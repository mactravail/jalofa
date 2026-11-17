import type {
  DeliveryMethod,
  FeedbackCategory,
  FeedbackStatus,
  InspirationMakerKind,
  MeasurementMode,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  PayoutMethod,
  RejectionReason,
  SuspensionReason,
  UserRole,
} from "@/lib/constants";
import type { BodyFigureShape } from "@/lib/body-figure";
import type { FreeDeliveryZone } from "@/lib/delivery";
import type { EuropeType, MakingType, ProductOrigin } from "@/lib/europe";
import type { SubscriptionPlanId } from "@/lib/subscriptions";

// Domain row types used when rendering data. These mirror the SQL schema and
// stand in for the generated Supabase types until the DB is provisioned.

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string | null;
  recipient_name: string | null;
  phone: string | null;
  address_line: string;
  city: string;
  region: string | null;
  is_default: boolean;
}

export interface Tailor {
  /** Où le prix du tailleur inclut la livraison. */
  free_delivery_zone?: FreeDeliveryZone;
  /** Mes prix de livraison du vêtement (FCFA) ; null = option non proposée. */
  ship_fee_economy?: number | null;
  ship_fee_express?: number | null;
  id: string;
  shop_name: string | null;
  bio: string | null;
  city: string | null;
  /** Le pays de l'atelier. Un pays d'Europe = JALOFA EUROPE (cf. `europe.ts`). */
  country?: string | null;
  base_price: number;
  avg_delivery_days: number;
  /**
   * Le tailleur prend la livraison à sa charge : mis en avant sur sa fiche
   * publique et, à la caisse, la livraison à domicile n'est pas facturée au
   * client pour les vêtements qu'il coud.
   */
  free_delivery: boolean;
  cover_url: string | null;
  rating: number;
  rating_count: number;
  is_active: boolean;
  /** Suspendu par l'administration : bloqué et masqué du catalogue public. */
  is_suspended: boolean;
  /** Motif de la suspension, `null` tant que le pro n'est pas suspendu. */
  suspension_reason: SuspensionReason | null;
  /** Certifié par l'administration : gage de confiance sur la fiche publique. */
  is_certified: boolean;
  /** Abonnement du pro : décide de la commission JALOFA sur ses prestations. */
  plan: SubscriptionPlanId;
  /**
   * « Prix sur demande » : le tailleur masque ses prix publics (fiche + ses
   * créations) et traite ses devis en privé. Réservé aux forfaits payants —
   * un compte Gratuit doit afficher ses prix, et l'enregistrement du profil
   * force ce champ à `false` hors abonnement (cf. `planCanQuote`).
   */
  quote_only: boolean;
  /**
   * Espace ouvert par l'administration après confirmation du paiement Wave (ou
   * validation de l'inscription). `false` = compte créé mais en attente : le pro
   * voit un écran d'attente au lieu de son tableau de bord.
   */
  is_activated: boolean;
  /**
   * Ventes validées par l'administration (anti-arnaque) : tant que `false`,
   * le pro publie et reste visible, mais aucun client ne peut lui acheter.
   * Absent (colonne pas encore en base) = validé. Lire avec `canSell()`.
   */
  sales_approved?: boolean;

  // --- Comment le pro est réglé de ses ventes (page « Paiement » de l'espace).
  //     JALOFA est gratuit : il encaisse 100%, versés sur ce moyen. Colonnes
  //     ajoutées par migration — optionnelles ici pour ne pas alourdir fixtures
  //     et objets de repli ; à lire défensivement (`?? null`).
  payout_method?: PayoutMethod | null;
  /** Numéro Mobile Money, ou RIB/IBAN pour un virement bancaire. */
  payout_number?: string | null;
  /** Nom du titulaire du compte qui reçoit les paiements. */
  payout_name?: string | null;

