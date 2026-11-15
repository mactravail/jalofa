"use client";

import { createContext, useContext, useId } from "react";
import { cn } from "@/lib/utils";

/**
 * L'homme qui porte le costume (configurateur des costumes et du smoking
 * JALOFA EUROPE), dans l'esprit des configurateurs Hockerty : une silhouette
 * humaine réaliste, de face, éclairée (dégradés, ombres, plis), dessin maison.
 *
 * Chaque planche choisie à l'étape Style se voit tout de suite : style de veste
 * (droit 1/2/3 boutons, croisé 2/4/6), revers (cranté, pointe, châle) et leur
 * largeur, poches, gilet et ses revers, pantalon (long / bermuda, pinces, bas à
 * revers, bandes de satin). Le tissu choisi habille la veste ; avec « Tissu
 * différent », le pantalon prend le sien.
 *
 * Repère : viewBox 400 × 980, axe x=200. Menton y≈148, épaules y≈200, bouton
 * de taille y≈390, bas de veste y≈596, entrejambe y≈600, sol y≈966.
 */

export type SuitKind = "costume3" | "costume2" | "smoking";

const SUIT_SLUGS: Record<string, SuitKind> = {
  "europe-costume-homme": "costume3",
  "europe-costume-2p-homme": "costume2",
  "europe-smoking-homme": "smoking",
};

export function suitKindFor(slug: string | null | undefined): SuitKind | null {
  return (slug && SUIT_SLUGS[slug]) || null;
}

/** Suffixe unique des dégradés : l'avatar peut être affiché deux fois. */
export const UidCtx = createContext("");
function useU() {
  const uid = useContext(UidCtx);
  return (name: string) => `url(#${name}-${uid})`;
}

export const EDGE = "rgba(0,0,0,0.55)";
export const SHIRT = "#f2f2f4";
const NAVY = "#1f2b48";
const TUX = "#141519";

export const MIRROR = "translate(400 0) scale(-1 1)";

type Pt = { x: number; y: number };

// --- Géométrie de la veste ----------------------------------------------------

type Closure = { roll: number; buttons: Pt[]; double: boolean };

function closure(style: string | undefined): Closure {
  switch (style) {
    case "droit-1":
      return { roll: 410, buttons: [{ x: 200, y: 418 }], double: false };
    case "droit-3":
      return {
        roll: 330,
        buttons: [338, 400, 462].map((y) => ({ x: 200, y })),
        double: false,
      };
    case "croise-2":
    case "croise-4":
    case "croise-6": {
      const rows = style === "croise-2" ? [402] : [402, 466];
      const buttons = rows.flatMap((y) => [
        { x: 172, y },
        { x: 228, y },
      ]);
      if (style === "croise-6") buttons.push({ x: 150, y: 336 }, { x: 250, y: 336 });
      return { roll: 394, buttons, double: true };
    }
    default:
      return { roll: 384, buttons: [392, 462].map((y) => ({ x: 200, y })), double: false };
  }
}

/** Le pan gauche de la veste (côté gauche de l'image), bord d'ouverture en x. */
function leftPanel(roll: number, frontX: number, lowest: number, square: boolean) {
  const hem = square
    ? `C146 598 176 600 ${frontX} 600 L${frontX} ${roll}`
    : `C146 598 164 600 180 598 C196 594 ${frontX - 1} ${Math.min(lowest + 70, 572)} ${frontX} ${lowest + 18} L${frontX} ${roll}`;
  return (
    `M182 176 L84 200 C100 250 122 290 126 320 C132 380 136 420 134 450 ` +
    `C132 510 128 560 126 592 ${hem} Z`
  );
}

/** Le pan croisé, posé par-dessus (côté droit de l'image). */
function doubleTopPanel(roll: number) {
  return (
    `M218 176 L316 200 C300 250 278 290 274 320 C268 380 264 420 266 450 ` +
    `C268 510 272 560 274 592 C240 600 190 602 154 600 L154 ${roll} Z`
  );
}

const LAPEL_TIP: Record<string, number> = { etroit: 154, moyen: 146, large: 134 };

