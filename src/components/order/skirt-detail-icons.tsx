// Planches de la JUPE (JALOFA AFRIQUE, slug `jupe`) : la jupe SEULE, sans haut —
// la coupe (droite, crayon, évasée, plissée, patineuse, portefeuille, sirène,
// à volants), la longueur (de la mini au sol), la taille, la fente, les poches
// et la broderie, chaque choix dessiné sur la jupe entière.
//
// Mêmes conventions que `gown-detail-icons.tsx` : `currentColor`, trait fin,
// moitié gauche dessinée une fois puis renvoyée en miroir autour de x = 32.

import type { ReactNode } from "react";

type IconDef = { viewBox: string; body: ReactNode };

function Mirror({ children }: { children: ReactNode }) {
  return <g transform="matrix(-1 0 0 1 64 0)">{children}</g>;
}

function Seam({ children }: { children: ReactNode }) {
  return (
    <g strokeWidth={0.8} strokeOpacity={0.6}>
      {children}
    </g>
  );
}

/** Broderie : un chapelet de points le long du tracé. */
function Embroidery({ d }: { d: string }) {
  return <path d={d} strokeWidth={1.5} strokeDasharray="0.01 1.7" />;
}

type Cut =
  | "droite"
  | "crayon"
  | "evasee"
  | "plissee"
  | "patineuse"
  | "portefeuille"
  | "sirene"
  | "volants";
type Length = "mini" | "dessus-genou" | "genou" | "midi" | "cheville" | "sol";
type Waist = "normale" | "haute" | "nouer" | "elastique";
type Slit = "sans" | "devant" | "cote";
type Pocket = "sans" | "biais";
type Brod = "sans" | "bas" | "ceinture" | "cote";

type Spec = {
  cut?: Cut;
  length?: Length;
  waist?: Waist;
  slit?: Slit;
  pocket?: Pocket;
  brod?: Brod;
};

type Pt = [number, number];

const HEM_Y: Record<Length, number> = {
  mini: 34,
  "dessus-genou": 42,
  genou: 50,
  midi: 62,
  cheville: 74,
  sol: 82,
};
/** Bas de la ceinture, là où commence la jupe. */
const WAIST_Y = 16;
const WAIST_X = 23.4;

/** Point d'un segment (a → b) à la hauteur y. */
function at(a: Pt, b: Pt, y: number): Pt {
  return [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y];
}

/** Le côté gauche de la jupe, de la taille jusqu'à l'ourlet `hem`. */
function side(cut: Cut, hem: number): Pt[] {
  const waist: Pt = [WAIST_X, WAIST_Y];
  const hip: Pt = [21, 27];
  switch (cut) {
    case "droite":
      return [waist, hip, at(hip, [21.4, 82], hem)];
    case "crayon":
      return [waist, hip, at(hip, [25, 82], hem)];
    case "evasee":
    case "plissee":
    case "portefeuille":
      return [waist, at(waist, [10.4, 82], hem)];
    case "patineuse":
      return [waist, at(waist, [2.4, 82], hem)];
    case "volants":
      return [waist, at(waist, [8.4, 82], hem)];
    case "sirene": {
      // Ajustée jusqu'au genou, puis s'ouvre en corolle.
      if (hem <= 50) return [waist, hip, at(hip, [22.4, 50], hem)];
      return [waist, hip, [22.4, 50], at([22.4, 50], [10, 82], hem)];
    }
  }
}

/** x du côté gauche à la hauteur y. */
function sideX(pts: Pt[], y: number): number {
  for (let i = 1; i < pts.length; i++) {
    if (y <= pts[i][1]) return at(pts[i - 1], pts[i], y)[0];
  }
  return pts[pts.length - 1][0];
}

const poly = (pts: Pt[]) => "M" + pts.map((p) => p.join(" ")).join("L");

function waistHalf(waist: Waist): ReactNode {
  const top = waist === "haute" ? 8 : 12.4;
  return (
    <>
      <path d={`M${WAIST_X + 0.2} ${top}Q27.8 ${top + 0.6} 32 ${top + 0.8}`} />
      <path d={`M${WAIST_X + 0.2} ${top} ${WAIST_X} ${WAIST_Y}`} />
      <path d={`M${WAIST_X} ${WAIST_Y}Q27.7 ${WAIST_Y + 0.6} 32 ${WAIST_Y + 0.8}`} />
      {waist === "elastique" && (
        <Seam>
          <path d="M24.8 12.8V16.2M26.6 13V16.4M28.4 13.1V16.6M30.2 13.2V16.7" />
        </Seam>
      )}
    </>
  );
}

