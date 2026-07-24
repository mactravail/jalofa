// Family-aware detail drawings for the "Style" step (Col · Broderie · Manches).
//
// The Coupe group already draws each garment's own silhouette (see
// `style-icons.tsx`). The finishing groups used to share ONE generic neckline /
// sleeve sketch, so a boubou collar looked exactly like a costume collar. Here
// each collar / embroidery / sleeve is instead composed onto the *bust of the
// chosen garment's family*: the same "Col V" reads as a wide draped V on a
// grand boubou, a notch lapel on a costume, and a soft feminine V on a robe.
//
// Everything is thin-outline `currentColor` line-art (monochrome design system),
// built by composition — one bust per family + one overlay per option — rather
// than hand-drawing every family × option combination.

import type { ReactNode } from "react";

import { garmentStyleKey } from "@/lib/style-options";
import type { GarmentModel } from "@/lib/types";

// ---------------------------------------------------------------------------
// Families — the torso archetype a garment's collar / sleeve is drawn on.
// ---------------------------------------------------------------------------

export type DetailFamily =
  | "flowing" // grand boubou, agbada, grande robe : épaules larges tombantes, encolure ample
  | "tunic" //   kaftan, dashiki, ensemble bazin : tunique droite à plastron
  | "shirt" //   chemise : empiècement + patte boutonnée
  | "tailored" // costume, veste, gilet, tailleur : épaules structurées, revers
  | "fitted"; //  robe, ensembles femme : épaules étroites, buste cintré

// Every configurable garment → its bust archetype, keyed like the style
// catalogue (par slug, cf. `style-options.ts`). Bottoms (jupe, pantalon,
// thiaya) never reach these groups, so they are intentionally absent.
const FAMILY_BY_SLUG: Record<string, DetailFamily> = {
  "grand-boubou": "flowing",
  "agbada": "flowing",
  "tenue-ceremonie": "flowing",
  "baye-lahat": "flowing",
  "boubou-femme": "flowing",
  "grande-robe": "flowing",
  "ceremonie-femme": "flowing",

  "kaftan": "tunic",
  "kaftan-brode": "tunic",
  "ensemble-bazin": "tunic",
  "dashiki": "tunic",
  "boubou-enfant": "tunic",
  "ensemble-enfant": "tunic",

  "chemise": "shirt",
  "chemise-femme": "shirt",

  "costume": "tailored",
  "costume-africain": "tailored",
  "veste-africaine": "tailored",
  "gilet": "tailored",
  "gilet-femme": "tailored",
  "tailleur-pantalon": "tailored",
  "veste-femme": "tailored",

  "robe": "fitted",
  "robe-soiree": "fitted",
  "robe-coupee": "fitted",
  "ensemble": "fitted",
  "bureau-femme": "fitted",
  "thiaya-femme": "fitted",
};

/** Bust archetype for a model — unknown garments fall back to a plain tunic. */
export function detailFamilyFor(model: GarmentModel | null | undefined): DetailFamily {
  const key = garmentStyleKey(model);
  if (!key) return "tunic";
  return FAMILY_BY_SLUG[key] ?? "tunic";
}

// ---------------------------------------------------------------------------
// Bust archetypes — shoulders + torso, WITHOUT the neck opening (each collar
// carves its own neckline). `nh`/`ny` are the neck-opening anchor (half-width,
// y); `breakY` is how deep a V / shawl lapel plunges on this garment.
// ---------------------------------------------------------------------------

type Bust = { nh: number; ny: number; breakY: number; body: ReactNode };

