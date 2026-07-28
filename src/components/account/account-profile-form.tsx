"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { saveAccountProfile } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/lib/types";

/**
 * L'identité du compte : nom, téléphone, ville. Le même formulaire sert au
 * client, au tailleur, au vendeur et à l'administrateur — un compte est un
 * compte, quel que soit l'espace depuis lequel on l'ouvre.
 *
 * L'e-mail est affiché mais non modifiable : le changer exige une confirmation
 * par courriel, or l'envoi d'e-mails n'est pas encore branché sur le projet.
 */
export function AccountProfileForm({
  profile,
  email,
}: {
  profile: Profile;
  email: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await saveAccountProfile(null, formData);
      if (res?.ok) {
        toast.success("Vos informations ont été enregistrées.");
      } else if (res) {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="account_full_name">Nom complet</Label>
        <Input
          id="account_full_name"
          name="full_name"
          autoComplete="name"
          required
          maxLength={120}
          defaultValue={profile.full_name ?? ""}
          placeholder="Ex. Fatou Ndiaye"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="account_phone">Téléphone</Label>
          <Input
            id="account_phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={profile.phone ?? ""}
            placeholder="+221 ..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account_city">Ville</Label>
          <Input
            id="account_city"
            name="city"
            defaultValue={profile.city ?? ""}
            placeholder="Ex. Dakar"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_email">E-mail</Label>
        <Input id="account_email" value={email ?? "—"} disabled readOnly />
        <p className="text-muted-foreground text-xs">
          L&apos;adresse e-mail sert à vous connecter et ne peut pas être
          modifiée ici. Écrivez-nous pour la changer.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
