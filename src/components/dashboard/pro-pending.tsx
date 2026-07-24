import Image from "next/image";
import Link from "next/link";
import { Clock, Home, LogOut, Scissors, Store } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { formatPrice, WAVE_PAYMENT } from "@/lib/constants";
import type { ProRole } from "@/lib/dashboard-nav";
import { getPlan, type SubscriptionPlanId } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<ProRole, string> = {
  tailor: "tailleur",
  vendor: "vendeur",
};

/**
 * Écran d'attente d'un pro dont l'espace n'est pas encore ouvert par
 * l'administration. Il remplace le tableau de bord tant que `is_activated` est
 * `false` : le compte existe, mais l'accès attend la confirmation du paiement
 * Wave (plans payants) ou la validation de l'inscription (plan Gratuit).
 */
export function ProPending({
  kind,
  plan,
  fullName,
}: {
  kind: ProRole;
  plan: SubscriptionPlanId;
  fullName: string | null;
}) {
  const details = getPlan(plan);
  const paid = (details?.monthlyPrice ?? 0) > 0;
  const Icon = kind === "tailor" ? Scissors : Store;

  return (
    <div className="bg-muted/30 flex min-h-svh flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="bg-card w-full max-w-md rounded-2xl border p-6 text-center shadow-sm sm:p-8">
        <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 mx-auto flex size-14 items-center justify-center rounded-full">
          <Clock className="size-7" />
        </span>

        <h1 className="mt-5 text-xl font-bold tracking-tight">
          {fullName ? `${fullName}, votre` : "Votre"} espace {KIND_LABEL[kind]} est
          en attente d&apos;activation
        </h1>

        <p className="text-muted-foreground mt-3 flex items-center justify-center gap-1.5 text-sm">
          <Icon className="size-4 shrink-0" />
          Abonnement {details?.name ?? plan}
        </p>

        {paid ? (
          <>
            <p className="text-muted-foreground mt-4 text-sm">
              Pour ouvrir votre espace, réglez votre abonnement par{" "}
              <span className="font-semibold">Wave</span> au numéro ci-dessous.
              Dès réception, l&apos;équipe JALOFA active votre compte.
            </p>

            <div className="bg-muted/60 mt-4 rounded-xl border p-4">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Paiement Wave
              </p>

              <div className="mx-auto mt-3 w-fit overflow-hidden rounded-xl border bg-white p-2">
                <Image
                  src={WAVE_PAYMENT.qr}
                  alt="QR code Wave JALOFA à scanner"
                  width={200}
                  height={206}
                  className="h-auto w-40 sm:w-48"
                />
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                Scannez ce QR depuis l&apos;application Wave, ou payez au numéro :
              </p>

              <p className="mt-1 text-lg font-bold tracking-tight tabular-nums">
                {WAVE_PAYMENT.number}
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                {WAVE_PAYMENT.name} ·{" "}
                <span className="text-foreground font-semibold">
                  {formatPrice(details?.monthlyPrice ?? 0)}
                </span>{" "}
                / mois
              </p>
            </div>

            <p className="text-muted-foreground mt-3 text-xs">
              Indiquez votre nom lors du paiement pour qu&apos;on retrouve votre
              compte.
            </p>
          </>
        ) : (
          <p className="text-muted-foreground mt-4 text-sm">
            Votre inscription est en cours de validation par l&apos;équipe JALOFA.
            Votre espace s&apos;ouvrira très bientôt — revenez vous connecter d&apos;ici
            peu.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline" }), "w-full gap-2")}
          >
            <Home className="size-4" /> Retour au site
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="text-muted-foreground hover:text-foreground inline-flex w-full items-center justify-center gap-2 py-2 text-sm font-medium"
            >
              <LogOut className="size-4" /> Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