  // --- Signaux du score de confiance (cf. `@/lib/trust-score`), dénormalisés
  //     sur la fiche pour un affichage public bon marché (compatible RLS).
  /** Badge « Membre Fondateur » : accordé aux tout premiers pros. */
  is_founding_member?: boolean;
  /** Nombre de photos de réalisations vérifiées par l'administration. */
  verified_photos?: number;
  /** Commandes menées jusqu'à la livraison (compteur tenu par trigger). */
  completed_orders?: number;
  /** Commandes acceptées (engagées au-delà de « reçue »). */
  accepted_orders?: number;
  /** Commandes refusées — sert au taux d'acceptation. */
  rejected_orders?: number;
  /** Commandes livrées dans le délai annoncé (proxy « respect des délais »). */
  on_time_orders?: number;
}

export interface Vendor {
  id: string;
  /** Mes prix d'envoi du tissu (FCFA) ; null = option non proposée. */
  ship_fee_economy?: number | null;
  ship_fee_express?: number | null;
  shop_name: string | null;
  bio: string | null;
  city: string | null;
  /** Le pays de l'atelier. Un pays d'Europe = JALOFA EUROPE (cf. `europe.ts`). */
  country?: string | null;
  /**
   * Le vendeur prend la livraison à sa charge : mis en avant sur sa fiche
   * publique et, à la caisse, la livraison à domicile n'est pas facturée au
   * client pour les tissus qu'il vend.
   */
  free_delivery: boolean;
  cover_url: string | null;
  rating: number;
  rating_count: number;
  is_active: boolean;
  /** Suspendu par l'administration : bloqué et masqué du catalogue public. */
  is_suspended: boolean;
  /** Motif de la suspension, `null` tant que le pro n'est pas suspendu. */
  suspension_reason: SuspensionReason | null;
  /** Certifié par l'administration : gage de confiance sur la fiche publique. */
  is_certified: boolean;
  /** Abonnement du pro : décide de la commission JALOFA sur ses ventes de tissu. */
  plan: SubscriptionPlanId;
  /**
   * Espace ouvert par l'administration après confirmation du paiement Wave (ou
   * validation de l'inscription). `false` = compte créé mais en attente : le pro
   * voit un écran d'attente au lieu de son tableau de bord.
   */
  is_activated: boolean;
  /**
   * Ventes validées par l'administration (anti-arnaque) : tant que `false`,
   * le pro publie et reste visible, mais aucun client ne peut lui acheter.
   * Absent (colonne pas encore en base) = validé. Lire avec `canSell()`.
   */
  sales_approved?: boolean;

  // --- Comment le pro est réglé de ses ventes (page « Paiement » de l'espace).
  //     JALOFA est gratuit : il encaisse 100%, versés sur ce moyen. Colonnes
  //     ajoutées par migration — optionnelles ici pour ne pas alourdir fixtures
  //     et objets de repli ; à lire défensivement (`?? null`).
  payout_method?: PayoutMethod | null;
  /** Numéro Mobile Money, ou RIB/IBAN pour un virement bancaire. */
  payout_number?: string | null;
  /** Nom du titulaire du compte qui reçoit les paiements. */
  payout_name?: string | null;

  // --- Signaux du score de confiance (cf. `@/lib/trust-score`), dénormalisés
  //     sur la fiche pour un affichage public bon marché (compatible RLS).
  /** Badge « Membre Fondateur » : accordé aux tout premiers pros. */
  is_founding_member?: boolean;
  /** Nombre de photos de réalisations vérifiées par l'administration. */
  verified_photos?: number;
  /** Commandes menées jusqu'à la livraison (compteur tenu par trigger). */
  completed_orders?: number;
  /** Commandes acceptées (engagées au-delà de « reçue »). */
  accepted_orders?: number;
  /** Commandes refusées — sert au taux d'acceptation. */
  rejected_orders?: number;
  /** Commandes livrées dans le délai annoncé (proxy « respect des délais »). */
  on_time_orders?: number;
}

