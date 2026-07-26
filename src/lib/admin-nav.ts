import {
  Ban,
  LayoutDashboard,
  Layers,
  MessageSquare,
  ShoppingBag,
  Scissors,
  Shirt,
  Sparkles,
  Star,
  Store,
  Users,
} from "lucide-react";

/**
 * Le menu de l'espace d'administration — la vigie de la place de marché. Comme
 * l'espace pro (cf. `dashboard-nav`), il est volontairement distinct du site :
 * l'admin surveille et modère, il ne fait pas ses courses. Chaque entrée est
 * une page à part entière — jamais un tableau de bord unique qui défile.
 */

export const ADMIN_ROOT = "/admin";
export const ADMIN_TITLE = "Administration";

export type AdminNavId =
  | "overview"
  | "orders"
  | "rejections"
  | "users"
  | "subscriptions"
  | "tailors"
  | "vendors"
  | "fabrics"
  | "models"
  | "reviews"
  | "inspiration"
  | "feedback"
  | "finance"
  | "payouts";

export type AdminNavItem = {
  id: AdminNavId;
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type AdminNavGroup = {
  /** null = groupe de tête, sans intitulé. */
  label: string | null;
  items: AdminNavItem[];
};

/** Compteurs affichés en pastille dans le menu (ex. commandes en attente). */
export type AdminBadges = Partial<Record<AdminNavId, number>>;

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: null,
    items: [
      {
        id: "overview",
        href: ADMIN_ROOT,
        label: "Vue d'ensemble",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Marché",
    items: [
      {
        id: "orders",
        href: `${ADMIN_ROOT}/commandes`,
        label: "Commandes",
        icon: ShoppingBag,
      },
      {
        id: "rejections",
        href: `${ADMIN_ROOT}/refus`,
        label: "Refus",
        icon: Ban,
      },
      {
        id: "users",
        href: `${ADMIN_ROOT}/utilisateurs`,
        label: "Utilisateurs",
        icon: Users,
      },
      {
        id: "feedback",
        href: `${ADMIN_ROOT}/feedback`,
        label: "Retours",
        icon: MessageSquare,
      },
    ],
  },
  {
    // JALOFA est gratuit pour les pros : plus d'abonnements ni de reversements
    // à administrer. Les pages `/admin/abonnements`, `/admin/finances` et
    // `/admin/reversements` restent en place (non liées) pour un retour éventuel
    // des forfaits — voir aussi `src/lib/subscriptions.ts`.
    label: "Prestataires",
    items: [
      {
        id: "tailors",
        href: `${ADMIN_ROOT}/tailleurs`,
        label: "Tailleurs",
        icon: Scissors,
      },
      {
        id: "vendors",
        href: `${ADMIN_ROOT}/vendeurs`,
        label: "Vendeurs",
        icon: Store,
      },
    ],
  },
  {
    label: "Catalogue",
    items: [
      {
        id: "fabrics",
        href: `${ADMIN_ROOT}/tissus`,
        label: "Tissus",
        icon: Layers,
      },
      {
        id: "models",
        href: `${ADMIN_ROOT}/modeles`,
        label: "Modèles",
        icon: Shirt,
      },
      {
        id: "reviews",
        href: `${ADMIN_ROOT}/avis`,
        label: "Avis",
        icon: Star,
      },
      {
        id: "inspiration",
        href: `${ADMIN_ROOT}/inspiration`,
        label: "Inspiration",
        icon: Sparkles,
      },
    ],
  },
];
