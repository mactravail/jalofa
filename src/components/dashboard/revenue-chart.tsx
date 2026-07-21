"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/constants";
import {
  summarize,
  type Granularity,
  type RevenueSeries,
} from "@/lib/revenue-series";
import { cn } from "@/lib/utils";

type TabDef = {
  id: Granularity;
  label: string;
  /** Décrit la fenêtre affichée (« 30 derniers jours »). */
  window: string;
  /** Le créneau, au singulier, pour la moyenne (« par jour »). */
  per: string;
};

const TABS: TabDef[] = [
  { id: "day", label: "Jour", window: "30 derniers jours", per: "jour" },
  { id: "week", label: "Semaine", window: "12 dernières semaines", per: "semaine" },
  { id: "month", label: "Mois", window: "12 derniers mois", per: "mois" },
];

const HEIGHT = 240;
const PAD = { top: 18, right: 16, bottom: 26, left: 48 };

/** Montant abrégé pour l'axe (« 45 k », « 1,3 M »). */
function compact(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)} k`;
  return String(Math.round(value));
}

/** Arrondit le plafond de l'axe à un « joli » nombre, avec un peu d'air. */
function niceMax(value: number): number {
  if (value <= 0) return 1_000;
  const withHeadroom = value * 1.1;
  const pow = Math.pow(10, Math.floor(Math.log10(withHeadroom)));
  const f = withHeadroom / pow;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * pow;
}

/**
 * La courbe des revenus d'un dashboard : ce qu'on a encaissé dans le temps,
 * bascule entre jour, semaine et mois. Une seule série — pas de légende, le
 * titre suffit ; l'infobulle donne le détail au survol, et une table cachée
 * porte les mêmes chiffres pour les lecteurs d'écran.
 */
export function RevenueChart({
  series,
  title,
  subtitle,
  unit = "vente",
  defaultGranularity = "day",
  className,
}: {
  series: RevenueSeries;
  title: string;
  subtitle?: string;
  unit?: string;
  defaultGranularity?: Granularity;
  className?: string;
}) {
  const [gran, setGran] = useState<Granularity>(defaultGranularity);
  const [active, setActive] = useState<number | null>(null);
  const [width, setWidth] = useState(640);
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gradientId = useId();

  const tab = TABS.find((t) => t.id === gran) ?? TABS[0];
  const points = series[gran];
  const summary = useMemo(() => summarize(points), [points]);

  // Largeur réelle du conteneur : SVG au pixel près, tracés nets, survol juste.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const n = points.length;
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const maxRaw = Math.max(0, ...points.map((p) => p.revenue));
  const maxY = niceMax(maxRaw);
  const empty = maxRaw <= 0;

  const xOf = (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (innerW * i) / (n - 1));
  const yOf = (v: number) => PAD.top + innerH - (maxY <= 0 ? 0 : (v / maxY) * innerH);

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(p.revenue).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${xOf(n - 1).toFixed(1)},${yOf(0).toFixed(1)} L${xOf(0).toFixed(1)},${yOf(0).toFixed(1)} Z`;

  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((r) => maxY * r);
  const labelEvery = Math.max(1, Math.ceil(n / 7));

  const activePoint = active != null ? points[active] : null;

  function handleMove(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || n === 0) return;
    const rect = svg.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const ratio = innerW <= 0 ? 0 : (px - PAD.left) / innerW;
    const i = Math.round(ratio * (n - 1));
    setActive(Math.min(n - 1, Math.max(0, i)));
  }

  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">
              {formatPrice(summary.total)}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {tab.window} · {summary.orders} {unit}
              {summary.orders > 1 ? "s" : ""} · moyenne {formatPrice(summary.average)}/
              {tab.per}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Granularité"
            className="bg-muted inline-flex shrink-0 items-center rounded-lg p-[3px]"
          >
            {TABS.map((t) => {
              const activeTab = t.id === gran;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab}
                  onClick={() => {
                    setGran(t.id);
                    setActive(null);
                  }}
                  className={cn(
                    "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                    activeTab
                      ? "bg-background text-foreground shadow-sm"
                      : "text-foreground/60 hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </header>

        {subtitle && <p className="text-muted-foreground -mt-3 text-xs">{subtitle}</p>}

        <div ref={wrapRef} className="relative w-full">
          {/* viewBox + w-full : avant l'hydratation (width vaut encore 640), le
              SVG se met à l'échelle du conteneur au lieu de déborder sur mobile.
              Après mesure, width = largeur réelle et l'échelle redevient 1:1. */}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${HEIGHT}`}
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={`${title} — ${formatPrice(summary.total)} sur ${tab.window}`}
            className="block h-auto w-full touch-none overflow-visible"
            onPointerMove={handleMove}
            onPointerLeave={() => setActive(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.24} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Lignes de repère horizontales + graduation de l'axe. */}
            {gridValues.map((value, i) => {
              const y = yOf(value);
              return (
                <g key={i}>
                  <line
                    x1={PAD.left}
                    x2={width - PAD.right}
                    y1={y}
                    y2={y}
                    className={i === 0 ? "stroke-border" : "stroke-border/60"}
                    strokeWidth={1}
                  />
                  <text
                    x={PAD.left - 8}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {compact(value)}
                  </text>
                </g>
              );
            })}

            {!empty && (
              <>
                <path d={areaPath} fill={`url(#${gradientId})`} />
                <path
                  d={linePath}
                  fill="none"
                  className="stroke-primary"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* Étiquettes de l'axe des abscisses, espacées pour ne pas se toucher. */}
            {points.map((p, i) =>
              i % labelEvery === 0 || i === n - 1 ? (
                <text
                  key={p.key}
                  x={xOf(i)}
                  y={HEIGHT - 8}
                  textAnchor={i === n - 1 ? "end" : i === 0 ? "start" : "middle"}
                  className="fill-muted-foreground text-[10px]"
                >
                  {p.label}
                </text>
              ) : null,
            )}

            {/* Survol : trait vertical + point mis en avant. */}
            {activePoint && (
              <>
                <line
                  x1={xOf(active as number)}
                  x2={xOf(active as number)}
                  y1={PAD.top}
                  y2={PAD.top + innerH}
                  className="stroke-primary/40"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={xOf(active as number)}
                  cy={yOf(activePoint.revenue)}
                  r={4.5}
                  className="fill-primary stroke-card"
                  strokeWidth={2}
                />
              </>
            )}

            {empty && (
              <text
                x={PAD.left + innerW / 2}
                y={PAD.top + innerH / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-xs"
              >
                Aucune vente sur cette période.
              </text>
            )}
          </svg>

          {activePoint && (
            <div
              className="bg-popover text-popover-foreground pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border px-3 py-2 text-xs shadow-md"
              style={{
                left: Math.min(
                  Math.max(xOf(active as number), 72),
                  Math.max(72, width - 72),
                ),
                top: yOf(activePoint.revenue) - 12,
              }}
            >
              <p className="text-muted-foreground whitespace-nowrap capitalize">
                {activePoint.fullLabel}
              </p>
              <p className="mt-0.5 font-semibold whitespace-nowrap">
                {formatPrice(activePoint.revenue)}
              </p>
              <p className="text-muted-foreground whitespace-nowrap">
                {activePoint.orders} {unit}
                {activePoint.orders > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>

        {/* Repli accessible : les mêmes chiffres, pour les lecteurs d'écran.
            Le div porte le sr-only : overflow ne s'applique pas aux tables,
            dont les cellules provoqueraient sinon un défilement horizontal. */}
        <div className="sr-only">
          <table>
            <caption>
              {title} par {tab.per}
            </caption>
            <thead>
              <tr>
                <th>Période</th>
                <th>Revenu</th>
                <th>{unit}s</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.key}>
                  <td>{p.fullLabel}</td>
                  <td>{formatPrice(p.revenue)}</td>
                  <td>{p.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
