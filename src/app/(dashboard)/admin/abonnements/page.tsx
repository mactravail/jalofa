import { AdminPage } from "@/components/admin/admin-page";
import {
  SubscriptionRow,
  type ProAccount,
} from "@/components/admin/subscription-row";
import { getAllTailors, getAllVendors } from "@/lib/admin-data";
import type { ProRole } from "@/lib/dashboard-nav";
import { isSupabaseConfigured } from "@/lib/queries";

/**
 * Validation des abonnements pros. Les paiements passent par Wave hors
 * plateforme : un pro qui s'inscrit reste « en attente » jusqu'à ce que
 * l'administration confirme le règlement et ouvre son espace ici. Un compte aux
 * deux métiers (Premium/Gratuit) apparaît sur une seule ligne : on l'active d'un
 * bloc.
 */
export default async function AdminSubscriptionsPage() {
  const [tailors, vendors] = await Promise.all([
    getAllTailors(),
    getAllVendors(),
  ]);

  // Fusion des deux boutiques par compte (l'id d'une boutique = l'id du profil).
  const accounts = new Map<string, ProAccount>();
  for (const t of tailors) {
    accounts.set(t.id, {
      id: t.id,
      name: t.shop_name ?? "Prestataire",
      plan: t.plan,
      metiers: ["tailor"],
      is_activated: t.is_activated,
    });
  }
  for (const v of vendors) {
    const existing = accounts.get(v.id);
    if (existing) {
      existing.metiers.push("vendor" as ProRole);
      existing.is_activated = existing.is_activated || v.is_activated;
    } else {
      accounts.set(v.id, {
        id: v.id,
        name: v.shop_name ?? "Prestataire",
        plan: v.plan,
        metiers: ["vendor"],
        is_activated: v.is_activated,
      });
    }
  }

  const all = [...accounts.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const pending = all.filter((a) => !a.is_activated);
  const active = all.filter((a) => a.is_activated);
  const demo = !isSupabaseConfigured();

  return (
    <AdminPage
      title="Abonnements"
      subtitle="Confirmez le paiement Wave d'un pro pour ouvrir son espace. Tant qu'il n'est pas activé, il patiente sur un écran d'attente."
    >
      <div className="space-y-8">
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            À valider
            <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 rounded-full px-2 py-0.5 text-xs font-bold">
              {pending.length}
            </span>
          </h2>
          {pending.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-muted-foreground text-sm">
                Aucun pro en attente. Tout est à jour.
              </p>
            </div>
          ) : (
            <div className="divide-y rounded-xl border border-amber-200 dark:border-amber-500/30">
              {pending.map((a) => (
                <SubscriptionRow key={a.id} account={a} demo={demo} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">
            Actifs{" "}
            <span className="text-muted-foreground font-normal">
              ({active.length})
            </span>
          </h2>
          {active.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-muted-foreground text-sm">
                Aucun pro activé pour l&apos;instant.
              </p>
            </div>
          ) : (
            <div className="divide-y rounded-xl border">
              {active.map((a) => (
                <SubscriptionRow key={a.id} account={a} demo={demo} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminPage>
  );
}
