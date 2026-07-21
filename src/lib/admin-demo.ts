import "server-only";

import type { ReviewRow } from "@/lib/admin-data";
import type { OrderStatus, OrderType, PaymentMethod } from "@/lib/constants";
import { TAILORS, VENDORS } from "@/lib/fixtures";
import type { OrderListItem } from "@/lib/orders-data";
import type { Profile, Vendor } from "@/lib/types";

// Données de démonstration propres à l'administration : la place de marché vue
// d'en haut, alors que Supabase n'est pas encore provisionné. Elles complètent
// les fixtures publiques (tissus, modèles, tailleurs) avec ce que seul l'admin
// voit — les comptes, les boutiques vendeurs et les avis.

const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();

// --- Commandes de la place, attribuées aux prestataires nommés --------------
//
// À la différence des jeux du dashboard pro (où chaque commande vise le pro
// « self »), l'admin voit *qui* touche quoi : chaque commande porte l'id du
// vendeur et/ou du tailleur des fixtures. C'est ce qui permet de ventiler les
// reversements par prestataire (cf. `@/lib/payouts`) tout en gardant les mêmes
// commandes derrière le volume d'affaires, les commissions et la livraison.

const V_HLM = "demo-vendor-hlm";
const V_TOUBA = "demo-vendor-touba";
const V_KHADI = "demo-vendor-khadi";
const T_FATOU = "demo-tailor-fatou";
const T_MODOU = "demo-tailor-modou";
const T_AWA = "demo-tailor-awa";
const T_IBRAHIMA = "demo-tailor-ibrahima";

// Nom de boutique par id, dérivé des fixtures, pour joindre le prestataire
// crédité à chaque commande (ce que Supabase fait via `vendor:vendors(shop_name)`
// / `tailor:tailors(...)`). Les ids `V_*` ci-dessus sont ceux des fixtures.
const VENDOR_SHOP: Record<string, string | null> = Object.fromEntries(
  VENDORS.map((v) => [v.id, v.shop_name]),
);

const TAILOR_SHOP: Record<string, string | null> = Object.fromEntries(
  TAILORS.map((t) => [t.id, t.shop_name]),
);

const DELIVERY_FEE = 2000;

// Ville de livraison par client, pour que la fiche de commande côté admin porte
// la même destination que ce dont le pro se sert pour regrouper ses colis.
// (Repris des villes des comptes clients plus bas, mais défini ici car
// `mkAdminOrder` s'exécute avant `USER_SEEDS`.)
const CLIENT_CITY: Record<string, string> = {
  "Aïssatou Diallo": "Dakar",
  "Mamadou Sow": "Rufisque",
  "Fatou Ndiaye": "Dakar",
  "Ndeye Fall": "Mbour",
  "Ousmane Ba": "Thiès",
  "Bineta Gueye": "Dakar",
  "Awa Cissé": "Kaolack",
  "Cheikh Mbaye": "Dakar",
  "Sokhna Faye": "Diourbel",
  "Modou Diop": "Dakar",
  "Rama Thiam": "Saint-Louis",
  "Pape Ndoye": "Dakar",
};

type AdminOrderSeed = {
  n: number;
  client: string;
  type: OrderType;
  status: OrderStatus;
  /** Boutique de tissu créditée (null pour « j'ai déjà mon tissu »). */
  vendor?: string | null;
  /** Atelier crédité (null pour « tissu seul »). */
  tailor?: string | null;
  /** Libellé affiché : nom du modèle, ou du tissu pour une vente sèche. */
  item: string;
  /** Tissu choisi pour une commande complète (le vendeur le fournit). Pour une
   *  vente de tissu seul, c'est `item` ; pour « j'ai déjà mon tissu », aucun. */
  fabric?: string;
  fabric_price?: number;
  tailoring_price?: number;
  method: PaymentMethod;
  /** `false` = commande passée mais pas encore réglée. */
  paid?: boolean;
  daysAgo: number;
};

