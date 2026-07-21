"use client";

import { useState } from "react";
import { Check, Loader2, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Case à cocher accessible pour l'acceptation des conditions. Le libellé peut
 * contenir un lien (« conditions générales »), c'est pourquoi seule la case est
 * un bouton — le texte reste un `<span>` cliquable à côté.
 */
export function TermsCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label="J'accepte les conditions"
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40 hover:border-muted-foreground",
        )}
      >
        {checked && <Check className="size-3.5" />}
      </button>
      <span className="text-muted-foreground leading-snug">{children}</span>
    </div>
  );
}

/**
 * Widget « Je ne suis pas un robot » façon reCAPTCHA. La vérification anti-robot
 * est simulée pour le MVP (aucune passerelle) : au clic, un court instant de
 * vérification, puis une coche verte. `onChange(true)` est appelé une fois validé.
 */
export function NotARobot({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const [verifying, setVerifying] = useState(false);

  function handleClick() {
    if (checked || verifying) return;
    setVerifying(true);
    // Petit délai pour imiter une vérification côté serveur.
    setTimeout(() => {
      setVerifying(false);
      onChange(true);
    }, 700);
  }

  return (
    <div className="bg-muted/30 flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          aria-busy={verifying}
          aria-label="Je ne suis pas un robot"
          disabled={verifying || checked}
          onClick={handleClick}
          className={cn(
            "bg-background flex size-7 items-center justify-center rounded-md border-2 transition-colors",
            checked
              ? "border-primary"
              : "border-muted-foreground/40 hover:border-muted-foreground",
          )}
        >
          {verifying ? (
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
          ) : checked ? (
            <Check className="text-primary size-5" />
          ) : null}
        </button>
        <span className="text-sm font-medium">Je ne suis pas un robot</span>
      </div>
      <div className="text-muted-foreground flex flex-col items-center gap-0.5">
        <ShieldCheck className="size-5" />
        <span className="text-[9px] leading-none">Sécurité</span>
      </div>
    </div>
  );
}
