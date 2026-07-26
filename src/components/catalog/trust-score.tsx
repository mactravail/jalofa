import { ShieldCheck } from "lucide-react";

import {
  CertifiedBadge,
  FoundingMemberBadge,
} from "@/components/admin/status-badges";
import { computeTrustScore, type TrustPro, type TrustTier } from "@/lib/trust-score";
import { cn } from "@/lib/utils";

// Tons par palier — le score est une info fonctionnelle, la couleur est donc
// permise même sur le site monochrome. Du gris (nouveau) au vert (excellent).
const TIER_PILL: Record<TrustTier["tone"], string> = {
  new: "border-border bg-muted text-muted-foreground",
  good: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300",
  high: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
  elite:
    "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-200",
};

const TIER_BAR: Record<TrustTier["tone"], string> = {
  new: "bg-muted-foreground/40",
  good: "bg-blue-500",
  high: "bg-emerald-500",
  elite: "bg-emerald-600",
};

/**
 * Pastille compacte du score de confiance — pour les cartes de l'annuaire.
 * « 🛡 Confiance 82 · Très fiable », ou « Nouveau » pour un pro sans historique.
 */
export function TrustScoreBadge({
  pro,
  className,
}: {
  pro: Partial<TrustPro>;
  className?: string;
}) {
  const { score, tier } = computeTrustScore(pro);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        TIER_PILL[tier.tone],
        className,
      )}
    >
      <ShieldCheck className="size-3.5" aria-hidden />
      {score !== null ? (
        <>
          <span className="tabular-nums">{score}</span>
          <span className="opacity-70">· {tier.label}</span>
        </>
      ) : (
        "Nouveau"
      )}
    </span>
  );
}

/**
 * Panneau détaillé du score de confiance — pour la fiche publique d'un pro.
 * Le chiffre en grand, le palier, les distinctions (Fondateur / Vérifié), puis
 * le détail critère par critère avec une barre de progression.
 */
export function TrustScorePanel({ pro }: { pro: Partial<TrustPro> }) {
  const { score, tier, components, badges } = computeTrustScore(pro);

  return (
    <section className="bg-card rounded-2xl border p-5">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-20 shrink-0 flex-col items-center justify-center rounded-2xl border",
            TIER_PILL[tier.tone],
          )}
        >
          {score !== null ? (
            <>
              <span className="text-2xl font-bold leading-none tabular-nums">
                {score}
              </span>
              <span className="text-[10px] font-medium opacity-70">/ 100</span>
            </>
          ) : (
            <ShieldCheck className="size-7" aria-hidden />
          )}
        </div>

        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <ShieldCheck className="text-primary size-4" aria-hidden /> Score de
            confiance
          </p>
          <p className="mt-0.5 text-lg font-semibold">{tier.label}</p>
          {(badges.founding || badges.certified) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {badges.certified && <CertifiedBadge />}
              {badges.founding && <FoundingMemberBadge />}
            </div>
          )}
        </div>
      </div>

      <dl className="mt-5 space-y-3">
        {components.map((c) => {
          const pct = c.value === null ? 0 : Math.round(c.value * 100);
          return (
            <div key={c.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <dt className="text-muted-foreground">
                  <span aria-hidden>{c.emoji}</span> {c.label}
                </dt>
                <dd className="font-medium">{c.display}</dd>
              </div>
              <div className="bg-muted mt-1.5 h-1.5 overflow-hidden rounded-full">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    c.value === null ? "bg-transparent" : TIER_BAR[tier.tone],
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </dl>

      <p className="text-muted-foreground mt-4 text-xs">
        Le score s&apos;appuie sur les avis, les commandes réalisées, le respect
        des délais, le taux d&apos;acceptation et les photos vérifiées.
      </p>
    </section>
  );
}