function mkAdminOrder(o: AdminOrderSeed): OrderListItem {
  const fabricPrice = o.fabric_price ?? 0;
  const tailoringPrice = o.tailoring_price ?? 0;
  const [firstName, ...lastName] = o.client.split(" ");
  const created = daysAgo(o.daysAgo);
  return {
    id: `demo-adm-${o.n}`,
    order_number: `NAT-2607-${String(o.n).padStart(5, "0")}`,
    client_id: `demo-client-adm-${o.n}`,
    tailor_id: o.tailor ?? null,
    vendor_id: o.vendor ?? null,
    type: o.type,
    model_id: null,
    style_slug: null,
    fabric_id: null,
    fabric_meters: null,
    measurement_id: null,
    address_id: null,
    delivery_method: "home",
    delivery_city: CLIENT_CITY[o.client] ?? null,
    contact_first_name: firstName,
    contact_last_name: lastName.join(" "),
    contact_email: null,
    contact_phone: "+221 77 000 00 00",
    status: o.status,
    fabric_price: fabricPrice,
    tailoring_price: tailoringPrice,
    delivery_fee: DELIVERY_FEE,
    total_amount: fabricPrice + tailoringPrice + DELIVERY_FEE,
    payment_status: o.paid === false ? "pending" : "paid",
    payment_method: o.method,
    notes: null,
    created_at: created,
    updated_at: created,
    model: o.type === "fabric_only" ? null : { name: o.item },
    fabric:
      o.type === "fabric_only"
        ? { name: o.item, image_url: null }
        : o.fabric
          ? { name: o.fabric, image_url: null }
          : null,
    tailor: o.tailor ? { shop_name: TAILOR_SHOP[o.tailor] ?? null } : null,
    vendor: o.vendor ? { shop_name: VENDOR_SHOP[o.vendor] ?? null } : null,
    style: null,
    client: { full_name: o.client, phone: "+221 77 000 00 00" },
    measurement: null,
  };
}

const ADMIN_ORDER_SEEDS: AdminOrderSeed[] = [
  { n: 2601, client: "Aïssatou Diallo", type: "full", status: "delivered", vendor: V_HLM, tailor: T_FATOU, item: "Grand Boubou", fabric: "Bazin Riche Blanc", fabric_price: 22800, tailoring_price: 20000, method: "orange_money", daysAgo: 20 },
  { n: 2602, client: "Mamadou Sow", type: "full", status: "shipped", vendor: V_TOUBA, tailor: T_MODOU, item: "Costume", fabric: "Laine Bleu Royal", fabric_price: 45500, tailoring_price: 35000, method: "wave", daysAgo: 4 },
  { n: 2603, client: "Fatou Ndiaye", type: "own_fabric", status: "in_production", tailor: T_AWA, item: "Kaftan", tailoring_price: 18000, method: "free_money", daysAgo: 6 },
  { n: 2604, client: "Ndeye Fall", type: "full", status: "accepted", vendor: V_KHADI, tailor: T_FATOU, item: "Robe", fabric: "Wax Ciré Fleuri", fabric_price: 19000, tailoring_price: 25000, method: "card", daysAgo: 2 },
  { n: 2605, client: "Ousmane Ba", type: "full", status: "sewing", vendor: V_HLM, tailor: T_IBRAHIMA, item: "Chemise Africaine", fabric: "Popeline Gris Perle", fabric_price: 7600, tailoring_price: 12000, method: "wave", daysAgo: 9 },
  { n: 2606, client: "Bineta Gueye", type: "full", status: "delivered", vendor: V_TOUBA, tailor: T_FATOU, item: "Ensemble", fabric: "Lin Terracotta", fabric_price: 26000, tailoring_price: 22000, method: "orange_money", daysAgo: 21 },
  { n: 2607, client: "Awa Cissé", type: "fabric_only", status: "received", vendor: V_HLM, item: "Bazin Riche Bleu Nuit", fabric_price: 27000, method: "wave", paid: false, daysAgo: 0 },
  { n: 2608, client: "Cheikh Mbaye", type: "full", status: "accepted", vendor: V_TOUBA, tailor: T_MODOU, item: "Costume", fabric: "Laine Mérinos Vert Forêt", fabric_price: 42000, tailoring_price: 30000, method: "card", daysAgo: 1 },
  { n: 2609, client: "Sokhna Faye", type: "full", status: "fabric_prepared", vendor: V_HLM, tailor: T_AWA, item: "Grand Boubou", fabric: "Bazin Riche Bleu Roi", fabric_price: 66000, tailoring_price: 25000, method: "orange_money", daysAgo: 3 },
  { n: 2610, client: "Modou Diop", type: "fabric_only", status: "fabric_shipped", vendor: V_KHADI, item: "Seersucker Rayé Vert", fabric_price: 20000, method: "wave", daysAgo: 5 },
  { n: 2611, client: "Rama Thiam", type: "full", status: "in_production", vendor: V_TOUBA, tailor: T_IBRAHIMA, item: "Robe", fabric: "Wax Fleuri Indigo", fabric_price: 32500, tailoring_price: 25000, method: "free_money", daysAgo: 8 },
  { n: 2612, client: "Pape Ndoye", type: "fabric_only", status: "delivered", vendor: V_HLM, item: "Popeline Blanche", fabric_price: 11400, method: "wave", daysAgo: 18 },
  { n: 2613, client: "Rama Thiam", type: "own_fabric", status: "delivered", tailor: T_MODOU, item: "Boubou Femme", tailoring_price: 21000, method: "orange_money", daysAgo: 25 },
  { n: 2614, client: "Cheikh Mbaye", type: "full", status: "received", vendor: V_KHADI, tailor: T_FATOU, item: "Kaftan", fabric: "Getzner Vert Émeraude", fabric_price: 15000, tailoring_price: 16000, method: "card", paid: false, daysAgo: 0 },
  { n: 2615, client: "Ndeye Fall", type: "full", status: "quality_check", vendor: V_HLM, tailor: T_AWA, item: "Ensemble", fabric: "Lin Sable", fabric_price: 24000, tailoring_price: 22000, method: "wave", daysAgo: 7 },
];

