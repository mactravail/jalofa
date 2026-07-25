import "server-only";

import type { OrderListItem, OrderMeasurement } from "@/lib/orders-data";
import type { OrderStatus, OrderType } from "@/lib/constants";

// Demo orders used by the pro dashboard while Supabase is not provisioned.
// Each set is tailored to the role so the pipeline actions shown are the ones
// that pro is actually responsible for (see src/lib/pipeline.ts).

const fabricImg = (n: number) => `/fabrics/${n}.jpg`;

// Deux relevés de démo : un sur mesure (le tailleur lit chaque cote) et une
// taille standard, pour montrer les deux façons dont une commande arrive.
const bespoke = (m: Partial<OrderMeasurement>): OrderMeasurement => ({
  mode: "manual",
  standard_size: null,
  height: null,
  chest: null,
  waist: null,
  hips: null,
  shoulders: null,
  arm_length: null,
  leg_length: null,
  neck: null,
  wrist: null,
  notes: null,
  label: null,
  ...m,
});

const standard = (size: string): OrderMeasurement =>
  bespoke({ mode: "standard", standard_size: size });

type DemoInput = {
  n: number;
  client: string;
  /** Ville de livraison — sert au regroupement des colis (page « Livraisons »). */
  city?: string;
  type: OrderType;
  status: OrderStatus;
  model?: string;
  fabric?: {
    name: string;
    image_url: string | null;
    color?: string | null;
    material?: string | null;
  };
  fabric_meters?: number;
  fabric_price?: number;
  tailoring_price?: number;
  measurement?: OrderMeasurement;
  notes?: string;
  paid?: boolean;
  daysAgo: number;
};

const DAY = 86_400_000;

function mk(o: DemoInput): OrderListItem {
  const fabricPrice = o.fabric_price ?? 0;
  const tailoringPrice = o.tailoring_price ?? 0;
  const deliveryFee = 2000;
  const created = new Date(Date.now() - o.daysAgo * DAY).toISOString();
  const [firstName, ...lastName] = o.client.split(" ");
  return {
    id: `demo-order-${o.n}`,
    order_number: `NAT-2607-${String(o.n).padStart(5, "0")}`,
    client_id: `demo-client-${o.n}`,
    tailor_id: o.type === "fabric_only" ? null : "demo-tailor-self",
    vendor_id: o.type === "own_fabric" ? null : "demo-vendor-self",
    type: o.type,
    model_id: o.model ? `demo-model-${o.n}` : null,
    style_slug: null,
    fabric_id: o.fabric ? `demo-fabric-${o.n}` : null,
    fabric_meters: o.fabric_meters ?? null,
    measurement_id: null,
    address_id: null,
    delivery_method: "home",
    delivery_city: o.city ?? null,
    contact_first_name: firstName,
    contact_last_name: lastName.join(" "),
    contact_email: `${firstName.toLowerCase()}@exemple.com`,
    contact_phone: "+221 77 000 00 00",
    status: o.status,
    rejection_reason: o.status === "rejected" ? "too_busy" : null,
    fabric_price: fabricPrice,
    tailoring_price: tailoringPrice,
    delivery_fee: deliveryFee,
    total_amount: fabricPrice + tailoringPrice + deliveryFee,
    payment_status: o.paid === false ? "pending" : "paid",
    payment_method: "wave",
    notes: o.notes ?? null,
    created_at: created,
    updated_at: created,
    model: o.model ? { name: o.model } : null,
    fabric: o.fabric ?? null,
    tailor: null,
    style: null,
    client: { full_name: o.client, phone: "+221 77 000 00 00" },
    measurement: o.measurement ?? null,
  };
}