export interface FabricCategory {
  slug: string;
  name: string;
  sort_order: number;
}

/** Où envoyer un tissu acheté chez un autre vendeur — donnée privée. */
export interface TailorAtelier {
  address: string;
  phone: string;
}

export interface Fabric {
  id: string;
  vendor_id: string | null;
  name: string;
  category_slug: string | null;
  color: string | null;
  material: string | null;
  price_per_meter: number;
  description: string | null;
  stock_meters: number;
  /** Le pro a-t-il encore ce tissu ? Sans indication, il est disponible. */
  in_stock?: boolean;
  image_url: string | null;
  is_active: boolean;
  /** Où ce pro offre la livraison de ce tissu. */
  delivery_zone?: FreeDeliveryZone;
  /** La boutique qui le vend : nom, ville, pays (joint depuis `vendors`). */
  origin?: ProductOrigin | null;

  // Fiche produit (migration 20260901000001) — absentes tant qu'elle n'est pas
  // appliquée : tout lecteur doit tolérer `undefined`.
  /** METER | YARD | PAGNE_2_YARDS | COMPLET_6_YARDS (cf. `fabric-specs.ts`). */
  sales_unit?: string | null;
  /** Prix de l'unité de vente, en FCFA. `price_per_meter` en est dérivé. */
  price_per_unit?: number | null;
  /** Laize, en cm. */
  width_cm?: number | null;
  min_order_qty?: number | null;
  composition?: string | null;
  origin_brand?: string | null;
  weight?: string | null;
  grammage_gsm?: number | null;
  opacity?: string | null;
  drape?: string | null;
  stretch?: string | null;
  pattern?: string | null;
  finish?: string | null;
  care_instructions?: string[] | null;
  recommended_usages?: string[] | null;
  /** 2e photo : gros plan sur le tissage / le grain. */
  detail_image_url?: string | null;
  /**
   * Par couleur (clé = nom de `color`), facultatif : un prix de l'unité propre
   * et/ou une photo. Sans entrée, la couleur se vend au prix et à la photo du
   * tissu (migration 20260902000001).
   */
  color_variants?: Record<string, FabricColorVariant> | null;
}

export interface FabricColorVariant {
  /** Prix de l'unité de vente pour cette couleur, en FCFA. */
  price?: number | null;
  image_url?: string | null;
}

export interface ModelCategory {
  slug: string;
  name: string;
  gender: "homme" | "femme" | "enfant" | "mixte";
  sort_order: number;
}

export interface Style {
  slug: string;
  name: string;
  sort_order: number;
}

/** Un choix proposé par le tailleur sur son modèle (ex. « Sans poche »). */
export interface ModelStyleOption {
  slug: string;
  name: string;
  /** Sa vraie photo. `null` seulement sur un brouillon : jamais montré au client. */
  photo: string | null;
  /** Supplément en FCFA. Le premier choix est le modèle présenté : toujours 0. */
  extra: number;
}

/** Un détail du modèle, défini par son tailleur (ex. « Poches »). */
export interface ModelStyleGroup {
  slug: string;
  name: string;
  options: ModelStyleOption[];
}

/** Les mesures qui aident à reconnaître une silhouette. La hauteur n'en fait pas partie. */
export type BodyRangeKey = "chest" | "waist" | "hips" | "shoulders";

/** La taille estimée d'une personne : une tranche de hauteur, sans lien avec le corps. */
export type HeightBand = "petite" | "moyenne" | "grande" | "tres_grande";

/** Un intervalle en cm. `null` seulement sur un brouillon : jamais montré au client. */
export interface BodyRange {
  min: number | null;
  max: number | null;
}

/** Ce que le tailleur indique, sur son modèle, pour une silhouette donnée. */
export interface ModelBodyFit {
  body: BodyFigureShape;
  /** Les mètres de tissu par taille. `null` seulement sur un brouillon. */
  meters: Record<HeightBand, number | null>;
  ranges: Record<BodyRangeKey, BodyRange>;
}

