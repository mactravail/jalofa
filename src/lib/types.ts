import type {
  DeliveryMethod,
  MeasurementMode,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  SuspensionReason,
  UserRole,
} from "@/lib/constants";
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
  id: string;
  shop_name: string | null;
  bio: string | null;
  city: string | null;
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
}

export interface Vendor {
  id: string;
  shop_name: string | null;
  bio: string | null;
  city: string | null;
  cover_url: string | null;
  is_active: boolean;
  /** Suspendu par l'administration : bloqué et masqué du catalogue public. */
  is_suspended: boolean;
  /** Motif de la suspension, `null` tant que le pro n'est pas suspendu. */
  suspension_reason: SuspensionReason | null;
  /** Certifié par l'administration : gage de confiance sur la fiche publique. */
  is_certified: boolean;
  /** Abonnement du pro : décide de la commission JALOFA sur ses ventes de tissu. */
  plan: SubscriptionPlanId;
}

export interface FabricCategory {
  slug: string;
  name: string;
  sort_order: number;
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
  image_url: string | null;
  is_active: boolean;
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

export interface GarmentModel {
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
  image_url: string | null;
  is_active: boolean;
  /**
   * Galerie du vêtement, dans l'ordre d'affichage : le vêtement seul d'abord,
   * puis porté (devant, dos), puis les détails. Vide = pas de galerie, on
   * retombe sur `image_url`. Vient de `model_photos` triée par `sort_order`.
   */
  photos: string[];
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
  fabric_price: number;
  tailoring_price: number;
  delivery_fee: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
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

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}
