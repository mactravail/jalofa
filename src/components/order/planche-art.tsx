// Point d'entrée unique des planches dessinées pièce par pièce (JALOFA EUROPE) :
// chemise, smoking / costume, robes, ensemble tailleur femme. L'étape « Style »
// n'a qu'à demander « est-ce une planche dédiée ? » et à l'afficher, sans
// connaître chaque fichier de dessins.
//
// Les planches du grand boubou (`boubou-detail-icons.tsx`) restent à part :
// elles servent de repli dans l'étape « Style ».

import {
  GownDetailIcon,
  gownArtIsTall,
  isGownArt,
  type GownDetailIconName,
} from "@/components/order/gown-detail-icons";
import {
  isLoungeArt,
  LoungeDetailIcon,
  loungeArtIsTall,
  type LoungeDetailIconName,
} from "@/components/order/lounge-detail-icons";
import {
  isShirtArt,
  ShirtDetailIcon,
  shirtArtIsTall,
  type ShirtDetailIconName,
} from "@/components/order/shirt-detail-icons";
import {
  isTuxedoArt,
  TuxedoDetailIcon,
  tuxedoArtIsTall,
  type TuxedoDetailIconName,
} from "@/components/order/tuxedo-detail-icons";
import {
  isWomensSuitArt,
  WomensSuitDetailIcon,
  womensSuitArtIsTall,
  type WomensSuitDetailIconName,
} from "@/components/order/womens-suit-detail-icons";

export type PlancheArtName =
  | ShirtDetailIconName
  | TuxedoDetailIconName
  | GownDetailIconName
  | WomensSuitDetailIconName
  | LoungeDetailIconName;

/** `true` si `name` est une planche dédiée connue d'ici. */
export function isPlancheArt(name: string): name is PlancheArtName {
  return isShirtArt(name) || isTuxedoArt(name) || isGownArt(name) || isWomensSuitArt(name) || isLoungeArt(name);
}

/** Vêtement entier (vignette en portrait) ou gros plan (vignette carrée) ? */
export function plancheArtIsTall(name: string): boolean {
  if (isShirtArt(name)) return shirtArtIsTall(name);
  if (isTuxedoArt(name)) return tuxedoArtIsTall(name);
  if (isGownArt(name)) return gownArtIsTall(name);
  if (isWomensSuitArt(name)) return womensSuitArtIsTall(name);
  if (isLoungeArt(name)) return loungeArtIsTall(name);
  return false;
}

export function PlancheArt({ name, className }: { name: string; className?: string }) {
  if (isShirtArt(name)) return <ShirtDetailIcon name={name} className={className} />;
  if (isTuxedoArt(name)) return <TuxedoDetailIcon name={name} className={className} />;
  if (isGownArt(name)) return <GownDetailIcon name={name} className={className} />;
  if (isWomensSuitArt(name)) return <WomensSuitDetailIcon name={name} className={className} />;
  if (isLoungeArt(name)) return <LoungeDetailIcon name={name} className={className} />;
  return null;
}
