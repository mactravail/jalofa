import Link from "@/components/i18n/link";
import { Clock, Eye, LogOut, Users } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { StatCard } from "@/components/admin/stat-card";
import { getSiteStats, type SiteStatsPage } from "@/lib/admin-data";
import { cn } from "@/lib/utils";

const PERIODS = [
  { days: 1, label: "Aujourd'hui" },
  { days: 7, label: "7 jours" },
  { days: 30, label: "30 jours" },
  { days: 90, label: "3 mois" },
] as const;

/** Les pages connues, en mots simples ; les autres gardent leur adresse. */
const PAGE_NAMES: [RegExp, string][] = [
  [/^\/$/, "Accueil"],
  [/^\/modeles\?category=homme$/, "Collection Homme"],
  [/^\/modeles\?category=femme$/, "Collection Femme"],
  [/^\/modeles\?category=enfant$/, "Collection Enfant"],
  [/^\/modeles$/, "Catalogue des modèles"],
  [/^\/modeles\//, "Page d'un vêtement"],
  [/^\/tissus$/, "Tissus"],
  [/^\/tissus\//, "Page d'un tissu"],
  [/^\/tailleurs$/, "Tailleurs"],
  [/^\/tailleurs\//, "Boutique d'un tailleur"],
  [/^\/vendeurs\//, "Ancienne page vendeur"],
  [/^\/commande\/nouvelle/, "Configurateur"],
  [/^\/panier/, "Panier"],
  [/^\/caisse/, "Paiement (caisse)"],
  [/^\/afrique/, "JALOFA Afrique"],
  [/^\/europe/, "JALOFA Europe"],
  [/^\/inspiration/, "Inspiration"],
  [/^\/connexion/, "Connexion"],
  [/^\/inscription/, "Créer un compte"],
  [/^\/compte/, "Espace client"],
];

function pageName(path: string): string {
  const p = path.replace(/^\/it(?=\/|$|\?)/, "") || "/";
  const name = PAGE_NAMES.find(([re]) => re.test(p))?.[1];
  return path.startsWith("/it") && name ? `${name} (italien)` : (name ?? path);
}

function duration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  return `${m} min ${String(s % 60).padStart(2, "0")}`;
}

const pct = (part: number, whole: number) =>
  whole > 0 ? `${Math.round((part / whole) * 100)} %` : "—";

const COUNTRY = new Intl.DisplayNames(["fr"], { type: "region" });
function countryName(code: string): string {
  if (code === "??") return "Inconnu";
  try {
    return COUNTRY.of(code) ?? code;
  } catch {
    return code;
  }
}

const DEVICE: Record<string, string> = {
  mobile: "Téléphone",
  tablet: "Tablette",
  desktop: "Ordinateur",
};

const DAY = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const days = PERIODS.find((x) => String(x.days) === p)?.days ?? 7;

  // « Aujourd'hui » = depuis minuit à Dakar (UTC+0 toute l'année).
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const stats = await getSiteStats(since);

  return (
    <AdminPage
      title="Statistiques"
      subtitle="Combien de personnes visitent JALOFA, ce qu'elles regardent et sur quelle page elles s'arrêtent. Vos propres visites ne sont pas comptées."
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {PERIODS.map((x) => (
          <Link
            key={x.days}
            href={`/admin/statistiques?p=${x.days}`}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm",
              x.days === days
                ? "bg-foreground text-background border-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {x.label}
          </Link>
        ))}
      </div>

      {!stats ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">
            Les statistiques ne sont pas encore activées : appliquez la migration{" "}
            <code>20260906000001_site_analytics.sql</code> dans Supabase.
          </p>
        </div>
      ) : stats.views === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">
            Aucune visite sur cette période pour l&apos;instant.
          </p>
        </div>
      ) : (
        <StatsBody stats={stats} />
      )}
    </AdminPage>
  );
}

