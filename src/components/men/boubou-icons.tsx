// Thin-outline line-art icons for the men's three-piece grand boubou
// configurator, in the same Hockerty aesthetic as `order/style-icons.tsx` and
// `women/dress-icons.tsx`. Grouped by the sections shown on the
// "Grand boubou sur mesure → Personnaliser" page, across the three pieces:
// the grand boubou itself, the kaftan worn underneath and the trousers
// (tubay). Every stroke uses `currentColor` so the drawings follow the theme
// and dim/brighten with selection state.

import type { ReactNode } from "react";

type IconDef = { viewBox: string; body: ReactNode };

// Shared frames — a bust with sleeves (collar / embroidery / pocket views) and
// a pair of trousers (waist / hem / pocket views). Reused so the icons of a
// same group stay perfectly registered from one option to the next.
const BUST = (
  <>
    <path d="M22 12Q32 7 42 12" />
    <path d="M22 12v38h20V12" />
    <path d="M22 12 13 20l3 26 7-2" />
    <path d="M42 12l9 8-3 26-7-2" />
    <path d="M28 11Q32 17 36 11" />
  </>
);

const TORSO = (
  <>
    <path d="M22 12Q32 7 42 12" />
    <path d="M22 12 14 20M42 12l8 8" />
    <path d="M22 12v38h20V12" />
    <path d="M28 11Q32 17 36 11" />
  </>
);

const TROUSERS = (
  <>
    <path d="M20 6h24" />
    <path d="M20 6 17 52h11l4-24 4 24h11L44 6" />
  </>
);

// Shoulders + neckline used by every collar icon (bust view).
const SHOULDERS = (
  <>
    <path d="M8 44 20 18M56 44 44 18" />
    <path d="M20 18Q32 10 44 18" />
  </>
);

