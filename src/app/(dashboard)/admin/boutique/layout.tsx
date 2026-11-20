import { PipelineProvider } from "@/components/dashboard/pipeline-store";
import { getProOrders } from "@/lib/dashboard-data";
import { isSupabaseConfigured } from "@/lib/queries";

/**
 * La boutique de tissus JALOFA — l'ancien « espace vendeur », passé dans
 * l'administration depuis que JALOFA est le seul vendeur de tissus.
 *
 * Le compte admin principal EST la boutique (sa ligne `vendors`, marquée
 * `is_platform`) : ses commandes de tissu se lisent avec la session, comme le
 * faisait un vendeur, et alimentent les pages du pipeline (`role="vendor"`).
 * La garde admin est déjà posée par `admin/layout.tsx`.
 */
export default async function AdminShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orders = await getProOrders("vendor");
  return (
    <PipelineProvider role="vendor" orders={orders} demo={!isSupabaseConfigured()}>
      {children}
    </PipelineProvider>
  );
}
