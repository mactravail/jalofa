import type { Metadata } from "next";

import { MyContactForm } from "@/components/account/my-contact-form";
import { getMySavedProfile } from "@/lib/actions/saved-profile";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Mes coordonnées") };
}

/**
 * Le téléphone et l'adresse enregistrés une fois pour toutes. À la caisse et au
 * devis, le client connecté choisit de les réutiliser ou d'en donner d'autres.
 */
export default async function AddressesPage() {
  const [profile, t] = await Promise.all([getMySavedProfile(), getT()]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("Mes coordonnées")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("Enregistrez votre téléphone et votre adresse. À chaque commande, nous vous demanderons si vous voulez les utiliser ou en donner d'autres.")}
        </p>
      </div>
      <MyContactForm initial={profile} />
    </div>
  );
}
