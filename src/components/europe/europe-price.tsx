import { Price } from "@/components/cart/price";
import { formatPrice } from "@/lib/constants";
import { formatEuro, xofToEur } from "@/lib/europe";
import { cn } from "@/lib/utils";

/**
 * Le prix d'un produit JALOFA EUROPE : en euros d'abord (la devise de l'atelier),
 * puis en FCFA (la devise de paiement). Le FCFA est arrimé à l'euro : la
 * conversion est exacte, elle ne bouge pas d'un jour à l'autre. Mêmes garde-fous
 * que `Price` : le montant ne se coupe jamais, la devise est plus petite.
 */
export function EuropePrice({
  amount,
  className,
  stacked = false,
}: {
  /** Le montant en FCFA, tel qu'il est enregistré et payé. */
  amount: number | null | undefined;
  className?: string;
  /** FCFA sous l'euro plutôt qu'à côté (fiche produit). */
  stacked?: boolean;
}) {
  const value = typeof amount === "number" ? amount : 0;
  return (
    <span
      aria-label={`${formatEuro(value)} (${formatPrice(value)})`}
      className={cn(
        "inline-flex tabular-nums",
        stacked ? "flex-col items-start" : "flex-wrap items-baseline gap-x-1.5",
        className,
      )}
    >
      <span aria-hidden className="whitespace-nowrap">
        {xofToEur(value).toLocaleString("fr-FR")}
        <span className="ml-1 text-[0.72em] font-medium">€</span>
      </span>
      <span aria-hidden className="text-muted-foreground text-[0.8em] font-normal">
        {stacked ? null : "· "}
        <Price amount={value} />
      </span>
    </span>
  );
}

/** Le prix qui convient : € + FCFA pour un produit européen, FCFA sinon. */
export function ProductPrice({
  amount,
  europe,
  className,
  stacked,
}: {
  amount: number | null | undefined;
  europe?: boolean;
  className?: string;
  stacked?: boolean;
}) {
  return europe ? (
    <EuropePrice amount={amount} className={className} stacked={stacked} />
  ) : (
    <Price amount={amount} className={className} />
  );
}