function StatsBody({ stats }: { stats: NonNullable<Awaited<ReturnType<typeof getSiteStats>>> }) {
  const exitPages = [...stats.pages]
    .filter((pg) => pg.exits > 0)
    .sort((a, b) => b.exits - a.exits)
    .slice(0, 15);
  const maxDaily = Math.max(...stats.daily.map((d) => d.visitors), 1);

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <StatCard
          icon={Users}
          label="Visiteurs"
          value={String(stats.visitors)}
          hint={`${stats.sessions} visite${stats.sessions > 1 ? "s" : ""}`}
          accent
          tone="blue"
        />
        <StatCard
          icon={Eye}
          label="Pages vues"
          value={String(stats.views)}
          hint={`${(stats.views / Math.max(stats.sessions, 1)).toFixed(1)} pages par visite`}
          tone="violet"
        />
        <StatCard
          icon={Clock}
          label="Temps moyen d'une visite"
          value={duration(stats.avg_session_ms)}
          tone="teal"
        />
        <StatCard
          icon={LogOut}
          label="Partis après 1 page"
          value={pct(stats.bounces, stats.sessions)}
          hint={`${stats.bounces} visite${stats.bounces > 1 ? "s" : ""}`}
          tone="rose"
        />
      </div>

      {stats.daily.length > 1 && (
        <section>
          <h2 className="mb-3 font-semibold">Visiteurs par jour</h2>
          <div className="flex h-40 items-end gap-1 rounded-xl border p-3">
            {stats.daily.map((d) => (
              <div
                key={d.day}
                className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                title={`${DAY.format(new Date(d.day))} : ${d.visitors} visiteur(s), ${d.views} page(s)`}
              >
                <span className="text-muted-foreground text-[10px] tabular-nums">
                  {d.visitors}
                </span>
                <div
                  className="w-full rounded-t bg-blue-500"
                  style={{ height: `${(d.visitors / maxDaily) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="text-muted-foreground mt-1 flex justify-between text-xs">
            <span>{DAY.format(new Date(stats.daily[0].day))}</span>
            <span>{DAY.format(new Date(stats.daily[stats.daily.length - 1].day))}</span>
          </div>
        </section>
      )}

      <section>
        <h2 className="font-semibold">Où les visiteurs s&apos;arrêtent</h2>
        <p className="text-muted-foreground mb-3 text-sm">
          La dernière page vue avant de quitter le site. Un fort pourcentage sur
          le panier ou la caisse = des achats abandonnés.
        </p>
        <PageTable
          pages={exitPages}
          columns={[
            { label: "Sont partis ici", value: (pg) => String(pg.exits), strong: true },
            { label: "Sur", value: (pg) => `${pg.views} vues` },
            { label: "Taux de sortie", value: (pg) => pct(pg.exits, pg.views) },
          ]}
        />
      </section>

      <section>
        <h2 className="font-semibold">Pages les plus vues</h2>
        <p className="text-muted-foreground mb-3 text-sm">
          Et combien de temps on y reste.
        </p>
        <PageTable
          pages={stats.pages.slice(0, 25)}
          columns={[
            { label: "Vues", value: (pg) => String(pg.views), strong: true },
            { label: "Visiteurs", value: (pg) => String(pg.visitors) },
            { label: "Temps moyen", value: (pg) => duration(pg.avg_ms) },
          ]}
        />
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <SmallList
          title="Appareils"
          rows={stats.devices.map((d) => ({ label: DEVICE[d.label] ?? d.label, n: d.visitors }))}
          total={stats.visitors}
        />
        <SmallList
          title="Pays"
          rows={stats.countries.map((c) => ({ label: countryName(c.label), n: c.visitors }))}
          total={stats.visitors}
        />
        <SmallList
          title="D'où ils viennent"
          rows={stats.sources.map((s) => ({
            label: s.label === "direct" ? "Lien direct / WhatsApp" : s.label,
            n: s.visitors,
          }))}
          total={stats.visitors}
        />
      </div>
    </div>
  );
}

function PageTable({
  pages,
  columns,
}: {
  pages: SiteStatsPage[];
  columns: { label: string; value: (pg: SiteStatsPage) => string; strong?: boolean }[];
}) {
  if (pages.length === 0) {
    return <p className="text-muted-foreground text-sm">Rien à afficher.</p>;
  }
  return (
    <div className="divide-y rounded-xl border">
      <div className="text-muted-foreground hidden gap-4 px-4 py-2 text-xs sm:flex">
        <span className="flex-1">Page</span>
        {columns.map((c) => (
          <span key={c.label} className="w-28 text-right">
            {c.label}
          </span>
        ))}
      </div>
      {pages.map((pg) => (
        <div key={pg.path} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{pageName(pg.path)}</p>
            <p className="text-muted-foreground truncate text-xs">{pg.path}</p>
          </div>
          <div className="flex flex-wrap gap-x-4 text-sm sm:contents">
            {columns.map((c) => (
              <span
                key={c.label}
                className={cn("tabular-nums sm:w-28 sm:text-right", c.strong && "font-semibold")}
              >
                <span className="text-muted-foreground sm:hidden">{c.label} : </span>
                {c.value(pg)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SmallList({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { label: string; n: number }[];
  total: number;
}) {
  return (
    <section>
      <h2 className="mb-3 font-semibold">{title}</h2>
      <div className="space-y-2 rounded-xl border p-4">
        {rows.length === 0 && <p className="text-muted-foreground text-sm">—</p>}
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between gap-2 text-sm">
              <span className="truncate">{r.label}</span>
              <span className="tabular-nums">{pct(r.n, total)}</span>
            </div>
            <div className="bg-muted mt-1 h-1.5 rounded-full">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${Math.min((r.n / Math.max(total, 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
