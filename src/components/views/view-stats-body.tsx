import Link from "@/components/i18n/link";
import { Eye, Shirt, Store, Users } from "lucide-react";

import { StatCard } from "@/components/admin/stat-card";
import { getT } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import { VIEW_PERIODS, type TailorViewStats } from "@/lib/view-stats";

const DAY = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

/** Les boutons de période (Aujourd'hui / 7 jours / 30 jours / 3 mois). */
export async function ViewPeriodTabs({ base, days }: { base: string; days: number }) {
  const t = await getT();
  const sep = base.includes("?") ? "&" : "?";
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {VIEW_PERIODS.map((x) => (
        <Link
          key={x.days}
          href={`${base}${sep}p=${x.days}`}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm",
            x.days === days
              ? "bg-foreground text-background border-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(x.label)}
        </Link>
      ))}
    </div>
  );
}

/** Le message quand la migration n'est pas encore appliquée. */
export async function ViewStatsMissing() {
  const t = await getT();
  return (
    <div className="rounded-xl border border-dashed p-10 text-center">
      <p className="text-muted-foreground text-sm">
        {t("Les vues ne sont pas encore disponibles. Revenez bientôt.")}
      </p>
    </div>
  );
}

/**
 * Les vues d'un tailleur : sa page publique, ses modèles, jour par jour, puis
 * chaque modèle du plus vu au moins vu. Partagé par « Mes vues » (tailleur) et
 * la fiche d'un tailleur dans « Vues des tailleurs » (admin).
 */
export async function ViewStatsBody({
  stats,
  modelHref,
}: {
  stats: TailorViewStats;
  /** Lien vers la page publique d'un modèle (pour vérifier ce que voit le client). */
  modelHref?: (id: string) => string;
}) {
  const t = await getT();
  const maxDaily = Math.max(...stats.daily.map((d) => d.page_views + d.model_views), 1);
  const maxModel = Math.max(...stats.models.map((m) => m.views), 1);
  const plural = (n: number, one: string, many: string) => (n > 1 ? t(many) : t(one));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard
          icon={Store}
          label={t("Ont ouvert ma page")}
          value={String(stats.page_visitors)}
          hint={`${stats.page_views} ${plural(stats.page_views, "fois", "fois")}`}
          accent
          tone="blue"
        />
        <StatCard
          icon={Shirt}
          label={t("Ont cliqué sur mes modèles")}
          value={String(stats.model_visitors)}
          hint={`${stats.model_views} ${plural(stats.model_views, "clic", "clics")}`}
          accent
          tone="violet"
        />
      </div>
      <p className="text-muted-foreground -mt-5 flex items-center gap-1.5 text-xs">
        <Users className="size-3.5" />
        {t("Le grand chiffre = des personnes différentes. Une même personne qui revient compte une seule fois.")}
      </p>

      {stats.daily.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">{t("Jour par jour")}</h2>
          <div className="flex h-40 items-end gap-1 rounded-xl border p-3">
            {stats.daily.map((d) => {
              const total = d.page_views + d.model_views;
              return (
                <div
                  key={d.day}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                  title={`${DAY.format(new Date(d.day))} : ${d.page_views} page, ${d.model_views} modèles`}
                >
                  <span className="text-muted-foreground text-[10px] tabular-nums">{total}</span>
                  <div
                    className="flex w-full flex-col overflow-hidden rounded-t"
                    style={{ height: `${(total / maxDaily) * 100}%` }}
                  >
                    <div className="bg-violet-500" style={{ flex: d.model_views }} />
                    <div className="bg-blue-500" style={{ flex: d.page_views }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-muted-foreground mt-2 flex flex-wrap justify-between gap-2 text-xs">
            <span>{DAY.format(new Date(stats.daily[0].day))}</span>
            <span className="flex gap-3">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-blue-500" /> {t("Ma page")}
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-violet-500" /> {t("Mes modèles")}
              </span>
            </span>
            <span>{DAY.format(new Date(stats.daily[stats.daily.length - 1].day))}</span>
          </div>
        </section>
      )}

      <section>
        <h2 className="font-semibold">{t("Chaque modèle")}</h2>
        <p className="text-muted-foreground mb-3 text-sm">
          {t("Du plus regardé au moins regardé.")}
        </p>
        {stats.models.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            {t("Aucun modèle publié pour l'instant.")}
          </p>
        ) : (
          <div className="divide-y rounded-xl border">
            {stats.models.map((m) => {
              const row = (
                <>
                  <span className="bg-muted size-12 shrink-0 overflow-hidden rounded-md">
                    {m.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.image_url} alt="" className="size-full object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{m.name}</span>
                    <span className="bg-muted mt-1.5 block h-1.5 rounded-full">
                      <span
                        className="block h-full rounded-full bg-violet-500"
                        style={{ width: `${(m.views / maxModel) * 100}%` }}
                      />
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="flex items-center justify-end gap-1 font-semibold tabular-nums">
                      <Eye className="size-4" /> {m.visitors}
                    </span>
                    <span className="text-muted-foreground block text-xs tabular-nums">
                      {m.views} {plural(m.views, "clic", "clics")}
                    </span>
                  </span>
                </>
              );
              return modelHref ? (
                <Link
                  key={m.id}
                  href={modelHref(m.id)}
                  className="hover:bg-muted/50 flex items-center gap-3 px-4 py-3"
                >
                  {row}
                </Link>
              ) : (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  {row}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