export type QuoteMode = "manual" | "auto";

export interface GarmentModel {
  /** Ce que le client peut choisir sur ce modèle, défini par son tailleur. */
  style_groups?: ModelStyleGroup[];
  /**
   * Le vêtement du catalogue dont ce modèle de tailleur reprend les planches
   * dessinées (clé de `STYLE_GROUPS_BY_SLUG`), ou `"sur-demande"` : le tailleur
   * a demandé à JALOFA de dessiner sa personnalisation. `null` = non précisé.
   */
  style_base?: string | null;
  /**
   * Création d'un tailleur : le modèle du catalogue JALOFA (`tailor_id` null)
   * sous lequel elle est rangée — c'est sur la page de ce modèle qu'elle
   * s'affiche. `null` sur le catalogue lui-même (et sur d'anciennes créations).
   */
  catalog_model_id?: string | null;
  /** Le tissu nécessaire par silhouette, défini par son tailleur. */
  body_fits?: ModelBodyFit[];
  /** Où ce pro offre la livraison de ce modèle. */
  delivery_zone?: FreeDeliveryZone;
  /** Les recommandations du tailleur (lavage, à éviter…), une par ligne. */
  care_tips?: string | null;
  id: string;
  /**
   * Identifiant stable et lisible, indépendant de l'`id` UUID généré en base.
   * C'est LUI (pas l'`id`) qui relie un modèle à sa page dédiée et à sa famille
   * (cf. `garment-routes.ts`) : les pages `/homme/grand-boubou-sur-mesure` &
   * co. résolvent leurs modèles par slug, ce qui marche à l'identique en démo
   * (fixtures) et en prod (Supabase). `null` = modèle sans slug (pas de page
   * dédiée). En fixtures, dérivé de l'`id` (`demo-` retiré).
   */
  slug: string | null;
  /**
   * Auteur du modèle. `null` = catalogue de la plateforme, ouvert à tous les
   * tailleurs. Renseigné = création propre à ce tailleur : le modèle reste
   * visible dans /modeles, mais le commander verrouille son auteur comme
   * tailleur de la commande.
   */
  tailor_id: string | null;
  name: string;
  category_slug: string | null;
  description: string | null;
  difficulty: "facile" | "moyen" | "difficile" | null;
  avg_days: number;
  /**
   * Prix de confection facturé par l'auteur pour cette création (FCFA). `null`
   * = pas de tarif propre (catalogue plateforme, ou prix non renseigné) : on
   * retombe alors sur le `base_price` « dès… » du tailleur choisi.
   */
  price: number | null;
  /**
   * Comment le tailleur répond aux demandes de devis sur ce modèle : `"manual"`
   * (il chiffre chaque demande) ou `"auto"` (le devis part tout de suite avec
   * `quote_price` + suppléments, `quote_delivery_fee` et `quote_ready_days`).
   */
  quote_mode?: QuoteMode;
  /** Devis automatique : prix fixe de confection (FCFA). */
  quote_price?: number | null;
  /** Devis automatique : prix de la livraison (FCFA), 0 = gratuite. */
  quote_delivery_fee?: number | null;
  /** Devis automatique : prête en N jours après le paiement. */
  quote_ready_days?: number | null;
  image_url: string | null;
  is_active: boolean;
  /**
   * Galerie du vêtement, dans l'ordre d'affichage : le vêtement seul d'abord,
   * puis porté (devant, dos), puis les détails. Vide = pas de galerie, on
   * retombe sur `image_url`. Vient de `model_photos` triée par `sort_order`.
   */
  photos: string[];
  /** JALOFA EUROPE : la catégorie européenne (robe de mariage, costume…). */
  europe_type?: EuropeType | null;
  /** Matière et tissu, en clair (« Laine Super 120s, Biella »). */
  material?: string | null;
  /** Sur mesure, prêt-à-porter, ou les deux. */
  making_type?: MakingType | null;
  /** Tailles disponibles en prêt-à-porter, en clair (« 46 à 56 »). */
  sizes?: string | null;
  /**
   * « Tel quel » = prêt-à-porter : le tailleur auteur a ce modèle déjà cousu.
   * Sans auteur, ou sans couleur, le modèle ne se vend que sur mesure.
   */
  ready_to_wear?: boolean;
  /** Les couleurs dans lesquelles le prêt-à-porter existe (« Blanc », « Bleu »…). */
  ready_colors?: string[];
  /** Prix « tel quel » propre à une couleur (FCFA) ; absente = `price` du modèle. */
  ready_color_prices?: Record<string, number>;
  /** Photo « tel quel » propre à une couleur ; absente = photos du modèle. */
  ready_color_images?: Record<string, string>;
  /** L'atelier qui le fabrique : nom, ville, pays (joint depuis `tailors`). */
  origin?: ProductOrigin | null;
}

