import { KeyRound, UserCog } from "lucide-react";

import { AccountPasswordForm } from "@/components/account/account-password-form";
import { AccountProfileForm } from "@/components/account/account-profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProfile, isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * Les réglages du compte connecté — identité et mot de passe. Un seul écran,
 * monté tel quel dans les quatre espaces (client, tailleur, vendeur, admin) :
 * changer son nom ou son mot de passe se fait au même endroit et de la même
 * façon partout.
 */
export async function AccountSettings() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <Card>
        <CardContent className="text-muted-foreground p-6 text-sm">
          {isSupabaseConfigured()
            ? "Connectez-vous pour modifier votre compte."
            : "La base de données n'est pas encore connectée : la modification du compte sera possible une fois Supabase configuré."}
        </CardContent>
      </Card>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCog className="text-muted-foreground size-5" /> Mes
            informations
          </CardTitle>
          <CardDescription>
            Le nom affiché sur vos commandes, vos messages et vos publications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountProfileForm profile={profile} email={user?.email ?? null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="text-muted-foreground size-5" /> Mot de passe
          </CardTitle>
          <CardDescription>
            Choisissez un mot de passe long et unique — au moins 8 caractères,
            avec majuscule, minuscule, chiffre et caractère spécial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
