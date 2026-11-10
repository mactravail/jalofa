"use client";

import { useRouter } from "@/lib/i18n/navigation";
import { useState, useTransition } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { FabricPicker } from "@/components/catalog/garment-personalise";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reviseQuote } from "@/lib/actions/orders";
import type { Fabric } from "@/lib/types";
import { useT } from "@/components/i18n/locale-provider";

/**
 * Le client change le tissu ou un détail de sa demande, puis redemande un devis.
 * Toujours gratuit : le nouveau devis remplace le précédent, et le tailleur est
 * prévenu qu'il doit refaire son prix.
 */
export function ReviseQuotePanel({
  orderId,
  fabrics,
  tailorId,
  tailorName,
  fabricId: initialFabricId,
  fabricMeters,
  address: initialAddress,
  city: initialCity,
  country: initialCountry,
  notes: initialNotes,
  ownFabric,
  hasPrice,
}: {
  orderId: string;
  /** Les tissus proposés : ceux du tailleur d'abord. */
  fabrics: Fabric[];
  tailorId: string | null;
  tailorName: string | null;
  fabricId: string | null;
  fabricMeters: number | null;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  /** Le client apporte son tissu : rien à choisir. */
  ownFabric: boolean;
  /** Un devis est déjà là : il sera remplacé. */
  hasPrice: boolean;
}) {
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [fabricId, setFabricId] = useState(initialFabricId);
  const [meters, setMeters] = useState(String(fabricMeters ?? ""));
  const [address, setAddress] = useState(initialAddress ?? "");
  const [city, setCity] = useState(initialCity ?? "");
  const [country, setCountry] = useState(initialCountry ?? "Sénégal");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <div className="rounded-xl border p-4">
        <Button variant="outline" className="h-12 w-full text-base" onClick={() => setOpen(true)}>
          <Pencil className="size-4" /> {t("Modifier ma demande")}
        </Button>
        <p className="text-muted-foreground mt-2 text-center text-xs">
          {t("Changez le tissu ou un détail et demandez un nouveau devis. C'est gratuit.")}
        </p>
      </div>
    );
  }

  const groups = [
    {
      label: t("Tissus de {name}", { name: tailorName ?? t("l'atelier") }),
      fabrics: fabrics.filter((f) => f.vendor_id === tailorId),
    },
    {
      label: t("Autres vendeurs"),
      fabrics: fabrics.filter((f) => f.vendor_id !== tailorId),
    },
  ];

  const send = () => {
    startTransition(async () => {
      const res = await reviseQuote(orderId, {
        fabricId,
        fabricMeters: ownFabric ? null : Number(meters),
        delivery: { address, city, country },
        notes,
      });
      if (res.ok) {
        toast.success(t("Nouveau devis demandé. Le tailleur est prévenu."));
        setOpen(false);
        router.refresh();
        return;
      }
      toast.error(t(res.error));
    });
  };

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <p className="font-semibold">{t("Modifier ma demande")}</p>

      {!ownFabric && (
        <>
          <FabricPicker
            fabrics={fabrics}
            groups={groups}
            value={fabricId}
            onChange={setFabricId}
          />
          <div className="space-y-1.5">
            <Label htmlFor="revise-meters">{t("Nombre de mètres")}</Label>
            <Input
              id="revise-meters"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              value={meters}
              onChange={(e) => setMeters(e.target.value)}
            />
          </div>
        </>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="revise-address">{t("Adresse de livraison")}</Label>
        <Input
          id="revise-address"
          autoComplete="street-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t("Quartier, rue, repère")}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="revise-city">{t("Ville")}</Label>
          <Input
            id="revise-city"
            autoComplete="address-level2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t("Ex. Dakar")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="revise-country">{t("Pays")}</Label>
          <Input
            id="revise-country"
            autoComplete="country-name"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="revise-notes">{t("Détails pour le tailleur")}</Label>
        <Textarea
          id="revise-notes"
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <p className="text-muted-foreground text-xs">
          {t("Ne mettez pas votre numéro ni votre e-mail : ils seront masqués.")}
        </p>
      </div>

      {hasPrice && (
        <p className="bg-muted/50 rounded-lg p-3 text-sm">
          {t("Le nouveau devis remplacera celui que vous avez reçu.")}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="h-12 flex-1 text-base" onClick={send} disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {t("Demander un nouveau devis")}
        </Button>
        <Button
          variant="outline"
          className="h-12 text-base"
          onClick={() => setOpen(false)}
          disabled={isPending}
        >
          {t("Annuler")}
        </Button>
      </div>
    </div>
  );
}
