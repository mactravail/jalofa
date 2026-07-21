"use client";

import { useId, useState } from "react";
import { Lock } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Card model
// ---------------------------------------------------------------------------

export type CardBrand = "visa" | "mastercard" | "amex" | "unknown";

export type CardDetails = {
  number: string; // digits only
  holder: string;
  expiry: string; // MMYY, digits only
  cvc: string;
};

export const EMPTY_CARD: CardDetails = { number: "", holder: "", expiry: "", cvc: "" };

const digits = (v: string) => v.replace(/\D/g, "");

export function detectBrand(number: string): CardBrand {
  if (/^4/.test(number)) return "visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(number)) return "mastercard";
  if (/^3[47]/.test(number)) return "amex";
  return "unknown";
}

// Amex uses 15 digits in 4-6-5 groups and a 4-digit code; everyone else 16 in
// 4-4-4-4 with 3.
const brandSpec = (brand: CardBrand) =>
  brand === "amex"
    ? { groups: [4, 6, 5], length: 15, cvc: 4, cvcLabel: "CID" }
    : { groups: [4, 4, 4, 4], length: 16, cvc: 3, cvcLabel: "CVC" };

function groupNumber(number: string, brand: CardBrand): string {
  const parts: string[] = [];
  let i = 0;
  for (const size of brandSpec(brand).groups) {
    if (i >= number.length) break;
    parts.push(number.slice(i, i + size));
    i += size;
  }
  return parts.join(" ");
}

function luhnValid(number: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = number.length - 1; i >= 0; i--) {
    let d = number.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return number.length > 0 && sum % 10 === 0;
}

function expiryValid(expiry: string): boolean {
  if (expiry.length !== 4) return false;
  const month = Number(expiry.slice(0, 2));
  const year = 2000 + Number(expiry.slice(2));
  if (month < 1 || month > 12) return false;
  const now = new Date();
  // A card stays valid through the last day of its expiry month.
  return new Date(year, month, 1) > now;
}

export function isCardComplete(card: CardDetails): boolean {
  const brand = detectBrand(card.number);
  const spec = brandSpec(brand);
  return (
    brand !== "unknown" &&
    card.number.length === spec.length &&
    luhnValid(card.number) &&
    card.holder.trim().length > 1 &&
    expiryValid(card.expiry) &&
    card.cvc.length === spec.cvc
  );
}

// ---------------------------------------------------------------------------
// Brand marks
// ---------------------------------------------------------------------------

