"use client";

import { useState } from "react";
import Link from "@/components/i18n/link";
import { usePathname } from "@/lib/i18n/navigation";
import { Ban, Bell, Heart, MapPin, Menu, Package, Ruler, Sparkles, UserCog } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

const LINKS = [
  { href: "/compte", label: "Mes commandes", short: "Commandes", icon: Package, tone: "text-orange-400 bg-orange-500/15" },
  // La cloche : devis prêt, commande acceptée, en route, livrée…
  { href: "/compte/notifications", label: "Notifications", short: "Notifs", icon: Bell, tone: "text-rose-400 bg-rose-500/15", badge: true },
  // Les commandes et devis annulés, à part pour ne pas encombrer « Mes commandes ».
  { href: "/compte/annulees", label: "Annulées", short: "Annulées", icon: Ban, tone: "text-red-400 bg-red-500/15" },
  { href: "/compte/inspiration", label: "Inspiration", short: "Inspiration", icon: Sparkles, tone: "text-violet-400 bg-violet-500/15" },
  // Enregistrées une fois pour toutes, proposées à chaque commande.
  { href: "/compte/mesures", label: "Mes mesures", short: "Mesures", icon: Ruler, tone: "text-amber-400 bg-amber-500/15" },
  { href: "/compte/adresses", label: "Mes coordonnées", short: "Adresse", icon: MapPin, tone: "text-sky-400 bg-sky-500/15" },
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
 * défile) avec un gros bouton « Menu » qui ouvre le menu complet du compte —
 * les mêmes entrées qu'à l'ordinateur — et la cloche des notifications.
 */
export function AccountNavMobile({ unread }: { unread: number }) {
  const pathname = usePathname();
  const t = useT();
  const [open, setOpen] = useState(false);
  const current = LINKS.find((l) => isActive(pathname, l.href)) ?? LINKS[0];
  return (
    <nav className="bg-background/95 sticky top-[calc(4rem+1px)] z-30 -mx-4 mb-6 flex items-center gap-2 border-b px-4 py-2 backdrop-blur md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <button
              type="button"
              className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border px-3 text-left"
            />
          }
        >
          <Menu className="size-5 shrink-0" />
          <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", current.tone)}>
            <current.icon className="size-4" />
          </span>
          <span className="truncate text-sm font-semibold">{t(current.label)}</span>
          <span className="text-muted-foreground ml-auto shrink-0 text-xs">{t("Menu")}</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 gap-0 p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle>{t("Mon espace")}</SheetTitle>
          </SheetHeader>
          <div className="p-3" onClick={() => setOpen(false)}>
            <AccountNavDesktop unread={unread} />
          </div>
        </SheetContent>
      </Sheet>
      <Link
        href="/compte/notifications"
        aria-label={t("Notifications")}
        className="relative grid size-11 shrink-0 place-items-center rounded-xl border text-rose-400"
      >
        <Bell className="size-5" />
        <Badge unread={unread} className="absolute -top-1.5 -right-1.5" />
      </Link>
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
              "hover:bg-muted flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium",
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
