import { CheckCircle2 } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { FeedbackAdminActions } from "@/components/feedback/feedback-admin-actions";
import { Badge } from "@/components/ui/badge";
import {
  FEEDBACK_CATEGORY_BADGES,
  FEEDBACK_SPACE_LABELS,
  type FeedbackCategory,
} from "@/lib/constants";
import { getAllFeedback } from "@/lib/admin-data";
import { cn } from "@/lib/utils";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** La teinte de la pastille par catégorie — le rouge signale un problème. */
const CATEGORY_TONE: Record<FeedbackCategory, string> = {
  amelioration:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  probleme:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
  autre:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
};

export default async function AdminFeedbackPage() {
  const feedback = await getAllFeedback();
  const newCount = feedback.filter((f) => f.status === "new").length;

  return (
    <AdminPage
      title="Retours"
      subtitle="Les idées et les problèmes remontés par les clients, tailleurs et vendeurs depuis leur espace. Marquez « traité » ce qui est réglé."
    >
      {feedback.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">Aucun retour pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {newCount > 0 && (
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground font-semibold">{newCount}</span>{" "}
              retour{newCount > 1 ? "s" : ""} à traiter
            </p>
          )}

          <div className="divide-y rounded-xl border">
            {feedback.map((f) => {
              const resolved = f.status === "resolved";
              return (
                <div
                  key={f.id}
                  className={cn(
                    "flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4",
                    resolved && "opacity-60",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={CATEGORY_TONE[f.category]}
                      >
                        {FEEDBACK_CATEGORY_BADGES[f.category]}
                      </Badge>
                      <Badge variant="secondary">
                        {FEEDBACK_SPACE_LABELS[f.space]}
                      </Badge>
                      {resolved && (
                        <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                          <CheckCircle2 className="size-3.5" /> Traité
                        </span>
                      )}
                      <span className="text-muted-foreground text-xs">
                        {DATE_FORMAT.format(new Date(f.created_at))}
                      </span>
                    </div>

                    <p className="mt-2 text-sm whitespace-pre-wrap">{f.message}</p>

                    <p className="text-muted-foreground mt-1.5 text-xs">
                      {f.author_name ?? "Utilisateur"}
                    </p>
                  </div>

                  <FeedbackAdminActions id={f.id} status={f.status} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminPage>
  );
}
