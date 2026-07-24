import { CURRENCY, formatPrice } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Un montant où la devise est plus petite que le nombre : c'est le chiffre
 * qu'on lit, « FCFA » ne fait que le qualifier. Trois garde-fous de mise en
 * page tiennent dans ce composant :
 *
 * - `whitespace-nowrap` : « 404 000 » ne se sépare jamais de sa devise ;
 * - `tabular-nums` : les chiffres ont tous la même chasse, donc deux prix
 *   empilés restent alignés à la virgule près, et changer la quantité ne fait
 *   pas danser la colonne ;
 * - devise à `0.72em` : elle suit la taille du prix, quel que soit le contexte.
 *
 * `aria-label` rend le montant complet aux lecteurs d'écran — la devise
 * rapetissée reste une information, pas une décoration.
 */
export function Price({
  amount,
  className,
}: {
  amount: number | null | undefined;
  className?: string;
}) {
  const value = typeof amount === "number" ? amount : 0;
  return (
    <span
      aria-label={formatPrice(value)}
      className={cn("whitespace-nowrap tabular-nums", className)}
    >
      <span aria-hidden>
        {value.toLocaleString("fr-FR")}
        <span className="ml-1 text-[0.72em] font-medium">{CURRENCY}</span>
      </span>
    </span>
  );
}
