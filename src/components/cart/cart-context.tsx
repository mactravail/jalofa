"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { OrderType } from "@/lib/constants";
import type { StyleRef } from "@/lib/style-refs";

// ---------------------------------------------------------------------------
// Cart model
//
// The configurator builds one fully-personalised garment at a time and drops
// it here ("Ajouter au panier"). A cart line carries two things:
//   1. a self-contained snapshot (names / images / prices) so the panier and
//      caisse can render without re-hitting the catalogue, and
//   2. the raw ids + measurement needed to recreate the order at checkout.
// Delivery + payment are NOT stored per line — they are chosen once at the
// caisse and apply to the whole basket.
// ---------------------------------------------------------------------------

export type CartMeasurement = {
  mode: "manual" | "standard";
  standard_size: string | null;
  values: Record<string, number | null>;
};

export type CartItem = {
  /** Cart line id (unique per add, not the model/fabric id). */
  lineId: string;
  qty: number;

  // --- order draft (rebuilt into an OrderDraft at checkout) ----------------
  type: OrderType;
  modelId: string | null;
  styleSlug: string | null;
  styleDetails: Record<string, string>;
  /** Photos d'inspiration destinées au tailleur (data URLs, cf. lib/style-refs). */
  styleRefs: StyleRef[];
  fabricId: string | null;
  fabricMeters: number | null;
  tailorId: string | null;
  measurement: CartMeasurement | null;
  notes: string | null;

  // --- display snapshot ----------------------------------------------------
  title: string;
  subtitle: string | null;
  image: string | null;
  styleName: string | null;
  tailorName: string | null;
  /** Le tailleur de cette ligne offre la livraison — sert l'estimation de la
   *  livraison à la caisse (le montant facturé est recalculé côté serveur). */
  freeDelivery: boolean;
  personalisation: { group: string; option: string }[];
  measurementLabel: string | null;

  // --- pricing (per single unit, delivery excluded) ------------------------
  unitFabricPrice: number;
  unitTailoringPrice: number;
  unitPrice: number;
};

/** What the configurator hands over — the cart assigns the lineId + qty. */
export type NewCartItem = Omit<CartItem, "lineId" | "qty">;

const STORAGE_KEY = "nataal.cart.v1";

/**
 * Une ligne écrite avant l'arrivée d'un champ n'a pas ce champ : on comble les
 * ajouts récents pour qu'un vieux panier ne casse pas l'affichage.
 */
function normalizeItem(raw: CartItem): CartItem {
  return { ...raw, styleRefs: raw.styleRefs ?? [], freeDelivery: raw.freeDelivery ?? false };
}

function makeLineId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `line_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type CartContextValue = {
  items: CartItem[];
  /** Total number of garments (sum of quantities). */
  count: number;
  /** Garments total, delivery excluded. */
  subtotal: number;
  /** True once the client has read localStorage — avoids an SSR/CSR flash. */
  hydrated: boolean;
  addItem: (item: NewCartItem) => void;
  removeItem: (lineId: string) => void;
  setQty: (lineId: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load once on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // One-time read of the persisted basket after mount — this keeps the
        // server-rendered markup (empty cart) and the first client render in
        // sync, avoiding a hydration mismatch.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (Array.isArray(parsed)) setItems(parsed.map(normalizeItem));
      }
    } catch {
      // Corrupt/unavailable storage — start empty.
    }
    setHydrated(true);
  }, []);

  // Persist on every change (only after the initial read).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full / disabled — cart stays in memory for this session.
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: NewCartItem) => {
    setItems((prev) => [...prev, { ...item, lineId: makeLineId(), qty: 1 }]);
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((it) => it.lineId !== lineId));
  }, []);

  const setQty = useCallback((lineId: string, qty: number) => {
    const next = Math.max(1, Math.min(99, Math.round(qty) || 1));
    setItems((prev) =>
      prev.map((it) => (it.lineId === lineId ? { ...it, qty: next } : it)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((n, it) => n + it.qty, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.unitPrice * it.qty, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({ items, count, subtotal, hydrated, addItem, removeItem, setQty, clear }),
    [items, count, subtotal, hydrated, addItem, removeItem, setQty, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