const ICONS = {
  // --- Type de grand boubou (full silhouettes) ------------------------------
  "gb-classique": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M18 18Q32 11 46 18" />
        <path d="M18 18 6 40l8 4-3 28h42l-3-28 8-4-8-22" />
        <path d="M27 16Q32 23 37 16" />
        <path d="M32 23v20" />
      </>
    ),
  },
  "gb-royal": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M18 18Q32 11 46 18" />
        <path d="M18 18 3 44l9 4-3 24h46l-3-24 9-4-15-26" />
        <path d="M27 16Q32 23 37 16" />
        <path d="M32 23v22" />
      </>
    ),
  },
  "gb-moderne": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M20 18Q32 12 44 18" />
        <path d="M20 18 10 40l6 3-2 29h36l-2-29 6-3-10-22" />
        <path d="M28 16Q32 22 36 16" />
        <path d="M32 22v20" />
      </>
    ),
  },
  "gb-court": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M18 18Q32 11 46 18" />
        <path d="M18 18 6 40l8 4-3 16h42l-3-16 8-4-8-22" />
        <path d="M27 16Q32 23 37 16" />
        <path d="M32 23v14" />
        <path d="M25 60v14M39 60v14" />
      </>
    ),
  },
  "gb-capuche": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M24 17q8-13 16 0" />
        <path d="M18 18Q32 11 46 18" />
        <path d="M18 18 6 40l8 4-3 28h42l-3-28 8-4-8-22" />
        <path d="M27 16Q32 23 37 16" />
        <path d="M32 23v20" />
      </>
    ),
  },

  // --- Cols (bust view) -----------------------------------------------------
  "col-rond": {
    viewBox: "0 0 64 52",
    body: (
      <>
        {SHOULDERS}
        <path d="M25 19Q32 31 39 19" />
      </>
    ),
  },
  "col-v": {
    viewBox: "0 0 64 52",
    body: (
      <>
        {SHOULDERS}
        <path d="M24 18 32 36 40 18" />
      </>
    ),
  },
  "col-mao": {
    viewBox: "0 0 64 52",
    body: (
      <>
        {SHOULDERS}
        <path d="M26 14v8h12v-8" />
        <path d="M26 22 32 28l6-6" />
        <path d="M32 28v14" />
      </>
    ),
  },
  "col-carre": {
    viewBox: "0 0 64 52",
    body: (
      <>
        {SHOULDERS}
        <path d="M26 18v12h12V18" />
      </>
    ),
  },
  "col-chale": {
    viewBox: "0 0 64 52",
    body: (
      <>
        {SHOULDERS}
        <path d="M24 16Q26 34 32 42Q38 34 40 16" />
        <path d="M27 17Q29 32 32 38Q35 32 37 17" />
      </>
    ),
  },
  "col-officier": {
    viewBox: "0 0 64 52",
    body: (
      <>
        {SHOULDERS}
        <path d="M26 12v10h12V12" />
        <circle cx="32" cy="17" r="1.2" />
        <path d="M32 22v20" />
      </>
    ),
  },

  // --- Broderie (bust view) -------------------------------------------------
  "br-sans": {
    viewBox: "0 0 64 60",
    body: BUST,
  },
  "br-simple": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {BUST}
        <path d="M32 18v16" />
        <path d="M28 23h8" />
      </>
    ),
  },
  "br-riche": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {BUST}
        <path d="M32 18v22" />
        <path d="M27 22h10M27 27h10M27 32h10" />
        <circle cx="32" cy="17" r="1" />
      </>
    ),
  },
  "br-doree": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {BUST}
        <path d="M32 18v18" />
        <path d="M26 23h12M26 29h12" />
        <path d="M32 39l1.4 2.8 2.8 1.4-2.8 1.4L32 47.4l-1.4-2.8-2.8-1.4 2.8-1.4z" />
      </>
    ),
  },
  "br-complete": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {BUST}
        <path d="M32 16v30" />
        <path d="M25 18h14M25 24h14M25 30h14M25 36h14M25 42h14" />
      </>
    ),
  },
  "br-col": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {BUST}
        <path d="M26 11Q32 20 38 11" />
      </>
    ),
  },
  "br-poignets": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {BUST}
        <path d="M26 11Q32 20 38 11" />
        <path d="M15 40l8-2M49 40l-8-2" />
      </>
    ),
  },
  "br-bas": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {TROUSERS}
        <path d="M18 44h9M37 44h9" />
        <path d="M18 48h9M37 48h9" />
      </>
    ),
  },
  "br-poches": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {TROUSERS}
        <path d="M20 14h8v10h-8z" />
        <path d="M36 14h8v10h-8z" />
        <path d="M22 19h4M38 19h4" />
      </>
    ),
  },

  // --- Type de couture (seam close-up) --------------------------------------
  "cu-machine": {
    viewBox: "0 0 64 40",
    body: (
      <>
        <path d="M6 14h52M6 26h52" />
        <path d="M12 20h4M20 20h4M28 20h4M36 20h4M44 20h4" />
      </>
    ),
  },
  "cu-anglaise": {
    viewBox: "0 0 64 40",
    body: (
      <>
        <path d="M6 12h52M6 28h52" />
        <path d="M12 17h4M20 17h4M28 17h4M36 17h4M44 17h4" />
        <path d="M12 23h4M20 23h4M28 23h4M36 23h4M44 23h4" />
      </>
    ),
  },
  "cu-surpiquee": {
    viewBox: "0 0 64 40",
    body: (
      <>
        <path d="M6 12h52M6 28h52" />
        <path d="M6 20h52" />
        <path d="M11 16h5M21 16h5M31 16h5M41 16h5" />
      </>
    ),
  },
  "cu-main": {
    viewBox: "0 0 64 40",
    body: (
      <>
        <path d="M6 14h52M6 26h52" />
        <path d="M12 22l4-4M20 22l4-4M28 22l4-4M36 22l4-4M44 22l4-4" />
      </>
    ),
  },

  // --- Longueur du boubou ---------------------------------------------------
  "lo-cheville": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M20 16Q32 10 44 16" />
        <path d="M20 16 10 38l6 3-3 29h38l-3-29 6-3-10-22" />
        <path d="M26 70v4M38 70v4" />
      </>
    ),
  },
  "lo-mollet": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M20 16Q32 10 44 16" />
        <path d="M20 16 10 38l6 3-3 17h38l-3-17 6-3-10-22" />
        <path d="M26 58v16M38 58v16" />
      </>
    ),
  },
  "lo-genou": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M20 16Q32 10 44 16" />
        <path d="M20 16 10 38l6 3-3 7h38l-3-7 6-3-10-22" />
        <path d="M26 48v26M38 48v26" />
      </>
    ),
  },

  // --- Poches du boubou (torso view) ----------------------------------------
  "po-poitrine": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {TORSO}
        <path d="M33 22h7v8h-7z" />
      </>
    ),
  },
  "po-laterales": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {TORSO}
        <path d="M23 34l5 4M41 34l-5 4" />
      </>
    ),
  },
  "po-sans": {
    viewBox: "0 0 64 60",
    body: TORSO,
  },

  // --- Type de kaftan intérieur (full silhouettes) --------------------------
  "in-droit": {
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
  "in-cintre": {
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
  "in-chemise": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M20 18 14 42M44 18l6 24" />
        <path d="M20 18v40h24V18" />
        <path d="M26 14v6h12v-6" />
        <path d="M26 20 32 26l6-6" />
        <path d="M32 26v30" />
        <circle cx="32" cy="34" r="1" />
        <circle cx="32" cy="44" r="1" />
      </>
    ),
  },
  "in-tunique": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M20 18Q32 12 44 18" />
        <path d="M20 18 14 40M44 18l6 22" />
        <path d="M20 18v30h24V18" />
        <path d="M28 15Q32 21 36 15" />
        <path d="M32 21v20" />
      </>
    ),
  },

  // --- Manches --------------------------------------------------------------
  "ma-longues": {
    viewBox: "0 0 64 60",
    body: (
      <>
        <path d="M24 11Q32 8 40 11" />
        <path d="M24 11v41h16V11" />
        <path d="M24 11 14 20l4 28 7-2" />
        <path d="M40 11l10 9-4 28-7-2" />
        <path d="M28 10Q32 15 36 10" />
      </>
    ),
  },
  "ma-troisquarts": {
    viewBox: "0 0 64 60",
    body: (
      <>
        <path d="M24 11Q32 8 40 11" />
        <path d="M24 11v41h16V11" />
        <path d="M24 11 14 20l3 18 8-2" />
        <path d="M40 11l10 9-3 18-8-2" />
        <path d="M28 10Q32 15 36 10" />
      </>
    ),
  },
  "ma-courtes": {
    viewBox: "0 0 64 60",
    body: (
      <>
        <path d="M24 11Q32 8 40 11" />
        <path d="M24 11v41h16V11" />
        <path d="M24 11 16 18l2 10 7-2" />
        <path d="M40 11l8 7-2 10-7-2" />
        <path d="M28 10Q32 15 36 10" />
      </>
    ),
  },

  // --- Fermeture ------------------------------------------------------------
  "fe-boutons": {
    viewBox: "0 0 64 60",
    body: (
      <>
        <path d="M24 10Q32 6 40 10" />
        <path d="M24 10v42h16V10" />
        <path d="M32 12v40" />
        <circle cx="32" cy="20" r="1.3" />
        <circle cx="32" cy="30" r="1.3" />
        <circle cx="32" cy="40" r="1.3" />
      </>
    ),
  },
  "fe-sans": {
    viewBox: "0 0 64 60",
    body: (
      <>
        <path d="M24 10Q32 6 40 10" />
        <path d="M24 10v42h16V10" />
        <path d="M28 9Q32 15 36 9" />
      </>
    ),
  },
  "fe-zip": {
    viewBox: "0 0 64 60",
    body: (
      <>
        <path d="M24 10Q32 6 40 10" />
        <path d="M24 10v42h16V10" />
        <path d="M32 12v28" />
        <path d="M30 18h4M30 22h4M30 26h4M30 30h4M30 34h4" />
        <path d="M31 40h2v6h-2z" />
      </>
    ),
  },

  // --- Coupe du pantalon ----------------------------------------------------
  "pa-tubay": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M18 14h28" />
        <path d="M18 14 8 68h18l6-28 6 28h18L46 14" />
        <path d="M32 14v26" />
      </>
    ),
  },
  "pa-droit": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M20 14h24" />
        <path d="M20 14 17 68h11l4-28 4 28h11L44 14" />
        <path d="M32 14v26" />
      </>
    ),
  },
  "pa-ajuste": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M20 14h24" />
        <path d="M20 14 21 68h9l2-28 2 28h9l1-54" />
        <path d="M32 14v26" />
      </>
    ),
  },
  "pa-sarouel": {
    viewBox: "0 0 64 80",
    body: (
      <>
        <path d="M18 14h28" />
        <path d="M18 14 13 48q0 7 7 8l1 12h9l2-22" />
        <path d="M46 14 51 48q0 7-7 8l-1 12h-9l-2-22" />
        <path d="M32 14v32" />
      </>
    ),
  },

  // --- Ceinture (waistband close-up) ----------------------------------------
  "ta-cordon": {
    viewBox: "0 0 64 40",
    body: (
      <>
        <path d="M8 12h48v12H8z" />
        <circle cx="28" cy="18" r="1" />
        <circle cx="36" cy="18" r="1" />
        <path d="M28 24q-4 6-10 8M36 24q4 6 10 8" />
      </>
    ),
  },
  "ta-elastique": {
    viewBox: "0 0 64 40",
    body: (
      <>
        <path d="M8 12h48v12H8z" />
        <path d="M14 14v8M20 14v8M26 14v8M32 14v8M38 14v8M44 14v8M50 14v8" />
      </>
    ),
  },
  "ta-boutonnee": {
    viewBox: "0 0 64 40",
    body: (
      <>
        <path d="M8 14h48v10H8z" />
        <circle cx="32" cy="19" r="1.5" />
        <path d="M16 12v14M48 12v14" />
      </>
    ),
  },

  // --- Bas de jambe (hem close-up) ------------------------------------------
  "ba-simple": {
    viewBox: "0 0 64 40",
    body: (
      <>
        <path d="M20 6 18 34M44 6l2 28" />
        <path d="M18 34h28" />
        <path d="M18 27h28" />
      </>
    ),
  },
  "ba-resserre": {
    viewBox: "0 0 64 40",
    body: (
      <>
        <path d="M20 6 26 34M44 6l-6 28" />
        <path d="M26 34h12" />
        <path d="M25 27h14" />
      </>
    ),
  },
  "ba-ouvert": {
    viewBox: "0 0 64 40",
    body: (
      <>
        <path d="M22 6 14 34M42 6l8 28" />
        <path d="M14 34h36" />
        <path d="M16 27h32" />
      </>
    ),
  },

  // --- Poches du pantalon ---------------------------------------------------
  "pp-laterales": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {TROUSERS}
        <path d="M21 12l4 8M43 12l-4 8" />
      </>
    ),
  },
  "pp-arriere": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {TROUSERS}
        <path d="M21 12l4 8M43 12l-4 8" />
        <path d="M24 26h7M33 26h7" />
      </>
    ),
  },
  "pp-sans": {
    viewBox: "0 0 64 60",
    body: TROUSERS,
  },
} satisfies Record<string, IconDef>;

export type BoubouIconName = keyof typeof ICONS;

export function BoubouIcon({
  name,
  className,
}: {
  name: BoubouIconName;
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
