"use client";

import { usePathname } from "@/lib/i18n/navigation";

// Wraps the shared site chrome (header + footer + bottom nav mobile) but hides
// it on the immersive configurator route, so "Créer une tenue" fills the whole
// viewport with no header/footer — the person/preview stays the sole focus
// (Hockerty-style).
export function MainChrome({
  header,
  footer,
  bottomNav,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  /** Rendu côté serveur : la barre dépend du rôle de la personne connectée. */
  bottomNav: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const immersive = pathname?.startsWith("/commande/nouvelle") ?? false;

  // Dans son compte, on est là pour agir : pas de footer du site.
  const inAccount = pathname === "/compte" || pathname?.startsWith("/compte/");

  if (immersive) return <main className="flex-1">{children}</main>;

  return (
    <>
      {header}
      <main className="flex-1">{children}</main>
      {!inAccount && footer}
      {/* La barre est fixe : ce cale évite qu'elle recouvre le bas de la page. */}
      <div aria-hidden className="h-bottom-nav md:hidden" />
      {bottomNav}
    </>
  );
}
