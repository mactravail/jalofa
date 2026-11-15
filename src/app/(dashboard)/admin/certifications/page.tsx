import { FileText } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { CertificationAdminActions } from "@/components/admin/certification-admin-actions";
import { Badge } from "@/components/ui/badge";
import { getAllCertificationRequests, type CertificationRequestRow } from "@/lib/admin-data";
import { cn } from "@/lib/utils";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Dakar",
});

const STATUS: Record<CertificationRequestRow["status"], { label: string; tone: string }> = {
  pending: {
    label: "En attente",
    tone: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  },
  approved: {
    label: "Certifié",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  },
  rejected: {
    label: "Refusée",
    tone: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
  },
};

/** Un lien vers une pièce du bucket privé (lien signé valable 1 h). */
function DocLink({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return <span className="text-muted-foreground text-xs">{label} : —</span>;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:bg-muted inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium"
    >
      <FileText className="size-3.5" /> {label}
    </a>
  );
}

export default async function AdminCertificationsPage() {
  const requests = await getAllCertificationRequests();
  const pending = requests.filter((r) => r.status === "pending").length;

  return (
    <AdminPage
      title="Certifications"
      subtitle="Les tailleurs et vendeurs qui demandent le badge « Certifié ». Vérifiez la carte d'identité et l'entreprise, puis certifiez ou refusez avec un motif."
    >
      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">Aucune demande pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending > 0 && (
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground font-semibold">{pending}</span> demande
              {pending > 1 ? "s" : ""} à examiner
            </p>
          )}
          <div className="divide-y rounded-xl border">
            {requests.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4",
                  r.status !== "pending" && "opacity-70",
                )}
              >
                {r.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element -- lien signé éphémère
                  <img
                    src={r.logo_url}
                    alt=""
                    className="size-14 shrink-0 rounded-lg border object-contain"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={STATUS[r.status].tone}>
                      {STATUS[r.status].label}
                    </Badge>
                    <Badge variant="secondary">
                      {r.kind === "tailor" ? "Tailleur" : "Vendeur"}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {DATE_FORMAT.format(new Date(r.created_at))}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold">{r.company_name}</p>
                  <dl className="mt-1 grid gap-x-4 gap-y-0.5 text-sm sm:grid-cols-[auto_1fr]">
                    <dt className="text-muted-foreground">Vrai nom</dt>
                    <dd>{r.legal_name}</dd>
                    <dt className="text-muted-foreground">Téléphone</dt>
                    <dd>
                      <a href={`tel:${r.phone}`} className="underline-offset-2 hover:underline">
                        {r.phone}
                      </a>
                    </dd>
                    <dt className="text-muted-foreground">Adresse</dt>
                    <dd className="whitespace-pre-wrap">{r.address}</dd>
                    <dt className="text-muted-foreground">NINEA</dt>
                    <dd>{r.ninea ?? "—"}</dd>
                  </dl>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <DocLink label="Carte d'identité" url={r.id_card_url} />
                    <DocLink label="Registre de commerce" url={r.trade_register_url} />
                    {r.logo_url && <DocLink label="Logo" url={r.logo_url} />}
                  </div>
                  {r.status === "rejected" && r.admin_note && (
                    <p className="text-muted-foreground mt-2 text-xs">
                      Motif du refus : {r.admin_note}
                    </p>
                  )}
                </div>
                {r.status === "pending" && (
                  <CertificationAdminActions id={r.id} name={r.company_name} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminPage>
  );
}
