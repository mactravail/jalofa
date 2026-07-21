"use client";

import Image from "next/image";
import { MapPin, Store } from "lucide-react";

import { useProModeration } from "@/components/admin/moderation-store";
import { ProModerationMenu } from "@/components/admin/pro-moderation-menu";
import {
  CertifiedBadge,
  ProStatusBadge,
} from "@/components/admin/status-badges";
import { SUSPENSION_REASON_LABELS } from "@/lib/constants";
import type { Vendor } from "@/lib/types";

/** Ligne d'un vendeur dans l'espace admin, avec pastilles d'état et modération. */
export function VendorAdminRow({ vendor }: { vendor: Vendor }) {
  const mod = useProModeration("vendor", vendor.id, {
    is_suspended: vendor.is_suspended,
    suspension_reason: vendor.suspension_reason,
    is_certified: vendor.is_certified,
  });
  const name = vendor.shop_name ?? "Boutique";

  return (
    <div className="flex items-center gap-4 p-4">
      <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg">
        {vendor.cover_url ? (
          <Image
            src={vendor.cover_url}
            alt={name}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <span className="text-muted-foreground flex size-full items-center justify-center">
            <Store className="size-5" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{name}</p>
          {mod.is_certified && <CertifiedBadge />}
        </div>
        <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
          <MapPin className="size-3" /> {vendor.city ?? "—"}
        </p>
        {vendor.bio && (
          <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
            {vendor.bio}
          </p>
        )}
        {mod.is_suspended && mod.suspension_reason && (
          <p className="text-destructive mt-1 text-xs font-medium">
            Suspendu · {SUSPENSION_REASON_LABELS[mod.suspension_reason]}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <ProStatusBadge active={vendor.is_active} suspended={mod.is_suspended} />
        <ProModerationMenu
          kind="vendor"
          id={vendor.id}
          name={name}
          state={mod}
        />
      </div>
    </div>
  );
}
