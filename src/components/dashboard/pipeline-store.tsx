"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { updateOrderStatus } from "@/lib/actions/orders";
import type { OrderStatus } from "@/lib/constants";
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
// Mode démo (Supabase pas encore branché) : avancer une commande n'a pas de
// base où écrire. Le nouveau statut est gardé dans le navigateur, ce qui permet
// de parcourir le pipeline de bout en bout — d'« À traiter » à « Livré » — en
// attendant le provisioning. Une fois la base branchée, ces statuts locaux ne
// sont plus lus : `move` passe par la server action.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "nataal.demo.pipeline.v1";

/** Statuts déplacés en mode démo, par id de commande. */
type DemoStatuses = Record<string, OrderStatus>;

type PipelineValue = {
  role: ProRole;
  /** Les commandes du métier, statuts de démo appliqués le cas échéant. */
  orders: OrderListItem[];
  demo: boolean;
  /** Fait passer une commande à l'étape demandée. */
  move: (orderId: string, status: OrderStatus) => Promise<void>;
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
  const [statuses, setStatuses] = useState<DemoStatuses>({});
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
        setStatuses(parsed as DemoStatuses);
      }
    } catch {
      // Stockage illisible ou corrompu — on repart des statuts d'origine.
    }
    setHydrated(true);
  }, [demo]);

  // Persistance à chaque déplacement, une fois la lecture initiale faite.
  useEffect(() => {
    if (!demo || !hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
    } catch {
      // Stockage plein ou désactivé — les déplacements tiennent la session.
    }
  }, [demo, hydrated, statuses]);

  const move = useCallback(
    async (orderId: string, status: OrderStatus) => {
      if (demo) {
        setStatuses((prev) => ({ ...prev, [orderId]: status }));
        return;
      }
      await updateOrderStatus(orderId, status);
    },
    [demo],
  );

  const merged = useMemo(() => {
    if (!demo) return orders;
    return orders.map((o) => (statuses[o.id] ? { ...o, status: statuses[o.id] } : o));
  }, [demo, orders, statuses]);

  const value = useMemo<PipelineValue>(
    () => ({ role, orders: merged, demo, move }),
    [role, merged, demo, move],
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
