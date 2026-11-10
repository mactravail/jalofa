import type { Metadata } from "next";
import { MailCheck } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Connexion") };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; inscription?: string; email?: string }>;
}) {
  const { redirect, inscription, email } = await searchParams;
  const t = await getT();

  return (
    <div className="space-y-4">
      {inscription === "ok" && (
        <div className="border-primary/30 bg-primary/5 rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <MailCheck className="text-primary mt-0.5 size-5 shrink-0" />
            <div className="space-y-1 text-sm">
              <p className="text-foreground font-semibold">
                {t("Compte créé — activez-le pour continuer")}
              </p>
              <p className="text-muted-foreground">
                {t("Nous venons de vous envoyer un e-mail de confirmation")}
                {email ? (
                  <>
                    {" "}{t("à")}{" "}
                    <span className="text-foreground font-medium">{email}</span>
                  </>
                ) : null}
                . {t("Ouvrez-le et cliquez sur le lien d'activation, puis connectez-vous ci-dessous.")}
              </p>
              <p className="text-muted-foreground text-xs">
                {t("Pensez à vérifier vos spams si vous ne le trouvez pas.")}
              </p>
            </div>
          </div>
        </div>
      )}
      <LoginForm redirectTo={redirect} />
    </div>
  );
}
