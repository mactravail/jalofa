"use client";

import { useActionState } from "react";
import Link from "@/components/i18n/link";
import { Loader2, Scissors, Shirt } from "lucide-react";

import { signIn, type AuthState } from "@/lib/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    signIn,
    null,
  );
  const t = useT();

  // Le client reprend son parcours (personnalisation, caisse…) après création
  // du compte ; les pros passent par leurs offres pour choisir leur abonnement.
  const clientHref = redirectTo
    ? `/inscription?role=client&redirect=${encodeURIComponent(redirectTo)}`
    : "/inscription?role=client";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t("Connexion")}</CardTitle>
        <CardDescription>
          {t("Accédez à vos commandes, mesures et messages.")}
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              {t(state.error)}
            </p>
          )}
          <input type="hidden" name="redirect" value={redirectTo ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="email">{t("E-mail")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t("vous@exemple.com")}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("Mot de passe")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
            <div className="text-right">
              <Link
                href="/mot-de-passe-oublie"
                className="text-muted-foreground hover:text-foreground text-sm underline"
              >
                {t("Mot de passe oublié ?")}
              </Link>
            </div>
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-5">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {t("Se connecter")}
          </Button>

          {/* Nouveau sur JALOFA : on choisit d'abord son profil, pour ne pas
              envoyer un client sur les tarifs pros. */}
          <div className="w-full border-t pt-5">
            <p className="text-muted-foreground text-center text-sm">
              {t("Nouveau sur JALOFA ? Créez votre compte :")}
            </p>
            <div className="mt-3 grid gap-2">
              <Link
                href={clientHref}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "justify-start gap-2",
                )}
              >
                <Shirt className="size-4 shrink-0" /> {t("Je suis client")}
              </Link>
              <Link
                href="/inscription?role=pro"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "justify-start gap-2",
                )}
              >
                <Scissors className="size-4 shrink-0" /> {t("Je suis pro (tailleur ou vendeur de tissu)")}
              </Link>
            </div>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
