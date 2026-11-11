"use client";

import Link from "@/components/i18n/link";
import { usePathname } from "@/lib/i18n/navigation";
import {
  CircleUserRound,
  Home,
  Shirt,
  Earth,
  Globe,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Préfixes de routes qui allument l'onglet (en plus de `href`). */
  match: string[];
};

const TABS: Tab[] = [
  { href: "/", label: "Accueil", icon: Home, match: [] },
  {
    href: "/modeles",
    label: "Modèles",
    icon: Shirt,
    match: ["/modeles", "/homme", "/femme", "/commande"],
  },
  // Les tissus restent accessibles par le menu ; la barre du bas met JALOFA EUROPE en avant.
  { href: "/europe", label: "Europe", icon: Globe, match: ["/europe"] },
  // Le panier reste dans le header (icône sur mobile) : la barre du bas met JALOFA AFRIQUE en avant.
  { href: "/afrique", label: "Afrique", icon: Earth, match: ["/afrique"] },
  {
    href: "/compte",
    label: "Compte",
    icon: CircleUserRound,
    match: ["/compte"],
  },
];

/**
 * Barre d'onglets fixe en bas d'écran, façon app native — mobile uniquement.
 * Le contenu doit réserver la place via `pb-bottom-nav` (cf. main-chrome).
 */
export function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  const isActive = (tab: Tab) =>
    tab.href === "/"
      ? pathname === "/"
      : tab.match.some((prefix) => pathname.startsWith(prefix));

  return (
    <nav
      aria-label={t("Navigation principale")}
      className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        {TABS.map((tab) => {
          const active = isActive(tab);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="relative">
                <tab.icon
                  className="size-5"
                  strokeWidth={active ? 2.25 : 2}
                  aria-hidden
                />
              </span>
              {t(tab.label)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
