"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { useT } from "@/components/i18n/locale-provider";
import { signUpWithProvider } from "@/lib/actions/auth";

function GoogleLogo() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"
      />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-current">
      <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9a4.8 4.8 0 0 0-3.8-2c-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9a5 5 0 0 0-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.5 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4a10 10 0 0 0 1.4-2.8 4.3 4.3 0 0 1-2.1-4.2zM13.9 5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4z" />
    </svg>
  );
}

/**
 * Inscription pro en un clic avec Google ou Apple, au-dessus du formulaire
 * e-mail. Hors du `<form>` d'inscription : boutons simples, action serveur.
 */
export function ProviderButtons({
  providers,
  initialError = null,
}: {
  providers: ("google" | "apple")[];
  initialError?: string | null;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [which, setWhich] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(initialError);

  function go(provider: "google" | "apple") {
    setWhich(provider);
    setError(null);
    startTransition(async () => {
      const res = await signUpWithProvider(provider);
      if (res?.error) setError(res.error);
    });
  }

  const base =
    "flex h-12 w-full items-center justify-center gap-3 rounded-xl text-base font-semibold transition-opacity hover:opacity-85 disabled:opacity-50";

  return (
    <div className="space-y-3">
      {error && (
        <p className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm">
          {t(error)}
        </p>
      )}
      {providers.includes("google") && (
        <button
          type="button"
          onClick={() => go("google")}
          disabled={pending}
          className={`${base} bg-white text-neutral-900`}
        >
          {pending && which === "google" ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <GoogleLogo />
          )}
          {t("Continuer avec Google")}
        </button>
      )}
      {providers.includes("apple") && (
        <button
          type="button"
          onClick={() => go("apple")}
          disabled={pending}
          className={`${base} bg-black text-white ring-1 ring-white/30`}
        >
          {pending && which === "apple" ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <AppleLogo />
          )}
          {t("Continuer avec Apple")}
        </button>
      )}
      <div className="flex items-center gap-3 pt-2 text-xs tracking-[0.2em] text-white/50 uppercase">
        <span className="h-px flex-1 bg-white/20" />
        {t("ou avec votre e-mail")}
        <span className="h-px flex-1 bg-white/20" />
      </div>
    </div>
  );
}
