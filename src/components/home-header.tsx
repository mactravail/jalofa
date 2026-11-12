"use client";

import { useEffect, useState } from "react";
import Link from "@/components/i18n/link";
import { usePathname } from "@/lib/i18n/navigation";

import { CartButton } from "@/components/cart/cart-button";
import { useCart } from "@/components/cart/cart-context";
import { MobileNav } from "@/components/mobile-nav";
import { Wordmark } from "@/components/wordmark";
import { display } from "@/lib/display-font";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

const TEXT_LINK =
  "text-sm tracking-[0.1em] whitespace-nowrap uppercase transition-opacity hover:opacity-70";

/**
 * Le header de tout le site : bandeau d'annonce, puis menu à gauche, logo au
 * centre, liens à droite. Sur la home (`overVideo`), il est transparent par-dessus
 * la vidéo du hero, et redevient noir une fois le hero passé.
 */
function Header({
  isAuthenticated,
  userMenu,
  overVideo,
}: {
  isAuthenticated: boolean;
  userMenu: React.ReactNode;
  overVideo: boolean;
}) {
  const [heroInView, setHeroInView] = useState(true);
  const { count, hydrated } = useCart();
  const t = useT();

  useEffect(() => {
    if (!overVideo) return;
    const update = () => setHeroInView(window.scrollY < window.innerHeight - 160);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [overVideo]);

  const transparent = overVideo && heroInView;
  const iconClass = transparent
    ? "text-white hover:bg-white/15 hover:text-white"
    : "text-foreground";

  return (
    <>
      {/* Bandeau d'annonce : la Sélection JALOFA (accès PRO offert, cf.
          `selection.ts`) — ni prix ni durée. */}
      <Link
        href="/inscription?role=pro"
        className={cn(
          display.className,
          "flex h-9 items-center bg-neutral-800 px-4 text-xs tracking-[0.06em] text-white uppercase md:px-6 md:text-sm",
        )}
      >
        {/* Mobile : version courte, la phrase entière ne tient pas sur une ligne. */}
        <span className="truncate md:hidden">
          {t("Sélection JALOFA : accès PRO offert")}
        </span>
        <span className="truncate max-md:hidden">
          {t("Accès PRO offert")}
        </span>
      </Link>

      {/* Sur la home, marge négative de la hauteur du header (bordure comprise) : le hero remonte dessous. */}
      <header
        className={cn(
          display.className,
          "sticky top-0 z-40 w-full border-b transition-colors duration-300",
          overVideo && "-mb-[calc(4rem+1px)]",
          transparent
            ? "border-white/15 bg-transparent text-white"
            : "bg-background text-foreground border-transparent",
        )}
      >
        <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 md:px-6">
          <div className="flex items-center">
            <MobileNav
              isAuthenticated={isAuthenticated}
              triggerClassName={cn("md:inline-flex", iconClass)}
            />
          </div>

          <Link href="/" aria-label={t("JALOFA — accueil")} className="flex items-center">
            <Wordmark />
          </Link>

          <div className="flex items-center justify-end gap-1 md:gap-5">
            {userMenu ??
              (!isAuthenticated && (
                <Link href="/connexion" className={cn(TEXT_LINK, "hidden md:inline")}>
                  {t("Connexion")}
                </Link>
              ))}
            <Link href="/panier" className={cn(TEXT_LINK, "hidden md:inline")}>
              {t("Panier")} [{hydrated ? count : 0}]
            </Link>
            <LanguageSwitcher className="hidden md:flex" />
            <CartButton className={cn("md:hidden", iconClass)} />
          </div>
        </div>
      </header>
    </>
  );
}

/** Le même header partout : seule la home le rend transparent sur sa vidéo. */
export function HeaderForRoute({
  isAuthenticated,
  userMenu,
}: {
  isAuthenticated: boolean;
  userMenu: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <Header isAuthenticated={isAuthenticated} userMenu={userMenu} overVideo={pathname === "/"} />
  );
}
