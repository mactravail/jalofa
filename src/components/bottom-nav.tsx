"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleUserRound,
  Home,
  Shirt,
  ShoppingBag,
  SwatchBook,
  type LucideIcon,
} from "lucide-react";

import { useCart } from "@/components/cart/cart-context";
import { cn } from "@/lib/utils";

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
  { href: "/tissus", label: "Tissus", icon: SwatchBook, match: ["/tissus"] },
  {
    href: "/panier",
    label: "Panier",
    icon: ShoppingBag,
    match: ["/panier", "/caisse"],
  },
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
  const { count } = useCart();

  const isActive = (tab: Tab) =>
    tab.href === "/"
      ? pathname === "/"
      : tab.match.some((prefix) => pathname.startsWith(prefix));

  return (
    <nav
      aria-label="Navigation principale"
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
                {tab.href === "/panier" && count > 0 && (
                  <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-2.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[0.625rem] leading-4 font-semibold">
                    {count}
                  </span>
                )}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
