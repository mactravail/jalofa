import { Eye, EyeOff } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { TailorAdminRow } from "@/components/admin/tailor-admin-row";
import { getAllTailors } from "@/lib/admin-data";
import type { Tailor } from "@/lib/types";

/** Affiché sur le site : boutique ouverte, ni masquée par JALOFA, ni suspendue. */
const isShown = (t: Tailor) => t.is_active && !t.hidden_by_admin && !t.is_suspended;

export default async function AdminTailorsPage() {
  const tailors = await getAllTailors();
  // Deux listes : ceux qu'on voit sur le site, puis ceux qui sont masqués
  // (par JALOFA, par le tailleur lui-même, ou suspendus). Un toucher sur le
  // bouton d'une ligne la fait passer dans l'autre liste.
  const shown = tailors.filter(isShown);
  const hidden = tailors.filter((t) => !isShown(t));

  return (
    <AdminPage
      title="Tailleurs"
      subtitle="Touchez « Sur le site » / « Masqué » pour choisir qui apparaît sur le site ; suspendez ou certifiez avec ⋯."
    >
      {tailors.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">Aucun tailleur.</p>
        </div>
      ) : (
        <div className="space-y-10">
          <TailorSection
            icon={<Eye className="size-5 text-emerald-400" />}
            title="Sur le site"
            empty="Aucun tailleur n'est affiché sur le site."
            tailors={shown}
          />
          <TailorSection
            icon={<EyeOff className="text-muted-foreground size-5" />}
            title="Masqués"
            empty="Aucun tailleur masqué."
            tailors={hidden}
          />
        </div>
      )}
    </AdminPage>
  );
}

function TailorSection({
  icon,
  title,
  empty,
  tailors,
}: {
  icon: React.ReactNode;
  title: string;
  empty: string;
  tailors: Tailor[];
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        {icon}
        {title}
        <span className="text-muted-foreground text-base font-normal">({tailors.length})</span>
      </h2>
      {tailors.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
          {empty}
        </p>
      ) : (
        <div className="divide-y rounded-xl border">
          {tailors.map((tailor) => (
            <TailorAdminRow key={tailor.id} tailor={tailor} />
          ))}
        </div>
      )}
    </section>
  );
}
