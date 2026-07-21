import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { ShippingByCityList } from "@/components/dashboard/shipping-by-city-list";
import type { ProRole } from "@/lib/dashboard-nav";

// Une pile du pipeline = une page ; ici c'est une vue transversale : les
// commandes à livrer regroupées par ville. Le tailleur coud, le vendeur coupe —
// seuls les mots changent.
const COPY: Record<ProRole, { subtitle: string; empty: string }> = {
  tailor: {
    subtitle:
      "Vos commandes à livrer, regroupées par ville. Préparez ensemble les colis d'une même destination.",
    empty: "Aucune commande à livrer pour le moment.",
  },
  vendor: {
    subtitle:
      "Vos ventes de tissu à livrer, regroupées par ville. Préparez ensemble les colis d'une même destination.",
    empty: "Aucune livraison à préparer pour le moment.",
  },
};

/**
 * La page « Livraisons » de l'espace pro. Le titre et le sous-titre sont rendus
 * côté serveur ; le regroupement par ville, qui lit le pipeline, vit dans le
 * composant client `ShippingByCityList`.
 */
export function ShippingByCityView({ role }: { role: ProRole }) {
  const copy = COPY[role];

  return (
    <DashboardPage title="Livraisons" subtitle={copy.subtitle}>
      <ShippingByCityList empty={copy.empty} />
    </DashboardPage>
  );
}
