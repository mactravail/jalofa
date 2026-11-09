import {
  Bell,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Crown,
  Layers,
  LayoutDashboard,
  Receipt,
  Scissors,
  Shirt,
  Store,
  Truck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

import type { OrderBucket } from "@/lib/pipeline";

/**
 * Le menu de l'espace pro — volontairement distinct de `NAV_LINKS` (le menu du
 * site public) : une fois connecté, un tailleur ou un vendeur travaille, il ne
 * fait pas ses courses. Chaque entrée est une page à part entière : le tableau
 * de bord ne défile plus.
 */

export type ProRole = "tailor" | "vendor";

export type DashboardNavId =
  | "overview"
  | "notifications"
  | "profile"
  | "account"
  | "todo"
  | "ongoing"
  | "shipping"
  | "done"
  | "revenue"
  | "payout"
  | "offer"
  | "clients"
  | "models"
  | "fabrics"
  | "sales";

export type DashboardNavItem = {
  id: DashboardNavId;
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type DashboardNavGroup = {
  /** null = groupe de tête, sans intitulé. */
  label: string | null;
  items: DashboardNavItem[];
};

export const DASHBOARD_ROOT: Record<ProRole, string> = {
  tailor: "/tailleur/espace",
  vendor: "/vendeur/espace",
};

export const DASHBOARD_TITLE: Record<ProRole, string> = {
  tailor: "Espace tailleur",
  vendor: "Espace vendeur",
};

/** Libellé court pour le sélecteur d'espace des pros aux deux métiers (Gratuit/Premium). */
export const DASHBOARD_TITLE_SHORT: Record<ProRole, string> = {
  tailor: "Tailleur",
  vendor: "Vendeur",
};

/**
 * L'intitulé des trois piles du pipeline : le tailleur coud, le vendeur coupe
 * et expédie — seuls les mots changent. Sert au menu, au titre de la page et à
 * la confirmation affichée quand une commande change de pile.
 */
export const BUCKET_LABELS: Record<ProRole, Record<OrderBucket, string>> = {
  tailor: {
    todo: "Nouvelles commandes",
    ongoing: "En cours",
    done: "Terminées",
  },
  vendor: {
    todo: "Nouvelles commandes",
    ongoing: "En cours",
    done: "Livrées",
  },
};

export function dashboardNav(role: ProRole): DashboardNavGroup[] {
  const root = DASHBOARD_ROOT[role];

  // L'ordre du menu suit la journée d'un pro : ses commandes d'abord, puis ce
  // qu'il vend, son argent, et enfin son compte.
  return [
    {
      label: null,
      items: [
        { id: "overview", href: root, label: "Accueil", icon: LayoutDashboard },
        // Le bouton cloche de la barre du bas du tailleur : nouvelles commandes
        // + messages de la plateforme.
        ...(role === "tailor"
          ? [
              {
                id: "notifications" as const,
                href: `${root}/notifications`,
                label: "Notifications",
                icon: Bell,
              },
            ]
          : []),
      ],
    },
    {
      label: "Commandes",
      items: [
        {
          id: "todo",
          href: `${root}/a-traiter`,
          label: "Nouvelles",
          icon: ClipboardList,
        },
        {
          id: "ongoing",
          href: `${root}/en-cours`,
          label: BUCKET_LABELS[role].ongoing,
          icon: Scissors,
        },
        {
          // Vue transversale : les commandes à livrer regroupées par ville, pour
          // expédier ensemble les colis d'une même destination.
          id: "shipping",
          href: `${root}/livraisons`,
          label: "À livrer",
          icon: Truck,
        },
        {
          id: "done",
          href: `${root}/terminees`,
          label: BUCKET_LABELS[role].done,
          icon: CheckCircle2,
        },
      ],
    },
    {
      // Le tailleur vend ses modèles et les tissus qu'il a en atelier ; le
      // vendeur vend ses tissus.
      label: "Ma boutique",
      items: [
        ...(role === "tailor"
          ? [
              {
                id: "models" as const,
                href: `${root}/creations`,
                label: "Mes modèles",
                icon: Shirt,
              },
              {
                id: "fabrics" as const,
                href: `${root}/tissus`,
                label: "Mes tissus",
                icon: Layers,
              },
            ]
          : [
              {
                id: "fabrics" as const,
                href: `${root}/tissus`,
                label: "Mes tissus",
                icon: Layers,
              },
              {
                id: "sales" as const,
                href: `${root}/ventes`,
                label: "Ventes de tissus",
                icon: Receipt,
              },
            ]),
        // La fiche publique que le pro compose lui-même : `/tailleurs/[id]` ou
        // `/vendeurs/[id]`.
        {
          id: "profile",
          href: `${root}/profil`,
          label: "Ma page publique",
          icon: Store,
        },
        {
          id: "clients",
          href: `${root}/clients`,
          label: "Mes clients",
          icon: Users,
        },
      ],
    },
    {
      label: "Mon argent",
      items: [
        {
          id: "revenue",
          href: `${root}/revenus`,
          label: "Ce que j'ai gagné",
          icon: Wallet,
        },
        {
          id: "payout",
          href: `${root}/paiement`,
          label: "Recevoir mon argent",
          icon: CreditCard,
        },
        // L'offre du compte pro (Gratuit avec commission, ou Pro payant via
        // PayDunya) — aussi la page de retour après paiement.
        {
          id: "offer",
          href: `${root}/offre`,
          label: "Mon offre",
          icon: Crown,
        },
      ],
    },
    {
      label: "Mon compte",
      items: [
        // Le nom, le téléphone et le mot de passe — à ne pas confondre avec la
        // page publique, vue par les clients.
        {
          id: "account",
          href: `${root}/compte`,
          label: "Mes informations",
          icon: UserCog,
        },
      ],
    },
  ];
}

/** Compteurs affichés en pastille dans le menu. */
export type DashboardBadges = Partial<Record<DashboardNavId, number>>;
