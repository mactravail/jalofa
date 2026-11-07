"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";

import { requestPasswordReset, type ResetRequestState } from "@/lib/actions/auth";
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

export function ForgotPasswordForm({ linkError }: { linkError?: boolean }) {
  const [state, formAction, isPending] = useActionState<ResetRequestState, FormData>(
    requestPasswordReset,
    null,
  );

  if (state && "sent" in state) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-6 text-center">
          <MailCheck className="text-primary mx-auto size-10" />
          <p className="text-lg font-semibold">Regardez vos e-mails</p>
          <p className="text-muted-foreground text-sm">
            Si un compte existe avec cette adresse, vous allez recevoir un lien
            pour choisir un nouveau mot de passe. Pensez à vérifier vos spams.
          </p>
          <Link
            href="/connexion"
            className={cn(buttonVariants({ variant: "outline" }), "mt-2 w-full")}
          >
            Retour à la connexion
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
        <CardDescription>
          Entrez votre e-mail : nous vous envoyons un lien pour en choisir un
          nouveau.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {linkError && !state && (
            <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              Ce lien a expiré ou a déjà servi. Demandez-en un nouveau.
            </p>
          )}
          {state && "error" in state && (
            <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              {state.error}
            </p>
          )}
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
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-4">
          <Button type="submit" size="lg" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Recevoir le lien
          </Button>
          <Link href="/connexion" className="text-muted-foreground text-sm underline">
            Retour à la connexion
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
