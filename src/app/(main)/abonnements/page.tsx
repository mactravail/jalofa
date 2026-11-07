import { redirect } from "next/navigation";

/**
 * Les offres pro se choisissent désormais directement à l'inscription du compte
 * pro (Gratuit ou Pro) — l'ancienne page de tarifs y renvoie.
 */
export default function SubscriptionsPage() {
  redirect("/inscription?role=pro");
}
