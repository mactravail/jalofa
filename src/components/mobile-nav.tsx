"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ShoppingBag } from "lucide-react";

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

export function MobileNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [open, setOpen] = useState(false);
  const { count } = useCart();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu" />
        }
      >
        <Menu className="size-5" />
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
                Se connecter
              </Link>
              <Link
                href="/abonnements"
                onClick={() => setOpen(false)}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Créer un compte
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
              {link.label}
            </Link>
          ))}
          <div className="my-2 h-px bg-border" />
          <Link
            href="/panier"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="size-4" /> Panier
            </span>
            {count > 0 && (
              <span className="bg-primary text-primary-foreground flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs font-semibold">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
