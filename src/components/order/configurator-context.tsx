"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Layers,
  ListChecks,
  PersonStanding,
  Ruler,
  Sparkles,
  Store,
} from "lucide-react";

import type { CartMeasurement, NewCartItem } from "@/components/cart/cart-context";
import { MEASUREMENT_FIELDS, type MeasurementMode, type OrderType } from "@/lib/constants";
import { computePrice, type PriceBreakdown } from "@/lib/pricing";
import { styleDetailDefaults, styleDetailSummary } from "@/lib/style-options";
import type { StyleRef } from "@/lib/style-refs";
import type { Fabric, GarmentModel, Style, Tailor } from "@/lib/types";

// ---------------------------------------------------------------------------
// Catalogue data injected by the (server) layout.
// ---------------------------------------------------------------------------

export type ConfiguratorData = {
  models: GarmentModel[];
  fabrics: Fabric[];
  tailors: Tailor[];
  styles: Style[];
};

// ---------------------------------------------------------------------------
// Steps — the flow is one route per step, but the ordered list still depends
// on the order type. StepKey is internal; each maps to a French URL slug.
//
// There is deliberately no "model" step: a configurator session personalises ONE
// garment, picked beforehand in the catalogue and carried in as `?model=`. The
// entry route bounces you back to /modeles rather than offering the catalogue
// here, so you can never turn a robe into a kaftan mid-flow.
//
// Delivery + payment used to live here; they now belong to the caisse, which
// applies one delivery/payment choice to the whole basket.
// ---------------------------------------------------------------------------

export type StepKey =
  | "style"
  | "fabric"
  | "meters"
  | "tailor"
  | "measurements"
  | "review";

export const BASE_PATH = "/commande/nouvelle";

export const STEP_LABELS: Record<StepKey, string> = {
  style: "Style",
  fabric: "Tissu",
  meters: "Quantité",
  tailor: "Tailleur",
  measurements: "Mesures",
  review: "Récapitulatif",
};

export const STEP_ICONS: Record<StepKey, React.ComponentType<{ className?: string }>> = {
  style: Sparkles,
  fabric: Layers,
  meters: Ruler,
  tailor: Store,
  measurements: PersonStanding,
  review: ListChecks,
};

/** StepKey → URL slug (French, matches the folder names under {BASE_PATH}). */
export const SLUG_BY_STEP: Record<StepKey, string> = {
  style: "style",
  fabric: "tissu",
  meters: "quantite",
  tailor: "tailleur",
  measurements: "mesures",
  review: "recap",
};

export const STEP_BY_SLUG: Record<string, StepKey> = Object.fromEntries(
  Object.entries(SLUG_BY_STEP).map(([step, slug]) => [slug, step as StepKey]),
) as Record<string, StepKey>;

export const STEPS_BY_TYPE: Record<OrderType, StepKey[]> = {
  full: ["style", "fabric", "meters", "tailor", "measurements", "review"],
  fabric_only: ["fabric", "meters", "review"],
  own_fabric: ["style", "tailor", "measurements", "review"],
};

/** Every type but `fabric_only` configures a garment, so it needs `?model=`. */
export const typeNeedsModel = (type: OrderType) => type !== "fabric_only";

export const stepUrl = (step: StepKey) => `${BASE_PATH}/${SLUG_BY_STEP[step]}`;

// ---------------------------------------------------------------------------
// Draft state
// ---------------------------------------------------------------------------

export type ConfiguratorState = {
  type: OrderType;
  // The garment being personalised. Fixed for the whole session — it comes from
  // the catalogue (?model=…) and no step can change it.
  modelId: string | null;
  styleSlug: string | null;
  // Garment personalisation → group slug : option slug. Which groups exist
  // depends on the garment (`styleGroupsFor`), so this is seeded from the model.
  styleDetails: Record<string, string>;
  /** Photos d'inspiration jointes par le client (max MAX_STYLE_REFS). */
  styleRefs: StyleRef[];
  fabricId: string | null;
  fabricMeters: number;
  tailorId: string | null;
  measurementMode: MeasurementMode;
  standardSize: string;
  manual: Record<string, string>;
  notes: string;
  // Fabric catalogue filtering (Hockerty-style search + category chips).
  fabricQuery: string;
  fabricCat: string | null;
};

function defaultState(): ConfiguratorState {
  return {
    type: "full",
    modelId: null,
    styleSlug: null,
    styleDetails: styleDetailDefaults(null),
    styleRefs: [],
    fabricId: null,
    fabricMeters: 3,
    tailorId: null,
    measurementMode: "standard",
    standardSize: "M",
    manual: {},
    notes: "",
    fabricQuery: "",
    fabricCat: null,
  };
}