export interface Measurement {
  id: string;
  user_id: string;
  label: string | null;
  mode: MeasurementMode;
  standard_size: string | null;
  height: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  shoulders: number | null;
  arm_length: number | null;
  leg_length: number | null;
  neck: number | null;
  wrist: number | null;
  notes: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  client_id: string;
  tailor_id: string | null;
  vendor_id: string | null;
  type: OrderType;
  model_id: string | null;
  style_slug: string | null;
  fabric_id: string | null;
  fabric_meters: number | null;
  measurement_id: string | null;
  address_id: string | null;
  delivery_method: DeliveryMethod;
  /**
   * Ville de destination du colis (Mbour, Thiès, Paris…). Renseignée à la
   * caisse quel que soit le mode de livraison ; c'est la clé qui permet au
   * pro de regrouper les commandes d'une même ville et de les expédier
   * ensemble (page « Livraisons » de l'espace pro).
   */
  delivery_city: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: OrderStatus;
  /** Motif du refus quand `status === "rejected"` ; `null` sinon. */
  rejection_reason: RejectionReason | null;
  /**
   * Née d'une demande de devis chez un tailleur « Prix sur demande » : reçue
   * sans prix ni paiement. Le tailleur la chiffre (`tailoring_price` passe de 0
   * à son prix) dans « À traiter », puis le client accepte et paie. `false`
   * pour toute commande achetée au prix affiché.
   */
  is_quote: boolean;
  /** Combien de fois le client a modifié sa demande de devis. */
  quote_revision: number;
  /** Devis : « prêt dans N jours », fixé par le tailleur avec son prix. */
  quote_ready_days?: number | null;
  /** Devis : un mot bref du tailleur au client. */
  quote_note?: string | null;
  /** Devis chiffré automatiquement depuis les réglages du modèle. */
  quote_auto?: boolean;
  /** Le livreur à qui le tailleur a remis la tenue (étape « en route »). */
  courier_name?: string | null;
  courier_phone?: string | null;
  /** Arrivée prévue chez le client. */
  courier_eta?: string | null;
  // --- Workflow (migration 20260826000001, cf. `src/lib/order-workflow.ts`) ---
  /** A = économique, B = express. */
  delivery_option?: "economy" | "express" | null;
  fabric_owner?: "vendor" | "tailor" | "client" | null;
  payment_id?: string | null;
  /** Horodatages serveur (UTC). */
  paid_at?: string | null;
  fabric_shipped_at?: string | null;
  fabric_received_at?: string | null;
  /**
   * Réception déclarée par le tailleur alors que le vendeur n'avait pas dit
   * « Tissu envoyé » : JALOFA vérifie auprès du vendeur avant de le payer
   * (migration 20260828000001).
   */
  fabric_vendor_check?: "pending" | "confirmed" | "denied" | null;
  /** Le client a dit à JALOFA qu'il n'a PAS reçu son colis (migration 20260905000001). */
  receipt_disputed_at?: string | null;
  cut_started_at?: string | null;
  cut_was_authorized?: boolean | null;
  /** Livraison aller du tissu, au tarif annoncé par le vendeur. */
  fabric_delivery_fee?: number | null;
  /** Ce que le client a réellement payé. */
  amount_paid?: number | null;
  /** Litige : JALOFA a bloqué la commande. */
  workflow_hold?: boolean | null;
  refund_status?: "none" | "pending" | "partial" | "refunded" | "failed" | null;
  /** Demande d'annulation en cours d'examen (lue à part, `withCancellations`). */
  cancellation?: OrderCancellationSummary | null;
  /** L'adresse où le pro livre : il la voit dès le devis, sans le nom du client. */
  delivery_address: string | null;
  delivery_country: string | null;
  fabric_price: number;
  tailoring_price: number;
  delivery_fee: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  notes: string | null;
  /** Broderie « Je choisis » : photo dans le bucket privé `embroidery-photos`. */
  embroidery_photo_path?: string | null;
  created_at: string;
  updated_at: string;
}