const BUSTS: Record<DetailFamily, Bust> = {
  // Wide, soft-sloping shoulders and an ample neck — the grand-boubou drape.
  flowing: {
    nh: 9,
    ny: 16,
    breakY: 30,
    body: (
      <>
        <path d="M23 16C16 15 11 19 7 26" />
        <path d="M41 16c7-1 12 3 16 10" />
        <path d="M7 26 6 58" />
        <path d="M57 26 58 58" />
        <path d="M18 31c1 13 0 20-1 26" strokeWidth={1.1} />
        <path d="M46 31c-1 13 0 20 1 26" strokeWidth={1.1} />
      </>
    ),
  },
  // Straight tunic with a vertical front placket (embroidery channel).
  tunic: {
    nh: 7,
    ny: 15,
    breakY: 27,
    body: (
      <>
        <path d="M25 15C19 15 14 18 10 24" />
        <path d="M39 15c6 0 11 3 15 9" />
        <path d="M10 24 11 58" />
        <path d="M54 24 53 58" />
        <path d="M32 21 32 58" strokeWidth={1.1} />
        <path d="M29 31h6M29 39h6" strokeWidth={1} />
      </>
    ),
  },
  // Shirt: yoke curve across the chest + buttoned placket.
  shirt: {
    nh: 6,
    ny: 15,
    breakY: 27,
    body: (
      <>
        <path d="M26 15C20 15 15 18 11 24" />
        <path d="M38 15c6 0 11 3 15 9" />
        <path d="M11 24 12 58" />
        <path d="M53 24 52 58" />
        <path d="M32 24 32 58" strokeWidth={1.1} />
        <circle cx="32" cy="32" r="0.9" />
        <circle cx="32" cy="40" r="0.9" />
        <circle cx="32" cy="48" r="0.9" />
      </>
    ),
  },
  // Tailored: straight structured shoulders. The jacket front + buttons are
  // drawn by `tailoredFrontNode`, anchored to each collar's own break, so a
  // notch lapel and a Nehru band both get a plausible closure.
  tailored: {
    nh: 6,
    ny: 16,
    breakY: 40,
    body: (
      <>
        <path d="M26 16 9 23" />
        <path d="M38 16 55 23" />
        <path d="M9 23 11 58" />
        <path d="M55 23 53 58" />
      </>
    ),
  },
  // Fitted feminine bust: narrow shoulders, waist taken in, soft bust line.
  fitted: {
    nh: 6,
    ny: 16,
    breakY: 29,
    body: (
      <>
        <path d="M26 16C21 16 17 19 14 25" />
        <path d="M38 16c4 0 9 3 12 9" />
        <path d="M14 25C16 38 15 46 19 58" />
        <path d="M50 25c-2 13-1 21-5 33" />
        <path d="M24 34Q32 40 40 34" strokeWidth={1} />
      </>
    ),
  },
};

// ---------------------------------------------------------------------------
// Collar overlays — drawn between the bust's neck anchors, so they sit on the
// right shoulders for every family.
// ---------------------------------------------------------------------------

function collarNode(variant: string, b: Bust): ReactNode {
  const { nh, ny, breakY } = b;
  const L = 32 - nh;
  const R = 32 + nh;
  const mid = (ny + breakY) / 2;

  switch (variant) {
    case "v":
      return (
        <>
          <path d={`M${L} ${ny}L32 ${breakY}L${R} ${ny}`} />
          <path d={`M${L + 2.5} ${ny}L32 ${breakY - 3}L${R - 2.5} ${ny}`} strokeWidth={1.1} />
        </>
      );
    case "bateau":
      return (
        <>
          <path d={`M${L} ${ny}Q32 ${ny + 3} ${R} ${ny}`} />
          <path d={`M${L} ${ny}Q32 ${ny - 3} ${R} ${ny}`} />
          <path d={`M${L} ${ny}h-3M${R} ${ny}h3`} strokeWidth={1.1} />
        </>
      );
    case "mao":
      return (
        <>
          <path d={`M${L} ${ny}Q32 ${ny + 5} ${R} ${ny}`} />
          <path d={`M${L} ${ny}L${L} ${ny - 5}Q32 ${ny - 2} ${R} ${ny - 5}L${R} ${ny}`} />
          <path d={`M32 ${ny - 4}v7`} strokeWidth={1.1} />
        </>
      );
    case "officier":
      return (
        <>
          <path d={`M${L} ${ny}L${L} ${ny - 7}Q32 ${ny - 4} ${R} ${ny - 7}L${R} ${ny}`} />
          <path d={`M${L + 1} ${ny - 1}Q32 ${ny + 3} ${R - 1} ${ny - 1}`} strokeWidth={1.1} />
          <circle cx="32" cy={ny - 4} r="1.2" />
        </>
      );
    case "chale":
      return (
        <>
          <path d={`M${L - 1} ${ny - 2}Q${L - 6} ${mid} 32 ${breakY}`} />
          <path d={`M${R + 1} ${ny - 2}Q${R + 6} ${mid} 32 ${breakY}`} />
          <path d={`M${L + 2} ${ny}Q${L - 1} ${mid} 32 ${breakY - 3}`} strokeWidth={1.1} />
          <path d={`M${R - 2} ${ny}Q${R + 1} ${mid} 32 ${breakY - 3}`} strokeWidth={1.1} />
        </>
      );
    case "rond":
    default:
      return (
        <>
          <path d={`M${L} ${ny}Q32 ${ny + 8} ${R} ${ny}`} />
          <path d={`M${L + 2} ${ny + 2}Q32 ${ny + 6} ${R - 2} ${ny + 2}`} strokeWidth={1.1} />
        </>
      );
  }
}

