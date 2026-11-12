// Planches du PANTALON TAILLEUR FEMME (JALOFA AFRIQUE, slug `tailleur-pantalon`) :
// le pantalon SEUL, sans haut — la coupe (palazzo, palazzo à pans plissés,
// droit, cigarette, évasé), la taille, la longueur, les plis, les poches et la
// broderie, chaque choix dessiné sur le pantalon entier.
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

type Cut = "palazzo" | "pans" | "droit" | "cigarette" | "evase";
type Waist = "haute" | "nouer" | "elastique";
type Length = "cheville" | "longue" | "sol";
type Pleats = 0 | 1 | 2;
type Pocket = "sans" | "italiennes" | "plaquees";
type Brod = "sans" | "bas" | "cotes" | "taille";

type Spec = {
  cut?: Cut;
  waist?: Waist;
  length?: Length;
  pleats?: Pleats;
  pocket?: Pocket;
  brod?: Brod;
};

type Pt = [number, number];

/** Hauteur de l'ourlet selon la longueur (la taille est à y = 24). */
const HEM_Y: Record<Length, number> = { cheville: 72, longue: 80, sol: 84 };
const WAIST_TOP = 20;
const WAIST_Y = 24;
const CROTCH_Y = 42;

/** Point d'un segment (a → b) à la hauteur y. */
function at(a: Pt, b: Pt, y: number): Pt {
  return [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y];
}

/**
 * Les deux bords de la jambe gauche, de la taille / l'entrejambe jusqu'à
 * l'ourlet `hem` : la coupe décide de la largeur en bas.
 */
function leg(cut: Cut, hem: number): { outer: Pt[]; inner: Pt[] } {
  const hip: Pt = [23.4, WAIST_Y];
  const crotch: Pt = [32, CROTCH_Y];
  switch (cut) {
    case "palazzo":
    case "pans":
      return { outer: [hip, at(hip, [10.4, 84], hem)], inner: [crotch, at(crotch, [30.6, 84], hem)] };
    case "droit":
      return { outer: [hip, at(hip, [19, 84], hem)], inner: [crotch, at(crotch, [28.6, 84], hem)] };
    case "cigarette":
      return {
        outer: [hip, [22.6, 44], at([22.6, 44], [22, 84], hem)],
        inner: [crotch, at(crotch, [27, 84], hem)],
      };
    case "evase":
      return {
        outer: [hip, [22.8, 56], at([22.8, 56], [17, 84], hem)],
        inner: [crotch, [28.6, 58], at([28.6, 58], [30.8, 84], hem)],
      };
  }
}

const poly = (pts: Pt[]) => "M" + pts.map((p) => p.join(" ")).join("L");

function waistHalf(waist: Waist): ReactNode {
  const band = (top: number) => (
    <>
      <path d={`M23.6 ${top}Q27.8 ${top + 0.6} 32 ${top + 0.8}`} />
      <path d={`M23.6 ${top} 23.4 ${WAIST_Y}`} />
      <path d={`M23.4 ${WAIST_Y}Q27.7 ${WAIST_Y + 0.6} 32 ${WAIST_Y + 0.8}`} />
    </>
  );
  switch (waist) {
    case "haute":
      return band(WAIST_TOP - 3);
    case "nouer":
      return band(WAIST_TOP);
    case "elastique":
      return (
        <>
          {band(WAIST_TOP)}
          <Seam>
            <path d="M24.8 20.4V24.2M26.6 20.6V24.4M28.4 20.7V24.6M30.2 20.8V24.7" />
          </Seam>
        </>
      );
  }
}

function pocketHalf(pocket: Pocket): ReactNode {
  switch (pocket) {
    case "sans":
      return null;
    case "italiennes":
      // Poche en biais, ouverte sur la couture de côté.
      return <path d="M23.2 27.4 27.4 26.4 24.6 36.6" />;
    case "plaquees":
      return <path d="M25 30H30.6V38.4Q27.8 39.8 25 38.4Z" />;
  }
}

function pleatsHalf(pleats: Pleats): ReactNode {
  if (pleats === 0) return null;
  return (
    <Seam>
      <path d="M28.6 25.2 28.2 33" />
      {pleats === 2 && <path d="M26.6 25.1 26.2 31" />}
    </Seam>
  );
}

