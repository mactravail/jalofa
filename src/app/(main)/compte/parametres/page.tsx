import type { Metadata } from "next";

import { AccountSettings } from "@/components/account/account-settings";

export const metadata: Metadata = { title: "Mon compte" };

export default function ClientAccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon compte</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Vos informations personnelles et votre mot de passe.
        </p>
      </div>
      <AccountSettings />
    </div>
  );
}