/** Toutes les commandes de la place, les deux métiers confondus, du plus récent. */
export const DEMO_ALL_ORDERS: OrderListItem[] = ADMIN_ORDER_SEEDS.map(
  mkAdminOrder,
).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

type UserSeed = {
  id: string;
  role: Profile["role"];
  full_name: string;
  city: string;
  daysAgo: number;
};

const USER_SEEDS: UserSeed[] = [
  { id: "demo-admin", role: "admin", full_name: "Awa Sène", city: "Dakar", daysAgo: 240 },

  // Tailleurs (propriétaires des boutiques des fixtures).
  { id: "demo-tailor-fatou", role: "tailor", full_name: "Fatou Diop", city: "Dakar", daysAgo: 210 },
  { id: "demo-tailor-modou", role: "tailor", full_name: "Modou Kane", city: "Thiès", daysAgo: 180 },
  { id: "demo-tailor-awa", role: "tailor", full_name: "Awa Ndour", city: "Dakar", daysAgo: 165 },
  { id: "demo-tailor-ibrahima", role: "tailor", full_name: "Ibrahima Sarr", city: "Saint-Louis", daysAgo: 120 },

  // Vendeurs de tissus.
  { id: "demo-vendor-hlm", role: "vendor", full_name: "Cheikh Diagne", city: "Dakar", daysAgo: 200 },
  { id: "demo-vendor-touba", role: "vendor", full_name: "Serigne Fall", city: "Touba", daysAgo: 140 },
  { id: "demo-vendor-khadi", role: "vendor", full_name: "Khadija Ba", city: "Dakar", daysAgo: 95 },

  // Clients.
  { id: "demo-client-aissatou", role: "client", full_name: "Aïssatou Diallo", city: "Dakar", daysAgo: 62 },
  { id: "demo-client-mamadou", role: "client", full_name: "Mamadou Sow", city: "Rufisque", daysAgo: 55 },
  { id: "demo-client-fatou", role: "client", full_name: "Fatou Ndiaye", city: "Dakar", daysAgo: 48 },
  { id: "demo-client-ndeye", role: "client", full_name: "Ndeye Fall", city: "Mbour", daysAgo: 40 },
  { id: "demo-client-ousmane", role: "client", full_name: "Ousmane Ba", city: "Thiès", daysAgo: 33 },
  { id: "demo-client-bineta", role: "client", full_name: "Bineta Gueye", city: "Dakar", daysAgo: 28 },
  { id: "demo-client-awa", role: "client", full_name: "Awa Cissé", city: "Kaolack", daysAgo: 22 },
  { id: "demo-client-cheikh", role: "client", full_name: "Cheikh Mbaye", city: "Dakar", daysAgo: 18 },
  { id: "demo-client-sokhna", role: "client", full_name: "Sokhna Faye", city: "Diourbel", daysAgo: 12 },
  { id: "demo-client-modou", role: "client", full_name: "Modou Diop", city: "Dakar", daysAgo: 8 },
  { id: "demo-client-rama", role: "client", full_name: "Rama Thiam", city: "Saint-Louis", daysAgo: 4 },
  { id: "demo-client-pape", role: "client", full_name: "Pape Ndoye", city: "Dakar", daysAgo: 1 },
];

