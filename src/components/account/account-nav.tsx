"use client";

import Link from "@/components/i18n/link";
import { usePathname } from "@/lib/i18n/navigation";
import { Bell, Heart, MapPin, Package, Sparkles, UserCog } from "lucide-react";

import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

const LINKS = [
  { href: "/compte", label: "Mes commandes", short: "Commandes", icon: Package, tone: "text-orange-400 bg-orange-500/15" },
  // La cloche : devis prêt, commande acceptée, en route, livrée…
  { href: "/compte/notifications", label: "Notifications", short: "Notifs", icon: Bell, tone: "text-rose-400 bg-rose-500/15", badge: true },
  { href: "/compte/inspiration", label: "Inspiration", short: "Inspiration", icon: Sparkles, tone: "text-violet-400 bg-violet-500/15" },
  { href: "/compte/adresses", label: "Adresses", short: "Adresses", icon: MapPin, tone: "text-sky-400 bg-sky-500/15" },
  { href: "/compte/favoris", label: "Favoris", short: "Favoris", icon: Heart, tone: "text-pink-400 bg-pink-500/15" },
  // Nom, téléphone et mot de passe — la même page que dans les espaces pros.
  { href: "/compte/parametres", label: "Mon compte", short: "Compte", icon: UserCog, tone: "text-emerald-400 bg-emerald-500/15" },
];

const isActive = (pathname: string, href: string) =>
  href === "/compte"
    ? pathname === "/compte" || pathname.startsWith("/compte/commandes")
    : pathname.startsWith(href);

function Badge({ unread, className }: { unread: number; className?: string }) {
  if (unread <= 0) return null;
  return (
    <span
      className={cn(
        "grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] leading-4 font-bold text-white",
        className,
      )}
    >
      {unread > 9 ? "9+" : unread}
    </span>
  );
}

/**
 * Sur mobile : une barre fixe sous le header (elle reste en place quand on
 * défile), six icônes en couleur avec leur nom en dessous — tout tient à
 * l'écran, sans barre de défilement.
 */
export function AccountNavMobile({ unread }: { unread: number }) {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav className="bg-background/95 sticky top-[calc(4rem+1px)] z-30 -mx-4 mb-6 border-b px-1 py-2 backdrop-blur md:hidden">
      <ul className="grid grid-cols-6">
        {LINKS.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className="flex flex-col items-center gap-1 rounded-lg px-0.5 py-1"
              >
                <span
                  className={cn(
                    "relative grid size-9 place-items-center rounded-xl transition",
                    l.tone,
                    active && "ring-2 ring-current",
                  )}
                >
                  <l.icon className="size-[18px]" />
                  {l.badge && <Badge unread={unread} className="absolute -top-1.5 -right-1.5" />}
                </span>
                <span
                  className={cn(
                    "w-full truncate text-center text-[10px] leading-tight",
                    active ? "text-foreground font-semibold" : "text-muted-foreground",
                  )}
                >
                  {t(l.short)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Sur ordinateur : le menu latéral, mêmes couleurs. */
export function AccountNavDesktop({ unread }: { unread: number }) {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((l) => {
        const active = isActive(pathname, l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "hover:bg-muted flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium",
              active && "bg-muted",
            )}
          >
            <span className={cn("grid size-7 place-items-center rounded-lg", l.tone)}>
              <l.icon className="size-4" />
            </span>
            {t(l.label)}
            {l.badge && <Badge unread={unread} className="ml-auto" />}
          </Link>
        );
      })}
    </nav>
  );
}
