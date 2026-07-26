"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, Scissors, Shirt, Store } from "lucide-react";

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

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    signIn,
    null,
  );

  // Le client reprend son parcours (personnalisation, caisse…) après création
  // du compte ; les pros passent par leurs offres pour choisir leur abonnement.
  const clientHref = redirectTo
    ? `/inscription?role=client&redirect=${encodeURIComponent(redirectTo)}`
    : "/inscription?role=client";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Connexion</CardTitle>
        <CardDescription>
          Accédez à vos commandes, mesures et messages.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              {state.error}
            </p>
          )}
          <input type="hidden" name="redirect" value={redirectTo ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-5">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Se connecter
          </Button>

          {/* Nouveau sur JALOFA : on choisit d'abord son profil, pour ne pas
              envoyer un client sur les tarifs pros. */}
          <div className="w-full border-t pt-5">
            <p className="text-muted-foreground text-center text-sm">
              Nouveau sur JALOFA ? Créez votre compte :
            </p>
            <div className="mt-3 grid gap-2">
              <Link
                href={clientHref}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "justify-start gap-2",
                )}
              >
                <Shirt className="size-4 shrink-0" /> Je suis client
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/inscription?role=tailor"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-1.5",
                  )}
                >
                  <Scissors className="size-4 shrink-0" /> Tailleur
                </Link>
                <Link
                  href="/inscription?role=vendor"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-1.5",
                  )}
                >
                  <Store className="size-4 shrink-0" /> Vendeur
                </Link>
              </div>
            </div>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
