"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { quoteOrder, rejectOrder, updateOrderStatus } from "@/lib/actions/orders";
import type { OrderStatus, RejectionReason } from "@/lib/constants";
import type { ProRole } from "@/lib/dashboard-nav";
import type { OrderListItem } from "@/lib/orders-data";
import { bucketOrders, type OrderBucket } from "@/lib/pipeline";

// ---------------------------------------------------------------------------
// Le pipeline de l'espace pro
//
// Le layout charge les commandes une fois et les dépose ici : la pastille du
// menu, les trois piles et la vue d'ensemble lisent toutes la même liste, sinon
// chaque page aurait sa propre idée de l'avancement.
//
// Mode démo (Supabase pas encore branché) : agir sur une commande n'a pas de
// base où écrire. Le changement est gardé dans le navigateur sous forme de
// patch (statut avancé, motif de refus, prix d'un devis…), ce qui permet de
// parcourir le pipeline de bout en bout — d'« À traiter » à « Livré » — en
// attendant le provisioning. Une fois la base branchée, ces patchs locaux ne
// sont plus lus : chaque geste passe par sa server action.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "nataal.demo.pipeline.v2";

/** Champs de commande modifiés en mode démo, par id de commande. */
type DemoPatches = Record<string, Partial<OrderListItem>>;

type PipelineValue = {
  role: ProRole;
  /** Les commandes du métier, patchs de démo appliqués le cas échéant. */
  orders: OrderListItem[];
  demo: boolean;
  /** Fait passer une commande à l'étape demandée. */
  move: (orderId: string, status: OrderStatus) => Promise<void>;
  /** Refuse une commande en enregistrant le motif (le client en est notifié). */
  reject: (orderId: string, reason: RejectionReason) => Promise<void>;
  /** Chiffre une demande de devis : fixe le prix de confection. */
  quote: (orderId: string, price: number) => Promise<void>;
};

const PipelineContext = createContext<PipelineValue | null>(null);

export function PipelineProvider({
  role,
  orders,
  demo,
  children,
}: {
  role: ProRole;
  orders: OrderListItem[];
  demo: boolean;
  children: React.ReactNode;
}) {
  const [patches, setPatches] = useState<DemoPatches>({});
  const [hydrated, setHydrated] = useState(false);

  // Lecture unique après le montage : le premier rendu client part des statuts
  // du serveur, comme le HTML rendu côté serveur — pas de décalage
  // d'hydratation. Les déplacements gardés en mémoire arrivent juste après.
  useEffect(() => {
    if (!demo) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPatches(parsed as DemoPatches);
      }
    } catch {
      // Stockage illisible ou corrompu — on repart des statuts d'origine.
    }
    setHydrated(true);
  }, [demo]);

  // Persistance à chaque changement, une fois la lecture initiale faite.
  useEffect(() => {
    if (!demo || !hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(patches));
    } catch {
      // Stockage plein ou désactivé — les changements tiennent la session.
    }
  }, [demo, hydrated, patches]);

  const patch = useCallback((orderId: string, fields: Partial<OrderListItem>) => {
    setPatches((prev) => ({ ...prev, [orderId]: { ...prev[orderId], ...fields } }));
  }, []);

  const move = useCallback(
    async (orderId: string, status: OrderStatus) => {
      if (demo) {
        patch(orderId, { status });
        return;
      }
      await updateOrderStatus(orderId, status);
    },
    [demo, patch],
  );

  const reject = useCallback(
    async (orderId: string, reason: RejectionReason) => {
      if (demo) {
        // En démo, le motif ne se stocke nulle part durablement — on marque la
        // commande refusée pour la voir basculer dans « Terminé ».
        patch(orderId, { status: "rejected", rejection_reason: reason });
        return;
      }
      await rejectOrder(orderId, reason);
    },
    [demo, patch],
  );

  const quote = useCallback(
    async (orderId: string, price: number) => {
      if (demo) {
        // Devis chiffré en démo : le prix apparaît, la commande reste reçue et
        // impayée (elle attend l'accord du client).
        patch(orderId, { tailoring_price: price, total_amount: price });
        return;
      }
      const res = await quoteOrder(orderId, price);
      if (!res.ok) throw new Error(res.error);
    },
    [demo, patch],
  );

  const merged = useMemo(() => {
    if (!demo) return orders;
    return orders.map((o) => (patches[o.id] ? { ...o, ...patches[o.id] } : o));
  }, [demo, orders, patches]);

  const value = useMemo<PipelineValue>(
    () => ({ role, orders: merged, demo, move, reject, quote }),
    [role, merged, demo, move, reject, quote],
  );

  return <PipelineContext.Provider value={value}>{children}</PipelineContext.Provider>;
}

export function usePipeline() {
  const ctx = useContext(PipelineContext);
  if (!ctx) throw new Error("usePipeline must be used within a PipelineProvider");
  return ctx;
}

/** Une pile du pipeline, telle que l'affiche sa page du menu. */
export function useBucket(bucket: OrderBucket): OrderListItem[] {
  const { role, orders } = usePipeline();
  return useMemo(() => bucketOrders(role, orders, bucket), [role, orders, bucket]);
}
