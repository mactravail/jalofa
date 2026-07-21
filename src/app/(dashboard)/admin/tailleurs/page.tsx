import { AdminPage } from "@/components/admin/admin-page";
import { TailorAdminRow } from "@/components/admin/tailor-admin-row";
import { getAllTailors } from "@/lib/admin-data";

export default async function AdminTailorsPage() {
  const tailors = await getAllTailors();

  return (
    <AdminPage
      title="Tailleurs"
      subtitle="Les ateliers de couture inscrits sur la plateforme. Suspendez, réactivez ou certifiez chaque atelier."
    >
      {tailors.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">Aucun tailleur.</p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {tailors.map((tailor) => (
            <TailorAdminRow key={tailor.id} tailor={tailor} />
          ))}
        </div>
      )}
    </AdminPage>
  );
}