export function BrandMark({ brand, className }: { brand: CardBrand; className?: string }) {
  const box = cn("h-6 w-9 shrink-0 rounded-[3px]", className);

  if (brand === "visa") {
    return (
      <svg viewBox="0 0 36 24" className={box} aria-label="Visa">
        <rect width="36" height="24" rx="3" fill="#1434CB" />
        <text
          x="18"
          y="16"
          textAnchor="middle"
          fill="#fff"
          fontSize="9"
          fontWeight="700"
          fontStyle="italic"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.5"
        >
          VISA
        </text>
      </svg>
    );
  }

  if (brand === "mastercard") {
    return (
      <svg viewBox="0 0 36 24" className={box} aria-label="Mastercard">
        <rect width="36" height="24" rx="3" fill="#16181D" />
        <circle cx="15" cy="12" r="6.5" fill="#EB001B" />
        <circle cx="21" cy="12" r="6.5" fill="#F79E1B" />
        <path
          d="M18 6.9a6.49 6.49 0 0 0 0 10.2 6.49 6.49 0 0 0 0-10.2Z"
          fill="#FF5F00"
        />
      </svg>
    );
  }

  if (brand === "amex") {
    return (
      <svg viewBox="0 0 36 24" className={box} aria-label="American Express">
        <rect width="36" height="24" rx="3" fill="#1F72CD" />
        <text
          x="18"
          y="15.5"
          textAnchor="middle"
          fill="#fff"
          fontSize="7"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          AMEX
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 36 24" className={box} aria-hidden="true">
      <rect width="36" height="24" rx="3" className="fill-muted-foreground/20" />
      <rect x="4" y="9" width="28" height="2.5" rx="1" className="fill-muted-foreground/40" />
      <rect x="4" y="14" width="10" height="2.5" rx="1" className="fill-muted-foreground/40" />
    </svg>
  );
}

export function AcceptedBrands({ active }: { active: CardBrand }) {
  const brands: CardBrand[] = ["visa", "mastercard", "amex"];
  return (
    <div className="flex items-center gap-1.5">
      {brands.map((b) => (
        <BrandMark
          key={b}
          brand={b}
          // Once the number identifies an issuer, dim the ones it isn't.
          className={cn(
            "transition-opacity",
            active !== "unknown" && active !== b && "opacity-30",
          )}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

function CardField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-xs">{label}</Label>
        {hint && <span className="text-muted-foreground text-[11px]">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-destructive text-[11px]">{error}</p>}
    </div>
  );
}

export function CardPaymentForm({
  card,
  onChange,
}: {
  card: CardDetails;
  onChange: (card: CardDetails) => void;
}) {
  const numberId = useId();
  // Errors surface on blur only — flagging an invalid number mid-typing is noise.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const brand = detectBrand(card.number);
  const spec = brandSpec(brand);
  const set = (patch: Partial<CardDetails>) => onChange({ ...card, ...patch });

  const numberError =
    touched.number && card.number.length > 0
      ? brand === "unknown"
        ? "Carte non prise en charge."
        : card.number.length < spec.length
          ? "Numéro incomplet."
          : !luhnValid(card.number)
            ? "Numéro de carte invalide."
            : null
      : null;

  const expiryError =
    touched.expiry && card.expiry.length > 0 && !expiryValid(card.expiry)
      ? card.expiry.length < 4
        ? "Date incomplète."
        : "Date expirée."
      : null;

  const cvcError =
    touched.cvc && card.cvc.length > 0 && card.cvc.length < spec.cvc
      ? `${spec.cvc} chiffres attendus.`
      : null;

  return (
    <div className="bg-muted/30 mt-3 space-y-4 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Détails de la carte</p>
        <AcceptedBrands active={brand} />
      </div>

      <CardField label="Numéro de carte" error={numberError}>
        <div className="relative">
          <Input
            id={numberId}
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 5678 9012 3456"
            value={groupNumber(card.number, brand)}
            aria-invalid={Boolean(numberError)}
            onBlur={() => touch("number")}
            onChange={(e) => set({ number: digits(e.target.value).slice(0, spec.length) })}
            className="pr-11 font-mono tracking-wide"
          />
          <BrandMark
            brand={brand}
            className="pointer-events-none absolute right-1.5 top-1/2 h-5 w-7 -translate-y-1/2"
          />
        </div>
      </CardField>

      <CardField label="Titulaire de la carte" error={null}>
        <Input
          autoComplete="cc-name"
          placeholder="Aminata Diop"
          value={card.holder}
          onChange={(e) => set({ holder: e.target.value.toUpperCase() })}
          className="uppercase"
        />
      </CardField>

      <div className="grid grid-cols-2 gap-4">
        <CardField label="Expiration" hint="MM/AA" error={expiryError}>
          <Input
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            value={
              card.expiry.length > 2
                ? `${card.expiry.slice(0, 2)}/${card.expiry.slice(2)}`
                : card.expiry
            }
            aria-invalid={Boolean(expiryError)}
            onBlur={() => touch("expiry")}
            onChange={(e) => {
              let v = digits(e.target.value).slice(0, 4);
              // A leading 2–9 can only mean a single-digit month: pad it.
              if (v.length === 1 && Number(v) > 1) v = `0${v}`;
              set({ expiry: v });
            }}
            className="font-mono"
          />
        </CardField>

        <CardField label={spec.cvcLabel} hint={`${spec.cvc} chiffres`} error={cvcError}>
          <Input
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder={"•".repeat(spec.cvc)}
            value={card.cvc}
            aria-invalid={Boolean(cvcError)}
            onBlur={() => touch("cvc")}
            onChange={(e) => set({ cvc: digits(e.target.value).slice(0, spec.cvc) })}
            className="font-mono"
          />
        </CardField>
      </div>

      <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
        <Lock className="size-3 shrink-0" />
        Paiement sécurisé — vos informations bancaires ne sont pas stockées.
      </p>
    </div>
  );
}
