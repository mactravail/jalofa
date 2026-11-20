"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Eye, EyeOff, Loader2, Scissors, Star } from "lucide-react";
import { toast } from "sonner";

import { useProModeration } from "@/components/admin/moderation-store";
import { ProModerationMenu } from "@/components/admin/pro-moderation-menu";
import {
  CertifiedBadge,
  ProStatusBadge,
} from "@/components/admin/status-badges";
import { setTailorHidden } from "@/lib/actions/moderation";
import { formatPrice, SUSPENSION_REASON_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Tailor } from "@/lib/types";

/** Ligne d'un tailleur dans l'espace admin, avec pastilles d'état et modération. */
export function TailorAdminRow({ tailor }: { tailor: Tailor }) {
  const mod = useProModeration("tailor", tailor.id, {
    is_suspended: tailor.is_suspended,
    suspension_reason: tailor.suspension_reason,
    is_certified: tailor.is_certified,
  });
  const name = tailor.shop_name ?? "Atelier";
  // Affiché sur le site : sa boutique est ouverte et JALOFA ne l'a pas masqué.
  const [shown, setShown] = useState(
    tailor.is_active && !tailor.hidden_by_admin,
  );
  const [isPending, startTransition] = useTransition();
  const hiddenByHimself = !tailor.is_active && !tailor.hidden_by_admin;

  function toggleShown() {
    const next = !shown;
    startTransition(async () => {
      const result = await setTailorHidden(tailor.id, !next);
      if (result.ok) {
        setShown(next);
        toast.success(
          next
            ? `${name} est affiché sur le site.`
            : `${name} est masqué du site.`,
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-4 p-4">
      <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg">
        {tailor.cover_url ? (
          <Image
            src={tailor.cover_url}
            alt={name}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <span className="text-muted-foreground flex size-full items-center justify-center">
            <Scissors className="size-5" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{name}</p>
          {mod.is_certified && <CertifiedBadge />}
        </div>
        <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
          <span className="text-foreground inline-flex items-center gap-0.5">
            <Star className="size-3 fill-current" /> {tailor.rating.toFixed(1)}
          </span>
          <span>· {tailor.rating_count} avis</span>
          <span>· {tailor.city ?? "—"}</span>
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Dès {formatPrice(tailor.base_price)} · {tailor.avg_delivery_days} j de
          délai
        </p>
        {!shown && hiddenByHimself && (
          <p className="text-muted-foreground mt-1 text-xs">
            Caché par le tailleur (« Ma visibilité »)
          </p>
        )}
        {mod.is_suspended && mod.suspension_reason && (
          <p className="text-destructive mt-1 text-xs font-medium">
            Suspendu · {SUSPENSION_REASON_LABELS[mod.suspension_reason]}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={toggleShown}
          disabled={isPending || mod.is_suspended}
          aria-pressed={shown}
          title={
            shown
              ? "Masquer ce tailleur du site"
              : "Afficher ce tailleur sur le site"
          }
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors disabled:opacity-50",
            shown
              ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : shown ? (
            <Eye className="size-4" />
          ) : (
            <EyeOff className="size-4" />
          )}
          {shown ? "Sur le site" : "Masqué"}
        </button>
        <ProStatusBadge active={shown} suspended={mod.is_suspended} />
        <ProModerationMenu
          kind="tailor"
          id={tailor.id}
          name={name}
          state={mod}
        />
      </div>
    </div>
  );
}
