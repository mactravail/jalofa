import {
  BadgeCheck,
  BarChart3,
  Ban,
  Bell,
  LayoutDashboard,
  Layers,
  MessageCircle,
  MessageSquare,
  OctagonX,
  PackageSearch,
  ShoppingBag,
  Scissors,
  Shirt,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  Store,
  Undo2,
  UserCog,
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
  | "stats"
  | "account"
  | "notifications"
  | "orders"
  | "rejections"
  | "receipts"
  | "shipmentChecks"
  | "cancellations"
  | "refunds"
  | "users"
  | "subscriptions"
  | "tailors"
  | "vendors"
  | "certifications"
  | "validations"
  | "fabrics"
  | "models"
  | "reviews"
  | "inspiration"
  | "feedback"
  | "satisfaction"
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
      // Visiteurs du site et pages où ils s'arrêtent (`page_views`).
      {
        id: "stats",
        href: `${ADMIN_ROOT}/statistiques`,
        label: "Statistiques",
        icon: BarChart3,
      },
      // La cloche : alertes de la place de marché (ex. modèle masqué après commande).
      {
        id: "notifications",
        href: `${ADMIN_ROOT}/notifications`,
        label: "Notifications",
        icon: Bell,
      },
      // Le compte de l'administrateur lui-même : son nom et son mot de passe.
      {
        id: "account",
        href: `${ADMIN_ROOT}/compte`,
        label: "Mon compte",
        icon: UserCog,
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
        id: "receipts",
        href: `${ADMIN_ROOT}/receptions`,
        label: "Colis à confirmer",
        icon: MessageCircle,
      },
      // Le tailleur a reçu un tissu que le vendeur n'a pas déclaré envoyé.
      {
        id: "shipmentChecks",
        href: `${ADMIN_ROOT}/envois`,
        label: "Envois à vérifier",
        icon: PackageSearch,
      },
      {
        id: "cancellations",
        href: `${ADMIN_ROOT}/annulations`,
        label: "Annulations",
        icon: OctagonX,
      },
      {
        id: "refunds",
        href: `${ADMIN_ROOT}/remboursements`,
        label: "Remboursements",
        icon: Undo2,
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
        // Anti-arnaque : un nouveau pro ne vend qu'une fois validé ici.
        id: "validations",
        href: `${ADMIN_ROOT}/validations`,
        label: "Validations",
        icon: ShieldCheck,
      },
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
      {
        id: "certifications",
        href: `${ADMIN_ROOT}/certifications`,
        label: "Certifications",
        icon: BadgeCheck,
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
      // « La tenue vous va ? » : Parfaite / Un problème, par prestataire.
      {
        id: "satisfaction",
        href: `${ADMIN_ROOT}/satisfaction`,
        label: "Satisfaction",
        icon: ThumbsUp,
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
