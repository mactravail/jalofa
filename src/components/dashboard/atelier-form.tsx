"use client";

import { useTransition } from "react";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveTailorAtelier } from "@/lib/actions/tailors";
import { saveVendorAddress } from "@/lib/actions/vendors";
import type { TailorAtelier } from "@/lib/types";

/** Les deux champs de l'atelier, partagés avec le formulaire d'un modèle. */
export function AtelierFields({
  atelier,
  required = false,
}: {
  atelier?: TailorAtelier | null;
  required?: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="atelier_address">Adresse de l&apos;atelier</Label>
        <Input
          id="atelier_address"
          name="atelier_address"
          required={required}
          defaultValue={atelier?.address ?? ""}
          placeholder="Ex. Médina, rue 11, à côté de la pharmacie"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="atelier_phone">Téléphone de l&apos;atelier</Label>
        <Input
          id="atelier_phone"
          name="atelier_phone"
          type="tel"
          required={required}
          defaultValue={atelier?.phone ?? ""}
          placeholder="Ex. 77 123 45 67"
        />
      </div>
    </>
  );
}

/** Vendeur : où les clients renvoient un tissu. Privé, comme l'atelier du tailleur. */
export function VendorAddressForm({ address }: { address: TailorAtelier | null }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveVendorAddress(null, formData);
      if (res?.ok) toast.success("Adresse enregistrée.");
      else if (res) toast.error(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-xl border p-4">
      <div>
        <h2 className="flex items-center gap-2 font-semibold">
          <MapPin className="size-4" /> Adresse pour les retours
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Un client qui rend un tissu l&apos;envoie ici. Cette adresse n&apos;apparaît pas sur
          votre page.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="vendor_address">Adresse</Label>
        <Input
          id="vendor_address"
          name="vendor_address"
          required
          defaultValue={address?.address ?? ""}
          placeholder="Ex. Marché HLM, cantine 12"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vendor_phone">Téléphone</Label>
        <Input
          id="vendor_phone"
          name="vendor_phone"
          type="tel"
          required
          defaultValue={address?.phone ?? ""}
          placeholder="Ex. 77 123 45 67"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Enregistrer l&apos;adresse
        </Button>
      </div>
    </form>
  );
}

/** « Mon atelier », sur la page du profil. Privé : jamais sur la fiche publique. */
export function AtelierForm({ atelier }: { atelier: TailorAtelier | null }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveTailorAtelier(null, formData);
      if (res?.ok) toast.success("Adresse de l'atelier enregistrée.");
      else if (res) toast.error(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-xl border p-4">
      <div>
        <h2 className="flex items-center gap-2 font-semibold">
          <MapPin className="size-4" /> Mon atelier
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Les vendeurs y envoient les tissus de vos clients. Cette adresse reste
          privée : elle n&apos;apparaît pas sur votre page.
        </p>
      </div>
      <AtelierFields atelier={atelier} required />
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Enregistrer l&apos;adresse
        </Button>
      </div>
    </form>
  );
}
