// Point d'entrée unique des planches dessinées pièce par pièce (JALOFA EUROPE) :
// chemise, smoking / costume, robes, ensemble tailleur femme. L'étape « Style »
// n'a qu'à demander « est-ce une planche dédiée ? » et à l'afficher, sans
// connaître chaque fichier de dessins.
//
// Les planches du grand boubou (`boubou-detail-icons.tsx`) restent à part :
// elles servent de repli dans l'étape « Style ».

import {
  BayeLahatDetailIcon,
  bayeLahatArtIsTall,
  isBayeLahatArt,
  type BayeLahatDetailIconName,
} from "@/components/order/baye-lahat-detail-icons";
import {
  AgbadaDetailIcon,
  agbadaArtIsTall,
  isAgbadaArt,
  type AgbadaDetailIconName,
} from "@/components/order/agbada-detail-icons";
import {
  CostumeAfricainDetailIcon,
  costumeAfricainArtIsTall,
  isCostumeAfricainArt,
  type CostumeAfricainDetailIconName,
} from "@/components/order/costume-africain-detail-icons";
import {
  isKaftanTroisPiecesArt,
  KaftanTroisPiecesDetailIcon,
  kaftanTroisPiecesArtIsTall,
  type KaftanTroisPiecesDetailIconName,
} from "@/components/order/kaftan-trois-pieces-detail-icons";
import {
  isKaftanArt,
  KaftanDetailIcon,
  kaftanArtIsTall,
  type KaftanDetailIconName,
} from "@/components/order/kaftan-detail-icons";
import {
  GiletDetailIcon,
  giletArtIsTall,
  isGiletArt,
  type GiletDetailIconName,
} from "@/components/order/gilet-detail-icons";
import {
  DashikiDetailIcon,
  dashikiArtIsTall,
  isDashikiArt,
  type DashikiDetailIconName,
} from "@/components/order/dashiki-detail-icons";
import {
  GrandBoubouDetailIcon,
  grandBoubouArtIsTall,
  isGrandBoubouArt,
  type GrandBoubouDetailIconName,
} from "@/components/order/grand-boubou-detail-icons";
import {
  CeremonyDetailIcon,
  ceremonyArtIsTall,
  isCeremonyArt,
  type CeremonyDetailIconName,
} from "@/components/order/ceremony-detail-icons";
import {
  isPantsuitArt,
  PantsuitDetailIcon,
  pantsuitArtIsTall,
  type PantsuitDetailIconName,
} from "@/components/order/pantsuit-detail-icons";
import {
  isSkirtArt,
  SkirtDetailIcon,
  skirtArtIsTall,
  type SkirtDetailIconName,
} from "@/components/order/skirt-detail-icons";
import {
  EnsembleDetailIcon,
  ensembleArtIsTall,
  isEnsembleArt,
  type EnsembleDetailIconName,
} from "@/components/order/ensemble-detail-icons";
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
  | LoungeDetailIconName
  | CeremonyDetailIconName
  | PantsuitDetailIconName
  | SkirtDetailIconName
  | EnsembleDetailIconName
  | BayeLahatDetailIconName
  | GrandBoubouDetailIconName
  | AgbadaDetailIconName
  | DashikiDetailIconName
  | CostumeAfricainDetailIconName
  | GiletDetailIconName
  | KaftanDetailIconName
  | KaftanTroisPiecesDetailIconName;

/** `true` si `name` est une planche dédiée connue d'ici. */
export function isPlancheArt(name: string): name is PlancheArtName {
  return (
    isShirtArt(name) ||
    isTuxedoArt(name) ||
    isGownArt(name) ||
    isWomensSuitArt(name) ||
    isLoungeArt(name) ||
    isCeremonyArt(name) ||
    isPantsuitArt(name) ||
    isSkirtArt(name) ||
    isEnsembleArt(name) ||
    isBayeLahatArt(name) ||
    isGrandBoubouArt(name) ||
    isAgbadaArt(name) ||
    isDashikiArt(name) ||
    isCostumeAfricainArt(name) ||
    isGiletArt(name) ||
    isKaftanArt(name) ||
    isKaftanTroisPiecesArt(name)
  );
}

/** Vêtement entier (vignette en portrait) ou gros plan (vignette carrée) ? */
export function plancheArtIsTall(name: string): boolean {
  if (isShirtArt(name)) return shirtArtIsTall(name);
  if (isTuxedoArt(name)) return tuxedoArtIsTall(name);
  if (isGownArt(name)) return gownArtIsTall(name);
  if (isWomensSuitArt(name)) return womensSuitArtIsTall(name);
  if (isLoungeArt(name)) return loungeArtIsTall(name);
  if (isCeremonyArt(name)) return ceremonyArtIsTall();
  if (isPantsuitArt(name)) return pantsuitArtIsTall();
  if (isSkirtArt(name)) return skirtArtIsTall();
  if (isEnsembleArt(name)) return ensembleArtIsTall(name);
  if (isBayeLahatArt(name)) return bayeLahatArtIsTall(name);
  if (isGrandBoubouArt(name)) return grandBoubouArtIsTall(name);
  if (isAgbadaArt(name)) return agbadaArtIsTall(name);
  if (isDashikiArt(name)) return dashikiArtIsTall(name);
  if (isCostumeAfricainArt(name)) return costumeAfricainArtIsTall(name);
  if (isGiletArt(name)) return giletArtIsTall(name);
  if (isKaftanArt(name)) return kaftanArtIsTall(name);
  if (isKaftanTroisPiecesArt(name)) return kaftanTroisPiecesArtIsTall();
  return false;
}

export function PlancheArt({ name, className }: { name: string; className?: string }) {
  if (isShirtArt(name)) return <ShirtDetailIcon name={name} className={className} />;
  if (isTuxedoArt(name)) return <TuxedoDetailIcon name={name} className={className} />;
  if (isGownArt(name)) return <GownDetailIcon name={name} className={className} />;
  if (isWomensSuitArt(name)) return <WomensSuitDetailIcon name={name} className={className} />;
  if (isLoungeArt(name)) return <LoungeDetailIcon name={name} className={className} />;
  if (isCeremonyArt(name)) return <CeremonyDetailIcon name={name} className={className} />;
  if (isPantsuitArt(name)) return <PantsuitDetailIcon name={name} className={className} />;
  if (isSkirtArt(name)) return <SkirtDetailIcon name={name} className={className} />;
  if (isEnsembleArt(name)) return <EnsembleDetailIcon name={name} className={className} />;
  if (isBayeLahatArt(name)) return <BayeLahatDetailIcon name={name} className={className} />;
  if (isGrandBoubouArt(name)) return <GrandBoubouDetailIcon name={name} className={className} />;
  if (isAgbadaArt(name)) return <AgbadaDetailIcon name={name} className={className} />;
  if (isDashikiArt(name)) return <DashikiDetailIcon name={name} className={className} />;
  if (isCostumeAfricainArt(name)) return <CostumeAfricainDetailIcon name={name} className={className} />;
  if (isGiletArt(name)) return <GiletDetailIcon name={name} className={className} />;
  if (isKaftanArt(name)) return <KaftanDetailIcon name={name} className={className} />;
  if (isKaftanTroisPiecesArt(name)) return <KaftanTroisPiecesDetailIcon name={name} className={className} />;
  return null;
}