/** La dernière demande d'annulation d'une commande (`order_cancellations`). */
export interface OrderCancellationSummary {
  id: string;
  status: "pending" | "accepted" | "rejected";
  stage: string;
  reason: string | null;
  requested_at: string;
  decided_at: string | null;
  decision_reason: string | null;
  refund_amount: number | null;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  client_id: string;
  tailor_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

/**
 * Avis d'un client sur un vendeur de tissu — pendant de {@link Review} côté
 * boutique. Rattaché à une commande de tissu livrée ; `fabric_id` garde le
 * tissu concerné pour l'afficher sur sa fiche.
 */
export interface VendorReview {
  id: string;
  order_id: string;
  client_id: string;
  vendor_id: string;
  fabric_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

/**
 * Une tenue partagée par un client dans la galerie « Inspiration » : cousue par
 * un tailleur du quartier, achetée au marché ou en boutique. Les photos vivent
 * dans {@link InspirationPhoto} ; `fabric_id` relie facultativement le tissu à
 * une fiche du catalogue, en plus de `fabric_note` en texte libre.
 */
export interface InspirationPost {
  id: string;
  author_id: string;
  /** Nom d'affichage de l'auteur, figé à la publication (cf. schéma). */
  author_name: string | null;
  caption: string | null;
  /** Type de vêtement saisi librement (« Grand boubou », « Robe »…). */
  garment_label: string | null;
  /** Qui a confectionné / d'où vient la tenue. */
  maker_kind: InspirationMakerKind;
  /** Nom du tailleur / marché / boutique (facultatif). */
  maker_name: string | null;
  /** Où le tissu a été acheté, en texte libre. */
  fabric_note: string | null;
  /** Lien facultatif vers un tissu du catalogue JALOFA. */
  fabric_id: string | null;
  is_published: boolean;
  created_at: string;
}

export interface InspirationPhoto {
  id: string;
  post_id: string;
  image_url: string;
  sort_order: number;
}

/**
 * Un retour envoyé depuis un espace (client / tailleur / vendeur) et reçu par
 * l'administration. L'auteur est dénormalisé (`author_name`, `author_role`) pour
 * survivre à la suppression du compte et rester lisible côté admin sans join.
 */
export interface Feedback {
  id: string;
  author_id: string | null;
  author_name: string | null;
  author_role: string | null;
  /** L'espace d'où le retour a été envoyé. */
  space: "client" | "tailor" | "vendor";
  category: FeedbackCategory;
  message: string;
  status: FeedbackStatus;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
  /** La commande concernée, pour savoir de quel devis / quelle tenue on parle. */
  order?: {
    order_number: string;
    model: { name: string; image_url: string | null } | null;
    fabric: { name: string; image_url: string | null } | null;
  } | null;
}
