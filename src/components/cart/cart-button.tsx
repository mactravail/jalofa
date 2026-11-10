"use client";

import Link from "@/components/i18n/link";
import { ShoppingBag } from "lucide-react";

import { useCart } from "@/components/cart/cart-context";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

export function CartButton({ className }: { className?: string }) {
  const { count, hydrated } = useCart();
  const t = useT();

  return (
    <Link
      href="/panier"
      aria-label={`${t("Panier")}${count > 0 ? ` (${count})` : ""}`}
      className={cn(
        "text-muted-foreground hover:text-foreground hover:bg-muted relative flex size-9 items-center justify-center rounded-full transition-colors",
        className,
      )}
    >
      <ShoppingBag className="size-5" />
      {hydrated && count > 0 && (
        <span className="bg-primary text-primary-foreground absolute -right-0.5 -top-0.5 flex min-w-[1.05rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-4">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