/** Le revers gauche (col compris), de son point de cassure P jusqu'au cou. */
function lapelPath(p: Pt, type: string | undefined, width: string | undefined) {
  const tx = LAPEL_TIP[width ?? "moyen"] ?? 146;
  const start = `M${p.x} ${p.y} L182 176 L188 158 `;
  const toP = (c1: string) => `C${c1} ${p.x - 34} ${p.y - 64} ${p.x} ${p.y} Z`;
  if (type === "chale") {
    return start + `C170 170 ${tx - 6} 220 ${tx} 262 ` + `C${tx + 6} 320 ${p.x - 30} ${p.y - 50} ${p.x} ${p.y} Z`;
  }
  if (type === "pointe") {
    return (
      start +
      `C176 166 166 188 ${tx + 14} 214 L${tx + 18} 224 L${tx - 12} 204 ` +
      toP(`${tx - 4} 250`)
    );
  }
  return start + `C176 166 164 190 ${tx + 8} 218 L${tx + 18} 229 L${tx} 233 ` + toP(`${tx + 4} 300`);
}

/** La couture col / revers (sauf châle). */
function gorgeLine(type: string | undefined, width: string | undefined) {
  if (type === "chale") return null;
  const tx = LAPEL_TIP[width ?? "moyen"] ?? 146;
  return `M${tx + 18} ${type === "pointe" ? 224 : 229} L179 196`;
}

// --- Petites pièces -----------------------------------------------------------

export function Button({ x, y, r = 6.5, satin = false }: { x: number; y: number; r?: number; satin?: boolean }) {
  const U = useU();
  return (
    <g>
      <circle cx={x} cy={y + 1.5} r={r} fill="#000" opacity={0.35} />
      <circle cx={x} cy={y} r={r} fill={satin ? U("sa-satin-btn") : U("sa-horn")} stroke="rgba(0,0,0,0.6)" strokeWidth={0.8} />
      {!satin && (
        <g fill="rgba(0,0,0,0.55)">
          <circle cx={x - 1.6} cy={y - 1.6} r={0.9} />
          <circle cx={x + 1.6} cy={y - 1.6} r={0.9} />
          <circle cx={x - 1.6} cy={y + 1.6} r={0.9} />
          <circle cx={x + 1.6} cy={y + 1.6} r={0.9} />
        </g>
      )}
    </g>
  );
}

function Pockets({ slug, fill, satin }: { slug: string | undefined; fill: string; satin: boolean }) {
  const U = useU();
  const kind = slug ?? "rabat";
  const flap = (x: number, y: number, w: number, h: number) => (
    <g>
      <path d={`M${x} ${y + h + 2} L${x + w} ${y + h + 2}`} stroke="#000" strokeOpacity={0.35} strokeWidth={3} filter={U("sa-blur-s")} />
      <path
        d={`M${x} ${y} L${x + w} ${y} L${x + w} ${y + h - 4} Q${x + w} ${y + h} ${x + w - 4} ${y + h} L${x + 4} ${y + h} Q${x} ${y + h} ${x} ${y + h - 4} Z`}
        fill={fill}
        stroke={EDGE}
        strokeWidth={0.9}
      />
      <path d={`M${x + 2} ${y + 2.5} L${x + w - 2} ${y + 2.5}`} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
    </g>
  );
  const welt = (x: number, y: number, w: number) => (
    <g>
      <rect x={x} y={y} width={w} height={5} rx={1} fill={satin ? U("sa-satin") : fill} stroke={EDGE} strokeWidth={0.8} />
      <path d={`M${x} ${y + 2.5} L${x + w} ${y + 2.5}`} stroke="rgba(0,0,0,0.6)" strokeWidth={0.7} />
    </g>
  );
  const patch = (x: number, y: number) => (
    <g>
      <path
        d={`M${x} ${y} L${x + 52} ${y} L${x + 52} ${y + 46} Q${x + 52} ${y + 56} ${x + 42} ${y + 56} L${x + 10} ${y + 56} Q${x} ${y + 56} ${x} ${y + 46} Z`}
        fill={fill}
        stroke={EDGE}
        strokeWidth={0.9}
      />
      <path d={`M${x + 2} ${y + 6} L${x + 50} ${y + 6}`} stroke="rgba(0,0,0,0.35)" strokeWidth={0.8} strokeDasharray="2 1.5" />
    </g>
  );

  let main: React.ReactNode;
  let ticket: React.ReactNode = null;
  switch (kind) {
    case "passepoil":
      main = welt(136, 478, 50);
      break;
    case "ticket":
    case "passepoil-3":
      main = welt(136, 478, 50);
      ticket = welt(142, 448, 38);
      break;
    case "plaquees":
      main = patch(134, 470);
      break;
    case "rabat-3":
      main = flap(136, 474, 50, 17);
      ticket = flap(142, 444, 38, 13);
      break;
    default:
      main = flap(136, 474, 50, 17);
  }
  return (
    <g>
      {main}
      <g transform={MIRROR}>{main}</g>
      {ticket}
      {/* Poche poitrine passepoilée */}
      <g transform="rotate(-4 256 312)">{welt(236, 306, 38)}</g>
    </g>
  );
}

