import { AdminPage } from "@/components/admin/admin-page";
import { VendorAdminRow } from "@/components/admin/vendor-admin-row";
import { getAllVendors } from "@/lib/admin-data";

export default async function AdminVendorsPage() {
  const vendors = await getAllVendors();

  return (
    <AdminPage
      title="Vendeurs"
      subtitle="Les boutiques de tissus inscrites sur la plateforme. Suspendez, réactivez ou certifiez chaque boutique."
    >
      {vendors.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">Aucun vendeur.</p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {vendors.map((vendor) => (
            <VendorAdminRow key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}
    </AdminPage>
  );
}
