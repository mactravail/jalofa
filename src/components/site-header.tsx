import Link from "next/link";

import { CartButton } from "@/components/cart/cart-button";
import { MobileNav } from "@/components/mobile-nav";
import { UserMenu } from "@/components/user-menu";
import { Wordmark } from "@/components/wordmark";
import { buttonVariants } from "@/components/ui/button";
import { type UserRole } from "@/lib/constants";
import { NAV_LINKS } from "@/lib/nav";
import { getCurrentProfile } from "@/lib/queries";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <header className="bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 md:gap-4">
        <div className="flex shrink-0 items-center md:hidden">
          <MobileNav isAuthenticated={Boolean(profile)} />
        </div>

        <Link
          href="/"
          aria-label="JALOFA — accueil"
          className="ml-[3px] flex min-w-0 shrink-0 items-center md:ml-0"
        >
          <Wordmark />
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <CartButton />
          {profile ? (
            <UserMenu
              fullName={profile.full_name}
              role={profile.role as UserRole}
            />
          ) : (
            <>
              <Link
                href="/connexion"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "hidden sm:inline-flex",
                )}
              >
                Connexion
              </Link>
              <Link href="/abonnements" className={buttonVariants({ size: "sm" })}>
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
