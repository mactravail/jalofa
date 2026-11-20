import { AdminPage } from "@/components/admin/admin-page";
import {
  SalesApprovalRow,
  type SalesApprovalAccount,
} from "@/components/admin/sales-approval-row";
import {
  getAllFabrics,
  getAllModels,
  getAllTailors,
  getContactDirectory,
} from "@/lib/admin-data";
import { isSupabaseConfigured } from "@/lib/queries";
import { canSell } from "@/lib/sales-approval";

/**
 * Validations — garde anti-arnaque de la Sélection JALOFA. Un nouveau pro
 * publie et reste visible, mais aucun client ne peut lui acheter tant qu'il
 * n'est pas validé ici. Un compte aux deux métiers tient sur une seule ligne.
 */
export default async function AdminValidationsPage() {
  // Plus de vendeurs de tissus (JALOFA vend seule) : seuls les tailleurs sont
  // à valider.
  const [tailors, models, fabrics, directory] = await Promise.all([
    getAllTailors(),
    getAllModels(),
    getAllFabrics(),
    getContactDirectory(),
  ]);

  const modelCount = new Map<string, number>();
  for (const m of models) {
    if (m.tailor_id) modelCount.set(m.tailor_id, (modelCount.get(m.tailor_id) ?? 0) + 1);
  }
  const fabricCount = new Map<string, number>();
  for (const f of fabrics) {
    if (f.vendor_id) fabricCount.set(f.vendor_id, (fabricCount.get(f.vendor_id) ?? 0) + 1);
  }

  const accounts = new Map<string, SalesApprovalAccount>();
  const touch = (
    shop: { id: string; shop_name: string | null; city: string | null; is_certified: boolean; sales_approved?: boolean },
    kind: "tailor" | "vendor",
  ) => {
    const owner = directory.get(shop.id);
    const existing = accounts.get(shop.id) ?? {
      id: shop.id,
      name: shop.shop_name ?? owner?.full_name ?? "Prestataire",
      hasTailor: false,
      hasVendor: false,
      approved: true,
      owner_name: owner?.full_name ?? null,
      email: owner?.email ?? null,
      phone: owner?.phone ?? null,
      city: shop.city,
      models: modelCount.get(shop.id) ?? 0,
      fabrics: fabricCount.get(shop.id) ?? 0,
      certified: false,
    };
    if (kind === "tailor") existing.hasTailor = true;
    else existing.hasVendor = true;
    // Une seule boutique non validée suffit à bloquer le compte.
    existing.approved = existing.approved && canSell(shop);
    existing.certified = existing.certified || shop.is_certified;
    existing.city ??= shop.city;
    accounts.set(shop.id, existing);
  };
  for (const t of tailors) touch(t, "tailor");

  const all = [...accounts.values()].sort((a, b) => a.name.localeCompare(b.name));
  const pending = all.filter((a) => !a.approved);
  const approved = all.filter((a) => a.approved);
  const demo = !isSupabaseConfigured();

  return (
    <AdminPage
      title="Validations"
      subtitle="Un nouveau pro publie et reste visible, mais personne ne peut lui acheter tant que vous n'avez pas validé ses ventes. Regardez sa boutique, appelez-le si besoin, puis validez."
    >
      <div className="space-y-8">
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            À valider
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              {pending.length}
            </span>
          </h2>
          {pending.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-muted-foreground text-sm">Aucun pro en attente. Tout est à jour.</p>
            </div>
          ) : (
            <div className="divide-y rounded-xl border border-amber-200 dark:border-amber-500/30">
              {pending.map((a) => (
                <SalesApprovalRow key={a.id} account={a} demo={demo} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">
            Peuvent vendre{" "}
            <span className="text-muted-foreground font-normal">({approved.length})</span>
          </h2>
          {approved.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-muted-foreground text-sm">Aucun pro validé pour l&apos;instant.</p>
            </div>
          ) : (
            <div className="divide-y rounded-xl border">
              {approved.map((a) => (
                <SalesApprovalRow key={a.id} account={a} demo={demo} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminPage>
  );
}
