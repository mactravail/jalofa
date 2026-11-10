import { Suspense } from "react";

import { BottomNav } from "@/components/bottom-nav";
import { TailorBottomNav } from "@/components/tailor-bottom-nav";
import { getProOrders } from "@/lib/dashboard-data";
import { getMyUnreadNotificationCount } from "@/lib/notifications-data";
import { bucketOrders } from "@/lib/pipeline";
import { getCurrentProfile } from "@/lib/queries";

/** La pastille de la cloche : elle charge des données, donc elle ne doit pas bloquer la page. */
async function TailorBottomNavWithCount() {
  const [orders, unread] = await Promise.all([
    getProOrders("tailor"),
    getMyUnreadNotificationCount(),
  ]);
  const orderDates = bucketOrders("tailor", orders, "todo").map((o) => o.created_at);
  return (
    <TailorBottomNav unread={unread} orderDates={orderDates} className="md:hidden" />
  );
}

/**
 * La barre du bas du site (mobile) : celle des clients par défaut, celle du
 * tailleur — tournée vers son travail — quand c'est un tailleur qui est connecté.
 */
export async function SiteBottomNav() {
  const profile = await getCurrentProfile();

  if (profile?.role === "tailor") {
    return (
      <Suspense
        fallback={<TailorBottomNav unread={0} orderDates={[]} className="md:hidden" />}
      >
        <TailorBottomNavWithCount />
      </Suspense>
    );
  }

  return <BottomNav />;
}
