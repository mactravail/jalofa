"use client";

import { useState } from "react";
import { Check, Clock, Copy, Landmark } from "lucide-react";

import { WaveMark, WaveQrPayment } from "@/components/cart/wave-payment";
import { OptionCard } from "@/components/order/configurator-ui";
import { TermsCheckbox } from "@/components/auth/signup-verification";
import { formatPrice } from "@/lib/constants";
import {
  YEARLY_DISCOUNT,
  displayedMonthly,
  periodTotal,
  type BillingPeriod,
  type SubscriptionPlan,
} from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

/** Paiement de l'abonnement : Wave (QR) ou virement bancaire. */
export type SubPaymentMethod = "wave" | "bank";

/**
 * Coordonnées bancaires SEPA de JALOFA pour un abonnement réglé par virement
 * depuis l'Europe (Wave couvre le paiement au Sénégal ; ce virement cible les
 * clients européens). Illustratif pour le MVP — la passerelle est simulée.
 * `mono` : valeur à afficher en chiffres/lettres monospace (IBAN, BIC).
 */
const BANK_DETAILS = [
  { label: "Bénéficiaire", value: "JALOFA SARL", mono: false },
  { label: "Banque", value: "BNP Paribas", mono: false },
  { label: "IBAN", value: "FR76 3000 6000 0112 3456 7890 189", mono: true },
  { label: "Code BIC / SWIFT", value: "BNPAFRPPXXX", mono: true },
] as const;

/**
 * Ligne de coordonnée bancaire avec bouton « copier ». Un bonifico se règle en
 * recopiant l'IBAN : on rend chaque valeur copiable en un clic plutôt que de
 * forcer une saisie manuelle (source d'erreurs).
 */
function BankRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value.replace(/\s+/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé) — on ignore.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copier ${label}`}
      className="group hover:bg-muted/60 flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors"
    >
      <div className="min-w-0">
        <dt className="text-muted-foreground text-[11px] uppercase tracking-wide">
          {label}
        </dt>
        <dd
          className={cn(
            "mt-0.5 truncate text-sm font-medium",
            mono && "font-mono tabular-nums tracking-tight",
          )}
        >
          {value}
        </dd>
      </div>
      <span
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors",
          copied
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      >
        {copied ? (
          <>
            <Check className="size-3.5" /> Copié
          </>
        ) : (
          <>
            <Copy className="size-3.5" /> Copier
          </>
        )}
      </span>
    </button>
  );
}

export function SubscriptionPayment({
  plan,
  period,
  method,
  onMethodChange,
  bankConfirmed,
  onBankConfirmedChange,
}: {
  plan: SubscriptionPlan;
  period: BillingPeriod;
  method: SubPaymentMethod | null;
  onMethodChange: (method: SubPaymentMethod) => void;
  bankConfirmed: boolean;
  onBankConfirmedChange: (value: boolean) => void;
}) {
  const isYearly = period === "yearly";
  // Montant réellement encaissé : toute l'année d'un coup (remise incluse) en
  // annuel, une seule mensualité en mensuel.
  const total = periodTotal(plan, period);

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Paiement de l&apos;abonnement</h3>
        <p className="text-muted-foreground text-xs">
          {isYearly
            ? "Réglez votre première année pour activer votre compte pro."
            : "Réglez votre première mensualité pour activer votre compte pro."}
        </p>
      </div>

      {/* Récapitulatif du montant */}
      <div className="bg-muted/30 rounded-xl border p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium">Abonnement {plan.name}</span>
          <span className="text-primary text-xl font-bold">
            {formatPrice(total)}
            <span className="text-muted-foreground text-sm font-normal">
              {isYearly ? " / an" : " / mois"}
            </span>
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {isYearly
            ? `Soit ${formatPrice(displayedMonthly(plan, period))}/mois, facturés une fois par an — ${Math.round(
                YEARLY_DISCOUNT * 100,
              )}% d'économie. Sans engagement.`
            : "Facturé chaque mois, sans engagement — résiliable à tout moment."}
        </p>
      </div>

      {/* Choix du moyen de paiement */}
      <div className="grid gap-3 sm:grid-cols-2">
        <OptionCard
          active={method === "wave"}
          onClick={() => onMethodChange("wave")}
          icon={WaveMark}
          title="Wave"
          desc="Mobile money · Afrique"
        />
        <OptionCard
          active={method === "bank"}
          onClick={() => onMethodChange("bank")}
          icon={Landmark}
          title="Compte bancaire"
          desc="Virement SEPA · Europe"
        />
      </div>

      {method === "wave" && <WaveQrPayment total={total} />}

      {method === "bank" && (
        <div className="bg-muted/30 mt-3 space-y-4 rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <Landmark className="size-5" />
            <p className="text-sm font-medium">Virement SEPA</p>
          </div>

          <p className="text-muted-foreground text-xs leading-relaxed">
            Depuis l&apos;Europe, effectuez un virement SEPA de{" "}
            <span className="text-foreground font-semibold">
              {formatPrice(total)}
            </span>{" "}
            vers le compte ci-dessous, puis cochez la case pour confirmer.
          </p>

          {/* Coordonnées copiables : un clic sur une ligne copie la valeur. */}
          <dl className="divide-border bg-background divide-y overflow-hidden rounded-lg border">
            {BANK_DETAILS.map((row) => (
              <BankRow
                key={row.label}
                label={row.label}
                value={row.value}
                mono={row.mono}
              />
            ))}
          </dl>

          {/* Référence : sans l'e-mail, impossible de rattacher le virement. */}
          <div className="border-primary/30 bg-primary/5 flex gap-2 rounded-lg border p-3">
            <Check className="text-primary mt-0.5 size-4 shrink-0" />
            <p className="text-xs leading-relaxed">
              <span className="font-medium">Important :</span> indiquez votre{" "}
              <span className="font-medium">e-mail en référence</span> du virement
              — c&apos;est ce qui nous permet d&apos;activer le bon compte.
            </p>
          </div>

          <div className="border-t pt-3">
            <TermsCheckbox
              checked={bankConfirmed}
              onChange={onBankConfirmedChange}
            >
              J&apos;ai effectué le virement de {formatPrice(total)}.
            </TermsCheckbox>
            <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-[11px]">
              <Clock className="size-3 shrink-0" />
              Activation confirmée dès réception du virement (sous 24 h ouvrées).
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
