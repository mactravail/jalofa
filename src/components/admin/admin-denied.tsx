import Link from "next/link";
import { Lock } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** L'administration n'a pas le chrome du site : le retour doit être explicite. */
export function AdminDenied() {
  return (
    <div className="flex min-h-svh flex-1 flex-col items-center justify-center px-4 text-center">
      <Lock className="text-muted-foreground size-8" />
      <p className="text-muted-foreground mt-4">
        Cet espace est réservé aux administrateurs.
      </p>
      <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>
        Retour au site
      </Link>
    </div>
  );
}