function trousersHalf(spec: Required<Spec>): ReactNode {
  const hem = HEM_Y[spec.length];
  const { outer, inner } = leg(spec.cut, hem);
  const hemOut = outer[outer.length - 1];
  const hemIn = inner[inner.length - 1];
  return (
    <>
      {waistHalf(spec.waist)}
      <path d={poly(outer)} />
      <path d={poly(inner)} />
      <path d={`M${hemOut[0]} ${hem}H${hemIn[0]}`} />
      {/* braguette et pli de devant */}
      <Seam>
        <path d={`M32 ${WAIST_Y + 0.8}V${CROTCH_Y - 4}`} />
        <path d={`M27.4 ${WAIST_Y + 9}L${(hemOut[0] + hemIn[0]) / 2} ${hem - 1}`} />
      </Seam>
      {pleatsHalf(spec.pleats)}
      {pocketHalf(spec.pocket)}
      {spec.cut === "pans" && (
        // Le pan plissé qui s'ouvre sur le côté, attaché à la ceinture.
        <>
          <path d={`M23.4 ${WAIST_Y}C15 32 8 58 4.6 ${hem - 2}H12`} fill="currentColor" fillOpacity={0.08} />
          <Seam>
            <path d={`M21.4 27 7.6 ${hem - 2}M22.6 26 10.4 ${hem - 3}`} />
          </Seam>
        </>
      )}
      {spec.brod === "bas" && <Embroidery d={`M${hemOut[0] + 0.8} ${hem - 2.4}H${hemIn[0] - 0.4}`} />}
      {spec.brod === "cotes" && <Embroidery d={poly(outer.map(([x, y]) => [x + 1.6, y + (y === WAIST_Y ? 2 : -2)] as Pt))} />}
      {spec.brod === "taille" && <Embroidery d={`M24.4 ${WAIST_TOP + 2}Q28.2 ${WAIST_TOP + 2.6} 32 ${WAIST_TOP + 2.8}`} />}
    </>
  );
}

function trousers(input: Spec = {}): ReactNode {
  const spec: Required<Spec> = {
    cut: "palazzo",
    waist: "nouer",
    length: "longue",
    pleats: 0,
    pocket: "sans",
    brod: "sans",
    ...input,
  };
  const half = trousersHalf(spec);
  return (
    <>
      {half}
      <Mirror>{half}</Mirror>
      {spec.waist === "nouer" && (
        // Le nœud devant, et ses deux pans.
        <path d="M32 22.6C29 19.6 26.6 21.6 28.6 23.6ZM32 22.6C35 19.6 37.4 21.6 35.4 23.6ZM31.4 23.4 29.6 32M32.6 23.4 34.8 31.4" />
      )}
    </>
  );
}

const BOX = "0 14 64 74";

const ICONS = {
  // === Coupe ================================================================
  "tp-coupe-palazzo": { viewBox: BOX, body: trousers({ cut: "palazzo" }) },
  "tp-coupe-pans": { viewBox: BOX, body: trousers({ cut: "pans" }) },
  "tp-coupe-droit": { viewBox: BOX, body: trousers({ cut: "droit" }) },
  "tp-coupe-cigarette": { viewBox: BOX, body: trousers({ cut: "cigarette", length: "cheville" }) },
  "tp-coupe-evase": { viewBox: BOX, body: trousers({ cut: "evase" }) },

  // === Taille ===============================================================
  "tp-taille-haute": { viewBox: BOX, body: trousers({ waist: "haute", cut: "droit" }) },
  "tp-taille-nouer": { viewBox: BOX, body: trousers({ waist: "nouer", cut: "droit" }) },
  "tp-taille-elastique": { viewBox: BOX, body: trousers({ waist: "elastique", cut: "droit" }) },

  // === Longueur =============================================================
  "tp-longueur-cheville": { viewBox: BOX, body: trousers({ length: "cheville", cut: "droit" }) },
  "tp-longueur-longue": { viewBox: BOX, body: trousers({ length: "longue", cut: "droit" }) },
  "tp-longueur-sol": { viewBox: BOX, body: trousers({ length: "sol", cut: "droit" }) },

  // === Plis =================================================================
  "tp-plis-0": { viewBox: BOX, body: trousers({ pleats: 0, cut: "droit", waist: "haute" }) },
  "tp-plis-1": { viewBox: BOX, body: trousers({ pleats: 1, cut: "droit", waist: "haute" }) },
  "tp-plis-2": { viewBox: BOX, body: trousers({ pleats: 2, cut: "droit", waist: "haute" }) },

  // === Poches ===============================================================
  "tp-poche-sans": { viewBox: BOX, body: trousers({ pocket: "sans", cut: "droit", waist: "haute" }) },
  "tp-poche-italiennes": {
    viewBox: BOX,
    body: trousers({ pocket: "italiennes", cut: "droit", waist: "haute" }),
  },
  "tp-poche-plaquees": {
    viewBox: BOX,
    body: trousers({ pocket: "plaquees", cut: "droit", waist: "haute" }),
  },

  // === Broderie =============================================================
  "tp-brod-sans": { viewBox: BOX, body: trousers({ brod: "sans" }) },
  "tp-brod-bas": { viewBox: BOX, body: trousers({ brod: "bas" }) },
  "tp-brod-cotes": { viewBox: BOX, body: trousers({ brod: "cotes" }) },
  "tp-brod-taille": { viewBox: BOX, body: trousers({ brod: "taille", waist: "haute" }) },
} satisfies Record<string, IconDef>;

export type PantsuitDetailIconName = keyof typeof ICONS;

export function isPantsuitArt(name: string): name is PantsuitDetailIconName {
  return name in ICONS;
}

/** Toutes les planches montrent le pantalon entier : vignette en portrait. */
export function pantsuitArtIsTall(): boolean {
  return true;
}

export function PantsuitDetailIcon({
  name,
  className,
}: {
  name: PantsuitDetailIconName;
  className?: string;
}) {
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