// Jacket front for the `tailored` family — a centred closure with two buttons,
// starting just under whatever collar was chosen so nothing floats.
function tailoredFrontNode(variant: string, ny: number, breakY: number): ReactNode {
  const top =
    variant === "v" || variant === "chale"
      ? breakY
      : variant === "officier"
        ? ny
        : variant === "mao"
          ? ny + 5
          : variant === "bateau"
            ? ny + 1
            : ny + 8; // rond
  const b1 = Math.max(top + 6, 44);
  return (
    <>
      <path d={`M32 ${top}V58`} strokeWidth={1.1} />
      <circle cx="32" cy={b1} r="0.9" />
      <circle cx="32" cy={b1 + 7} r="0.9" />
    </>
  );
}

// ---------------------------------------------------------------------------
// Embroidery overlays — the family's own neckline/placket, dressed with a
// stitch density that grows sans → simple → riche → dorée.
// ---------------------------------------------------------------------------

function broderieNode(variant: string, family: DetailFamily, b: Bust): ReactNode {
  const rows = variant === "sans" ? 0 : variant === "simple" ? 1 : variant === "riche" ? 2 : 3;
  const beads = variant === "doree";
  const { nh, ny } = b;
  const L = 32 - nh;
  const R = 32 + nh;

  // Placket-run garments (tunic / shirt): embroidery climbs the front placket.
  if (family === "tunic" || family === "shirt") {
    const stitches: ReactNode[] = [];
    for (let i = 0; i < rows; i++) {
      const dx = 3 + i * 1.6;
      // Parallel vertical rows climbing the placket (not converging to a point).
      stitches.push(
        <path
          key={`p${i}`}
          d={`M${32 - dx} ${ny + 4}V54M${32 + dx} ${ny + 4}V54`}
          strokeWidth={1}
        />,
      );
    }
    return (
      <>
        <path d={`M${L} ${ny}Q32 ${ny + 6} ${R} ${ny}`} />
        {stitches}
        {rows >= 2 &&
          [0, 1, 2, 3].map((i) => (
            <path key={`r${i}`} d={`M28 ${ny + 8 + i * 8}h8`} strokeWidth={0.9} />
          ))}
        {beads &&
          [0, 1, 2, 3].map((i) => <circle key={`b${i}`} cx="32" cy={ny + 10 + i * 9} r="0.9" />)}
      </>
    );
  }

  // Tailored: an open lapel + jacket front, with discreet stitching tracing the
  // lapel edge only.
  if (family === "tailored") {
    return (
      <>
        <path d={`M${L} ${ny}L32 ${b.breakY}L${R} ${ny}`} />
        <path d={`M32 ${b.breakY}V58`} strokeWidth={1.1} />
        <circle cx="32" cy="47" r="0.9" />
        <circle cx="32" cy="53" r="0.9" />
        {rows >= 1 && <path d={`M${L + 3} ${ny}L32 ${b.breakY - 4}L${R - 3} ${ny}`} strokeWidth={1} />}
        {beads && [0, 1].map((i) => <circle key={i} cx="35" cy={b.breakY + 3 + i * 6} r="0.8" />)}
      </>
    );
  }

  // Flowing / fitted: a round neckline framed by embroidery — a piped binding
  // (simple), a "sfifa" chest panel with rungs (riche), then beads (dorée).
  const panelBottom = family === "flowing" ? ny + 32 : ny + 24;
  const rungs: number[] = [];
  for (let y = ny + 15; y < panelBottom - 1; y += 5) rungs.push(y);
  return (
    <>
      <path d={`M${L} ${ny}Q32 ${ny + 8} ${R} ${ny}`} />
      {rows >= 1 && (
        <path d={`M${L + 1} ${ny + 2}Q32 ${ny + 13} ${R - 1} ${ny + 2}`} strokeWidth={1} />
      )}
      {rows >= 2 && (
        <>
          <path d={`M29 ${ny + 12}V${panelBottom}`} strokeWidth={1} />
          <path d={`M35 ${ny + 12}V${panelBottom}`} strokeWidth={1} />
          {rungs.map((y) => (
            <path key={`r${y}`} d={`M29 ${y}H35`} strokeWidth={0.9} />
          ))}
        </>
      )}
      {beads && rungs.map((y) => <circle key={`b${y}`} cx="32" cy={y + 2.5} r="0.9" />)}
    </>
  );
}

// ---------------------------------------------------------------------------
// Sleeve overlays — a small symmetric bust whose sleeve width + cuff read as
// the chosen family, and whose length / fullness read as the option.
// ---------------------------------------------------------------------------