// --- Le corps -----------------------------------------------------------------

export function Head({ beard = true }: { beard?: boolean }) {
  const U = useU();
  return (
    <g>
      {/* Oreilles */}
      <g fill={U("sa-skin")} stroke="rgba(40,20,10,0.5)" strokeWidth={0.8}>
        <path d="M158 78 C148 74 146 90 150 100 C152 108 158 110 161 106 Z" />
        <path d="M242 78 C252 74 254 90 250 100 C248 108 242 110 239 106 Z" />
      </g>
      {/* Visage */}
      <path
        d="M157 74 C157 40 176 22 200 22 C224 22 243 40 243 74 C243 104 237 122 226 134 C216 144 208 149 200 149 C192 149 184 144 174 134 C163 122 157 104 157 74 Z"
        fill={U("sa-skin")}
      />
      <path
        d="M157 74 C157 40 176 22 200 22 C224 22 243 40 243 74 C243 104 237 122 226 134 C216 144 208 149 200 149 C192 149 184 144 174 134 C163 122 157 104 157 74 Z"
        fill={U("sa-face-shade")}
      />
      {/* Cheveux courts */}
      <path
        d="M155 80 C150 44 168 14 200 13 C232 14 250 44 245 80 C243 66 239 55 231 49 C216 41 186 41 169 49 C161 55 157 66 155 80 Z"
        fill="#120d0b"
      />
      <path d="M170 30 C184 20 214 18 232 32" stroke="rgba(255,255,255,0.08)" strokeWidth={3} fill="none" />
      {/* Sourcils */}
      <g fill="#120c0a">
        <path d="M171 73 C178 68 188 68 194 71 L193 74 C187 72 179 72 172 76 Z" />
        <path d="M229 73 C222 68 212 68 206 71 L207 74 C213 72 221 72 228 76 Z" />
      </g>
      {/* Yeux */}
      {[182, 218].map((cx) => (
        <g key={cx}>
          <path d={`M${cx - 9} 86 Q${cx} 79 ${cx + 9} 86 Q${cx} 91 ${cx - 9} 86 Z`} fill="#eee4d8" />
          <circle cx={cx} cy={85.5} r={3.6} fill="#2b170d" />
          <circle cx={cx} cy={85.5} r={1.6} fill="#000" />
          <circle cx={cx + 1.2} cy={84.4} r={0.8} fill="#fff" />
          <path d={`M${cx - 9.5} 86 Q${cx} 78.5 ${cx + 9.5} 86`} stroke="#140a06" strokeWidth={1.5} fill="none" />
          <path d={`M${cx - 7} 90 Q${cx} 92.5 ${cx + 7} 90`} stroke="rgba(40,18,8,0.45)" strokeWidth={0.8} fill="none" />
        </g>
      ))}
      {/* Nez */}
      <path d="M197 88 C195 98 191 106 190 111" stroke="rgba(50,22,10,0.35)" strokeWidth={1.4} fill="none" />
      <path
        d="M189 110 C188 116 194 118 200 117 C206 118 212 116 211 110 C209 113 205 113 203 111 L197 111 C195 113 191 113 189 110 Z"
        fill="rgba(55,25,12,0.55)"
      />
      <path d="M201 92 C203 100 205 104 204 108" stroke="rgba(255,220,190,0.18)" strokeWidth={2} fill="none" />
      {/* Barbe courte, moustache, lèvres (pas de barbe pour un enfant) */}
      {beard && (
        <>
          <path
            d="M161 98 C163 124 179 146 200 149 C221 146 237 124 239 98 C236 116 228 127 216 132 C208 129 192 129 184 132 C172 127 164 116 161 98 Z"
            fill="#1a120f"
            opacity={0.8}
          />
          <path d="M185 121 C191 117 209 117 215 121 C209 123 191 123 185 121 Z" fill="#160f0c" />
        </>
      )}
      <path d="M189 126 C195 124 205 124 211 126 C206 131 194 131 189 126 Z" fill="#5a2c20" />
      <path d="M190 126 C196 127 204 127 210 126" stroke="rgba(0,0,0,0.5)" strokeWidth={0.8} fill="none" />
    </g>
  );
}

