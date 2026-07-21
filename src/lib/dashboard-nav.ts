import {
  CheckCircle2,
  ClipboardList,
  Layers,
  LayoutDashboard,
  Receipt,
  Scissors,
  Shirt,
  Store,
  Truck,
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
  | "profile"
  | "todo"
  | "ongoing"
  | "shipping"
  | "done"
  | "revenue"
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
    todo: "À traiter",
    ongoing: "Travail en cours",
    done: "Travail terminé",
  },
  vendor: {
    todo: "À traiter",
    ongoing: "En cours",
    done: "Livrées",
  },
};

export function dashboardNav(role: ProRole): DashboardNavGroup[] {
  const root = DASHBOARD_ROOT[role];

  return [
    {
      label: null,
      items: [
        { id: "overview", href: root, label: "Vue d'ensemble", icon: LayoutDashboard },
        // Les deux métiers ont une fiche publique qu'ils composent eux-mêmes :
        // le tailleur sur `/tailleurs/[id]`, le vendeur sur `/vendeurs/[id]`.
        {
          id: "profile",
          href: `${root}/profil`,
          label: "Mon profil public",
          icon: Store,
        },
        { id: "revenue", href: `${root}/revenus`, label: "Mes revenus", icon: Wallet },
      ],
    },
    {
      label: "Commandes",
      items: [
        {
          id: "todo",
          href: `${root}/a-traiter`,
          label: BUCKET_LABELS[role].todo,
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
          label: "Livraisons",
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
      // Le tailleur vend ses créations, le vendeur ses tissus : un métier ne
      // déborde jamais sur l'autre. C'est l'abonnement qui décide (Standard =
      // un seul, Gratuit/Premium = les deux, atteints via le sélecteur d'espace).
      label: "Ma boutique",
      items:
        role === "tailor"
          ? [
              {
                id: "models" as const,
                href: `${root}/creations`,
                label: "Mes créations",
                icon: Shirt,
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
            ],
    },
  ];
}

/** Compteurs affichés en pastille dans le menu. */
export type DashboardBadges = Partial<Record<DashboardNavId, number>>;
