import Link from "next/link";
import { Lock } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { ProRole } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

const COPY: Record<ProRole, string> = {
  tailor: "Cet espace est réservé aux tailleurs.",
  vendor: "Cet espace est réservé aux vendeurs de tissus.",
};

/** L'espace pro n'a pas le chrome du site : le retour doit être explicite. */
export function DashboardDenied({ role }: { role: ProRole }) {
  return (
    <div className="flex min-h-svh flex-1 flex-col items-center justify-center px-4 text-center">
      <Lock className="text-muted-foreground size-8" />
      <p className="text-muted-foreground mt-4">{COPY[role]}</p>
      <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>
        Retour au site
      </Link>
    </div>
  );
}
