"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogOut, Menu, ShieldCheck } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Wordmark } from "@/components/wordmark";
import { signOut } from "@/lib/actions/auth";
import { ROLE_LABELS } from "@/lib/constants";
import {
  ADMIN_NAV,
  ADMIN_ROOT,
  ADMIN_TITLE,
  type AdminBadges,
  type AdminNavGroup,
} from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

/**
 * Le châssis de l'administration : menu latéral à demeure sur grand écran,
 * tiroir sur mobile. Comme l'espace pro, il remplace l'en-tête et le pied de
 * page du site — l'admin surveille, il ne navigue pas le catalogue. Chaque
 * entrée mène à sa propre page.
 */
export function AdminShell({
  fullName,
  badges,
  children,
}: {
  fullName: string | null;
  badges: AdminBadges;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === ADMIN_ROOT ? pathname === ADMIN_ROOT : pathname.startsWith(href);

  const current = ADMIN_NAV.flatMap((g) => g.items).find((item) =>
    isActive(item.href),
  );

  return (
    <div className="bg-muted/30 flex min-h-svh flex-1 flex-col lg:flex-row">
      <aside className="bg-card sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r lg:flex">
        <Brand />
        <Nav
          badges={badges}
          isActive={isActive}
          className="flex-1 overflow-y-auto px-3 py-2"
        />
        <Account fullName={fullName} />
      </aside>

      <header className="bg-card sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-3 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" aria-label="Menu" />}
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 gap-0 p-0">
            <SheetHeader className="p-0">
              <SheetTitle className="sr-only">{ADMIN_TITLE}</SheetTitle>
              <Brand />
            </SheetHeader>
            <Nav
              badges={badges}
              isActive={isActive}
              onNavigate={() => setOpen(false)}
              className="flex-1 overflow-y-auto px-3 py-2"
            />
            <Account fullName={fullName} />
          </SheetContent>
        </Sheet>
        <Link
          href="/"
          aria-label="JALOFA — accueil"
          className="flex shrink-0 items-center"
        >
          <Wordmark size="sm" />
        </Link>
        <span className="text-muted-foreground truncate border-l pl-2 text-sm font-medium">
          {current?.label ?? ADMIN_TITLE}
        </span>
      </header>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}

/** Même logotype que le reste du site ; « Admin » n'est qu'une mention à côté. */
function Brand() {
  return (
    <div className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <Link
        href="/"
        aria-label="JALOFA — accueil"
        className="flex min-w-0 shrink-0 items-center"
      >
        <Wordmark size="sm" />
      </Link>
      <span className="bg-muted text-muted-foreground ml-auto flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium">
        <ShieldCheck className="size-3" /> Admin
      </span>
    </div>
  );
}

function Nav({
  badges,
  isActive,
  onNavigate,
  className,
}: {
  badges: AdminBadges;
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={className}>
      {ADMIN_NAV.map((group: AdminNavGroup, i) => (
        <div key={group.label ?? i} className={cn(i > 0 && "mt-5")}>
          {group.label && (
            <p className="text-muted-foreground px-3 pb-1.5 text-xs font-medium tracking-wide uppercase">
              {group.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              const count = badges[item.id] ?? 0;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {count > 0 && (
                      <span
                        className={cn(
                          "ml-auto flex min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Account({ fullName }: { fullName: string | null }) {
  const initials = (fullName ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="shrink-0 border-t p-3">
      <div className="flex items-center gap-2 px-1 py-1.5">
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{fullName ?? "Mon compte"}</p>
          <p className="text-muted-foreground truncate text-xs">
            {ROLE_LABELS.admin}
          </p>
        </div>
      </div>
      <div className="mt-1 space-y-0.5">
        <Link
          href="/"
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
        >
          <Home className="size-4 shrink-0" /> Retour au site
        </Link>
        <button
          type="button"
          onClick={() => signOut()}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
        >
          <LogOut className="size-4 shrink-0" /> Se déconnecter
        </button>
      </div>
    </div>
  );
}