export function Neck() {
  const U = useU();
  return (
    <path d="M178 118 C179 140 177 160 172 180 L228 180 C223 160 221 140 222 118 Z" fill={U("sa-neck")} />
  );
}

export function Hand() {
  const U = useU();
  return (
    <g>
      <path
        d="M80 574 C74 600 74 632 82 654 C88 670 104 672 112 662 C120 650 124 626 124 602 C124 588 122 578 120 574 Z"
        fill={U("sa-skin-hand")}
        stroke="rgba(40,20,10,0.45)"
        strokeWidth={0.8}
      />
      <path
        d="M117 588 C127 600 127 622 119 636 C113 630 113 606 115 592 Z"
        fill={U("sa-skin")}
        stroke="rgba(40,20,10,0.45)"
        strokeWidth={0.8}
      />
      <g stroke="rgba(40,20,10,0.35)" strokeWidth={0.8} fill="none">
        <path d="M92 628 C92 644 94 656 97 666" />
        <path d="M102 630 C103 646 104 656 106 664" />
        <path d="M86 622 C85 636 86 648 89 658" />
      </g>
    </g>
  );
}

// --- Le pantalon ----------------------------------------------------------------

function Trousers({
  details,
  fill,
  satin,
}: {
  details: Record<string, string>;
  fill: string;
  satin: boolean;
}) {
  const U = useU();
  const bermuda = details.longueur === "bermuda";
  const hemY = bermuda ? 760 : 944;
  const outerHem = bermuda ? 134 : 140;
  const innerHem = bermuda ? 196 : 190;
  const leg = `M124 492 L200 492 L200 600 C196 ${bermuda ? 680 : 700} ${innerHem + 2} ${bermuda ? 730 : 820} ${innerHem} ${hemY} L${outerHem} ${hemY} C${bermuda ? 130 : 132} ${bermuda ? 700 : 760} 126 620 124 492 Z`;
  const pleats = details.pinces === "deux" ? 2 : details.pinces === "une" ? 1 : 0;
  const cuff = !bermuda && details["bas-pantalon"] === "revers";
  const band = satin && details.bandes === "avec";

  const half = (
    <g>
      {bermuda && (
        <path d="M142 756 L192 756 C190 820 186 880 184 934 L152 934 C150 880 146 820 142 756 Z" fill={U("sa-skin")} />
      )}
      <path d={leg} fill={fill} stroke={EDGE} strokeWidth={1} />
      <path d={leg} fill={U("sa-leg-shade")} />
      {/* Pli de repassage */}
      <path d={`M164 600 L${bermuda ? 165 : 166} ${hemY - 2}`} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
      <path d={`M166 600 L${bermuda ? 167 : 168} ${hemY - 2}`} stroke="rgba(0,0,0,0.25)" strokeWidth={0.8} />
      {Array.from({ length: pleats }, (_, i) => (
        <path key={i} d={`M${174 + i * 9} 492 C${175 + i * 9} 590 ${172 + i * 9} 620 ${170 + i * 9} 650`} stroke="rgba(0,0,0,0.4)" strokeWidth={1} fill="none" />
      ))}
      {/* Plis aux genoux et cassure sur la chaussure */}
      <g stroke="rgba(0,0,0,0.3)" strokeWidth={2} fill="none" filter={U("sa-blur-s")}>
        <path d="M144 760 C156 754 170 756 186 762" />
        {!bermuda && <path d="M146 922 C160 914 176 916 188 924" />}
      </g>
      {cuff && (
        <g>
          <path d={`M${outerHem - 1} ${hemY - 18} L${innerHem + 1} ${hemY - 18} L${innerHem} ${hemY} L${outerHem} ${hemY} Z`} fill={fill} stroke={EDGE} strokeWidth={0.9} />
          <path d={`M${outerHem - 1} ${hemY - 18} L${innerHem + 1} ${hemY - 18}`} stroke="rgba(0,0,0,0.5)" strokeWidth={1.2} />
        </g>
      )}
      {band && <path d={`M124 492 L131 492 C133 640 138 780 ${outerHem + 7} ${hemY} L${outerHem} ${hemY} C132 760 126 620 124 540 Z`} fill={U("sa-satin")} />}
      {/* Chaussure */}
      <path
        d="M136 940 C150 936 180 936 192 940 C197 950 195 961 187 965 C168 970 146 970 132 964 C126 957 128 946 136 940 Z"
        fill={U("sa-shoe")}
        stroke="rgba(0,0,0,0.7)"
        strokeWidth={0.8}
      />
      <path d="M146 944 C160 941 176 941 186 944" stroke="rgba(255,255,255,0.25)" strokeWidth={1.4} fill="none" />
    </g>
  );
  return (
    <g>
      {half}
      <g transform={MIRROR}>{half}</g>
      <path d="M200 492 L200 600" stroke="rgba(0,0,0,0.4)" strokeWidth={1} />
    </g>
  );
}

