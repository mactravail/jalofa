"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogOut, Menu, Scissors, Store } from "lucide-react";

import { useBucket } from "@/components/dashboard/pipeline-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { signOut } from "@/lib/actions/auth";
import { ROLE_LABELS } from "@/lib/constants";
import {
  DASHBOARD_ROOT,
  DASHBOARD_TITLE,
  DASHBOARD_TITLE_SHORT,
  dashboardNav,
  type DashboardBadges,
  type DashboardNavGroup,
  type ProRole,
} from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

/**
 * Le châssis de l'espace pro : menu latéral à demeure sur grand écran, tiroir
 * sur mobile. Il remplace l'en-tête et le pied de page du site — chaque entrée
 * mène à sa propre page, sans le long défilement d'un tableau de bord unique.
 */
export function DashboardShell({
  role,
  fullName,
  badges,
  capabilities,
  children,
}: {
  role: ProRole;
  fullName: string | null;
  /** Pastilles hors pipeline — « À traiter » se compte tout seul, ci-dessous. */
  badges: DashboardBadges;
  /**
   * Les espaces auxquels le pro a droit. Au-delà d'un (Gratuit/Premium), le châssis
   * affiche un sélecteur pour basculer d'un métier à l'autre.
   */
  capabilities: ProRole[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const groups = dashboardNav(role);

  // La pastille se lit dans le pipeline, comme la page « À traiter » : les deux
  // ne peuvent pas se contredire après un déplacement.
  const todo = useBucket("todo").length;
  const allBadges: DashboardBadges = { ...badges, todo };

  const root = DASHBOARD_ROOT[role];
  const isActive = (href: string) =>
    href === root ? pathname === root : pathname.startsWith(href);

  const current = groups
    .flatMap((g) => g.items)
    .find((item) => isActive(item.href));

  return (
    <div className="bg-muted/30 flex min-h-svh flex-1 flex-col lg:flex-row">
      <aside className="bg-card sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r lg:flex">
        <Brand role={role} capabilities={capabilities} />
        <Nav
          groups={groups}
          badges={allBadges}
          isActive={isActive}
          className="flex-1 overflow-y-auto px-3 py-2"
        />
        <Account role={role} fullName={fullName} />
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
              <SheetTitle className="sr-only">{DASHBOARD_TITLE[role]}</SheetTitle>
              <Brand role={role} capabilities={capabilities} />
            </SheetHeader>
            <Nav
              groups={groups}
              badges={allBadges}
              isActive={isActive}
              onNavigate={() => setOpen(false)}
              className="flex-1 overflow-y-auto px-3 py-2"
            />
            <Account role={role} fullName={fullName} />
          </SheetContent>
        </Sheet>
        <span className="truncate font-semibold">
          {current?.label ?? DASHBOARD_TITLE[role]}
        </span>
      </header>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}

function Brand({
  role,
  capabilities,
}: {
  role: ProRole;
  capabilities: ProRole[];
}) {
  return (
    <div className="flex shrink-0 flex-col gap-2.5 border-b px-4 py-3">
      <div className="flex h-10 items-center gap-2">
        <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
          {role === "tailor" ? (
            <Scissors className="size-4" />
          ) : (
            <Store className="size-4" />
          )}
        </span>
        <span className="truncate font-semibold tracking-tight">
          {DASHBOARD_TITLE[role]}
        </span>
      </div>
      {capabilities.length > 1 && (
        <SpaceSwitcher current={role} spaces={capabilities} />
      )}
    </div>
  );
}

/**
 * Bascule entre les deux espaces d'un pro aux deux métiers. Chaque segment est un
 * lien vers la racine de l'autre métier : on change de layout, pas juste de page.
 */
function SpaceSwitcher({
  current,
  spaces,
}: {
  current: ProRole;
  spaces: ProRole[];
}) {
  return (
    <div
      role="tablist"
      aria-label="Changer d'espace"
      className="bg-muted flex items-center gap-1 rounded-lg p-1"
    >
      {spaces.map((r) => {
        const active = r === current;
        return (
          <Link
            key={r}
            href={DASHBOARD_ROOT[r]}
            role="tab"
            aria-selected={active}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {r === "tailor" ? (
              <Scissors className="size-3.5" />
            ) : (
              <Store className="size-3.5" />
            )}
            {DASHBOARD_TITLE_SHORT[r]}
          </Link>
        );
      })}
    </div>
  );
}

function Nav({
  groups,
  badges,
  isActive,
  onNavigate,
  className,
}: {
  groups: DashboardNavGroup[];
  badges: DashboardBadges;
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={className}>
      {groups.map((group, i) => (
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

function Account({ role, fullName }: { role: ProRole; fullName: string | null }) {
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
            {ROLE_LABELS[role]}
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
