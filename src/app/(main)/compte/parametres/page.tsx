import type { Metadata } from "next";

import { AccountSettings } from "@/components/account/account-settings";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Mon compte") };
}

export default async function ClientAccountPage() {
  const t = await getT();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("Mon compte")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("Vos informations personnelles et votre mot de passe.")}
        </p>
      </div>
      <AccountSettings />
    </div>
  );
}