// Per family: arm-cap position, plus the normal-sleeve cuff span (outer→inner
// x). `amples` overrides this with a wide bell; `band` families get a buttoned
// cuff. Contrast is deliberate — a boubou sleeve reads far fuller than a
// tailored one, and `amples` far fuller than `longues`.
type SleeveShape = { cap: number; capY: number; outer: number; inner: number; band: boolean };

const SLEEVE_BY_FAMILY: Record<DetailFamily, SleeveShape> = {
  flowing: { cap: 6, capY: 18, outer: 4, inner: 13, band: false },
  tunic: { cap: 9, capY: 17, outer: 8, inner: 15, band: false },
  shirt: { cap: 11, capY: 16, outer: 11, inner: 17, band: true },
  tailored: { cap: 11, capY: 16, outer: 11, inner: 17, band: true },
  fitted: { cap: 12, capY: 18, outer: 11, inner: 16, band: false },
};

function sleeveNode(variant: string, family: DetailFamily): ReactNode {
  const s = SLEEVE_BY_FAMILY[family];
  const capL = s.cap;
  const capR = 56 - s.cap;
  const capY = s.capY;

  // Shared upper body: neckline + shoulders (symmetric, ending exactly on the
  // arm caps) + torso sides down to the hem.
  const bodyTop = capY + 2;
  const upper = (
    <>
      <path d="M23 10Q28 8 33 10" />
      <path d={`M23 10C20 10 ${capL + 3} ${capY - 3} ${capL} ${capY}`} />
      <path d={`M33 10C36 10 ${capR - 3} ${capY - 3} ${capR} ${capY}`} />
      <path d={`M20 ${bodyTop} 20 54`} />
      <path d={`M36 ${bodyTop} 36 54`} />
      <path d="M20 54H36" />
    </>
  );

  // Sleeveless: just the armhole scoop, no hanging sleeve.
  if (variant === "sans") {
    return (
      <>
        {upper}
        <path d={`M${capL} ${capY}Q${capL + 7} ${capY + 7} 20 ${bodyTop + 3}`} />
        <path d={`M${capR} ${capY}Q${capR - 7} ${capY + 7} 36 ${bodyTop + 3}`} />
      </>
    );
  }

  const bell = variant === "amples" || family === "flowing";
  const cuffY = variant === "courtes" ? 32 : 49;
  const outL = variant === "amples" ? 1 : s.outer;
  const inL = variant === "amples" ? 11 : s.inner;
  const outR = 56 - outL;
  const inR = 56 - inL;
  const band = s.band && variant === "longues";
  const midY = (capY + cuffY) / 2;

  const outer = (cap: number, out: number) =>
    bell ? `M${cap} ${capY}Q${out} ${midY} ${out} ${cuffY}` : `M${cap} ${capY}L${out} ${cuffY}`;

  return (
    <>
      {upper}
      {/* left sleeve */}
      <path d={outer(capL, outL)} />
      <path d={`M20 ${bodyTop} ${inL} ${cuffY}`} />
      <path d={`M${outL} ${cuffY}H${inL}`} />
      {/* right sleeve */}
      <path d={outer(capR, outR)} />
      <path d={`M36 ${bodyTop} ${inR} ${cuffY}`} />
      <path d={`M${outR} ${cuffY}H${inR}`} />
      {/* buttoned cuff (shirt / tailored, full length) */}
      {band && (
        <>
          <path d={`M${outL} ${cuffY - 4}H${inL}`} strokeWidth={1.2} />
          <path d={`M${outR} ${cuffY - 4}H${inR}`} strokeWidth={1.2} />
          <circle cx={(outL + inL) / 2} cy={cuffY - 2} r="0.8" />
          <circle cx={(outR + inR) / 2} cy={cuffY - 2} r="0.8" />
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export type DetailGroup = "col" | "broderie" | "manches";

export function GarmentDetailIcon({
  family,
  group,
  variant,
  className,
}: {
  family: DetailFamily;
  group: DetailGroup;
  variant: string;
  className?: string;
}) {
  const bust = BUSTS[family];

  if (group === "manches") {
    return (
      <Svg viewBox="0 0 56 64" className={className}>
        {sleeveNode(variant, family)}
      </Svg>
    );
  }

  return (
    <Svg viewBox="0 0 64 60" className={className}>
      {bust.body}
      {group === "col" ? (
        <>
          {collarNode(variant, bust)}
          {family === "tailored" && tailoredFrontNode(variant, bust.ny, bust.breakY)}
        </>
      ) : (
        broderieNode(variant, family, bust)
      )}
    </Svg>
  );
}

function Svg({
  viewBox,
  className,
  children,
}: {
  viewBox: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
