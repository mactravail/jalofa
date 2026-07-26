import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { TailorProfileForm } from "@/components/dashboard/tailor-profile-form";
import { getCurrentTailor } from "@/lib/data";
import type { Tailor } from "@/lib/types";

export const metadata: Metadata = { title: "Mon profil public" };

// Boutique vide de repli : le formulaire a toujours une ligne à éditer, même
// avant que le tailleur n'ait rien renseigné.
const EMPTY_TAILOR: Tailor = {
  id: "",
  shop_name: null,
  bio: null,
  city: null,
  base_price: 0,
  avg_delivery_days: 7,
  free_delivery: false,
  cover_url: null,
  rating: 0,
  rating_count: 0,
  is_active: false,
  is_suspended: false,
  suspension_reason: null,
  is_certified: false,
  plan: "free",
  quote_only: false,
  is_activated: true,
};

export default async function TailorProfilePage() {
  const tailor = (await getCurrentTailor()) ?? EMPTY_TAILOR;

  return (
    <DashboardPage
      title="Mon profil public"
      subtitle="La fiche que les clients voient avant de commander : photo, présentation, tarifs. Soignez-la, c'est votre vitrine."
    >
      {tailor.id && (
        <Link
          href={`/tailleurs/${tailor.id}`}
          target="_blank"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm"
        >
          <ExternalLink className="size-4" /> Voir ma fiche publique
        </Link>
      )}
      <TailorProfileForm tailor={tailor} />
    </DashboardPage>
  );
}
