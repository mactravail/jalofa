import type { Metadata } from "next";
import Link from "next/link";

import { NewPasswordForm } from "@/components/auth/new-password-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function NewPasswordPage() {
  let email: string | undefined;
  let signedIn = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = !!user && !user.is_anonymous;
    email = user?.email ?? undefined;
  }

  // Pas de session : le lien n'a pas été ouvert, a expiré ou a déjà servi.
  if (!signedIn) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-6 text-center">
          <p className="text-lg font-semibold">Lien expiré</p>
          <p className="text-muted-foreground text-sm">
            Ce lien n&apos;est plus valable. Demandez-en un nouveau.
          </p>
          <Link
            href="/mot-de-passe-oublie"
            className={buttonVariants({ size: "lg", className: "mt-2 w-full" })}
          >
            Recevoir un nouveau lien
          </Link>
        </CardContent>
      </Card>
    );
  }

  return <NewPasswordForm email={email} />;
}
