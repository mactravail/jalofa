"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PasswordField } from "@/components/auth/password-field";
import { changePassword } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import { checkPassword } from "@/lib/password";

/**
 * Changement de mot de passe, disponible dans les quatre espaces. L'ancien mot
 * de passe est exigé (la server action le revérifie contre Supabase) et le
 * nouveau doit satisfaire la même politique qu'à l'inscription.
 */
export function AccountPasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const strongEnough = checkPassword(next).valid;
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSubmit =
    current.length > 0 && strongEnough && confirm === next && !isPending;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await changePassword(null, formData);
      if (res?.ok) {
        toast.success("Votre mot de passe a été changé.");
        setCurrent("");
        setNext("");
        setConfirm("");
      } else if (res) {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <PasswordField
        name="current_password"
        label="Mot de passe actuel"
        autoComplete="current-password"
        requirements={false}
        value={current}
        onChange={setCurrent}
      />

      <PasswordField
        name="new_password"
        label="Nouveau mot de passe"
        value={next}
        onChange={setNext}
      />

      <PasswordField
        name="confirm_password"
        label="Confirmer le nouveau mot de passe"
        autoComplete="new-password"
        requirements={false}
        value={confirm}
        onChange={setConfirm}
      />
      {mismatch && (
        <p className="text-destructive text-xs">
          Les deux mots de passe ne sont pas identiques.
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={!canSubmit}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Changer mon mot de passe
        </Button>
      </div>
    </form>
  );
}
