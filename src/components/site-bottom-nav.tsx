import { Suspense } from "react";

import { BottomNav } from "@/components/bottom-nav";
import { TailorBottomNav } from "@/components/tailor-bottom-nav";
import { getProOrders } from "@/lib/dashboard-data";
import { bucketOrders } from "@/lib/pipeline";
import { getCurrentProfile } from "@/lib/queries";

/** Le compteur « à traiter » : il charge les commandes, donc il ne doit pas bloquer la page. */
async function TailorBottomNavWithCount() {
  const orders = await getProOrders("tailor");
  const todo = bucketOrders("tailor", orders, "todo").length;
  return <TailorBottomNav todo={todo} className="md:hidden" />;
}

/**
 * La barre du bas du site (mobile) : celle des clients par défaut, celle du
 * tailleur — tournée vers son travail — quand c'est un tailleur qui est connecté.
 */
export async function SiteBottomNav() {
  const profile = await getCurrentProfile();

  if (profile?.role === "tailor") {
    return (
      <Suspense fallback={<TailorBottomNav todo={0} className="md:hidden" />}>
        <TailorBottomNavWithCount />
      </Suspense>
    );
  }

  return <BottomNav />;
}
