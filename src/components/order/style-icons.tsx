// Line-drawing icons for the "Style" step, in the thin-outline Hockerty
// aesthetic. Adapted to Senegalese / African clothing: cut silhouettes,
// collars, embroidery, sleeves and lengths. All strokes use `currentColor` so
// they follow the theme and dim/brighten with selection state.
//
// Silhouettes are drawn per garment family (boubou / kaftan / chemise / costume
// / robe / ensemble / jupe) because `style-options.ts` offers each garment only
// its own cuts — a robe is never shown a kaftan.

import type { ReactNode } from "react";

type IconDef = { viewBox: string; body: ReactNode };

const ICONS = {
  // --- Coupe · boubou -------------------------------------------------------
  boubou: {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M18 18Q32 11 46 18" />
        <path d="M18 18 6 40l8 4-3 28h42l-3-28 8-4-8-22" />
        <path d="M27 16Q32 23 37 16" />
        <path d="M32 23v22" />
        <path d="M28 30h8M28 36h8" />
      </>
    ),
  },
  "boubou-3pieces": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M18 18Q32 11 46 18" />
        <path d="M18 18 6 40l8 4-3 28h42l-3-28 8-4-8-22" />
        <path d="M27 16Q32 23 37 16" />
        <path d="M24 44v28M40 44v28" />
        <path d="M32 23v21" />
        <path d="M28 30h8" />
      </>
    ),
  },
  "boubou-court": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M18 20Q32 13 46 20" />
        <path d="M18 20 8 40l7 4-2 18h38l-2-18 7-4-8-20" />
        <path d="M27 18Q32 25 37 18" />
        <path d="M32 25v18" />
        <path d="M28 32h8" />
      </>
    ),
  },

  // --- Coupe · kaftan -------------------------------------------------------
  "kaftan-droit": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M20 18Q32 12 44 18" />
        <path d="M20 18 14 44M44 18l6 26" />
        <path d="M20 18v54h24V18" />
        <path d="M28 15Q32 21 36 15" />
        <path d="M32 21v29" />
      </>
    ),
  },
  "kaftan-cintre": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M20 18Q32 12 44 18" />
        <path d="M20 18 15 42M44 18l5 24" />
        <path d="M20 18c-1 16 4 22 5 24l-2 30h18l-2-30c1-2 6-8 5-24" />
        <path d="M28 15Q32 21 36 15" />
        <path d="M32 21v25" />
      </>
    ),
  },
  "kaftan-long": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M20 16Q32 10 44 16" />
        <path d="M20 16 13 44M44 16l7 28" />
        <path d="M20 16 19 76h26l-1-60" />
        <path d="M28 13Q32 19 36 13" />
        <path d="M32 19v33" />
      </>
    ),
  },

  // --- Coupe · chemise ------------------------------------------------------
  "chemise-droite": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M22 18 18 62h28l-4-44" />
        <path d="M22 18 14 40M42 18l8 22" />
        <path d="M26 15 32 22l6-7" />
        <path d="M26 15h12" />
        <path d="M32 22v38" />
        <circle cx="32" cy="34" r="1" />
        <circle cx="32" cy="44" r="1" />
      </>
    ),
  },
  "chemise-cintree": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M22 18c-1 12 3 16 4 18l-3 26h18l-3-26c1-2 5-6 4-18" />
        <path d="M22 18 14 40M42 18l8 22" />
        <path d="M26 15 32 22l6-7" />
        <path d="M26 15h12" />
        <path d="M32 22v38" />
        <circle cx="32" cy="34" r="1" />
        <circle cx="32" cy="46" r="1" />
      </>
    ),
  },

  // --- Coupe · costume ------------------------------------------------------
  "costume-mao": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M20 20 16 70h32l-4-50" />
        <path d="M20 20 14 42M44 20l6 22" />
        <path d="M26 16v6h12v-6" />
        <path d="M26 22 32 28l6-6" />
        <path d="M32 28v38" />
        <circle cx="32" cy="38" r="1" />
        <circle cx="32" cy="46" r="1" />
        <circle cx="32" cy="54" r="1" />
      </>
    ),
  },
  dashiki: {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M18 18Q32 12 46 18" />
        <path d="M18 18 10 40M46 18l8 22" />
        <path d="M18 18v50h28V18" />
        <path d="M26 16v18h12V16" />
        <path d="M23 20h18M23 24h18" />
      </>
    ),
  },
  senghor: {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M20 20 17 70h30l-3-50" />
        <path d="M20 20 14 44M44 20l6 24" />
        <path d="M24 18 30 24l2-2 2 2 6-6" />
        <path d="M32 22v44" />
        <circle cx="32" cy="40" r="1" />
        <circle cx="32" cy="50" r="1" />
        <path d="M22 34h6v6h-6zM36 34h6v6h-6z" />
      </>
    ),
  },

  "costume-classique": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M20 20 17 68h30l-3-48" />
        <path d="M20 20 14 44M44 20l6 24" />
        <path d="M26 17 32 30l6-13" />
        <path d="M26 17 24 27M38 17l2 10" />
        <path d="M32 30v34" />
        <circle cx="32" cy="42" r="1" />
        <circle cx="32" cy="50" r="1" />
      </>
    ),
  },

  // --- Coupe · robe ---------------------------------------------------------
  "robe-droite": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M23 18Q32 12 41 18" />
        <path d="M23 18 17 27M41 18l6 9" />
        <path d="M23 18 22 72h20l-1-54" />
        <path d="M27 16Q32 22 37 16" />
      </>
    ),
  },
  "robe-evasee": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M23 18Q32 12 41 18" />
        <path d="M23 18 17 27M41 18l6 9" />
        <path d="M23 18 13 72h38L41 18" />
        <path d="M27 16Q32 22 37 16" />
        <path d="M13 72q19-6 38 0" />
      </>
    ),
  },
  "robe-sirene": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M23 18Q32 12 41 18" />
        <path d="M23 18 17 27M41 18l6 9" />
        <path d="M23 18c-1 14 3 18 4 24-1 8-9 12-9 30h28c0-18-8-22-9-30 1-6 5-10 4-24" />
        <path d="M27 16Q32 22 37 16" />
      </>
    ),
  },
  "robe-empire": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M23 18Q32 12 41 18" />
        <path d="M23 18 17 27M41 18l6 9" />
        <path d="M23 18 21 32l-6 40h34l-6-40-2-14" />
        <path d="M21 32h22" />
        <path d="M27 16Q32 22 37 16" />
      </>
    ),
  },

  // --- Coupe · ensemble (haut + bas) ---------------------------------------
  "ensemble-droit": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M22 16Q32 10 42 16" />
        <path d="M22 16 15 36M42 16l7 20" />
        <path d="M22 16 21 40h22l-1-24" />
        <path d="M21 44h22l-2 28h-8l-1-20-1 20h-8z" />
      </>
    ),
  },
  "ensemble-ample": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M20 16Q32 9 44 16" />
        <path d="M20 16 10 38M44 16l10 22" />
        <path d="M20 16 18 40h28l-2-24" />
        <path d="M19 44h26l-4 28h-8l-1-18-1 18h-8z" />
      </>
    ),
  },

  // --- Coupe · jupe ---------------------------------------------------------
  "jupe-droite": {
    viewBox: "0 0 64 64",
    body: (
      <>
        <path d="M22 12h20v6H22z" />
        <path d="M22 18 21 54h22l-1-36" />
      </>
    ),
  },
  "jupe-crayon": {
    viewBox: "0 0 64 64",
    body: (
      <>
        <path d="M22 12h20v6H22z" />
        <path d="M22 18 24 54h16l2-36" />
      </>
    ),
  },
  "jupe-plissee": {
    viewBox: "0 0 64 64",
    body: (
      <>
        <path d="M22 12h20v6H22z" />
        <path d="M22 18 16 54h32l-6-36" />
        <path d="M27 20 24 54M32 20v34M37 20l3 34" />
      </>
    ),
  },
  "jupe-evasee": {
    viewBox: "0 0 64 64",
    body: (
      <>
        <path d="M22 12h20v6H22z" />
        <path d="M22 18 14 54h36l-8-36" />
        <path d="M14 54q18-5 36 0" />
      </>
    ),
  },

  // --- Longueur (hemline height) -------------------------------------------
  "long-courte": {
    viewBox: "0 0 48 64",
    body: (
      <>
        <path d="M14 8h20v5H14z" />
        <path d="M14 13 11 30h26L34 13" />
        <path d="M11 30h26" strokeDasharray="0" />
        <path d="M8 30h-4M40 30h4" />
      </>
    ),
  },
  "long-midi": {
    viewBox: "0 0 48 64",
    body: (
      <>
        <path d="M14 8h20v5H14z" />
        <path d="M14 13 10 42h28L34 13" />
        <path d="M10 42h28" />
        <path d="M7 42H3M41 42h4" />
      </>
    ),
  },
  "long-longue": {
    viewBox: "0 0 48 64",
    body: (
      <>
        <path d="M14 8h20v5H14z" />
        <path d="M14 13 8 56h32L34 13" />
        <path d="M8 56h32" />
        <path d="M5 56H1M43 56h4" />
      </>
    ),
  },

  // --- Col (collar / neckline) ---------------------------------------------
  "col-rond": {
    viewBox: "0 0 64 52",
    body: (
      <>
        <path d="M6 42 18 16M58 42 46 16" />
        <path d="M18 16Q32 8 46 16" />
        <path d="M23 18Q32 30 41 18" />
      </>
    ),
  },
  "col-mao": {
    viewBox: "0 0 64 52",
    body: (
      <>
        <path d="M6 44 18 18M58 44 46 18" />
        <path d="M18 18Q32 12 46 18" />
        <path d="M26 20v-8h12v8" />
        <path d="M32 12v10" />
      </>
    ),
  },
  "col-v": {
    viewBox: "0 0 64 52",
    body: (
      <>
        <path d="M6 42 18 16M58 42 46 16" />
        <path d="M18 16Q32 8 46 16" />
        <path d="M22 16 32 34 42 16" />
      </>
    ),
  },
  "col-chale": {
    viewBox: "0 0 64 52",
    body: (
      <>
        <path d="M6 42 18 16M58 42 46 16" />
        <path d="M18 16Q32 8 46 16" />
        <path d="M24 16c0 14 16 14 16 0" />
        <path d="M28 18c0 8 8 8 8 0" />
      </>
    ),
  },
  "col-officier": {
    viewBox: "0 0 64 52",
    body: (
      <>
        <path d="M6 44 18 18M58 44 46 18" />
        <path d="M18 18Q32 12 46 18" />
        <path d="M26 20v-9h12v9" />
        <path d="M32 11v9" />
        <circle cx="32" cy="15" r="1.4" />
      </>
    ),
  },
  "col-bateau": {
    viewBox: "0 0 64 52",
    body: (
      <>
        <path d="M6 42 16 16M58 42 48 16" />
        <path d="M16 16Q32 10 48 16" />
        <path d="M16 18Q32 26 48 18" />
      </>
    ),
  },

  // --- Broderie (embroidery around the neckline) ---------------------------
  "brod-sans": {
    viewBox: "0 0 64 52",
    body: (
      <>
        <path d="M6 42 18 16M58 42 46 16" />
        <path d="M18 16Q32 8 46 16" />
        <path d="M23 18Q32 30 41 18" />
      </>
    ),
  },
  "brod-simple": {
    viewBox: "0 0 64 52",
    body: (
      <>
        <path d="M6 42 18 16M58 42 46 16" />
        <path d="M18 16Q32 8 46 16" />
        <path d="M23 18Q32 30 41 18" />
        <path d="M25 21Q32 32 39 21" />
      </>
    ),
  },
  "brod-riche": {
    viewBox: "0 0 64 52",
    body: (
      <>
        <path d="M6 42 18 16M58 42 46 16" />
        <path d="M18 16Q32 8 46 16" />
        <path d="M23 18Q32 30 41 18" />
        <path d="M25 21Q32 32 39 21" />
        <path d="M27 24Q32 33 37 24" />
        <circle cx="32" cy="30" r="0.9" />
        <circle cx="28" cy="27" r="0.9" />
        <circle cx="36" cy="27" r="0.9" />
      </>
    ),
  },
  "brod-doree": {
    viewBox: "0 0 64 52",
    body: (
      <>
        <path d="M6 42 18 16M58 42 46 16" />
        <path d="M18 16Q32 8 46 16" />
        <path d="M23 18Q32 30 41 18" />
        <path d="M26 22q2 5 6 5 4 0 6-5" />
        <path d="M28 26q2 3 4 0M32 30q2 3 4 0" />
        <circle cx="32" cy="34" r="1.2" />
      </>
    ),
  },

  // --- Manches (sleeves) ---------------------------------------------------
  "manche-longue": {
    viewBox: "0 0 48 64",
    body: (
      <>
        <path d="M14 8Q24 5 34 8" />
        <path d="M14 8 11 52M34 8l-3 44" />
        <path d="M11 52h20" />
        <path d="M12 46h18" />
      </>
    ),
  },
  "manche-courte": {
    viewBox: "0 0 48 64",
    body: (
      <>
        <path d="M12 8Q24 5 36 8" />
        <path d="M12 8 9 30M36 8l3 22" />
        <path d="M9 30h30" />
      </>
    ),
  },
  "manche-ample": {
    viewBox: "0 0 48 64",
    body: (
      <>
        <path d="M14 8Q24 5 34 8" />
        <path d="M14 8 4 50M34 8l10 42" />
        <path d="M4 50h40" />
        <path d="M12 30h24" />
      </>
    ),
  },
  "manche-sans": {
    viewBox: "0 0 48 64",
    body: (
      <>
        <path d="M14 8Q24 5 34 8" />
        <path d="M14 8Q10 16 14 22M34 8q4 8 0 14" />
        <path d="M14 22h20" />
      </>
    ),
  },
} satisfies Record<string, IconDef>;

export type StyleIconName = keyof typeof ICONS;

export function StyleIcon({
  name,
  className,
}: {
  name: StyleIconName;
  className?: string;
}) {
  const icon = ICONS[name];
  return (
    <svg
      viewBox={icon.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icon.body}
    </svg>
  );
}
