import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package, Scissors, Store, Truck } from "lucide-react";

import { DemoBanner } from "@/components/demo-banner";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/constants";
import { getFabricById, getVendorById } from "@/lib/data";
import { cn } from "@/lib/utils";

export default async function FabricDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fabric = await getFabricById(id);
  if (!fabric) notFound();

  // Boutique d'origine — on ne lie que vers une fiche publique visible (une
  // boutique suspendue n'a pas de page).
  const vendor = fabric.vendor_id ? await getVendorById(fabric.vendor_id) : null;
  const shop = vendor && !vendor.is_suspended ? vendor : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <DemoBanner />
      <Link
        href="/tissus"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" /> Retour aux tissus
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="bg-muted relative aspect-square overflow-hidden rounded-2xl border">
          {fabric.image_url && (
            <Image
              src={fabric.image_url}
              alt={fabric.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          )}
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {fabric.color && <Badge variant="secondary">{fabric.color}</Badge>}
            {fabric.material && <Badge variant="outline">{fabric.material}</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{fabric.name}</h1>
          <p className="text-primary mt-2 text-2xl font-semibold">
            {formatPrice(fabric.price_per_meter)}
            <span className="text-muted-foreground text-base font-normal"> / mètre</span>
          </p>

          {fabric.description && (
            <p className="text-muted-foreground mt-4">{fabric.description}</p>
          )}

          {shop && (
            <Link
              href={`/vendeurs/${shop.id}`}
              className="text-muted-foreground hover:text-foreground mt-4 inline-flex items-center gap-1.5 text-sm"
            >
              <Store className="size-4" /> Vendu par{" "}
              <span className="text-foreground font-medium">{shop.shop_name}</span>
            </Link>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-muted/50 rounded-lg p-3">
              <dt className="text-muted-foreground">Disponibilité</dt>
              <dd className="font-medium">{fabric.stock_meters} mètres en stock</dd>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <dt className="text-muted-foreground flex items-center gap-1">
                <Truck className="size-3.5" /> Livraison
              </dt>
              <dd className="font-medium">À domicile disponible</dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/commande/nouvelle?type=fabric_only&fabric=${fabric.id}`}
              className={cn(buttonVariants({ size: "lg" }), "h-11 flex-1 text-base")}
            >
              <Package className="size-4" /> Acheter ce tissu
            </Link>
            <Link
              href={`/modeles?fabric=${fabric.id}`}
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "h-11 flex-1 text-base",
              )}
            >
              <Scissors className="size-4" /> Créer une tenue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
