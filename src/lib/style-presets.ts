// Ce que le formulaire propose au tailleur quand il décrit le style d'un modèle :
// un toucher ajoute le détail et ses choix déjà nommés, il ne reste qu'à mettre
// les photos. Ce ne sont que des idées : il peut tout renommer, tout retirer, ou
// créer son propre détail.

export type StylePreset = { name: string; options: string[] };

const COUPE: StylePreset = { name: "Coupe", options: ["Droite", "Ample", "Ajustée"] };
const COL: StylePreset = { name: "Col", options: ["Col rond", "Col V", "Col Mao", "Sans col"] };
const MANCHES: StylePreset = {
  name: "Manches",
  options: ["Courtes", "Longues", "Amples", "Sans manches"],
};
const LONGUEUR: StylePreset = { name: "Longueur", options: ["Courte", "Mi-mollet", "Longue"] };
const BRODERIE: StylePreset = { name: "Broderie", options: ["Sans broderie", "Simple", "Riche"] };
const POCHES: StylePreset = { name: "Poches", options: ["Avec poches", "Sans poche"] };
const CEINTURE: StylePreset = { name: "Ceinture", options: ["Élastique", "Cordon", "Boutons"] };
const FERMETURE: StylePreset = { name: "Fermeture", options: ["Boutons", "Zip", "Sans fermeture"] };
const DOUBLURE: StylePreset = { name: "Doublure", options: ["Avec doublure", "Sans doublure"] };

const THIAYA: StylePreset[] = [
  { name: "Type de thiaya", options: ["Ample", "Ajusté", "À plis"] },
  POCHES,
  { name: "Longueur", options: ["Au genou", "Mi-mollet", "Cheville"] },
  CEINTURE,
  BRODERIE,
];

// L'ordre compte : la première règle qui reconnaît le nom du modèle l'emporte.
const PRESETS_BY_GARMENT: [RegExp, StylePreset[]][] = [
  [/thiaya|tiaya|saroual/, THIAYA],
  [/pantalon/, [COUPE, POCHES, LONGUEUR, CEINTURE]],
  [/jupe/, [COUPE, LONGUEUR, CEINTURE, FERMETURE, DOUBLURE]],
  [/robe/, [COUPE, COL, MANCHES, LONGUEUR, BRODERIE, DOUBLURE]],
  [/costume|veste|blazer/, [COL, POCHES, FERMETURE, DOUBLURE, BRODERIE]],
  [/chemise|tunique|dashiki/, [COL, MANCHES, POCHES, BRODERIE, LONGUEUR]],
  [/boubou|agbada|kaftan|caftan|baye.?lahat/, [COUPE, COL, BRODERIE, MANCHES, POCHES, LONGUEUR]],
];

const EVERY_PRESET = [COUPE, COL, MANCHES, LONGUEUR, BRODERIE, POCHES, CEINTURE, FERMETURE, DOUBLURE];

/** Les détails à proposer pour ce vêtement, d'après le nom que le tailleur a donné. */
export function stylePresetsFor(modelName: string): StylePreset[] {
  const name = modelName.toLowerCase();
  return PRESETS_BY_GARMENT.find(([re]) => re.test(name))?.[1] ?? EVERY_PRESET;
}

/** Les recommandations les plus courantes, à ajouter d'un toucher. */
export const CARE_TIP_SUGGESTIONS = [
  "Laver à la main, à l'eau froide",
  "Ne pas utiliser de javel",
  "Ne pas essorer",
  "Sécher à l'ombre",
  "Repasser à l'envers",
  "Pressing conseillé",
];
