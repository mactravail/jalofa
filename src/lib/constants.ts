/**
 * Domain constants for JALOFA — labels shown to end users are in French
 * (target market: Senegal). Codes/keys stay in English for the database.
 */

export const APP_NAME = "JALOFA";
export const APP_TAGLINE = "La couture sur mesure, depuis votre téléphone";

// Équivalents hex de --background (globals.css, light/dark) : le manifest PWA
// et la meta theme-color ne savent pas lire oklch().
export const THEME_COLOR_LIGHT = "#fbfbfb";
export const THEME_COLOR_DARK = "#1c1c1c";

// ---------------------------------------------------------------------------
// Currency (West African CFA franc)
// ---------------------------------------------------------------------------

export const CURRENCY = "FCFA";

export function formatPrice(amount: number | null | undefined): string {
  const value = typeof amount === "number" ? amount : 0;
  return `${value.toLocaleString("fr-FR")} ${CURRENCY}`;
}

// ---------------------------------------------------------------------------
// Paiement des abonnements pro (Wave)
//
// Pour l'instant les abonnements se règlent par Wave, hors plateforme : le pro
// paie ce numéro, puis l'administration confirme la réception et active son
// espace (cf. écran d'attente `pro-pending` et `/admin/abonnements`).
// ⚠️ À RENSEIGNER avec le vrai numéro Wave de JALOFA avant l'ouverture.
// ---------------------------------------------------------------------------

export const WAVE_PAYMENT = {
  /** Numéro Wave qui reçoit les abonnements. */
  number: "77 500 85 83",
  /** Nom affiché du bénéficiaire du paiement. */
  name: "JALOFA",
  /** QR Wave à scanner depuis l'app (fichier dans `public/`). */
  qr: "/wave_qr.jpeg",
};

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const RELATIVE_TIME = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

const TIME_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/**
 * « il y a 2 heures » — for feeds where the age matters more than the date.
 * Renders against the current clock, so a server/client pair can disagree by a
 * few seconds: mark the element `suppressHydrationWarning`.
 */
export function formatTimeAgo(iso: string): string {
  const seconds = Math.round((Date.parse(iso) - Date.now()) / 1000);
  const magnitude = Math.abs(seconds);
  for (const [unit, size] of TIME_UNITS) {
    if (magnitude >= size) return RELATIVE_TIME.format(Math.round(seconds / size), unit);
  }
  return RELATIVE_TIME.format(seconds, "second");
}

const CLOCK_FR = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
});
const DAY_FR = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});

/**
 * « Reçue aujourd'hui à 14 h 32 » — la date *et l'heure* d'arrivée d'une
 * commande, en toutes lettres. Une nouvelle commande doit dire quand elle est
 * tombée sans que le pro ait à calculer : « aujourd'hui » / « hier » quand
 * c'est récent, sinon le jour et le mois, toujours suivis de l'heure.
 *
 * Rendu contre l'horloge locale (« aujourd'hui » dépend du fuseau du lecteur) :
 * marquer l'élément `suppressHydrationWarning`.
 */
export function formatReceivedAt(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const heure = CLOCK_FR.format(date).replace(":", " h ");

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round(
    (startOfToday.getTime() -
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
      86_400_000,
  );

  if (days <= 0) return `aujourd'hui à ${heure}`;
  if (days === 1) return `hier à ${heure}`;
  return `le ${DAY_FR.format(date)} à ${heure}`;
}

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

/**
 * Les vues d'un modèle, du vêtement seul au détail. Tous les modèles n'ont pas
 * encore de galerie photographiée : ceux-là retombent sur leur photo unique,
 * pour que l'appelant n'ait jamais à gérer le cas vide.
 */
export function modelPhotos(model: {
  photos: string[];
  image_url: string | null;
}): string[] {
  if (model.photos.length) return model.photos;
  return model.image_url ? [model.image_url] : [];
}

// ---------------------------------------------------------------------------
// User roles
// ---------------------------------------------------------------------------

export type UserRole = "client" | "tailor" | "vendor" | "admin";

export const ROLE_LABELS: Record<UserRole, string> = {
  client: "Client",
  tailor: "Tailleur",
  vendor: "Vendeur de tissus",
  admin: "Administrateur",
};

// ---------------------------------------------------------------------------
// Inspiration — d'où vient la tenue partagée par un client
// ---------------------------------------------------------------------------

export type InspirationMakerKind =
  | "tailleur_quartier"
  | "marche"
  | "boutique"
  | "jalofa"
  | "autre";

export const INSPIRATION_MAKER_KINDS: InspirationMakerKind[] = [
  "tailleur_quartier",
  "marche",
  "boutique",
  "jalofa",
  "autre",
];

/** Libellé au moment du choix (formulaire). */
export const INSPIRATION_MAKER_KIND_LABELS: Record<InspirationMakerKind, string> = {
  tailleur_quartier: "Cousue par un tailleur",
  marche: "Achetée au marché",
  boutique: "Achetée en boutique",
  jalofa: "Réalisée sur JALOFA",
  autre: "Autre",
};

/** Formulation courte pour la pastille affichée sur une publication. */
export const INSPIRATION_MAKER_KIND_BADGES: Record<InspirationMakerKind, string> = {
  tailleur_quartier: "Tailleur",
  marche: "Marché",
  boutique: "Boutique",
  jalofa: "JALOFA",
  autre: "Autre",
};

// ---------------------------------------------------------------------------
// Retours des utilisateurs (« Une idée ? Un problème ? »)
// ---------------------------------------------------------------------------

/** La nature d'un retour envoyé depuis un espace (client / tailleur / vendeur). */
export type FeedbackCategory = "amelioration" | "probleme" | "autre";

export const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  "amelioration",
  "probleme",
  "autre",
];

