"use client";

import { usePathname } from "next/navigation";

import { BottomNav } from "@/components/bottom-nav";

// Wraps the shared site chrome (header + footer + bottom nav mobile) but hides
// it on the immersive configurator route, so "Créer une tenue" fills the whole
// viewport with no header/footer — the person/preview stays the sole focus
// (Hockerty-style).
export function MainChrome({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const immersive = pathname?.startsWith("/commande/nouvelle") ?? false;

  if (immersive) return <main className="flex-1">{children}</main>;

  return (
    <>
      {header}
      <main className="flex-1">{children}</main>
      {footer}
      {/* La barre est fixe : ce cale évite qu'elle recouvre le bas du footer. */}
      <div aria-hidden className="h-bottom-nav md:hidden" />
      <BottomNav />
    </>
  );
}