// --- Le gilet -------------------------------------------------------------------

function Vest({ details, fill }: { details: Record<string, string>; fill: string }) {
  const U = useU();
  const style = details.gilet ?? "droit-4";
  const bottom = style === "droit-5" ? 284 : style === "croise-6" ? 290 : 302;
  const body = `M168 182 L188 190 L200 ${bottom} L212 190 L232 182 L252 538 L214 562 L200 552 L186 562 L148 538 Z`;
  const buttons: Pt[] =
    style === "croise-6"
      ? [0, 1, 2].flatMap((i) => [
          { x: 188, y: bottom + 14 + i * 34 },
          { x: 212, y: bottom + 14 + i * 34 },
        ])
      : Array.from({ length: style === "droit-5" ? 5 : 4 }, (_, i) => ({
          x: 200,
          y: bottom + 12 + i * (style === "droit-5" ? 30 : 36),
        }));
  const revers = details["revers-gilet"];
  const lapel =
    revers === "cran"
      ? `M188 190 L200 ${bottom} L195 ${bottom - 6} L180 222 L176 214 L183 206 Z`
      : revers === "pointe"
        ? `M188 190 L200 ${bottom} L195 ${bottom - 6} L178 220 L172 204 Z`
        : null;
  return (
    <g>
      <path d={body} fill={fill} stroke={EDGE} strokeWidth={1} />
      <path d={body} fill={U("sa-body-shade")} />
      {lapel && (
        <>
          <path d={lapel} fill={fill} stroke={EDGE} strokeWidth={0.9} />
          <path d={lapel} fill={fill} stroke={EDGE} strokeWidth={0.9} transform={MIRROR} />
        </>
      )}
      {buttons.map((b) => (
        <Button key={`${b.x}-${b.y}`} x={b.x} y={b.y} r={4.2} />
      ))}
    </g>
  );
}

