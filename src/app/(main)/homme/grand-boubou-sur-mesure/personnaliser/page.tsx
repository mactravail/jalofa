import { redirect } from "next/navigation";

/**
 * Le grand boubou n'a plus de configurateur à part : il se personnalise dans
 * le configurateur commun à tous les vêtements (/commande/nouvelle), comme la
 * robe, le kaftan ou la chemise. On renvoie donc sur sa page dédiée, où le
 * tissu se choisit avant d'entrer dans le configurateur (« Le personnaliser »).
 *
 * La route reste en place pour ne pas casser les liens déjà partagés.
 */
export default function PersonnaliserGrandBoubouPage() {
  redirect("/homme/grand-boubou-sur-mesure?type=grand-boubou");
}
