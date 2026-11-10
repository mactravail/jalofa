"use client";

import { useState } from "react";
import Link from "@/components/i18n/link";
import { ShoppingBag } from "lucide-react";

import { useCart } from "@/components/cart/cart-context";
import { Wordmark } from "@/components/wordmark";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_LINKS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

export function MobileNav({
  isAuthenticated,
  triggerClassName,
}: {
  isAuthenticated: boolean;
  /** Le header rend le bouton visible sur ordinateur, et blanc sur la vidéo de la home. */
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const t = useT();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={cn("md:hidden", triggerClassName)}
            aria-label={t("Menu")}
          />
        }
      >
        <span aria-hidden className="flex w-6 flex-col gap-2">
          <span className="h-px w-full bg-current" />
          <span className="h-px w-full bg-current" />
        </span>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>
            <Wordmark size="sm" />
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {!isAuthenticated && (
            <div className="mb-3 flex flex-col gap-2">
              <Link
                href="/connexion"
                onClick={() => setOpen(false)}
                className={buttonVariants({ size: "sm" })}
              >
                {t("Se connecter")}
              </Link>
              <Link
                href="/inscription"
                onClick={() => setOpen(false)}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                {t("Créer un compte")}
              </Link>
              <div className="mt-1 h-px bg-border" />
            </div>
          )}
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent"
            >
              {t(link.label)}
            </Link>
          ))}
          <div className="my-2 h-px bg-border" />
          <Link
            href="/panier"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="size-4" /> {t("Panier")}
            </span>
            {count > 0 && (
              <span className="bg-primary text-primary-foreground flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs font-semibold">
                {count}
              </span>
            )}
          </Link>
          <div className="my-2 h-px bg-border" />
          <LanguageSwitcher className="px-3 py-2 text-sm" />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