/** Libellé au moment du choix (formulaire). */
export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  amelioration: "Une amélioration",
  probleme: "Un problème",
  autre: "Autre",
};

/** Formulation courte pour la pastille affichée côté administration. */
export const FEEDBACK_CATEGORY_BADGES: Record<FeedbackCategory, string> = {
  amelioration: "Amélioration",
  probleme: "Problème",
  autre: "Autre",
};

/** Triage de l'administration : nouveau tant qu'il n'a pas été traité. */
export type FeedbackStatus = "new" | "resolved";

/** L'espace d'où le retour a été envoyé — sert au libellé côté administration. */
export const FEEDBACK_SPACE_LABELS: Record<"client" | "tailor" | "vendor", string> = {
  client: "Client",
  tailor: "Tailleur",
  vendor: "Vendeur",
};

// ---------------------------------------------------------------------------
// Modération des prestataires (réservée à l'administration)
// ---------------------------------------------------------------------------

/**
 * Le motif d'une suspension imposée par la plateforme : abonnement impayé ou
 * faute grave. C'est ce que l'admin choisit au moment de suspendre un tailleur
 * ou un vendeur (cf. `is_suspended` sur `Tailor` / `Vendor`).
 */
export type SuspensionReason = "unpaid" | "misconduct";

export const SUSPENSION_REASON_LABELS: Record<SuspensionReason, string> = {
  unpaid: "Abonnement impayé",
  misconduct: "Faute grave",
};

// ---------------------------------------------------------------------------
// Order types (the three main flows)
// ---------------------------------------------------------------------------

export type OrderType = "full" | "fabric_only" | "own_fabric";

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  full: "Vêtement complet",
  fabric_only: "Tissu seul",
  own_fabric: "J'ai déjà mon tissu",
};

// ---------------------------------------------------------------------------
// Order status pipeline
// ---------------------------------------------------------------------------

export type OrderStatus =
  | "received"
  | "accepted"
  | "rejected"
  | "fabric_prepared"
  | "fabric_shipped"
  | "fabric_received_by_tailor"
  | "in_production"
  | "sewing"
  | "quality_check"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Commande reçue",
  accepted: "Commande acceptée",
  rejected: "Commande refusée",
  fabric_prepared: "Tissu préparé",
  fabric_shipped: "Tissu expédié",
  fabric_received_by_tailor: "Tissu reçu par le tailleur",
  in_production: "En production",
  sewing: "Phase de couture",
  quality_check: "Contrôle qualité",
  shipped: "Expédié",
  delivered: "Livré",
  cancelled: "Annulé",
};

// ---------------------------------------------------------------------------
// Refus d'une commande par le tailleur
// ---------------------------------------------------------------------------

/**
 * Pourquoi un tailleur refuse une commande. Choisi au moment du refus ; porté
 * par la commande à côté du statut `rejected`, affiché au client (qui relance
 * chez un autre tailleur) et à l'administration.
 */
export type RejectionReason =
  | "cannot_make"
  | "too_busy"
  | "cannot_deliver_in_time";

export const REJECTION_REASONS: RejectionReason[] = [
  "cannot_make",
  "too_busy",
  "cannot_deliver_in_time",
];

export const REJECTION_REASON_LABELS: Record<RejectionReason, string> = {
  cannot_make: "Je ne sais pas faire ce modèle",
  too_busy: "Je suis trop chargé en ce moment",
  cannot_deliver_in_time: "Je ne peux pas livrer dans les délais",
};

/** Formulation vue par le client / l'admin (le tailleur, lui, parle à la 1ʳᵉ personne). */
export const REJECTION_REASON_CLIENT_LABELS: Record<RejectionReason, string> = {
  cannot_make: "Le tailleur ne réalise pas ce modèle",
  too_busy: "Le tailleur est trop chargé en ce moment",
  cannot_deliver_in_time: "Le tailleur ne peut pas livrer dans les délais",
};

/** Ordered timeline shown to the client for a normal "full garment" flow. */
export const ORDER_TIMELINE: OrderStatus[] = [
  "received",
  "accepted",
  "fabric_prepared",
  "fabric_shipped",
  "fabric_received_by_tailor",
  "in_production",
  "sewing",
  "quality_check",
  "shipped",
  "delivered",
];

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export type PaymentMethod = "orange_money" | "wave" | "free_money" | "card";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  orange_money: "Orange Money",
  wave: "Wave",
  free_money: "Free Money",
  card: "Carte bancaire",
};

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "En attente",
  paid: "Payé",
  failed: "Échoué",
  refunded: "Remboursé",
};

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------

export type MeasurementMode = "manual" | "standard";

export const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
export type StandardSize = (typeof STANDARD_SIZES)[number];

/** Manual measurement fields (all in centimetres). */
export const MEASUREMENT_FIELDS = [
  { key: "height", label: "Taille (hauteur)" },
  { key: "chest", label: "Poitrine" },
  { key: "waist", label: "Tour de taille" },
  { key: "hips", label: "Hanches" },
  { key: "shoulders", label: "Épaules" },
  { key: "arm_length", label: "Longueur de bras" },
  { key: "leg_length", label: "Longueur de jambe" },
  { key: "neck", label: "Cou" },
  { key: "wrist", label: "Poignet" },
] as const;

export type MeasurementField = (typeof MEASUREMENT_FIELDS)[number]["key"];

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

export type DeliveryMethod = "home" | "pickup";

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  home: "Livraison à domicile",
  pickup: "Retrait en boutique",
};