export const DEMO_USERS: Profile[] = USER_SEEDS.map((u) => ({
  id: u.id,
  role: u.role,
  full_name: u.full_name,
  phone: "+221 77 000 00 00",
  avatar_url: null,
  city: u.city,
  created_at: daysAgo(u.daysAgo),
}));

// Les boutiques vendeurs vivent désormais avec le catalogue public (fixtures) :
// l'admin voit les mêmes lignes que la fiche publique `/vendeurs/[id]`.
export const DEMO_VENDORS: Vendor[] = VENDORS;

/** Avis clients, joints à l'auteur et à la boutique notée pour l'affichage. */
export const DEMO_REVIEWS: ReviewRow[] = [
  {
    id: "demo-review-1",
    order_id: "demo-order-1019",
    client_id: "demo-client-bineta",
    tailor_id: "demo-tailor-fatou",
    rating: 5,
    comment: "Boubou impeccable, finitions soignées et livraison à l'heure. Merci !",
    created_at: daysAgo(16),
    client: { full_name: "Bineta Gueye" },
    tailor: { shop_name: "Atelier Fatou Couture" },
  },
  {
    id: "demo-review-2",
    order_id: "demo-order-2065",
    client_id: "demo-client-pape",
    tailor_id: "demo-tailor-modou",
    rating: 4,
    comment: "Très bon travail, la coupe est parfaite. Un léger retard de deux jours.",
    created_at: daysAgo(14),
    client: { full_name: "Pape Ndoye" },
    tailor: { shop_name: "Modou Tailleur Moderne" },
  },
  {
    id: "demo-review-3",
    order_id: "demo-order-1028",
    client_id: "demo-client-ousmane",
    tailor_id: "demo-tailor-awa",
    rating: 5,
    comment: "La broderie est magnifique, exactement ce que je voulais.",
    created_at: daysAgo(9),
    client: { full_name: "Ousmane Ba" },
    tailor: { shop_name: "Awa Design & Broderie" },
  },
  {
    id: "demo-review-4",
    order_id: "demo-order-1036",
    client_id: "demo-client-fatou",
    tailor_id: "demo-tailor-ibrahima",
    rating: 3,
    comment: "Kaftan correct mais le tissu fourni n'a pas été très bien repassé.",
    created_at: daysAgo(6),
    client: { full_name: "Fatou Ndiaye" },
    tailor: { shop_name: "Ibrahima Sur Mesure" },
  },
  {
    id: "demo-review-5",
    order_id: "demo-order-1031",
    client_id: "demo-client-ndeye",
    tailor_id: "demo-tailor-fatou",
    rating: 5,
    comment: "Deuxième commande, toujours aussi satisfaite. Je recommande vivement.",
    created_at: daysAgo(3),
    client: { full_name: "Ndeye Fall" },
    tailor: { shop_name: "Atelier Fatou Couture" },
  },
];