function skirtHalf(spec: Required<Spec>): ReactNode {
  const hem = HEM_Y[spec.length];
  const pts = side(spec.cut, hem);
  const hx = pts[pts.length - 1][0];
  const wavy = spec.cut === "patineuse" || spec.cut === "volants";
  let hemPath = `M${hx} ${hem}Q${(hx + 32) / 2} ${hem + 1} 32 ${hem + 1.2}`;
  if (wavy) {
    // Ourlet ondulé : la jupe tourne.
    const n = 4;
    const w = (32 - hx) / n;
    hemPath = `M${hx} ${hem}`;
    for (let i = 0; i < n; i++) hemPath += `q${w / 2} ${i % 2 ? -1.6 : 1.6} ${w} ${0.3}`;
  }
  const span = hem - WAIST_Y;
  return (
    <>
      {waistHalf(spec.waist)}
      <path d={poly(pts)} />
      <path d={hemPath} />
      {spec.cut === "plissee" && (
        <Seam>
          {[0.25, 0.5, 0.75].map((f) => {
            const top = WAIST_X + (32 - WAIST_X) * f;
            const bottom = hx + (32 - hx) * f;
            return <path key={f} d={`M${top} ${WAIST_Y + 1}L${bottom} ${hem}`} />;
          })}
        </Seam>
      )}
      {spec.cut === "patineuse" && (
        <Seam>
          <path d={`M27 ${WAIST_Y + 4}Q22 ${WAIST_Y + span / 2} 16 ${hem - 1}`} />
        </Seam>
      )}
      {spec.cut === "volants" &&
        [1 / 3, 2 / 3].map((f) => {
          const y = WAIST_Y + span * f;
          const x = sideX(pts, y);
          // Chaque étage dépasse un peu de celui du dessus.
          return (
            <path key={f} d={`M${x - 1.6} ${y + 1}q${(32 - x) / 4} 1.6 ${(32 - x) / 2} .3T32 ${y + 1.6}`} />
          );
        })}
      {spec.cut === "sirene" && hem > 50 && (
        <Seam>
          <path d="M22.4 50Q27.2 51 32 51.2" />
        </Seam>
      )}
      {spec.pocket === "biais" && <path d={`M22.4 19.6 26.6 18.6 23.4 27.4`} />}
      {spec.brod === "bas" && <Embroidery d={`M${hx + 1} ${hem - 2.2}Q${(hx + 32) / 2} ${hem - 1.2} 32 ${hem - 1}`} />}
      {spec.brod === "ceinture" && <Embroidery d={`M24.4 14.6Q28.2 15.2 32 15.4`} />}
      {spec.brod === "cote" && (
        <Embroidery d={poly(pts.map(([x, y], i) => [x + 1.8, i === 0 ? y + 2 : y - (i === pts.length - 1 ? 2 : 0)] as Pt))} />
      )}
      {spec.slit === "cote" && (
        <path d={`M${sideX(pts, hem - 12) + 1.4} ${hem - 12}L${hx + 2.8} ${hem + 0.3}`} />
      )}
    </>
  );
}

function skirt(input: Spec = {}): ReactNode {
  const spec: Required<Spec> = {
    cut: "droite",
    length: "genou",
    waist: "normale",
    slit: "sans",
    pocket: "sans",
    brod: "sans",
    ...input,
  };
  const hem = HEM_Y[spec.length];
  const half = skirtHalf(spec);
  return (
    <>
      {half}
      <Mirror>{half}</Mirror>
      {spec.slit === "devant" && <path d={`M32 ${hem - 13}L30.2 ${hem + 1.2}M32 ${hem - 13}L33.8 ${hem + 1.2}`} />}
      {spec.waist === "nouer" && (
        // Le nœud devant, et ses deux pans.
        <path d="M32 14.6C29 11.6 26.6 13.6 28.6 15.6ZM32 14.6C35 11.6 37.4 13.6 35.4 15.6ZM31.4 15.4 29.6 24M32.6 15.4 34.8 23.4" />
      )}
      {spec.cut === "portefeuille" && (
        // Le pan croisé : de la taille, à droite, jusqu'à l'ourlet, à gauche.
        <>
          <path d={`M38.6 ${WAIST_Y + 0.6}C36 ${WAIST_Y + 14} 30 ${hem - 12} 24.6 ${hem + 0.8}`} />
          <path d="M40.2 17.4C43.4 16 44.4 19 41.4 19.6M40.2 17.4 42.4 25.6M40.2 17.4 39.6 25" />
        </>
      )}
    </>
  );
}

