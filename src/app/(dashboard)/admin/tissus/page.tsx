import Image from "next/image";
import { Layers } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { ActiveBadge } from "@/components/admin/status-badges";
import { getAllFabrics } from "@/lib/admin-data";
import { formatPrice } from "@/lib/constants";
import type { Fabric } from "@/lib/types";

export default async function AdminFabricsPage() {
  const fabrics = await getAllFabrics();

  return (
    <AdminPage
      title="Tissus"
      subtitle="Le catalogue des tissus, tous vendeurs confondus."
    >
      {fabrics.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">Aucun tissu.</p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {fabrics.map((fabric) => (
            <FabricRow key={fabric.id} fabric={fabric} />
          ))}
        </div>
      )}
    </AdminPage>
  );
}

function FabricRow({ fabric }: { fabric: Fabric }) {
  const meta = [fabric.material, fabric.color].filter(Boolean).join(" · ");

  return (
    <div className="flex items-center gap-4 p-4">
      <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg">
        {fabric.image_url ? (
          <Image
            src={fabric.image_url}
            alt={fabric.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <span className="text-muted-foreground flex size-full items-center justify-center">
            <Layers className="size-5" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{fabric.name}</p>
        {meta && (
          <p className="text-muted-foreground mt-0.5 truncate text-xs">{meta}</p>
        )}
        <p className="text-muted-foreground mt-0.5 text-xs">
          {fabric.stock_meters} m en stock
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-semibold">{formatPrice(fabric.price_per_meter)}</p>
        <p className="text-muted-foreground text-xs">le mètre</p>
        <div className="mt-1 flex justify-end">
          <ActiveBadge active={fabric.is_active} />
        </div>
      </div>
    </div>
  );
}
