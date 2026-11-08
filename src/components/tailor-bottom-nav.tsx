"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ClipboardList, Home, Plus, Store, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const ROOT = "/tailleur/espace";
const CREATIONS = `${ROOT}/creations`;

/** Écouté par le panneau « Mes créations » quand on est déjà sur la page. */
export const NEW_MODEL_EVENT = "jalofa:new-model";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Préfixes de routes qui allument l'onglet (en plus de `href`). */
  match: string[];
  badge?: boolean;
};

const LEFT: Tab[] = [
  { href: ROOT, label: "Accueil", icon: Home, match: [] },
  {
    href: `${ROOT}/notifications`,
    label: "Notifications",
    icon: Bell,
    match: [`${ROOT}/notifications`],
    badge: true,
  },
];

const RIGHT: Tab[] = [
  {
    href: `${ROOT}/a-traiter`,
    label: "Commandes",
    icon: ClipboardList,
    match: [
      `${ROOT}/a-traiter`,
      `${ROOT}/en-cours`,
      `${ROOT}/livraisons`,
      `${ROOT}/terminees`,
    ],
  },
  {
    href: CREATIONS,
    label: "Boutique",
    icon: Store,
    match: [CREATIONS, `${ROOT}/profil`],
  },
];

/**
 * La barre du bas d'un tailleur connecté, sur mobile — sur le site comme dans
 * son espace. Au centre, un gros bouton « + » (façon bouton de publication des
 * réseaux sociaux) : ajouter un modèle est LE geste du tailleur.
 */
export function TailorBottomNav({
  todo,
  className,
}: {
  /** Nouvelles commandes en attente — la pastille de « Notifications ». */
  todo: number;
  /** Le point de rupture qui masque la barre (`md:hidden`, `lg:hidden`…). */
  className?: string;
}) {
  const pathname = usePathname();

  const isActive = (tab: Tab) =>
    tab.href === ROOT
      ? pathname === ROOT
      : tab.match.some((prefix) => pathname.startsWith(prefix));

  const renderTab = (tab: Tab) => {
    const active = isActive(tab);
    return (
      <Link
        key={tab.href}
        href={tab.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span className="relative">
          <tab.icon className="size-6" strokeWidth={active ? 2.25 : 2} aria-hidden />
          {tab.badge && todo > 0 && (
            <span className="border-background absolute -top-1.5 -right-2.5 flex min-w-4 items-center justify-center rounded-full border-2 bg-rose-500 px-1 text-[0.625rem] leading-4 font-bold text-white">
              {todo}
            </span>
          )}
        </span>
        {tab.label}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Navigation tailleur"
      className={cn(
        "bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur",
        className,
      )}
    >
      <div className="grid h-16 grid-cols-5">
        {LEFT.map(renderTab)}

        <div className="flex items-center justify-center">
          <Link
            href={`${CREATIONS}?nouveau=1`}
            aria-label="Ajouter un modèle"
            onClick={(e) => {
              // Déjà sur « Mes créations » : la page ne se recharge pas, on
              // demande au panneau d'ouvrir l'ajout directement.
              if (pathname === CREATIONS) {
                e.preventDefault();
                window.dispatchEvent(new Event(NEW_MODEL_EVENT));
              }
            }}
            className="relative flex h-10 w-12 items-center justify-center transition-transform active:scale-95"
          >
            {/* Dégradé orange, du clair au foncé : il ne ressemble à aucun
                autre onglet. */}
            <span className="relative flex h-8 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-orange-300 via-orange-500 to-orange-700 text-white">
              <Plus className="size-5" strokeWidth={2.5} aria-hidden />
            </span>
          </Link>
        </div>

        {RIGHT.map(renderTab)}
      </div>
    </nav>
  );
}