const BOX = "0 4 64 84";

const ICONS = {
  // === Coupe ================================================================
  "jp-coupe-droite": { viewBox: BOX, body: skirt({ cut: "droite" }) },
  "jp-coupe-crayon": { viewBox: BOX, body: skirt({ cut: "crayon", length: "midi" }) },
  "jp-coupe-evasee": { viewBox: BOX, body: skirt({ cut: "evasee" }) },
  "jp-coupe-plissee": { viewBox: BOX, body: skirt({ cut: "plissee", length: "midi" }) },
  "jp-coupe-patineuse": { viewBox: BOX, body: skirt({ cut: "patineuse", length: "dessus-genou" }) },
  "jp-coupe-portefeuille": { viewBox: BOX, body: skirt({ cut: "portefeuille", length: "midi" }) },
  "jp-coupe-sirene": { viewBox: BOX, body: skirt({ cut: "sirene", length: "sol" }) },
  "jp-coupe-volants": { viewBox: BOX, body: skirt({ cut: "volants", length: "cheville" }) },

  // === Longueur =============================================================
  "jp-longueur-mini": { viewBox: BOX, body: skirt({ cut: "evasee", length: "mini" }) },
  "jp-longueur-dessus-genou": { viewBox: BOX, body: skirt({ cut: "evasee", length: "dessus-genou" }) },
  "jp-longueur-genou": { viewBox: BOX, body: skirt({ cut: "evasee", length: "genou" }) },
  "jp-longueur-midi": { viewBox: BOX, body: skirt({ cut: "evasee", length: "midi" }) },
  "jp-longueur-cheville": { viewBox: BOX, body: skirt({ cut: "evasee", length: "cheville" }) },
  "jp-longueur-sol": { viewBox: BOX, body: skirt({ cut: "evasee", length: "sol" }) },

  // === Taille ===============================================================
  "jp-taille-normale": { viewBox: BOX, body: skirt({ waist: "normale" }) },
  "jp-taille-haute": { viewBox: BOX, body: skirt({ waist: "haute" }) },
  "jp-taille-nouer": { viewBox: BOX, body: skirt({ waist: "nouer" }) },
  "jp-taille-elastique": { viewBox: BOX, body: skirt({ waist: "elastique" }) },

  // === Fente ================================================================
  "jp-fente-sans": { viewBox: BOX, body: skirt({ cut: "crayon", length: "midi" }) },
  "jp-fente-devant": { viewBox: BOX, body: skirt({ cut: "crayon", length: "midi", slit: "devant" }) },
  "jp-fente-cote": { viewBox: BOX, body: skirt({ cut: "crayon", length: "midi", slit: "cote" }) },

  // === Poches ===============================================================
  "jp-poche-sans": { viewBox: BOX, body: skirt({ cut: "evasee" }) },
  "jp-poche-biais": { viewBox: BOX, body: skirt({ cut: "evasee", pocket: "biais" }) },

  // === Broderie =============================================================
  "jp-brod-sans": { viewBox: BOX, body: skirt({ cut: "evasee", length: "midi" }) },
  "jp-brod-bas": { viewBox: BOX, body: skirt({ cut: "evasee", length: "midi", brod: "bas" }) },
  "jp-brod-ceinture": { viewBox: BOX, body: skirt({ cut: "evasee", length: "midi", brod: "ceinture" }) },
  "jp-brod-cote": { viewBox: BOX, body: skirt({ cut: "evasee", length: "midi", brod: "cote" }) },
} satisfies Record<string, IconDef>;

export type SkirtDetailIconName = keyof typeof ICONS;

export function isSkirtArt(name: string): name is SkirtDetailIconName {
  return name in ICONS;
}

/** Toutes les planches montrent la jupe entière : vignette en portrait. */
export function skirtArtIsTall(): boolean {
  return true;
}

export function SkirtDetailIcon({ name, className }: { name: SkirtDetailIconName; className?: string }) {
  const icon: IconDef = ICONS[name];
  return (
    <svg
      viewBox={icon.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icon.body}
    </svg>
  );
}
