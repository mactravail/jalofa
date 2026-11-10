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
  ListChecks,
  PersonStanding,
  Ruler,
  Sparkles,
  Store,
  User,
} from "lucide-react";

import type { CartMeasurement, NewCartItem } from "@/components/cart/cart-context";
import { bodyTypeLabel, heightBandLabel, type BodyType } from "@/lib/body-types";
import { MEASUREMENT_FIELDS, type MeasurementMode, type OrderType } from "@/lib/constants";
import { DEFAULT_METRAGE, metrageFor } from "@/lib/fabric-metrage";
import { computePrice, type PriceBreakdown } from "@/lib/pricing";
import { styleDetailDefaults, styleDetailSummary, styleExtraTotal } from "@/lib/style-options";
import type { StyleRef } from "@/lib/style-refs";
import type { Fabric, GarmentModel, HeightBand, Style, Tailor } from "@/lib/types";

// ---------------------------------------------------------------------------
// Catalogue data injected by the (server) layout.
// ---------------------------------------------------------------------------

export type ConfiguratorData = {
  models: GarmentModel[];
  fabrics: Fabric[];
  tailors: Tailor[];
  styles: Style[];
  /** Coordonnées demandées au récap :
   *  - `account` : pas de compte → nom, téléphone, e-mail et mot de passe (le
   *    compte client est créé avec le devis) ;
   *  - `contact` : compte sans nom / téléphone → ces deux champs ;
   *  - absent : rien à demander. */
  contactMode?: "account" | "contact" | null;
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
// Same rule for the fabric: it is ALWAYS chosen before the configurator and
// carried in as `?fabric=` — on the fabric's own page for `fabric_only`
// (/tissus/[id] → « Acheter ce tissu »), and on the garment's page for `full`
// (/modeles/[id] → « Le personnaliser »). The configurator is a purchase page:
// it never re-offers the fabric catalogue, it only sets the metrage (quantity).
// (`own_fabric` brings the client's own cloth, so it carries no fabric at all.)
//
// Delivery + payment used to live here; they now belong to the caisse, which
// applies one delivery/payment choice to the whole basket.
// ---------------------------------------------------------------------------

export type StepKey =
  | "style"
  | "body"
  | "meters"
  | "tailor"
  | "measurements"
  | "review";

export const BASE_PATH = "/commande/nouvelle";

export const STEP_LABELS: Record<StepKey, string> = {
  style: "Style",
  body: "Silhouette",
  meters: "Quantité",
  tailor: "Tailleur",
  measurements: "Mesures",
  review: "Récapitulatif",
};

/** Ce qu'on demande à l'étape, en une phrase — affiché sous le titre. */
export const STEP_HELP: Record<StepKey, string> = {
  style: "Choisissez la coupe et les finitions.",
  body: "Touchez le corps qui vous ressemble, puis indiquez votre taille.",
  meters:"Combien de tissu faut-il couper pour votre tenue ?",
  tailor: "L'atelier qui va coudre votre tenue.",
  measurements: "Une taille standard suffit — les mesures détaillées affinent la coupe.",
  review: "Vérifiez votre tenue avant de l'ajouter au panier.",
};

/**
 * Ce qui manque quand « Continuer » reste inactif. Sans ça, sur téléphone, le
 * bouton grisé ne dit pas ce qu'on attend du client.
 */
export const STEP_REQUIREMENT: Record<StepKey, string | null> = {
  style: null,
  body: "Choisissez votre silhouette et votre taille pour continuer",
  meters: null,
  tailor: "Choisissez un tailleur pour continuer",
  measurements: "Renseignez au moins une mesure pour continuer",
  review: null,
};

export const STEP_ICONS: Record<StepKey, React.ComponentType<{ className?: string }>> = {
  style: Sparkles,
  body: User,
  meters: Ruler,
  tailor: Store,
  measurements: PersonStanding,
  review: ListChecks,
};

/** StepKey → URL slug (French, matches the folder names under {BASE_PATH}). */
export const SLUG_BY_STEP: Record<StepKey, string> = {
  style: "style",
  body: "silhouette",
  meters: "quantite",
  tailor: "tailleur",
  measurements: "mesures",
  review: "recap",
};

export const STEP_BY_SLUG: Record<string, StepKey> = Object.fromEntries(
  Object.entries(SLUG_BY_STEP).map(([step, slug]) => [slug, step as StepKey]),
) as Record<string, StepKey>;

export const STEPS_BY_TYPE: Record<OrderType, StepKey[]> = {
  // La silhouette précède la quantité, qu'elle détermine : sans tissu à couper
  // (`own_fabric`, `fabric_only` sans vêtement), elle n'a pas lieu d'être.
  full: ["style", "body", "meters", "tailor", "measurements", "review"],
  fabric_only: ["meters", "review"],
  own_fabric: ["style", "tailor", "measurements", "review"],
};

/** Every type but `fabric_only` configures a garment, so it needs `?model=`. */
export const typeNeedsModel = (type: OrderType) => type !== "fabric_only";

/**
 * The fabric is never chosen inside the configurator — it must arrive as
 * `?fabric=`. `fabric_only` picks it on the fabric's detail page; `full` picks
 * it on the garment's page (« Le personnaliser »). Only `own_fabric` needs none,
 * since the client supplies their own cloth.
 */
export const typeNeedsFabric = (type: OrderType) =>
  type === "fabric_only" || type === "full";

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
  /** Le corps désigné par le client. Avec sa taille, il décide du métrage conseillé. */
  bodyType: BodyType | null;
  /** La taille estimée du client, sans lien avec son corps. */
  heightBand: HeightBand | null;
  fabricId: string | null;
  /**
   * Métrage de tissu. Posé dès l'amorçage au métrage que l'atelier taille pour
   * ce vêtement (`metrageFor`) — un grand boubou n'a jamais tenu dans les 3 m
   * du brouillon vierge —, recalé sur la personne en arrivant à l'étape Quantité,
   * où le client l'arbitre.
   */
  fabricMeters: number;
  /**
   * Le corps et la taille sur lesquels `fabricMeters` a été recalé. Revenir à
   * Quantité sans en changer ne doit pas écraser un métrage ajusté à la main.
   */
  metersPersonKey: string | null;
  tailorId: string | null;
  measurementMode: MeasurementMode;
  standardSize: string;
  /**
   * Avec une taille standard : une photo du client, ou d'une personne qui a sa
   * silhouette. Facultative. Le tailleur la voit une fois la commande payée.
   */
  bodyPhoto: StyleRef | null;
  manual: Record<string, string>;
  notes: string;
  /** Le tailleur les voit dès le devis, pour le prix de la livraison. */
  deliveryAddress: string;
  deliveryCity: string;
  deliveryCountry: string;
  /** Coordonnées saisies au récap (cf. `ConfiguratorData.contactMode`). */
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  /** Jamais écrit dans le brouillon (sessionStorage) — cf. la persistance. */
  contactPassword: string;
  contactPasswordConfirm: string;
  /** Un accord se donne à chaque fois : pas gardé dans le brouillon non plus. */
  contactAcceptTerms: boolean;
};