const TAILOR_INPUTS: DemoInput[] = [
  {
    n: 1042,
    client: "Aïssatou Diallo",
    city: "Mbour",
    type: "full",
    status: "received",
    model: "Grand Boubou",
    fabric: {
      name: "Bazin Riche Blanc",
      image_url: fabricImg(7),
      color: "Blanc cassé",
      material: "Bazin (coton damassé)",
    },
    fabric_meters: 6,
    fabric_price: 22800,
    tailoring_price: 20000,
    measurement: bespoke({
      label: "Aïssatou",
      height: 170,
      chest: 96,
      waist: 82,
      hips: 104,
      shoulders: 41,
      arm_length: 60,
      neck: 38,
      wrist: 16,
    }),
    notes: "Broderie dorée à l'encolure et aux manches. Coupe ample.",
    daysAgo: 0,
  },
  {
    n: 1039,
    client: "Mamadou Sow",
    city: "Thiès",
    type: "full",
    status: "fabric_shipped",
    model: "Costume",
    fabric: {
      name: "Laine Bleu Royal",
      image_url: fabricImg(5),
      color: "Bleu royal",
      material: "Laine",
    },
    fabric_meters: 3.5,
    fabric_price: 45500,
    tailoring_price: 35000,
    measurement: bespoke({
      label: "Mamadou",
      height: 182,
      chest: 104,
      waist: 92,
      hips: 102,
      shoulders: 47,
      arm_length: 65,
      leg_length: 108,
      neck: 42,
      wrist: 18,
    }),
    daysAgo: 4,
  },
  {
    n: 1036,
    client: "Fatou Ndiaye",
    city: "Mbour",
    type: "own_fabric",
    status: "in_production",
    model: "Kaftan",
    tailoring_price: 18000,
    measurement: standard("L"),
    daysAgo: 6,
  },
  {
    n: 1031,
    client: "Ndeye Fall",
    city: "Thiès",
    type: "full",
    status: "accepted",
    model: "Robe",
    fabric: {
      name: "Wax Ciré Fleuri",
      image_url: fabricImg(14),
      color: "Multicolore fleuri",
      material: "Wax (coton ciré)",
    },
    fabric_meters: 5,
    fabric_price: 19000,
    tailoring_price: 25000,
    measurement: bespoke({
      label: "Ndeye",
      height: 165,
      chest: 90,
      waist: 72,
      hips: 100,
      shoulders: 39,
      arm_length: 57,
      leg_length: 100,
    }),
    notes: "Robe cintrée, longueur cheville. Fente arrière.",
    daysAgo: 2,
  },
  {
    n: 1028,
    client: "Ousmane Ba",
    city: "Dakar",
    type: "full",
    status: "sewing",
    model: "Chemise Africaine",
    fabric: {
      name: "Popeline Gris Perle",
      image_url: fabricImg(8),
      color: "Gris perle",
      material: "Popeline de coton",
    },
    fabric_meters: 2,
    fabric_price: 7600,
    tailoring_price: 12000,
    measurement: standard("M"),
    daysAgo: 9,
  },
  {
    n: 1019,
    client: "Bineta Gueye",
    city: "Rome",
    type: "full",
    status: "delivered",
    model: "Ensemble",
    fabric: {
      name: "Lin Terracotta",
      image_url: fabricImg(11),
      color: "Terracotta",
      material: "Lin",
    },
    fabric_meters: 4,
    fabric_price: 26000,
    tailoring_price: 22000,
    measurement: bespoke({
      label: "Bineta",
      height: 168,
      chest: 94,
      waist: 76,
      hips: 102,
      shoulders: 40,
      arm_length: 58,
    }),
    daysAgo: 21,
  },
];

const VENDOR_INPUTS: DemoInput[] = [
  {
    n: 2087,
    client: "Awa Cissé",
    city: "Mbour",
    type: "fabric_only",
    status: "received",
    fabric: { name: "Bazin Riche Bleu Nuit", image_url: fabricImg(3) },
    fabric_meters: 6,
    fabric_price: 27000,
    daysAgo: 0,
  },
  {
    n: 2084,
    client: "Cheikh Mbaye",
    city: "Dakar",
    type: "full",
    status: "accepted",
    model: "Costume",
    fabric: { name: "Laine Mérinos Vert Forêt", image_url: fabricImg(1) },
    fabric_meters: 3.5,
    fabric_price: 42000,
    tailoring_price: 30000,
    daysAgo: 1,
  },
  {
    n: 2081,
    client: "Sokhna Faye",
    city: "Thiès",
    type: "full",
    status: "fabric_prepared",
    model: "Grand Boubou",
    fabric: { name: "Tweed Gris Chiné", image_url: fabricImg(2) },
    fabric_meters: 6,
    fabric_price: 66000,
    tailoring_price: 25000,
    daysAgo: 3,
  },
  {
    n: 2078,
    client: "Modou Diop",
    city: "Mbour",
    type: "fabric_only",
    status: "fabric_shipped",
    fabric: { name: "Seersucker Rayé Vert", image_url: fabricImg(10) },
    fabric_meters: 4,
    fabric_price: 20000,
    daysAgo: 5,
  },
  {
    n: 2072,
    client: "Rama Thiam",
    city: "Saint-Louis",
    type: "full",
    status: "in_production",
    model: "Robe",
    fabric: { name: "Lin Vert Olive", image_url: fabricImg(13) },
    fabric_meters: 5,
    fabric_price: 32500,
    tailoring_price: 25000,
    daysAgo: 8,
  },
  {
    n: 2065,
    client: "Pape Ndoye",
    city: "Thiaroye",
    type: "fabric_only",
    status: "delivered",
    fabric: { name: "Popeline Blanche", image_url: fabricImg(7) },
    fabric_meters: 3,
    fabric_price: 11400,
    daysAgo: 18,
  },
];

export const DEMO_TAILOR_ORDERS: OrderListItem[] = TAILOR_INPUTS.map(mk);
export const DEMO_VENDOR_ORDERS: OrderListItem[] = VENDOR_INPUTS.map(mk);