/** Seed applied by the entry route from the incoming query string. */
export type ConfiguratorSeed = {
  type?: OrderType;
  modelId?: string | null;
  fabricId?: string | null;
  tailorId?: string | null;
};

// ---------------------------------------------------------------------------
// Pure helpers shared by the shell and the step pages
// ---------------------------------------------------------------------------

export function stepCanProceed(step: StepKey, s: ConfiguratorState): boolean {
  switch (step) {
    case "style":
      return Boolean(s.styleSlug);
    case "fabric":
      return Boolean(s.fabricId);
    case "meters":
      return s.fabricMeters > 0;
    case "tailor":
      return Boolean(s.tailorId);
    case "measurements":
      return s.measurementMode === "standard"
        ? Boolean(s.standardSize)
        : Object.values(s.manual).some((v) => v.trim() !== "");
    default:
      return true;
  }
}

/**
 * Snapshot the configured garment into a cart line. Delivery/payment are not
 * captured here — they are chosen once for the whole basket at the caisse.
 */
export function buildCartItem(
  s: ConfiguratorState,
  ctx: {
    model: GarmentModel | null;
    fabric: Fabric | null;
    tailor: Tailor | null;
    styleName: string | null;
    price: PriceBreakdown;
  },
): NewCartItem {
  const { model, fabric, tailor, styleName, price } = ctx;
  const isFabricOnly = s.type === "fabric_only";

  // Structured personalisation for display; also folded into the tailor notes
  // (there is no dedicated column yet) so it reaches the atelier.
  const personalisation = isFabricOnly ? [] : styleDetailSummary(s.modelId, s.styleDetails);
  const personalisationText = personalisation
    .map((d) => `${d.group} : ${d.option}`)
    .join(" · ");
  const notes =
    [
      personalisationText ? `Personnalisation — ${personalisationText}` : null,
      s.notes.trim() || null,
    ]
      .filter(Boolean)
      .join("\n\n") || null;

  const measurement: CartMeasurement | null = isFabricOnly
    ? null
    : {
        mode: s.measurementMode,
        standard_size: s.measurementMode === "standard" ? s.standardSize : null,
        values:
          s.measurementMode === "manual"
            ? Object.fromEntries(
                Object.entries(s.manual).map(([k, v]) => [k, v ? Number(v) : null]),
              )
            : {},
      };

  const measurementLabel = isFabricOnly
    ? null
    : s.measurementMode === "standard"
      ? `Taille ${s.standardSize}`
      : (() => {
          const filled = MEASUREMENT_FIELDS.filter((f) => s.manual[f.key]?.trim());
          return filled.length
            ? `Sur mesure · ${filled.length} mesure${filled.length > 1 ? "s" : ""}`
            : "Sur mesure";
        })();

  return {
    type: s.type,
    modelId: isFabricOnly ? null : s.modelId,
    styleSlug: isFabricOnly ? null : s.styleSlug,
    styleDetails: s.styleDetails,
    // Une commande de tissu seul n'a pas de vêtement à inspirer.
    styleRefs: isFabricOnly ? [] : s.styleRefs,
    fabricId: s.type === "own_fabric" ? null : s.fabricId,
    fabricMeters: s.type === "own_fabric" ? null : s.fabricMeters,
    tailorId: isFabricOnly ? null : s.tailorId,
    measurement,
    notes,

    title: isFabricOnly ? fabric?.name ?? "Tissu" : model?.name ?? "Tenue sur mesure",
    subtitle: isFabricOnly ? "Tissu au mètre" : "Sur mesure",
    image: isFabricOnly
      ? fabric?.image_url ?? null
      : model?.image_url ?? fabric?.image_url ?? null,
    styleName: isFabricOnly ? null : styleName,
    tailorName: isFabricOnly ? null : tailor?.shop_name ?? null,
    freeDelivery: isFabricOnly ? false : tailor?.free_delivery ?? false,
    personalisation,
    measurementLabel,

    unitFabricPrice: price.fabricPrice,
    unitTailoringPrice: price.tailoringPrice,
    unitPrice: price.total,
  };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type ConfiguratorContextValue = {
  data: ConfiguratorData;
  state: ConfiguratorState;
  update: (patch: Partial<ConfiguratorState>) => void;
  seed: (seed: ConfiguratorSeed) => void;
  // Derived
  steps: StepKey[];
  model: GarmentModel | null;
  fabric: Fabric | null;
  tailor: Tailor | null;
  price: PriceBreakdown;
  fabricCategories: string[];
  filteredFabrics: Fabric[];
};

const ConfiguratorContext = createContext<ConfiguratorContextValue | null>(null);

/**
 * The draft lives in sessionStorage so a reload (or a link shared into the same
 * tab) does not silently drop the choices already made — the step routes carry
 * no ids of their own.
 */
const DRAFT_KEY = "nataal:configurator-draft";

export function ConfiguratorProvider({
  data,
  children,
}: {
  data: ConfiguratorData;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<ConfiguratorState>(defaultState);
  // The entry route seeds from the query string during its own effect, which
  // React runs before this parent's — so a seed must veto the restore below,
  // otherwise a stale draft would clobber the freshly chosen model.
  const seededRef = useRef(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    if (!seededRef.current) {
      try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : null;
        if (parsed && typeof parsed === "object") {
          setState({ ...defaultState(), ...(parsed as Partial<ConfiguratorState>) });
        }
      } catch {
        // Unreadable draft — start clean rather than blocking the configurator.
      }
    }
    setRestored(true);
  }, []);

  // Debounced: depuis que les photos d'inspiration voyagent en data URL, le
  // brouillon pèse jusqu'à ~1 Mo, et l'écrire à chaque frappe dans les notes
  // bloquerait le thread sur un téléphone d'entrée de gamme.
  useEffect(() => {
    if (!restored) return;
    const id = setTimeout(() => {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(state));
      } catch {
        // Private mode / quota — the draft just stays in memory.
      }
    }, 400);
    return () => clearTimeout(id);
  }, [restored, state]);

  const update = useCallback((patch: Partial<ConfiguratorState>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  // A fresh order: reset to defaults, then apply the incoming ids/type.
  const seed = useCallback((incoming: ConfiguratorSeed) => {
    seededRef.current = true;
    setState({
      ...defaultState(),
      type: incoming.type ?? "full",
      modelId: incoming.modelId ?? null,
      // The groups differ per garment, so the defaults must come from it.
      styleDetails: styleDetailDefaults(incoming.modelId),
      fabricId: incoming.fabricId ?? null,
      tailorId: incoming.tailorId ?? null,
    });
  }, []);

  const model = useMemo(
    () => data.models.find((m) => m.id === state.modelId) ?? null,
    [data.models, state.modelId],
  );
  const fabric = useMemo(
    () => data.fabrics.find((f) => f.id === state.fabricId) ?? null,
    [data.fabrics, state.fabricId],
  );
  const tailor = useMemo(
    () => data.tailors.find((t) => t.id === state.tailorId) ?? null,
    [data.tailors, state.tailorId],
  );

  // Delivery is priced once at the caisse, not per garment — exclude it here.
  const price = useMemo(
    () =>
      computePrice({
        type: state.type,
        fabric,
        fabricMeters: state.fabricMeters,
        tailor,
        deliveryMethod: "pickup",
      }),
    [state.type, state.fabricMeters, fabric, tailor],
  );

  const fabricCategories = useMemo(() => {
    const slugs = new Set<string>();
    for (const f of data.fabrics) if (f.category_slug) slugs.add(f.category_slug);
    return [...slugs];
  }, [data.fabrics]);

  const filteredFabrics = useMemo(() => {
    const q = state.fabricQuery.trim().toLowerCase();
    return data.fabrics.filter((f) => {
      if (state.fabricCat && f.category_slug !== state.fabricCat) return false;
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        (f.color ?? "").toLowerCase().includes(q) ||
        (f.material ?? "").toLowerCase().includes(q)
      );
    });
  }, [data.fabrics, state.fabricQuery, state.fabricCat]);

  const value = useMemo<ConfiguratorContextValue>(
    () => ({
      data,
      state,
      update,
      seed,
      steps: STEPS_BY_TYPE[state.type],
      model,
      fabric,
      tailor,
      price,
      fabricCategories,
      filteredFabrics,
    }),
    [data, state, update, seed, model, fabric, tailor, price, fabricCategories, filteredFabrics],
  );

  return (
    <ConfiguratorContext.Provider value={value}>{children}</ConfiguratorContext.Provider>
  );
}

export function useConfigurator() {
  const ctx = useContext(ConfiguratorContext);
  if (!ctx) {
    throw new Error("useConfigurator must be used within a ConfiguratorProvider");
  }
  return ctx;
}
