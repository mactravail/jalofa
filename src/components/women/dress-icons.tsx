// Thin-outline line-art icons for the women's dress configurator, in the same
// Hockerty/Sumissura aesthetic as `order/style-icons.tsx`. Grouped by the
// customisation sections shown on the "Personnaliser" page: encolure (neckline),
// manches (sleeves), silhouette, longueur (length), fermeture (closure),
// doublure (lining) and finitions (details). Every stroke uses `currentColor`
// so the drawings follow the theme and dim/brighten with selection state.

import type { ReactNode } from "react";

type IconDef = { viewBox: string; body: ReactNode };

const ICONS = {
  // --- Encolure (neckline — bust view) -------------------------------------
  "nl-rond": {
    viewBox: "0 0 64 52",
    body: (
      <>
        <path d="M6 42 18 16M58 42 46 16" />
        <path d="M18 16Q32 8 46 16" />
        <path d="M23 18Q32 30 41 18" />
      </>
    ),
  },
  "nl-v": {
    viewBox: "0 0 64 52",
    body: (
      <>
        <path d="M6 42 18 16M58 42 46 16" />
        <path d="M18 16Q32 8 46 16" />
        <path d="M22 16 32 34 42 16" />
      </>
    ),
  },
  "nl-bateau": {
    viewBox: "0 0 64 52",
    body: (
      <>
        <path d="M6 42 18 16M58 42 46 16" />
        <path d="M18 16Q32 8 46 16" />
        <path d="M19 16Q32 22 45 16" />
      </>
    ),
  },
  "nl-coeur": {
    viewBox: "0 0 64 52",
    body: (
      <>
        <path d="M6 42 18 16M58 42 46 16" />
        <path d="M18 16Q32 8 46 16" />
        <path d="M23 17Q28 27 32 22Q36 27 41 17" />
      </>
    ),
  },
  "nl-carre": {
    viewBox: "0 0 64 52",
    body: (
      <>
        <path d="M6 42 18 16M58 42 46 16" />
        <path d="M18 16Q32 8 46 16" />
        <path d="M24 16 24 28 40 28 40 16" />
      </>
    ),
  },

  // --- Manches (sleeves — torso view) --------------------------------------
  "sl-sans": {
    viewBox: "0 0 64 60",
    body: (
      <>
        <path d="M28 10Q32 14 36 10" />
        <path d="M24 11Q32 8 40 11" />
        <path d="M24 11 24 52M40 11 40 52M24 52H40" />
        <path d="M24 11Q22 15 24 20M40 11Q42 15 40 20" />
      </>
    ),
  },
  "sl-courtes": {
    viewBox: "0 0 64 60",
    body: (
      <>
        <path d="M28 10Q32 14 36 10" />
        <path d="M24 11Q32 8 40 11" />
        <path d="M24 11 24 52M40 11 40 52M24 52H40" />
        <path d="M24 11 15 17 19 27 24 22M40 11 49 17 45 27 40 22" />
      </>
    ),
  },
  "sl-troisquarts": {
    viewBox: "0 0 64 60",
    body: (
      <>
        <path d="M28 10Q32 14 36 10" />
        <path d="M24 11Q32 8 40 11" />
        <path d="M24 11 24 52M40 11 40 52M24 52H40" />
        <path d="M24 11 14 18 18 41 24 36M40 11 50 18 46 41 40 36" />
      </>
    ),
  },
  "sl-longues": {
    viewBox: "0 0 64 60",
    body: (
      <>
        <path d="M28 10Q32 14 36 10" />
        <path d="M24 11Q32 8 40 11" />
        <path d="M24 11 24 52M40 11 40 52M24 52H40" />
        <path d="M24 11 13 17 16 52 24 47M40 11 51 17 48 52 40 47" />
      </>
    ),
  },
  "sl-ballon": {
    viewBox: "0 0 64 60",
    body: (
      <>
        <path d="M28 10Q32 14 36 10" />
        <path d="M24 11Q32 8 40 11" />
        <path d="M24 11 24 52M40 11 40 52M24 52H40" />
        <path d="M24 11Q11 13 15 28Q20 24 24 24M40 11Q53 13 49 28Q44 24 40 24" />
      </>
    ),
  },
  "sl-volantees": {
    viewBox: "0 0 64 60",
    body: (
      <>
        <path d="M28 10Q32 14 36 10" />
        <path d="M24 11Q32 8 40 11" />
        <path d="M24 11 24 52M40 11 40 52M24 52H40" />
        <path d="M24 11 15 15Q8 30 19 34L24 25M40 11 49 15Q56 30 45 34L40 25" />
        <path d="M11 33Q15 37 19 33" />
        <path d="M45 33Q49 37 53 33" />
      </>
    ),
  },

  // --- Silhouette (full dress) ---------------------------------------------
  "si-ajustee": {
    viewBox: "0 0 64 96",
    body: (
      <>
        <path d="M29 11Q32 15 35 11" />
        <path d="M26 12Q32 9 38 12" />
        <path d="M26 12Q22 16 22 21M38 12Q42 16 42 21" />
        <path d="M26 12 24 84H40L38 12" />
      </>
    ),
  },
  "si-fourreau": {
    viewBox: "0 0 64 96",
    body: (
      <>
        <path d="M29 11Q32 15 35 11" />
        <path d="M26 12Q32 9 38 12" />
        <path d="M26 12Q22 16 22 21M38 12Q42 16 42 21" />
        <path d="M26 12Q23 46 27 84H37Q41 46 38 12" />
      </>
    ),
  },
  "si-evasee": {
    viewBox: "0 0 64 96",
    body: (
      <>
        <path d="M29 11Q32 15 35 11" />
        <path d="M26 12Q32 9 38 12" />
        <path d="M26 12Q22 16 22 21M38 12Q42 16 42 21" />
        <path d="M26 12 27 42 16 84H48L37 42 38 12" />
      </>
    ),
  },
  "si-trapeze": {
    viewBox: "0 0 64 96",
    body: (
      <>
        <path d="M29 11Q32 15 35 11" />
        <path d="M26 12Q32 9 38 12" />
        <path d="M26 12Q22 16 22 22M38 12Q42 16 42 22" />
        <path d="M26 12 13 84H51L38 12" />
      </>
    ),
  },
  "si-empire": {
    viewBox: "0 0 64 96",
    body: (
      <>
        <path d="M29 11Q32 15 35 11" />
        <path d="M26 12Q32 9 38 12" />
        <path d="M26 12Q22 16 22 21M38 12Q42 16 42 21" />
        <path d="M26 12 27 30M38 12 37 30" />
        <path d="M27 30H37" />
        <path d="M27 30 16 84H48L37 30" />
      </>
    ),
  },
  "si-patineuse": {
    viewBox: "0 0 64 96",
    body: (
      <>
        <path d="M29 11Q32 15 35 11" />
        <path d="M26 12Q32 9 38 12" />
        <path d="M26 12Q22 16 22 21M38 12Q42 16 42 21" />
        <path d="M26 12 27 44M38 12 37 44" />
        <path d="M27 44Q13 62 15 84Q32 90 49 84Q51 62 37 44" />
      </>
    ),
  },

  // --- Longueur (length — figure with hemline) -----------------------------
  "lg-mini": {
    viewBox: "0 0 48 96",
    body: (
      <>
        <path d="M21 9Q24 12 27 9" />
        <path d="M17 10Q24 7 31 10" />
        <path d="M17 10 15 42M31 10 33 42M15 42H33" />
        <path d="M20 42 20 90M28 42 28 90" />
        <path d="M16 90H21M27 90H32" />
      </>
    ),
  },
  "lg-genou": {
    viewBox: "0 0 48 96",
    body: (
      <>
        <path d="M21 9Q24 12 27 9" />
        <path d="M17 10Q24 7 31 10" />
        <path d="M17 10 14 56M31 10 34 56M14 56H34" />
        <path d="M20 56 20 90M28 56 28 90" />
        <path d="M16 90H21M27 90H32" />
      </>
    ),
  },
  "lg-midi": {
    viewBox: "0 0 48 96",
    body: (
      <>
        <path d="M21 9Q24 12 27 9" />
        <path d="M17 10Q24 7 31 10" />
        <path d="M17 10 13 72M31 10 35 72M13 72H35" />
        <path d="M21 72 21 90M27 72 27 90" />
        <path d="M17 90H22M26 90H31" />
      </>
    ),
  },
  "lg-cheville": {
    viewBox: "0 0 48 96",
    body: (
      <>
        <path d="M21 9Q24 12 27 9" />
        <path d="M17 10Q24 7 31 10" />
        <path d="M17 10 12 86M31 10 36 86M12 86H36" />
        <path d="M18 86H23M25 86H30" />
      </>
    ),
  },
  "lg-longue": {
    viewBox: "0 0 48 96",
    body: (
      <>
        <path d="M21 9Q24 12 27 9" />
        <path d="M17 10Q24 7 31 10" />
        <path d="M17 10 11 93M31 10 37 93M11 93H37" />
      </>
    ),
  },

  // --- Fermeture (closure — back view) -------------------------------------
  "cl-zip-dos": {
    viewBox: "0 0 48 76",
    body: (
      <>
        <path d="M18 9Q24 13 30 9" />
        <path d="M13 8Q24 6 35 8" />
        <path d="M13 8 11 66M35 8 37 66M11 66H37" />
        <path d="M24 13 24 62" />
        <path d="M22 13H26V17H22Z" />
      </>
    ),
  },
  "cl-zip-cote": {
    viewBox: "0 0 48 76",
    body: (
      <>
        <path d="M18 9Q24 13 30 9" />
        <path d="M13 8Q24 6 35 8" />
        <path d="M13 8 11 66M35 8 37 66M11 66H37" />
        <path d="M33 16 33 60" />
        <path d="M31 16H35V19H31Z" />
      </>
    ),
  },
  "cl-boutons": {
    viewBox: "0 0 48 76",
    body: (
      <>
        <path d="M18 9Q24 13 30 9" />
        <path d="M13 8Q24 6 35 8" />
        <path d="M13 8 11 66M35 8 37 66M11 66H37" />
        <path d="M24 14 24 62" />
        <circle cx="24" cy="20" r="1.6" />
        <circle cx="24" cy="32" r="1.6" />
        <circle cx="24" cy="44" r="1.6" />
        <circle cx="24" cy="56" r="1.6" />
      </>
    ),
  },
  "cl-lacage": {
    viewBox: "0 0 48 76",
    body: (
      <>
        <path d="M18 9Q24 13 30 9" />
        <path d="M13 8Q24 6 35 8" />
        <path d="M13 8 11 66M35 8 37 66M11 66H37" />
        <path d="M20 16 20 60M28 16 28 60" />
        <path d="M20 20 28 26M28 20 20 26M20 30 28 36M28 30 20 36M20 40 28 46M28 40 20 46M20 50 28 56M28 50 20 56" />
      </>
    ),
  },

  // --- Doublure (lining — fabric swatch) -----------------------------------
  "dl-sans": {
    viewBox: "0 0 56 56",
    body: (
      <>
        <path strokeDasharray="3 3" d="M14 14H42V42H14Z" />
        <path d="M16 40 40 16" />
      </>
    ),
  },
  "dl-coton": {
    viewBox: "0 0 56 56",
    body: (
      <>
        <path d="M14 14H42V42H14Z" />
        <path d="M32 14V24H42" />
        <path d="M14 24H30M14 32H30" />
      </>
    ),
  },
  "dl-soie": {
    viewBox: "0 0 56 56",
    body: (
      <>
        <path d="M14 14H42V42H14Z" />
        <path d="M16 40Q30 20 42 17" />
        <path d="M20 42Q34 28 42 25" />
      </>
    ),
  },

  // --- Finitions (details) -------------------------------------------------
  "fn-sans": {
    viewBox: "0 0 64 88",
    body: (
      <>
        <path d="M29 11Q32 15 35 11" />
        <path d="M26 12Q32 9 38 12" />
        <path d="M26 12Q22 16 22 20M38 12Q42 16 42 20" />
        <path d="M26 12 18 80H46L38 12" />
      </>
    ),
  },
  "fn-ceinture": {
    viewBox: "0 0 64 88",
    body: (
      <>
        <path d="M29 11Q32 15 35 11" />
        <path d="M26 12Q32 9 38 12" />
        <path d="M26 12Q22 16 22 20M38 12Q42 16 42 20" />
        <path d="M26 12 18 80H46L38 12" />
        <path d="M23 44H41" />
        <path d="M30 42H34V47H30Z" />
      </>
    ),
  },
  "fn-poches": {
    viewBox: "0 0 64 88",
    body: (
      <>
        <path d="M29 11Q32 15 35 11" />
        <path d="M26 12Q32 9 38 12" />
        <path d="M26 12Q22 16 22 20M38 12Q42 16 42 20" />
        <path d="M26 12 18 80H46L38 12" />
        <path d="M23 46V56H30V47M41 46V56H34V47" />
      </>
    ),
  },
  "fn-fente": {
    viewBox: "0 0 64 88",
    body: (
      <>
        <path d="M29 11Q32 15 35 11" />
        <path d="M26 12Q32 9 38 12" />
        <path d="M26 12Q22 16 22 20M38 12Q42 16 42 20" />
        <path d="M26 12 18 80H46L38 12" />
        <path d="M32 58 32 80" />
      </>
    ),
  },
  "fn-volant": {
    viewBox: "0 0 64 88",
    body: (
      <>
        <path d="M29 11Q32 15 35 11" />
        <path d="M26 12Q32 9 38 12" />
        <path d="M26 12Q22 16 22 20M38 12Q42 16 42 20" />
        <path d="M26 12 21 74M38 12 43 74" />
        <path d="M21 74H43" />
        <path d="M18 74Q22 82 26 75Q30 82 34 75Q38 82 42 75Q45 80 46 74" />
      </>
    ),
  },
} satisfies Record<string, IconDef>;

export type DressIconName = keyof typeof ICONS;

export function DressIcon({
  name,
  className,
}: {
  name: DressIconName;
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
