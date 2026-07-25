"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { reassignTailor } from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import {
  REJECTION_REASON_CLIENT_LABELS,
  formatPrice,
  type RejectionReason,
} from "@/lib/constants";
import type { Tailor } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Une commande refusée n'est pas une impasse : le client relance ici chez un
 * autre tailleur, sans repasser par tout le configurateur. Le motif du refus
 * est rappelé en tête. Ce panneau n'apparaît QUE tant que la commande est
 * `rejected` — une fois relancée (ou acceptée), le client ne change plus
 * d'atelier.
 */
export function ReassignTailorPanel({
  orderId,
  reason,
  tailors,
}: {
  orderId: string;
  reason: RejectionReason | null;
  /** Les tailleurs ouverts, sauf celui qui vient de refuser. */
  tailors: Tailor[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const confirm = () => {
    if (!selected) return;
    startTransition(async () => {
      const res = await reassignTailor(orderId, selected);
      if (res.ok) {
        toast.success("Commande relancée chez le nouveau tailleur.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="border-destructive/40 bg-destructive/5 space-y-4 rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-destructive mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-semibold">Commande refusée par le tailleur</p>
          <p className="text-muted-foreground text-sm">
            {reason
              ? REJECTION_REASON_CLIENT_LABELS[reason]
              : "Le tailleur ne peut pas honorer cette commande."}{" "}
            Choisissez un autre tailleur pour la relancer — le reste de votre
            commande est conservé.
          </p>
        </div>
      </div>

      {tailors.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Aucun autre tailleur disponible pour le moment. Réessayez plus tard.
        </p>
      ) : (
        <>
          <div className="grid gap-2">
            {tailors.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setSelected(t.id)}
                disabled={isPending}
                className={cn(
                  "flex gap-3 overflow-hidden rounded-xl border bg-card p-2 text-left transition-colors",
                  selected === t.id
                    ? "border-primary ring-primary/30 ring-2"
                    : "hover:bg-muted",
                )}
              >
                {t.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.cover_url}
                    alt={t.shop_name ?? ""}
                    className="size-16 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 py-1">
                  <p className="truncate text-sm font-semibold">{t.shop_name}</p>
                  <p className="text-muted-foreground text-xs">{t.city}</p>
                  <p className="mt-1 text-xs">
                    dès {formatPrice(t.base_price)} · {t.avg_delivery_days} j · ★{" "}
                    {t.rating.toFixed(1)}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={confirm} disabled={isPending || !selected}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Relancer chez ce tailleur
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
