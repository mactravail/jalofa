import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { OrderList } from "@/components/dashboard/order-list";
import { BUCKET_LABELS, type ProRole } from "@/lib/dashboard-nav";
import type { OrderBucket } from "@/lib/pipeline";

type Copy = { subtitle: string; empty: string };

// Une pile du pipeline = une page du menu. Le tailleur coud, le vendeur coupe :
// seuls les mots changent.
const COPY: Record<ProRole, Record<OrderBucket, Copy>> = {
  tailor: {
    todo: {
      subtitle: "Les nouvelles commandes qui attendent votre accord.",
      empty: "Aucune commande à traiter pour le moment.",
    },
    ongoing: {
      subtitle:
        "Les commandes que vous avez acceptées. Faites-les avancer d'une étape à l'autre, jusqu'à la livraison.",
      empty: "Aucune commande en cours.",
    },
    done: {
      subtitle: "Les commandes livrées, refusées ou annulées.",
      empty: "Aucune commande terminée.",
    },
  },
  vendor: {
    todo: {
      subtitle: "Les nouvelles commandes de tissu à accepter ou à préparer.",
      empty: "Aucune commande à traiter pour le moment.",
    },
    ongoing: {
      subtitle:
        "Les commandes lancées : à expédier, puis entre les mains du tailleur ou du livreur.",
      empty: "Aucune commande en cours.",
    },
    done: {
      subtitle: "Les commandes livrées, refusées ou annulées.",
      empty: "Aucune commande livrée.",
    },
  },
};

export function OrdersPageView({
  role,
  bucket,
}: {
  role: ProRole;
  bucket: OrderBucket;
}) {
  const copy = COPY[role][bucket];

  return (
    <DashboardPage title={BUCKET_LABELS[role][bucket]} subtitle={copy.subtitle}>
      <OrderList bucket={bucket} empty={copy.empty} />
    </DashboardPage>
  );
}
