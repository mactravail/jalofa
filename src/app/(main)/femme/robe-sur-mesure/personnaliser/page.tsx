import { redirect } from "next/navigation";

/**
 * La robe n'a plus de configurateur à part : elle se personnalise dans le
 * configurateur commun à tous les vêtements (/commande/nouvelle). On renvoie
 * donc sur sa page dédiée, où le tissu se choisit avant d'entrer dans le
 * configurateur (« Le personnaliser »).
 *
 * La route reste en place pour ne pas casser les liens déjà partagés.
 */
export default function PersonnaliserRobePage() {
  // La « Robe » africaine est retirée du site : la page ouvre sur la grande robe.
  redirect("/femme/robe-sur-mesure");
}