/** Les dégradés partagés (peau, ombres…), suffixés par `uid`. */
export function SuitDefs({ uid }: { uid: string }) {
  const U = (name: string) => `url(#${name}-${uid})`;
  return (
    <>
        <radialGradient id={`sa-skin-${uid}`} cx="0.45" cy="0.38" r="0.75">
          <stop offset="0" stopColor="#a06a47" />
          <stop offset="0.6" stopColor="#7b4a2d" />
          <stop offset="1" stopColor="#5a321d" />
        </radialGradient>
        <linearGradient id={`sa-skin-hand-${uid}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#5f361f" />
          <stop offset="0.5" stopColor="#8a5534" />
          <stop offset="1" stopColor="#6a3d23" />
        </linearGradient>
        <radialGradient id={`sa-face-shade-${uid}`} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.35} />
        </radialGradient>
        <linearGradient id={`sa-neck-${uid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3e2213" />
          <stop offset="0.35" stopColor="#6a3e25" />
          <stop offset="1" stopColor="#5a331e" />
        </linearGradient>

        <linearGradient id={`sa-body-shade-${uid}`} gradientUnits="userSpaceOnUse" x1={70} x2={330} y1={0} y2={0}>
          <stop offset="0" stopColor="#000" stopOpacity={0.5} />
          <stop offset="0.3" stopColor="#000" stopOpacity={0.05} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.06} />
          <stop offset="0.7" stopColor="#000" stopOpacity={0.05} />
          <stop offset="1" stopColor="#000" stopOpacity={0.5} />
        </linearGradient>
        <linearGradient id={`sa-sleeve-shade-${uid}`} gradientUnits="userSpaceOnUse" x1={66} x2={130} y1={0} y2={0}>
          <stop offset="0" stopColor="#000" stopOpacity={0.55} />
          <stop offset="0.4" stopColor="#000" stopOpacity={0.08} />
          <stop offset="1" stopColor="#000" stopOpacity={0.45} />
        </linearGradient>
        <linearGradient id={`sa-leg-shade-${uid}`} gradientUnits="userSpaceOnUse" x1={122} x2={202} y1={0} y2={0}>
          <stop offset="0" stopColor="#000" stopOpacity={0.5} />
          <stop offset="0.45" stopColor="#fff" stopOpacity={0.05} />
          <stop offset="1" stopColor="#000" stopOpacity={0.4} />
        </linearGradient>
        <linearGradient id={`sa-lapel-shade-${uid}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.1} />
          <stop offset="1" stopColor="#000" stopOpacity={0.2} />
        </linearGradient>
        <linearGradient id={`sa-vertical-shade-${uid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.05} />
          <stop offset="0.6" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.25} />
        </linearGradient>
        <linearGradient id={`sa-satin-${uid}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#050507" />
          <stop offset="0.45" stopColor="#34343c" />
          <stop offset="0.55" stopColor="#1a1a20" />
          <stop offset="1" stopColor="#050507" />
        </linearGradient>
        <radialGradient id={`sa-satin-btn-${uid}`} cx="0.35" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#4a4a52" />
          <stop offset="1" stopColor="#050507" />
        </radialGradient>
        <radialGradient id={`sa-horn-${uid}`} cx="0.35" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#5a4636" />
          <stop offset="1" stopColor="#1a120c" />
        </radialGradient>
        <linearGradient id={`sa-shoe-${uid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3b2a21" />
          <stop offset="1" stopColor="#120c09" />
        </linearGradient>
        <linearGradient id={`sa-tie-${uid}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#2c4a8a" />
          <stop offset="0.5" stopColor="#4569b0" />
          <stop offset="1" stopColor="#2c4a8a" />
        </linearGradient>
        <pattern id={`sa-tie-weave-${uid}`} patternUnits="userSpaceOnUse" width={5} height={5} patternTransform="rotate(45)">
          <rect width={5} height={5} fill={U("sa-tie")} />
          <path d="M0 0 L0 5" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
        </pattern>
        <filter id={`sa-blur-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={4} />
        </filter>
        <filter id={`sa-blur-s-${uid}`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation={1.6} />
        </filter>
    </>
  );
}

// --- Assemblage -------------------------------------------------------------------

export function SuitAvatar({
  kind,
  details,
  fabricImage,
  trousersFabricImage,
  className,
}: {
  kind: SuitKind;
  /** Les choix du configurateur (groupe → option). */
  details: Record<string, string>;
  /** La photo du tissu choisi : elle habille la veste (et le pantalon). */
  fabricImage?: string | null;
  /** « Tissu différent » : la photo du tissu du pantalon. */
  trousersFabricImage?: string | null;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const U = (name: string) => `url(#${name}-${uid})`;
  const smoking = kind === "smoking";
  const base = smoking ? TUX : NAVY;
  const jacketFill = fabricImage ? `url(#sa-fab-${uid})` : `url(#sa-plain-${uid})`;
  const trousersFill =
    details.tissus === "different" && trousersFabricImage
      ? `url(#sa-fab2-${uid})`
      : jacketFill;

  const c = closure(details.style);
  const lowest = Math.max(...c.buttons.map((b) => b.y));
  const lapelFill = smoking ? U("sa-satin") : jacketFill;
  const lapelType = details.revers;
  const lapelWidth = details["largeur-revers"];
  const leftP: Pt = c.double ? { x: 160, y: c.roll } : { x: 204, y: c.roll };
  const rightP: Pt = c.double ? { x: 246, y: c.roll } : { x: 204, y: c.roll };
  const withVest = kind === "costume3" && Boolean(details.gilet);
  const gorge = gorgeLine(lapelType, lapelWidth);

  const lapel = (p: Pt) => (
    <g>
      <path d={lapelPath(p, lapelType, lapelWidth)} fill="#000" opacity={0.4} transform="translate(3 4)" filter={U("sa-blur")} />
      <path d={lapelPath(p, lapelType, lapelWidth)} fill={lapelFill} stroke={EDGE} strokeWidth={1} />
      <path d={lapelPath(p, lapelType, lapelWidth)} fill={U("sa-lapel-shade")} />
      {gorge && <path d={gorge} stroke="rgba(0,0,0,0.55)" strokeWidth={1} />}
    </g>
  );

  const sleeve = (
    <g>
      <path
        d="M86 198 C70 214 66 260 68 310 C70 390 70 480 74 566 L128 568 C128 480 129 390 128 320 C126 280 116 250 104 226 C98 214 92 204 86 198 Z"
        fill={jacketFill}
        stroke={EDGE}
        strokeWidth={1}
      />
      <path
        d="M86 198 C70 214 66 260 68 310 C70 390 70 480 74 566 L128 568 C128 480 129 390 128 320 C126 280 116 250 104 226 C98 214 92 204 86 198 Z"
        fill={U("sa-sleeve-shade")}
      />
      <g stroke="rgba(0,0,0,0.35)" strokeWidth={2.4} fill="none" filter={U("sa-blur-s")}>
        <path d="M76 392 C88 398 104 398 120 390" />
        <path d="M80 410 C92 414 106 412 118 406" />
        <path d="M110 240 C116 270 120 300 122 330" />
      </g>
      {[536, 546, 556].map((y) => (
        <circle key={y} cx={79} cy={y} r={2.6} fill={smoking ? U("sa-satin-btn") : U("sa-horn")} stroke="rgba(0,0,0,0.5)" strokeWidth={0.5} />
      ))}
      {/* Poignet de chemise */}
      <path d="M74 566 L128 568 L127 578 L76 576 Z" fill={SHIRT} stroke="rgba(0,0,0,0.3)" strokeWidth={0.8} />
      <Hand />
    </g>
  );

  return (
    <svg
      viewBox="0 0 400 980"
      role="img"
      aria-label={smoking ? "Homme en smoking" : "Homme en costume"}
      className={cn("h-full w-auto", className)}
    >
      <UidCtx.Provider value={uid}>
      <defs>
        {fabricImage && (
          <pattern id={`sa-fab-${uid}`} patternUnits="userSpaceOnUse" width={180} height={180}>
            <rect width={180} height={180} fill={base} />
            <image href={fabricImage} width={180} height={180} preserveAspectRatio="xMidYMid slice" />
          </pattern>
        )}
        {trousersFabricImage && (
          <pattern id={`sa-fab2-${uid}`} patternUnits="userSpaceOnUse" width={180} height={180}>
            <rect width={180} height={180} fill={base} />
            <image href={trousersFabricImage} width={180} height={180} preserveAspectRatio="xMidYMid slice" />
          </pattern>
        )}
        {/* Tissu uni : fine diagonale de sergé */}
        <pattern id={`sa-plain-${uid}`} patternUnits="userSpaceOnUse" width={4} height={4}>
          <rect width={4} height={4} fill={base} />
          <path d="M0 4 L4 0" stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        </pattern>

        <SuitDefs uid={uid} />
      </defs>

      <ellipse cx={200} cy={966} rx={110} ry={9} fill="#000" opacity={0.35} filter={U("sa-blur")} />

      <Neck />
      <Head />

      {/* Chemise, cravate ou nœud papillon */}
      <path d="M176 168 L224 168 L238 500 L162 500 Z" fill={SHIRT} />
      <path d="M180 174 L200 300 L220 174" fill="rgba(0,0,0,0.06)" />
      {smoking ? (
        <g>
          <path d="M200 186 L178 174 C174 180 174 194 178 200 Z" fill={U("sa-satin")} stroke="#000" strokeWidth={0.6} />
          <path d="M200 186 L222 174 C226 180 226 194 222 200 Z" fill={U("sa-satin")} stroke="#000" strokeWidth={0.6} />
          <rect x={194} y={180} width={12} height={12} rx={3} fill={U("sa-satin")} stroke="#000" strokeWidth={0.6} />
          {[230, 262, 294].map((y) => (
            <circle key={y} cx={200} cy={y} r={2.4} fill="#111" />
          ))}
        </g>
      ) : (
        <g>
          <path d="M195 196 C193 260 189 360 188 412 L200 428 L212 412 C211 360 207 260 205 196 Z" fill={U("sa-tie-weave")} stroke="rgba(0,0,0,0.4)" strokeWidth={0.8} />
          <path d="M191 176 L209 176 L205 198 L195 198 Z" fill={U("sa-tie-weave")} stroke="rgba(0,0,0,0.45)" strokeWidth={0.8} />
        </g>
      )}
      {/* Col de chemise */}
      <path d="M178 172 C184 160 192 156 200 156 C208 156 216 160 222 172 L220 180 C214 171 207 167 200 167 C193 167 186 171 180 180 Z" fill={SHIRT} stroke="rgba(0,0,0,0.25)" strokeWidth={0.8} />
      {!smoking && (
        <g fill={SHIRT} stroke="rgba(0,0,0,0.3)" strokeWidth={0.8}>
          <path d="M199 178 L183 166 L177 184 L185 206 Z" />
          <path d="M201 178 L217 166 L223 184 L215 206 Z" />
        </g>
      )}
      {smoking && (
        <g fill={SHIRT} stroke="rgba(0,0,0,0.3)" strokeWidth={0.8}>
          <path d="M194 172 L186 166 L186 176 Z" />
          <path d="M206 172 L214 166 L214 176 Z" />
        </g>
      )}

      {withVest && <Vest details={details} fill={jacketFill} />}

      <Trousers details={details} fill={trousersFill} satin={smoking} />


      {/* La veste */}
      <g>
        {(() => {
          const left = leftPanel(c.roll, c.double ? 204 : 204, lowest, c.double);
          const right = c.double ? doubleTopPanel(c.roll) : null;
          return (
            <>
              <path d={left} fill={jacketFill} stroke={EDGE} strokeWidth={1} />
              <path d={left} fill={U("sa-body-shade")} />
              <path d={left} fill={U("sa-vertical-shade")} />
              {lapel(leftP)}
              {right ? (
                <>
                  <path d={right} fill="#000" opacity={0.35} transform="translate(-3 2)" filter={U("sa-blur")} />
                  <path d={right} fill={jacketFill} stroke={EDGE} strokeWidth={1} />
                  <path d={right} fill={U("sa-body-shade")} />
                  <path d={right} fill={U("sa-vertical-shade")} />
                </>
              ) : (
                <g transform={MIRROR}>
                  <path d={left} fill={jacketFill} stroke={EDGE} strokeWidth={1} />
                  <path d={left} fill={U("sa-body-shade")} />
                  <path d={left} fill={U("sa-vertical-shade")} />
                </g>
              )}
              <g transform={MIRROR}>{lapel(rightP)}</g>
            </>
          );
        })()}

        {/* Plis de traction autour du bouton fermé */}
        <g stroke="rgba(0,0,0,0.3)" strokeWidth={3} fill="none" filter={U("sa-blur-s")}>
          <path d={`M${c.double ? 172 : 200} ${c.buttons[0].y} C176 ${c.buttons[0].y - 14} 158 ${c.buttons[0].y - 30} 140 ${c.buttons[0].y - 44}`} />
          <path d={`M${c.double ? 228 : 200} ${c.buttons[0].y} C224 ${c.buttons[0].y - 14} 242 ${c.buttons[0].y - 30} 260 ${c.buttons[0].y - 44}`} />
        </g>

        <Pockets slug={details.poches} fill={jacketFill} satin={smoking} />

        {/* Boutonnière au revers gauche du porteur */}
        <path d="M262 258 L274 262" stroke="rgba(0,0,0,0.6)" strokeWidth={1.4} />

        {c.buttons.map((b) => (
          <Button key={`${b.x}-${b.y}`} x={b.x} y={b.y} satin={smoking} />
        ))}
      </g>

      {/* Manches et mains */}
      {sleeve}
      <g transform={MIRROR}>{sleeve}</g>
      </UidCtx.Provider>
    </svg>
  );
}
