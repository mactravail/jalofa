"use client";

import { AFRICAN_MAN_KEYS, AfricanManAvatar } from "@/components/order/african-man-avatar";
import { CeremonyAvatar } from "@/components/order/ceremony-avatar";
import { ShirtAvatar, shirtWearerFor } from "@/components/order/shirt-avatar";
import { SuitAvatar, suitKindFor } from "@/components/order/suit-avatar";
import { WOMAN_OUTFIT_KEYS, WomanOutfitAvatar } from "@/components/order/woman-outfit-avatar";
import { garmentStyleKey } from "@/lib/style-options";
import type { GarmentModel } from "@/lib/types";

/**
 * L'avatar qui porte le vêtement en cours de personnalisation, pour TOUS les
 * modèles : on choisit la bonne silhouette d'après la clé du vêtement
 * (`garmentStyleKey`, qui suit aussi le « Quel vêtement est-ce ? » d'un modèle
 * de tailleur), puis on lui passe les choix de l'étape Style.
 *
 * - chemises Europe → `ShirtAvatar` ; costumes / smoking → `SuitAvatar`
 * - robes, boubou femme, tenue de cérémonie → `CeremonyAvatar`
 * - tenues africaines homme et enfant → `AfricanManAvatar`
 * - ensembles, jupe, pantalon, veste, gilet femme → `WomanOutfitAvatar`
 *
 * Les robes Europe gardent leur mannequin à habiller (`dress-mannequin`).
 */

/** Robes et tenues longues femme, dessinées par la femme en tenue de cérémonie. */
const DRESS_KEYS = new Set([
  "ceremonie-femme",
  "robe",
  "robe-soiree",
  "grande-robe",
  "boubou-femme",
  "thiaya-femme",
  "bureau-femme",
]);

type Pick =
  | { kind: "shirt"; wearer: "homme" | "femme" }
  | { kind: "suit"; suit: NonNullable<ReturnType<typeof suitKindFor>> }
  | { kind: "dress"; key: string }
  | { kind: "man"; key: string }
  | { kind: "woman"; key: string };

function pickFor(model: GarmentModel | null | undefined): Pick | null {
  if (!model) return null;
  const key = garmentStyleKey(model) ?? "";
  const wearer = shirtWearerFor(key);
  if (wearer) return { kind: "shirt", wearer };
  const suit = suitKindFor(key);
  if (suit) return { kind: "suit", suit };
  if (DRESS_KEYS.has(key)) return { kind: "dress", key };
  if (AFRICAN_MAN_KEYS.has(key)) return { kind: "man", key };
  if (WOMAN_OUTFIT_KEYS.has(key)) return { kind: "woman", key };
  // Vêtement sans planches dédiées : la silhouette suit la catégorie.
  if (model.category_slug === "femme") return { kind: "dress", key: "robe" };
  if (model.category_slug === "enfant") return { kind: "man", key: "ensemble-enfant" };
  return { kind: "man", key: key || "chemise" };
}

export function hasGarmentAvatar(model: GarmentModel | null | undefined): boolean {
  return pickFor(model) !== null;
}

const BRODERIE: Record<string, string> = {
  sans: "sans",
  simple: "tailleur",
  riche: "choisir",
  doree: "choisir",
};

const DRESS_SLEEVES: Record<string, string> = {
  longues: "longue",
  courtes: "courte-ajustee",
  amples: "longue-cloche",
  sans: "sans",
};

/** Les choix d'une robe traduits dans le vocabulaire de la tenue de cérémonie. */
function dressDetails(key: string, d: Record<string, string>): Record<string, string> {
  if (key === "ceremonie-femme") return d;
  const out: Record<string, string> = {
    coupe: "composee",
    col: d.col === "chale" ? "v" : (d.col ?? "rond"),
    broderie: BRODERIE[d.broderie ?? "sans"] ?? "sans",
    "manches-robe": DRESS_SLEEVES[d.manches ?? "longues"] ?? "longue",
    longueur: d.longueur ?? (key === "bureau-femme" ? "genou" : "sol"),
    foulard: "sans",
  };
  const coupe = d.coupe;
  const jupe: Record<string, string> = {
    droite: "crayon",
    droit: "crayon",
    evasee: key === "grande-robe" ? "cercle" : "demi-cercle",
    sirene: "sirene",
    empire: "ligne-a",
    cintre: "ligne-a",
    tailleur: "ligne-a",
  };
  if (key === "boubou-femme") {
    out.coupe = coupe === "droit" ? "kaftan" : "grand-boubou";
    if (coupe === "court") out.longueur = "midi";
  } else if (coupe === "ample") {
    out.coupe = "kaftan";
  } else {
    out.jupe = jupe[coupe ?? ""] ?? (key === "grande-robe" ? "cercle" : "ligne-a");
  }
  return out;
}

export function GarmentAvatar({
  model,
  details,
  fabricImage,
  trousersFabricImage,
  className,
}: {
  model: GarmentModel | null | undefined;
  details: Record<string, string>;
  fabricImage?: string | null;
  trousersFabricImage?: string | null;
  className?: string;
}) {
  const pick = pickFor(model);
  if (!pick) return null;
  switch (pick.kind) {
    case "shirt":
      return <ShirtAvatar wearer={pick.wearer} details={details} fabricImage={fabricImage} className={className} />;
    case "suit":
      return (
        <SuitAvatar
          kind={pick.suit}
          details={details}
          fabricImage={fabricImage}
          trousersFabricImage={trousersFabricImage}
          className={className}
        />
      );
    case "dress":
      return <CeremonyAvatar details={dressDetails(pick.key, details)} fabricImage={fabricImage} className={className} />;
    case "man":
      return <AfricanManAvatar garmentKey={pick.key} details={details} fabricImage={fabricImage} className={className} />;
    case "woman":
      return <WomanOutfitAvatar garmentKey={pick.key} details={details} fabricImage={fabricImage} className={className} />;
  }
}
