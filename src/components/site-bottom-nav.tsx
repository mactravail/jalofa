import { BottomNav } from "@/components/bottom-nav";
import { TailorBottomNav } from "@/components/tailor-bottom-nav";
import { getProOrders } from "@/lib/dashboard-data";
import { bucketOrders } from "@/lib/pipeline";
import { getCurrentProfile } from "@/lib/queries";

/**
 * La barre du bas du site (mobile) : celle des clients par défaut, celle du
 * tailleur — tournée vers son travail — quand c'est un tailleur qui est connecté.
 */
export async function SiteBottomNav() {
  const profile = await getCurrentProfile();

  if (profile?.role === "tailor") {
    const orders = await getProOrders("tailor");
    const todo = bucketOrders("tailor", orders, "todo").length;
    return <TailorBottomNav todo={todo} className="md:hidden" />;
  }

  return <BottomNav />;
}
