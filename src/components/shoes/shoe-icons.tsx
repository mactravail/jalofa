// Thin-outline line-art icons for the men's shoe configurator, in the same
// Hockerty aesthetic as `order/style-icons.tsx` and `women/dress-icons.tsx`.
// Grouped by the customisation sections shown on the "Personnaliser" page:
// modèle (base last), bout (toe), semelle (sole), doublure (lining) and
// finition (finish). Every stroke uses `currentColor` so the drawings follow
// the theme and dim/brighten with selection state. The big colour-reactive
// hero preview lives separately in `shoe-preview.tsx`.

import type { ReactNode } from "react";

type IconDef = { viewBox: string; body: ReactNode };

// A small right-facing low-shoe outline reused by several model / finish icons.
const LOW_OUTLINE = (
  <path d="M8 26C6 29 8 32 12 32L48 32C55 32 60 29 61 25C61 23 59 22 56 22C43 21 31 20 25 17C20 15 13 16 10 20Z" />
);

const ICONS = {
  // --- Modèle (base silhouette) --------------------------------------------
  "m-oxford": {
    viewBox: "0 0 64 40",
    body: (
      <>
        {LOW_OUTLINE}
        <path d="M26 20 40 25M40 19 26 24" />
        <path d="M30 17 44 22M44 17 30 22" />
      </>
    ),
  },
  "m-derby": {
    viewBox: "0 0 64 40",
    body: (
      <>
        {LOW_OUTLINE}
        <path d="M25 18Q30 22 30 27M45 20Q40 23 40 27" />
        <path d="M30 21 40 24M40 21 30 24" />
      </>
    ),
  },
  "m-monk": {
    viewBox: "0 0 64 40",
    body: (
      <>
        {LOW_OUTLINE}
        <path d="M28 16 48 25" />
        <path d="M34 17H40V22H34Z" />
      </>
    ),
  },
  "m-mocassin": {
    viewBox: "0 0 64 40",
    body: (
      <>
        {LOW_OUTLINE}
        <path d="M24 17Q40 14 56 22" />
        <path d="M33 16Q37 20 43 18" />
      </>
    ),
  },
  "m-brogue": {
    viewBox: "0 0 64 40",
    body: (
      <>
        {LOW_OUTLINE}
        <path d="M26 20 40 25M40 19 26 24" />
        <path d="M47 22Q43 27 47 31" />
        <circle cx="50" cy="24" r="0.9" />
        <circle cx="52" cy="27" r="0.9" />
        <circle cx="50" cy="30" r="0.9" />
      </>
    ),
  },
  "m-bottine": {
    viewBox: "0 0 64 40",
    body: (
      <>
        <path d="M8 26C6 29 8 32 12 32L48 32C55 32 60 29 61 25C61 23 59 22 56 22C47 21 41 20 39 17L39 7C31 5 22 5 16 7L16 22C13 22 10 23 8 26Z" />
        <path d="M39 12Q34 14 34 20" />
        <path d="M16 9Q27 7 39 9" />
      </>
    ),
  },

  // --- Bout (toe box, front profile) ---------------------------------------
  "t-droit": {
    viewBox: "0 0 48 40",
    body: (
      <path d="M6 30C4 24 8 14 20 12C34 10 44 16 44 26C44 30 40 32 34 32L12 32C8 32 6 31 6 30Z" />
    ),
  },
  "t-cap": {
    viewBox: "0 0 48 40",
    body: (
      <>
        <path d="M6 30C4 24 8 14 20 12C34 10 44 16 44 26C44 30 40 32 34 32L12 32C8 32 6 31 6 30Z" />
        <path d="M30 12Q32 22 32 32" />
      </>
    ),
  },
  "t-fleuri": {
    viewBox: "0 0 48 40",
    body: (
      <>
        <path d="M6 30C4 24 8 14 20 12C34 10 44 16 44 26C44 30 40 32 34 32L12 32C8 32 6 31 6 30Z" />
        <path d="M22 12Q18 22 20 32M32 11Q36 20 33 32" />
        <path d="M24 22 27 19 30 22" />
        <circle cx="25" cy="27" r="0.9" />
        <circle cx="28" cy="27" r="0.9" />
        <circle cx="26.5" cy="30" r="0.9" />
      </>
    ),
  },

  // --- Semelle (sole, side profile) ----------------------------------------
  "s-cuir": {
    viewBox: "0 0 56 32",
    body: (
      <>
        <path d="M6 16C6 13 11 11 20 11L46 11C51 11 53 13 52 16L50 18L8 18C6 18 6 17 6 16Z" />
        <path d="M8 18 7 24 15 24 16 18" />
      </>
    ),
  },
  "s-gomme": {
    viewBox: "0 0 56 32",
    body: (
      <>
        <path d="M6 15C6 12 11 10 20 10L46 10C51 10 54 13 53 17L52 20L7 20C5 20 5 18 6 15Z" />
        <path d="M9 20 8 25 16 25 17 20" />
        <circle cx="24" cy="18.5" r="1" />
        <circle cx="30" cy="18.5" r="1" />
        <circle cx="36" cy="18.5" r="1" />
        <circle cx="42" cy="18.5" r="1" />
      </>
    ),
  },
  "s-goodyear": {
    viewBox: "0 0 56 32",
    body: (
      <>
        <path d="M6 15C6 12 11 10 20 10L46 10C51 10 54 13 53 17L52 19L7 19C5 19 5 18 6 15Z" />
        <path strokeDasharray="2 2" d="M7 15 52 14" />
        <path d="M9 19 8 25 16 25 17 19" />
      </>
    ),
  },

  // --- Doublure (lining, collar opening) -----------------------------------
  "d-cuir": {
    viewBox: "0 0 48 40",
    body: (
      <>
        <ellipse cx="24" cy="20" rx="15" ry="11" />
        <ellipse cx="24" cy="20" rx="10" ry="7" />
      </>
    ),
  },
  "d-agneau": {
    viewBox: "0 0 48 40",
    body: (
      <>
        <ellipse cx="24" cy="20" rx="15" ry="11" />
        <path d="M16 20Q19 16 22 20T28 20T33 20" />
        <path d="M16 24Q19 20 22 24T28 24T33 24" />
      </>
    ),
  },
  "d-textile": {
    viewBox: "0 0 48 40",
    body: (
      <>
        <ellipse cx="24" cy="20" rx="15" ry="11" />
        <path d="M18 15 18 25M24 14 24 26M30 15 30 25" />
        <path d="M16 20 32 20" />
      </>
    ),
  },

  // --- Finition (finish, side profile) -------------------------------------
  "f-naturelle": {
    viewBox: "0 0 64 40",
    body: LOW_OUTLINE,
  },
  "f-patine": {
    viewBox: "0 0 64 40",
    body: (
      <>
        {LOW_OUTLINE}
        <path d="M46 22Q52 24 55 26M44 26Q50 27 54 29" />
      </>
    ),
  },
  "f-vernis": {
    viewBox: "0 0 64 40",
    body: (
      <>
        {LOW_OUTLINE}
        <path d="M44 20 46 24 50 26 46 28 44 32 42 28 38 26 42 24Z" />
      </>
    ),
  },
} satisfies Record<string, IconDef>;

export type ShoeIconName = keyof typeof ICONS;

export function ShoeIcon({
  name,
  className,
}: {
  name: ShoeIconName;
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