function defaultState(): ConfiguratorState {
  return {
    type: "full",
    modelId: null,
    styleSlug: null,
    styleDetails: styleDetailDefaults(null),
    styleRefs: [],
    bodyType: null,
    heightBand: null,
    fabricId: null,
    fabricMeters: DEFAULT_METRAGE.recommended,
    metersPersonKey: null,
    tailorId: null,
    measurementMode: "standard",
    standardSize: "M",
    bodyPhoto: null,
    manual: {},
    notes: "",
    deliveryAddress: "",
    deliveryCity: "",
    deliveryCountry: "Sénégal",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    contactPassword: "",
    contactPasswordConfirm: "",
    contactAcceptTerms: false,
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
    case "body":
      return Boolean(s.bodyType && s.heightBand);
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
 * La note transmise au tailleur : personnalisation, silhouette, taille, puis le
 * mot du client. Aucun n'a de colonne dédiée.
 */
export function tailorNotes(
  s: ConfiguratorState,
  personalisationText: string,
  model: GarmentModel | null,
): string | null {
  const body = bodyTypeLabel(s.bodyType);
  const height = heightBandLabel(model?.category_slug, s.heightBand);
  return (
    [
      personalisationText ? `Personnalisation — ${personalisationText}` : null,
      body ? `Silhouette — ${body}` : null,
      height ? `Taille estimée — ${height}` : null,
      s.notes.trim() || null,
    ]
      .filter(Boolean)
      .join("\n\n") || null
  );
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
  const personalisation = isFabricOnly ? [] : styleDetailSummary(model, s.styleDetails);
  const personalisationText = personalisation
    .map((d) => `${d.group} : ${d.option}`)
    .join(" · ");
  const notes = tailorNotes(s, personalisationText, model);

  const measurement: CartMeasurement | null = isFabricOnly
    ? null
    : {
        mode: s.measurementMode,
        standard_size: s.measurementMode === "standard" ? s.standardSize : null,
        photo: s.measurementMode === "standard" ? (s.bodyPhoto?.dataUrl ?? null) : null,
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

  const deliveryZone =
    (isFabricOnly ? fabric?.delivery_zone : model?.delivery_zone) ?? "none";

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
    // Le pro le décide produit par produit (cf. basketHasFreeDelivery).
    freeDelivery: deliveryZone !== "none",
    freeDeliveryZone: deliveryZone,
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
  previewPhoto: string | null;
  setPreviewPhoto: (photo: string | null) => void;
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
          // `setState` synchrone dans un effet, et c'est voulu : la restauration
          // doit avoir lieu APRÈS les effets des enfants, seul moment où l'on
          // sait si la route d'entrée a semé un modèle (`seededRef`) qui doit
          // primer sur le brouillon. Un initialiseur paresseux de `useState`
          // lirait sessionStorage pendant le rendu — donc avant tout effet
          // enfant, ce qui rendrait le veto impossible — et provoquerait en
          // prime une divergence d'hydratation (pas de sessionStorage au SSR).
          // eslint-disable-next-line react-hooks/set-state-in-effect
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
        // Le mot de passe ne quitte jamais la mémoire de la page.
        sessionStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            ...state,
            contactPassword: "",
            contactPasswordConfirm: "",
            contactAcceptTerms: false,
          }),
        );
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
  const models = data.models;
  const seed = useCallback(
    (incoming: ConfiguratorSeed) => {
      seededRef.current = true;
      const type = incoming.type ?? "full";
      const seededModel = models.find((m) => m.id === incoming.modelId) ?? null;
      setState({
        ...defaultState(),
        type,
        modelId: incoming.modelId ?? null,
        // The groups differ per garment, so the defaults must come from it.
        styleDetails: styleDetailDefaults(seededModel),
        // Idem pour le métrage : c'est le vêtement qui le dicte, et il doit être
        // juste dès le premier écran (le prix affiché en dépend). Un tissu
        // acheté seul n'a pas de vêtement — il garde le métrage passe-partout,
        // que l'étape Quantité fait ensuite choisir.
        fabricMeters:
          type === "fabric_only"
            ? DEFAULT_METRAGE.recommended
            : metrageFor(seededModel).recommended,
        fabricId: incoming.fabricId ?? null,
        tailorId: incoming.tailorId ?? null,
      });
    },
    [models],
  );

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

  // La photo du dernier choix touché, montrée en grand à l'étape Style.
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Delivery is priced once at the caisse, not per garment — exclude it here.
  // Les suppléments du tailleur s'ajoutent à la confection, en direct.
  const price = useMemo(() => {
    const base = computePrice({
      type: state.type,
      fabric,
      fabricMeters: state.fabricMeters,
      tailor,
      model,
    });
    const extra = state.type === "fabric_only" ? 0 : styleExtraTotal(model, state.styleDetails);
    return {
      ...base,
      tailoringPrice: base.tailoringPrice + extra,
      total: base.total + extra,
    };
  }, [state.type, state.fabricMeters, state.styleDetails, fabric, tailor, model]);

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
      previewPhoto,
      setPreviewPhoto,
    }),
    [data, state, update, seed, model, fabric, tailor, price, previewPhoto],
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
