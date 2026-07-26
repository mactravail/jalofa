import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, Store } from "lucide-react";

import { TrustScoreBadge } from "@/components/catalog/trust-score";
import { Badge } from "@/components/ui/badge";
import type { Vendor } from "@/lib/types";

export function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Link
      href={`/vendeurs/${vendor.id}`}
      className="group bg-card overflow-hidden rounded-xl border transition-shadow hover:shadow-md"
    >
      <div className="bg-muted relative aspect-video overflow-hidden">
        {vendor.cover_url ? (
          <Image
            src={vendor.cover_url}
            alt={vendor.shop_name ?? "Vendeur de tissu"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-muted-foreground flex size-full items-center justify-center">
            <Store className="size-10" />
          </span>
        )}
        {vendor.is_certified && (
          <Badge className="absolute left-2 top-2 gap-1 bg-white/90 text-blue-700">
            <BadgeCheck className="size-3 fill-blue-600 text-white" />
            Certifié
          </Badge>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold">{vendor.shop_name}</h3>
        <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
          <MapPin className="size-3.5" /> {vendor.city}
        </p>
        {vendor.bio && (
          <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
            {vendor.bio}
          </p>
        )}
        <TrustScoreBadge pro={vendor} className="mt-3" />
      </div>
    </Link>
  );
}
