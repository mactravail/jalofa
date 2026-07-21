import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { VendorProfileForm } from "@/components/dashboard/vendor-profile-form";
import { getCurrentVendor } from "@/lib/data";
import type { Vendor } from "@/lib/types";

export const metadata: Metadata = { title: "Mon profil public" };

// Boutique vide de repli : le formulaire a toujours une ligne à éditer, même
// avant que le vendeur n'ait rien renseigné.
const EMPTY_VENDOR: Vendor = {
  id: "",
  shop_name: null,
  bio: null,
  city: null,
  cover_url: null,
  is_active: false,
  is_suspended: false,
  suspension_reason: null,
  is_certified: false,
  plan: "free",
};

export default async function VendorProfilePage() {
  const vendor = (await getCurrentVendor()) ?? EMPTY_VENDOR;

  return (
    <DashboardPage
      title="Mon profil public"
      subtitle="La fiche que les clients voient : photo, présentation, ville et vos tissus. Soignez-la, c'est votre vitrine."
    >
      {vendor.id && (
        <Link
          href={`/vendeurs/${vendor.id}`}
          target="_blank"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm"
        >
          <ExternalLink className="size-4" /> Voir ma fiche publique
        </Link>
      )}
      <VendorProfileForm vendor={vendor} />
    </DashboardPage>
  );
}
