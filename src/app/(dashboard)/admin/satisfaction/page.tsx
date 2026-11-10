import type { Metadata } from "next";
import { AlertTriangle, Scissors, Store, ThumbsUp } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { getSatisfactionRows, type SatisfactionRow } from "@/lib/admin-data";
import { SATISFACTION_ISSUES, isSatisfactionIssue } from "@/lib/after-sale";
import { formatReceivedAt } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Satisfaction" };

type Score = {
  id: string;
  name: string;
  role: "tailor" | "vendor";
  perfect: number;
  problems: number;
  /** Les problèmes qui reviennent, du plus fréquent. */
  top: [string, number][];
};

/**
 * Le bilan par prestataire. Un tailleur compte toutes les réponses de ses
 * commandes ; un vendeur seulement ses « parfaite » et les problèmes de tissu.
 */
function scores(rows: SatisfactionRow[]): Score[] {
  const map = new Map<string, Score & { counts: Map<string, number> }>();
  const add = (role: "tailor" | "vendor", id: string | null, name: string | undefined, r: SatisfactionRow) => {
    if (!id) return;
    const issues = r.issues.filter(isSatisfactionIssue).filter((i) => SATISFACTION_ISSUES[i].who === role);
    const concerned = r.verdict === "perfect" || issues.length > 0 || (role === "tailor" && r.issues.length === 0);
    if (!concerned) return;
    const key = `${role}:${id}`;
    const s = map.get(key) ?? {
      id,
      name: name ?? (role === "tailor" ? "Tailleur" : "Vendeur"),
      role,
      perfect: 0,
      problems: 0,
      top: [],
      counts: new Map<string, number>(),
    };
    if (r.verdict === "perfect") s.perfect++;
    else s.problems++;
    for (const i of issues) s.counts.set(i, (s.counts.get(i) ?? 0) + 1);
    map.set(key, s);
  };
  for (const r of rows) {
    add("tailor", r.tailor_id, r.tailor?.shop_name, r);
    add("vendor", r.vendor_id, r.vendor?.shop_name, r);
  }
  return [...map.values()]
    .map(({ counts, ...s }) => ({
      ...s,
      top: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
    }))
    .sort((a, b) => b.problems - a.problems || a.name.localeCompare(b.name));
}

const rate = (s: Score) => Math.round((s.perfect / Math.max(1, s.perfect + s.problems)) * 100);

export default async function AdminSatisfactionPage() {
  const rows = await getSatisfactionRows();
  const board = scores(rows);

  return (
    <AdminPage
      title="Satisfaction"
      subtitle="Ce que disent les clients une fois leur tenue reçue : « Parfaite » ou « Un problème ». Pour évaluer chaque tailleur et chaque vendeur."
    >
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <ThumbsUp className="text-muted-foreground mx-auto size-7" />
          <p className="text-muted-foreground mt-3 text-sm">Aucune réponse pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="space-y-10">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Par prestataire</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {board.map((s) => {
                const pct = rate(s);
                return (
                  <div key={`${s.role}-${s.id}`} className="bg-card rounded-xl border p-4">
                    <div className="flex items-center gap-2">
                      {s.role === "tailor" ? (
                        <Scissors className="text-muted-foreground size-4" />
                      ) : (
                        <Store className="text-muted-foreground size-4" />
                      )}
                      <p className="min-w-0 flex-1 truncate font-semibold">{s.name}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-bold",
                          pct >= 80
                            ? "bg-emerald-500/15 text-emerald-400"
                            : pct >= 50
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-rose-500/15 text-rose-400",
                        )}
                      >
                        {pct} % parfaite
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm">
                      <span className="text-emerald-400">{s.perfect} parfaite{s.perfect > 1 ? "s" : ""}</span>
                      {" · "}
                      <span className="text-amber-400">
                        {s.problems} problème{s.problems > 1 ? "s" : ""}
                      </span>
                    </p>
                    {s.top.length > 0 && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {s.top
                          .map(([i, n]) =>
                            `${isSatisfactionIssue(i) ? SATISFACTION_ISSUES[i].label : i} ×${n}`,
                          )
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Toutes les réponses</h2>
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.id} className="bg-card rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {r.verdict === "perfect" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        <ThumbsUp className="size-3" /> Parfaite
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                        <AlertTriangle className="size-3" /> Problème
                      </span>
                    )}
                    <span className="text-muted-foreground font-mono text-xs">
                      {r.order?.order_number}
                    </span>
                    <span className="text-muted-foreground text-xs" suppressHydrationWarning>
                      {formatReceivedAt(r.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">
                    {r.order?.model?.name ?? "Commande"}
                    {r.tailor?.shop_name && ` · ${r.tailor.shop_name}`}
                    {r.vendor?.shop_name && ` · tissu ${r.vendor.shop_name}`}
                  </p>
                  {r.issues.length > 0 && (
                    <p className="mt-1 text-sm font-medium text-amber-400">
                      {r.issues
                        .map((i) => (isSatisfactionIssue(i) ? SATISFACTION_ISSUES[i].label : i))
                        .join(", ")}
                    </p>
                  )}
                  {r.comment && (
                    <p className="text-muted-foreground mt-1 text-sm break-words">« {r.comment} »</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </AdminPage>
  );
}
