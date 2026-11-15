import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { ShopLinkView } from "@/components/dashboard/shop-link-view";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Mon lien TikTok") };
}

export default function ShopLinkPage() {
  return (
    <DashboardPage
      title="Mon lien TikTok"
      subtitle="Mettez ce lien sur TikTok : vos clients arrivent directement dans votre boutique."
    >
      <ShopLinkView role="vendor" />
    </DashboardPage>
  );
}
