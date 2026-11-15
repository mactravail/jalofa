"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { refreshSavedProfile } from "@/components/account/use-saved-profile";
import { useT } from "@/components/i18n/locale-provider";
import { Field } from "@/components/order/configurator-ui";
import { Button } from "@/components/ui/button";
import { saveMyContact } from "@/lib/actions/saved-profile";
import type { SavedProfile } from "@/lib/saved-profile";

/** Téléphone et adresse de livraison, enregistrés pour les prochaines commandes. */
export function MyContactForm({ initial }: { initial: SavedProfile | null }) {
  const t = useT();
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState({
    address_line: initial?.address?.address_line ?? "",
    city: initial?.address?.city ?? "",
    region: initial?.address?.region ?? "",
    country: initial?.address?.country ?? "Sénégal",
  });
  const [pending, start] = useTransition();

  const hasAddress = Boolean(address.address_line.trim() || address.city.trim());
  const canSave =
    Boolean(phone.trim()) &&
    (!hasAddress || Boolean(address.address_line.trim() && address.city.trim()));

  const save = () =>
    start(async () => {
      const res = await saveMyContact({
        phone,
        address: hasAddress ? { ...address, region: address.region || null } : null,
      });
      if (!res.ok) {
        toast.error(t(res.error));
        return;
      }
      refreshSavedProfile();
      toast.success(t("Coordonnées enregistrées"), {
        description: t("À votre prochaine commande, nous vous proposerons de les utiliser."),
      });
    });

  return (
    <div className="space-y-6 rounded-xl border p-4 sm:p-6">
      <section className="space-y-3">
        <h2 className="font-semibold">{t("Téléphone")}</h2>
        <Field
          label={t("Téléphone (WhatsApp)")}
          type="tel"
          placeholder="77 000 00 00"
          value={phone}
          onChange={setPhone}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">{t("Adresse de livraison")}</h2>
        <Field
          label={t("Adresse")}
          placeholder={t("Quartier, rue, repère")}
          value={address.address_line}
          onChange={(v) => setAddress((a) => ({ ...a, address_line: v }))}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label={t("Ville")}
            placeholder={t("Ex. Dakar")}
            value={address.city}
            onChange={(v) => setAddress((a) => ({ ...a, city: v }))}
          />
          <Field
            label={t("Région")}
            value={address.region}
            onChange={(v) => setAddress((a) => ({ ...a, region: v }))}
          />
          <Field
            label={t("Pays")}
            value={address.country}
            onChange={(v) => setAddress((a) => ({ ...a, country: v }))}
          />
        </div>
      </section>

      <Button type="button" size="lg" onClick={save} disabled={!canSave || pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {t("Enregistrer")}
      </Button>
    </div>
  );
}
