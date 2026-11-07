"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";

import { PasswordField } from "@/components/auth/password-field";
import { setNewPassword, type AuthState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { checkPassword } from "@/lib/password";

export function NewPasswordForm({ email }: { email?: string }) {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    setNewPassword,
    null,
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = confirm.length > 0 && confirm !== password;
  const ready = checkPassword(password).valid && confirm === password;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
        <CardDescription>
          {email ? <>Pour le compte {email}. </> : null}
          Choisissez un mot de passe que vous n&apos;utilisez nulle part ailleurs.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              {state.error}
            </p>
          )}
          <PasswordField
            name="new_password"
            label="Nouveau mot de passe"
            value={password}
            onChange={setPassword}
          />
          <PasswordField
            name="confirm_password"
            label="Confirmer le mot de passe"
            value={confirm}
            onChange={setConfirm}
            requirements={false}
          />
          {mismatch && (
            <p className="text-destructive text-sm">
              Les deux mots de passe ne sont pas identiques.
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-6">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isPending || !ready}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Enregistrer le mot de passe
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
