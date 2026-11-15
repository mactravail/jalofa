"use client";

import { createContext, useContext, useId } from "react";
import { cn } from "@/lib/utils";

/**
 * La femme qui porte la Tenue de Cérémonie (configurateur `ceremonie-femme`),
 * dans l'esprit Hockerty : une silhouette humaine réaliste, de face, éclairée
 * (dégradés, ombres, plis), dessin maison.
 *
 * Chaque planche se voit en direct : la coupe (robe à composer, grand boubou,
 * sirène, taille basse, ndokette, robe à cape, kaftan), le corsage et son
 * décolleté (froncé, à pinces, dentelle Grace…), les manches, la jupe, la
 * broderie dorée, la longueur (traîne comprise) et le foulard. Le tissu choisi
 * habille la tenue.
 *
 * Repère : viewBox 0 -40 400 1020, axe x=200. Menton y≈142, épaules y≈196,
 * taille y=360, hanches y≈450, sol y≈966.
 */

export const CEREMONY_AVATAR_SLUGS = new Set(["ceremonie-femme"]);

export function wearsCeremonyAvatar(slug: string | null | undefined): boolean {
  return Boolean(slug && CEREMONY_AVATAR_SLUGS.has(slug));
}

export const UidCtx = createContext("");
function useU() {
  const uid = useContext(UidCtx);
  return (name: string) => `url(#${name}-${uid})`;
}

export const EDGE = "rgba(0,0,0,0.5)";
export const ROYAL = "#2c3fb0";
export const GOLD = "#d4af37";
export const MIRROR = "translate(400 0) scale(-1 1)";

const WAIST = 360;

/** Hauteur de l'ourlet selon la longueur choisie. */
export const HEMS: Record<string, number> = {
  sol: 948,
  traine: 948,
  longue: 948,
  cheville: 900,
  midi: 780,
  genou: 680,
  courte: 640,
  "dessus-genou": 620,
  mini: 560,
};

type Pt = { x: number; y: number };
/** `band` : la partie brodée du décolleté (sans les coutures d'épaule). */
type Neck = { l: Pt; r: Pt; path: string; band?: string };

// --- Décolletés -----------------------------------------------------------------

export const NECKS: Record<string, Neck> = {
  rond: { l: { x: 112, y: 198 }, r: { x: 288, y: 198 }, path: "L170 184 Q200 214 230 184 L288 198" , band: "M170 184 Q200 214 230 184" },
  "rond-profond": {
    l: { x: 112, y: 198 },
    r: { x: 288, y: 198 },
    path: "L150 190 C154 236 178 256 200 256 C222 256 246 236 250 190 L288 198",
    band: "M150 190 C154 236 178 256 200 256 C222 256 246 236 250 190",
  },
  v: { l: { x: 112, y: 198 }, r: { x: 288, y: 198 }, path: "L174 186 L200 280 L226 186 L288 198" , band: "M174 186 L200 280 L226 186" },
  bateau: { l: { x: 106, y: 202 }, r: { x: 294, y: 202 }, path: "L130 192 Q200 206 270 192 L294 202" , band: "M130 192 Q200 206 270 192" },
  carre: {
    l: { x: 112, y: 198 },
    r: { x: 288, y: 198 },
    path: "L160 190 L162 238 Q162 248 172 248 L228 248 Q238 248 238 238 L240 190 L288 198",
    band: "M160 190 L162 238 Q162 248 172 248 L228 248 Q238 248 238 238 L240 190",
  },
  montant: {
    l: { x: 112, y: 198 },
    r: { x: 288, y: 198 },
    path: "L186 186 L186 150 L214 150 L214 186 L288 198",
    band: "M186 152 L214 152",
  },
  coeur: { l: { x: 120, y: 250 }, r: { x: 280, y: 250 }, path: "C140 234 176 234 200 262 C224 234 260 234 280 250" },
  cupidon: {
    l: { x: 120, y: 250 },
    r: { x: 280, y: 250 },
    path: "C146 238 178 238 194 248 L200 256 L206 248 C222 238 254 238 280 250",
  },
  bustier: { l: { x: 120, y: 252 }, r: { x: 280, y: 252 }, path: "Q200 238 280 252" },
  tiffany: {
    l: { x: 124, y: 252 },
    r: { x: 276, y: 252 },
    path: "C138 230 160 196 184 184 Q200 190 216 184 C240 196 262 230 276 252",
  },
  bettina: { l: { x: 96, y: 238 }, r: { x: 304, y: 238 }, path: "Q200 256 304 238" },
};

type Corsage = { neck: string; work: "fronce" | "pinces" | "drape" | "none"; lace?: string };

export const CORSAGES: Record<string, Corsage> = {
  "tiffany-fronce": { neck: "tiffany", work: "fronce" },
  "coeur-fronce": { neck: "coeur", work: "fronce" },
  "rond-profond-fronce": { neck: "rond-profond", work: "fronce" },
  "rond-fronce": { neck: "rond", work: "fronce" },
  "cupidon-fronce": { neck: "cupidon", work: "fronce" },
  "bustier-drape": { neck: "bustier", work: "drape" },
  "tiffany-pinces": { neck: "tiffany", work: "pinces" },
  "v-profond": { neck: "v", work: "pinces" },
  "rond-profond-pinces": { neck: "rond-profond", work: "pinces" },
  "rond-pinces": { neck: "rond", work: "pinces" },
  "cupidon-pinces": { neck: "cupidon", work: "pinces" },
  "carre-arrondi": { neck: "carre", work: "pinces" },
  bettina: { neck: "bettina", work: "fronce" },
  "princesse-dentelle": { neck: "coeur", work: "pinces", lace: "rond" },
  grace: { neck: "v", work: "pinces", lace: "montant" },
  "grace-coeur": { neck: "coeur", work: "pinces", lace: "montant" },
  "bandeau-grace": { neck: "bustier", work: "drape", lace: "montant" },
};

export const clipOf = (n: Neck) =>
  `M-50 1100 L-50 ${n.l.y} L${n.l.x} ${n.l.y} ${n.path} L450 ${n.r.y} L450 1100 Z`;
export const lineOf = (n: Neck) => `M${n.l.x} ${n.l.y} ${n.path}`;
/** Le point le plus bas du décolleté, au milieu. */
export const neckBottom = (n: Neck) => {
  const ys = [...n.path.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)]
    .filter((m) => Math.abs(Number(m[1]) - 200) < 12)
    .map((m) => Number(m[2]));
  return ys.length ? Math.max(...ys) : 200;
};

// --- Le corps -------------------------------------------------------------------

export const TORSO =
  "M184 180 C170 188 132 188 118 196 C106 204 106 226 116 248 C128 290 146 330 158 362 " +
  "C146 400 140 430 140 460 L260 460 C260 430 254 400 242 362 C254 330 272 290 284 248 " +
  "C294 226 294 204 282 196 C268 188 230 188 216 180 Z";

export const BODICE =
  "M182 146 L218 146 L218 184 C236 188 270 190 286 198 C296 206 294 226 284 248 " +
  "C272 290 254 330 242 364 L158 364 C146 330 128 290 116 248 C106 226 104 206 114 198 " +
  "C130 190 164 188 182 184 Z";

/** Bord extérieur / intérieur du bras gauche à la hauteur y. */
export function ao(y: number) {
  if (y <= 250) return 100;
  if (y <= 370) return 100 - ((y - 250) * 4) / 120;
  return 96 - ((y - 370) * 1) / 122;
}
export function ai(y: number) {
  if (y <= 256) return 130;
  if (y <= 372) return 130 - ((y - 256) * 8) / 116;
  return 122 - ((y - 372) * 6) / 122;
}

const ARM =
  "M120 194 C104 200 98 222 100 250 C100 300 98 340 96 370 C94 420 94 460 95 492 " +
  "L116 494 C118 460 120 420 122 372 C124 330 128 290 130 254 C132 230 132 210 120 194 Z";

export function Arm() {
  const U = useU();
  return <path d={ARM} fill={U("cv-skin-arm")} stroke="rgba(40,20,10,0.4)" strokeWidth={0.8} />;
}

export function Hand() {
  const U = useU();
  return (
    <g>
      <path
        d="M95 490 C90 508 90 532 96 548 C100 560 110 563 115 553 C120 540 121 516 117 492 Z"
        fill={U("cv-skin-arm")}
        stroke="rgba(40,20,10,0.4)"
        strokeWidth={0.8}
      />
      <path d="M114 504 C121 514 121 530 116 538 C112 532 112 516 113 506 Z" fill={U("cv-skin")} stroke="rgba(40,20,10,0.4)" strokeWidth={0.7} />
      <g stroke="rgba(40,20,10,0.35)" strokeWidth={0.7} fill="none">
        <path d="M101 530 C101 542 102 552 104 559" />
        <path d="M108 532 C109 544 109 552 110 558" />
      </g>
      {/* Bracelet doré */}
      <path d="M94 486 Q106 492 118 488" stroke={GOLD} strokeWidth={2.4} fill="none" />
    </g>
  );
}

export function Head({ foulard }: { foulard: string | undefined }) {
  const U = useU();
  const face =
    "M163 76 C163 44 180 26 200 26 C220 26 237 44 237 76 C237 102 232 118 222 130 C214 138 207 142 200 142 C193 142 186 138 178 130 C168 118 163 102 163 76 Z";
  return (
    <g>
      {foulard !== "moussor" && (
        <g fill="#100b09">
          <circle cx={200} cy={4} r={22} />
          <path d="M160 84 C152 44 172 14 200 13 C228 14 248 44 240 84 C236 62 226 44 200 42 C174 44 164 62 160 84 Z" />
        </g>
      )}
      <path d="M188 126 C189 150 187 166 184 186 L216 186 C213 166 211 150 212 128 Z" fill={U("cv-neck")} />
      <g fill={U("cv-skin")} stroke="rgba(40,20,10,0.45)" strokeWidth={0.7}>
        <path d="M164 80 C156 76 154 92 158 100 C160 106 164 108 166 104 Z" />
        <path d="M236 80 C244 76 246 92 242 100 C240 106 236 108 234 104 Z" />
      </g>
      <path d={face} fill={U("cv-skin")} />
      <path d={face} fill={U("cv-face-shade")} />
      {foulard !== "moussor" && (
        <path d="M163 74 C166 52 178 40 200 40 C222 40 234 52 237 74 C230 58 218 50 200 50 C182 50 170 58 163 74 Z" fill="#100b09" />
      )}
      {/* Boucles d'oreilles */}
      <g fill={GOLD}>
        <circle cx={160} cy={108} r={2.2} />
        <path d="M160 110 L155 128 Q160 134 165 128 Z" />
        <circle cx={240} cy={108} r={2.2} />
        <path d="M240 110 L235 128 Q240 134 245 128 Z" />
      </g>
      {/* Sourcils arqués */}
      <g fill="#140c09">
        <path d="M174 72 C180 66 189 66 194 70 L193 72 C188 69 181 69 175 74 Z" />
        <path d="M226 72 C220 66 211 66 206 70 L207 72 C212 69 219 69 225 74 Z" />
      </g>
      {[184, 216].map((cx) => (
        <g key={cx}>
          <path d={`M${cx - 8} 84 Q${cx} 77 ${cx + 8} 84 Q${cx} 89 ${cx - 8} 84 Z`} fill="#efe5d9" />
          <circle cx={cx} cy={83.6} r={3.3} fill="#2a160c" />
          <circle cx={cx} cy={83.6} r={1.4} fill="#000" />
          <circle cx={cx + 1} cy={82.6} r={0.7} fill="#fff" />
          <path d={`M${cx - 9} 84.5 Q${cx} 76 ${cx + 9.5} 83`} stroke="#0d0604" strokeWidth={2} fill="none" />
          <path d={`M${cx + 8} 82 L${cx + 11} 79`} stroke="#0d0604" strokeWidth={1} />
        </g>
      ))}
      <path d="M197 88 C196 98 193 104 192 108" stroke="rgba(50,22,10,0.3)" strokeWidth={1.2} fill="none" />
      <path d="M191 108 C190 113 195 115 200 114 C205 115 210 113 209 108 C207 111 204 111 202 109 L198 109 C196 111 193 111 191 108 Z" fill="rgba(55,25,12,0.5)" />
      <path d="M201 90 C203 98 204 102 203 106" stroke="rgba(255,220,190,0.2)" strokeWidth={2} fill="none" />
      {/* Lèvres */}
      <path d="M188 123 C193 119 197 120 200 121 C203 120 207 119 212 123 C206 125 194 125 188 123 Z" fill="#7a2a33" />
      <path d="M188 123 C194 131 206 131 212 123 C206 125 194 125 188 123 Z" fill="#8e3340" />
      <path d="M195 127 Q200 128 205 127" stroke="rgba(255,255,255,0.25)" strokeWidth={1} fill="none" />
    </g>
  );
}

// --- Les manches ------------------------------------------------------------------

function sleevePath(end: number, flare = 0) {
  const o = ao(end) - 3 - flare;
  const i = ai(end) + 3 + flare * 0.7;
  const mid = end > 380 ? `L${ao(370) - 3} 370 ` : "";
  const midIn = end > 380 ? `L${ai(372) + 3} 372 ` : "";
  return (
    `M124 191 C104 194 96 218 ${ao(250) - 3} 250 ${mid}` +
    `L${o} ${end + (flare ? 6 : 0)} L${i} ${end + (flare ? 6 : 0)} ${midIn}` +
    `L133 256 C132 230 130 206 124 191 Z`
  );
}

function ruffle(end: number) {
  const o = ao(end) - 3;
  const i = ai(end) + 3;
  return `M${o} ${end} L${o - 10} ${end + 24} Q${o - 4} ${end + 30} ${(o + i) / 2 - 6} ${end + 26} Q${(o + i) / 2} ${end + 32} ${(o + i) / 2 + 6} ${end + 26} Q${i + 4} ${end + 30} ${i + 10} ${end + 24} L${i} ${end} Z`;
}

export function Sleeve({ slug, fill }: { slug: string | undefined; fill: string }) {
  const U = useU();
  const shapes: string[] = [];
  switch (slug) {
    case undefined:
    case "sans":
      return null;
    case "cap":
      shapes.push("M124 191 C104 194 96 214 98 232 Q112 238 130 232 C131 214 129 200 124 191 Z");
      break;
    case "courte-ajustee":
    case "courtes":
      shapes.push(sleevePath(266));
      break;
    case "courte-volant":
      shapes.push(sleevePath(252), ruffle(252));
      break;
    case "courte-papillon":
    case "papillon":
      shapes.push("M124 191 C100 194 82 236 72 284 Q94 296 116 286 Q128 290 138 280 L133 256 C132 230 130 206 124 191 Z");
      break;
    case "coude-ajustee":
      shapes.push(sleevePath(370));
      break;
    case "coude-cloche":
      shapes.push(sleevePath(370, 14));
      break;
    case "coude-volant":
      shapes.push(sleevePath(346), ruffle(346));
      break;
    case "coude-papillon":
      shapes.push("M124 191 C98 196 74 270 58 396 Q90 414 124 400 Q132 404 138 396 L133 256 C132 230 130 206 124 191 Z");
      break;
    case "trois-quarts":
      shapes.push(sleevePath(420));
      break;
    case "longue":
    case "longues":
      shapes.push(sleevePath(488));
      break;
    case "longue-cloche":
    case "evasees":
      shapes.push(sleevePath(488, 18));
      break;
    case "longue-volant":
      shapes.push(sleevePath(462), ruffle(462));
      break;
    case "longue-bishop":
      shapes.push(
        "M124 191 C104 194 96 218 97 250 C92 330 80 420 84 466 C86 476 92 478 96 478 L118 478 C126 476 136 460 136 420 C136 360 134 300 133 256 C132 230 130 206 124 191 Z",
        "M95 474 L119 474 L118 490 L96 490 Z",
      );
      break;
    default:
      shapes.push(sleevePath(488));
  }
  return (
    <g>
      {shapes.map((d, k) => (
        <g key={k}>
          <path d={d} fill={fill} stroke={EDGE} strokeWidth={0.9} />
          <path d={d} fill={U("cv-sleeve-shade")} />
        </g>
      ))}
    </g>
  );
}

// --- Les jupes et les coupes -------------------------------------------------------

type Skirt = { d: string; hemL: number; hemR: number; folds: string[]; under?: string };

export function skirtFor(kind: string, hem: number): Skirt {
  const flared = (w: number, n: number): Skirt => {
    const l = 200 - w;
    const r = 200 + w;
    const folds = Array.from({ length: n }, (_, k) => {
      const t = (k + 1) / (n + 1);
      const top = 162 + 76 * t;
      const bottom = l + (r - l) * t;
      return `M${top} 400 C${top + (bottom - top) * 0.3} 560 ${bottom - (bottom - top) * 0.1} 760 ${bottom} ${hem - 4}`;
    });
    return {
      d: `M158 360 C${158 - w * 0.25} 420 ${l + w * 0.12} 700 ${l} ${hem} Q200 ${hem + 16} ${r} ${hem} C${r - w * 0.12} 700 ${242 + w * 0.25} 420 242 360 Z`,
      hemL: l,
      hemR: r,
      folds,
    };
  };
  switch (kind) {
    case "cercle":
      return flared(170, 7);
    case "trois-quarts-cercle":
      return flared(148, 6);
    case "demi-cercle":
      return flared(120, 5);
    case "plissee": {
      const s = flared(104, 0);
      s.folds = Array.from({ length: 13 }, (_, k) => {
        const t = (k + 1) / 14;
        return `M${160 + 80 * t} 372 L${96 + 208 * t} ${hem - 2}`;
      });
      return s;
    }
    case "panneaux": {
      const s = flared(96, 0);
      s.folds = [0.2, 0.4, 0.6, 0.8].map((t) => `M${160 + 80 * t} 362 L${104 + 192 * t} ${hem}`);
      return s;
    }
    case "plongeant":
      return {
        d: `M158 360 C130 430 84 700 60 ${hem} C110 ${hem - 70} 160 680 200 650 C240 680 290 ${hem - 70} 340 ${hem} C316 700 270 430 242 360 Z`,
        under: `M118 580 C92 760 72 860 60 ${hem} Q200 ${hem + 14} 340 ${hem} C328 860 308 760 282 580 Z`,
        hemL: 60,
        hemR: 340,
        folds: [`M180 400 C170 500 150 600 120 760`, `M220 400 C230 500 250 600 280 760`],
      };
    case "ligne-a":
      return {
        d: `M158 360 C146 400 140 440 140 470 C136 ${Math.min(640, hem - 160)} ${122 + (948 - hem) * 0.04} ${hem - 120} ${112 + (948 - hem) * 0.06} ${hem} Q200 ${hem + 8} ${288 - (948 - hem) * 0.06} ${hem} C${278 - (948 - hem) * 0.04} ${hem - 120} 264 ${Math.min(640, hem - 160)} 260 470 C260 440 254 400 242 360 Z`,
        hemL: 112,
        hemR: 288,
        folds: [`M172 480 C168 560 160 ${hem - 100} 152 ${hem - 8}`, `M228 480 C232 560 240 ${hem - 100} 248 ${hem - 8}`],
      };
    case "crayon":
      return {
        d: `M158 360 C146 400 140 440 140 470 C142 ${Math.min(640, hem - 160)} 150 ${hem - 120} 152 ${hem} L248 ${hem} C250 ${hem - 120} 258 ${Math.min(640, hem - 160)} 260 470 C260 440 254 400 242 360 Z`,
        hemL: 152,
        hemR: 248,
        folds: [`M200 560 L200 ${hem - 8}`],
      };
    case "sirene":
    default: {
      // Le genou de la sirène suit la longueur : la queue reste proportionnée.
      const k = Math.min(710, hem - 110);
      const f = (948 - hem) * 0.12;
      return {
        d: `M158 360 C146 400 140 440 140 470 C142 ${k - 150} 152 ${k - 70} 160 ${k} C138 ${k + (hem - k) * 0.33} ${92 + f} ${k + (hem - k) * 0.7} ${78 + f} ${hem} Q200 ${hem + 14} ${322 - f} ${hem} C${308 - f} ${k + (hem - k) * 0.7} 262 ${k + (hem - k) * 0.33} 240 ${k} C248 ${k - 70} 258 ${k - 150} 260 470 C260 440 254 400 242 360 Z`,
        hemL: 78 + f,
        hemR: 322 - f,
        folds: [`M170 ${k + 10} C150 ${k + 60} ${128 + f} ${hem - 60} ${116 + f} ${hem - 8}`, `M200 ${k + 30} L200 ${hem - 4}`, `M230 ${k + 10} C250 ${k + 60} ${272 - f} ${hem - 60} ${284 - f} ${hem - 8}`],
      };
    }
  }
}

// --- Broderie dorée ----------------------------------------------------------------

export function GoldBand({ d, w }: { d: string; w: number }) {
  const U = useU();
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke="#7a5a14" strokeWidth={w + 2.5} />
      <path d={d} stroke={U("cv-embro")} strokeWidth={w} />
    </g>
  );
}

/** Les dégradés partagés (peau, ombres…), suffixés par `uid`. */
export function CeremonyDefs({ uid }: { uid: string }) {
  return (
    <>
          <pattern id={`cv-lace-${uid}`} patternUnits="userSpaceOnUse" width={8} height={8}>
            <circle cx={4} cy={4} r={2.4} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={0.7} />
            <circle cx={0} cy={0} r={1} fill="rgba(255,255,255,0.35)" />
          </pattern>
          <pattern id={`cv-embro-${uid}`} patternUnits="userSpaceOnUse" width={10} height={10}>
            <rect width={10} height={10} fill="#b8901f" />
            <circle cx={5} cy={5} r={2.2} fill="#f3d77a" />
            <circle cx={5} cy={5} r={0.9} fill="#8a6612" />
            <circle cx={0} cy={0} r={1.3} fill="#f7e3a0" />
            <circle cx={10} cy={10} r={1.3} fill="#f7e3a0" />
            <circle cx={0} cy={10} r={1.3} fill="#f7e3a0" />
            <circle cx={10} cy={0} r={1.3} fill="#f7e3a0" />
          </pattern>
          <radialGradient id={`cv-skin-${uid}`} cx="0.45" cy="0.38" r="0.75">
            <stop offset="0" stopColor="#a8704b" />
            <stop offset="0.6" stopColor="#82502f" />
            <stop offset="1" stopColor="#5e3520" />
          </radialGradient>
          <linearGradient id={`cv-skin-arm-${uid}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#5f361f" />
            <stop offset="0.45" stopColor="#93603d" />
            <stop offset="1" stopColor="#6a3d23" />
          </linearGradient>
          <linearGradient id={`cv-torso-${uid}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#5f361f" />
            <stop offset="0.5" stopColor="#93603d" />
            <stop offset="1" stopColor="#5f361f" />
          </linearGradient>
          <radialGradient id={`cv-face-shade-${uid}`} cx="0.5" cy="0.45" r="0.6">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.3} />
          </radialGradient>
          <linearGradient id={`cv-neck-${uid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#3e2213" />
            <stop offset="0.35" stopColor="#734429" />
            <stop offset="1" stopColor="#6a3d23" />
          </linearGradient>
          <linearGradient id={`cv-body-shade-${uid}`} gradientUnits="userSpaceOnUse" x1={30} x2={370} y1={0} y2={0}>
            <stop offset="0" stopColor="#000" stopOpacity={0.55} />
            <stop offset="0.32" stopColor="#000" stopOpacity={0.08} />
            <stop offset="0.48" stopColor="#fff" stopOpacity={0.1} />
            <stop offset="0.68" stopColor="#000" stopOpacity={0.08} />
            <stop offset="1" stopColor="#000" stopOpacity={0.55} />
          </linearGradient>
          <linearGradient id={`cv-sleeve-shade-${uid}`} gradientUnits="userSpaceOnUse" x1={60} x2={140} y1={0} y2={0}>
            <stop offset="0" stopColor="#000" stopOpacity={0.5} />
            <stop offset="0.45" stopColor="#fff" stopOpacity={0.06} />
            <stop offset="1" stopColor="#000" stopOpacity={0.4} />
          </linearGradient>
          <linearGradient id={`cv-shoe-${uid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#e6c86a" />
            <stop offset="1" stopColor="#8a6a1f" />
          </linearGradient>
          <filter id={`cv-blur-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={3} />
          </filter>
    </>
  );
}

// --- Assemblage -------------------------------------------------------------------

export function CeremonyAvatar({
  details,
  fabricImage,
  className,
}: {
  /** Les choix du configurateur (groupe → option). */
  details: Record<string, string>;
  /** La photo du tissu choisi : elle habille la tenue. */
  fabricImage?: string | null;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const U = (name: string) => `url(#${name}-${uid})`;
  const fill = fabricImage ? U("cv-fab") : U("cv-plain");

  const coupe = details.coupe ?? "composee";
  const composee = coupe === "composee";
  // Les autres robes n'ont pas de corsage : leur encolure (« col ») en tient lieu.
  const corsage: Corsage | null = composee
    ? (CORSAGES[details.corsage ?? ""] ??
      (details.col && NECKS[details.col]
        ? { neck: details.col, work: "pinces" }
        : CORSAGES["tiffany-fronce"]))
    : null;
  const neck = NECKS[corsage?.neck ?? details.col ?? "rond"] ?? NECKS.rond;
  const lace = corsage?.lace ? NECKS[corsage.lace] : null;
  const longueur = details.longueur ?? "sol";
  const hem = HEMS[longueur] ?? 948;
  const broderie = details.broderie ?? "choisir";
  const foulard = details.foulard;

  const loose = coupe === "grand-boubou" || coupe === "kaftan";
  const sleeveSlug = composee
    ? corsage?.neck === "bettina"
      ? "sans"
      : details["manches-robe"]
    : ["sirene", "taille-basse", "ndokette"].includes(coupe)
      ? details.manches
      : "sans";

  const skirtKind = composee
    ? (details.jupe ?? "cercle")
    : coupe === "taille-basse"
      ? "crayon"
      : coupe === "ndokette"
        ? "ligne-a"
        : "sirene";
  const skirt = skirtFor(skirtKind, hem);
  const nb = neckBottom(neck);

  const shaded = (d: string, extra?: React.ReactNode) => (
    <g>
      <path d={d} fill={fill} stroke={EDGE} strokeWidth={1} />
      <path d={d} fill={U("cv-body-shade")} />
      {extra}
    </g>
  );

  const train =
    longueur === "traine" && !loose ? (
      <path
        d={`M${skirt.hemL + 20} ${hem - 60} C30 ${hem + 10} 10 ${hem + 34} 40 ${hem + 44} Q200 ${hem + 64} 360 ${hem + 44} C390 ${hem + 34} 370 ${hem + 10} ${skirt.hemR - 20} ${hem - 60} Z`}
        fill={fill}
        stroke={EDGE}
        strokeWidth={1}
      />
    ) : null;

  // Le haut fermé : grand boubou et kaftan couvrent bras et robe.
  const looseBody =
    coupe === "grand-boubou"
      ? `M170 184 L104 200 C70 230 44 330 34 520 C40 600 58 800 60 ${hem} L340 ${hem} C342 800 360 600 366 520 C356 330 330 230 296 200 L230 184 Z`
      : `M170 184 L116 198 C110 240 122 300 124 360 C124 500 120 700 116 ${hem} L284 ${hem} C280 700 276 500 276 360 C278 300 290 240 284 198 L230 184 Z`;
  const kaftanSleeve =
    "M118 196 C92 206 80 260 74 320 C66 400 56 460 52 510 Q86 526 122 508 C124 440 128 340 132 256 Z";

  const embroidery = broderie !== "sans" && (
    <g>
      <GoldBand d={neck.band ?? lineOf(neck)} w={broderie === "choisir" ? 9 : 7} />
      <GoldBand d={`M200 ${nb + 6} L200 ${loose ? 620 : broderie === "choisir" ? 352 : 320}`} w={broderie === "choisir" ? 16 : 12} />
      {broderie === "choisir" && (
        <>
          <GoldBand
            d={
              loose
                ? `M${coupe === "grand-boubou" ? 66 : 120} ${hem - 14} L${coupe === "grand-boubou" ? 334 : 280} ${hem - 14}`
                : `M${skirt.hemL + 6} ${hem - 12} Q200 ${hem + 2} ${skirt.hemR - 6} ${hem - 12}`
            }
            w={12}
          />
          {!loose && <GoldBand d="M160 360 Q200 366 240 360" w={8} />}
        </>
      )}
    </g>
  );

  return (
    <svg
      viewBox="0 -40 400 1020"
      role="img"
      aria-label="Femme en tenue de cérémonie"
      className={cn("h-full w-auto", className)}
    >
      <UidCtx.Provider value={uid}>
        <defs>
          {fabricImage && (
            <pattern id={`cv-fab-${uid}`} patternUnits="userSpaceOnUse" width={200} height={200}>
              <rect width={200} height={200} fill={ROYAL} />
              <image href={fabricImage} width={200} height={200} preserveAspectRatio="xMidYMid slice" />
            </pattern>
          )}
          <pattern id={`cv-plain-${uid}`} patternUnits="userSpaceOnUse" width={6} height={6}>
            <rect width={6} height={6} fill={ROYAL} />
            <circle cx={3} cy={3} r={0.6} fill="rgba(255,255,255,0.08)" />
          </pattern>
          <CeremonyDefs uid={uid} />
          <clipPath id={`cv-neck-clip-${uid}`}>
            <path d={clipOf(neck)} />
          </clipPath>
          {lace && (
            <clipPath id={`cv-lace-clip-${uid}`}>
              <path d={clipOf(lace)} />
            </clipPath>
          )}
        </defs>

        <ellipse cx={200} cy={968} rx={150} ry={10} fill="#000" opacity={0.35} filter={U("cv-blur")} />

        {/* Jambes et escarpins (visibles sous un ourlet plongeant ou à la cheville) */}
        <g>
          {[0, 1].map((k) => (
            <g key={k} transform={k ? MIRROR : undefined}>
              <path d="M152 450 L196 450 L188 932 L172 932 Z" fill={U("cv-skin-arm")} />
              <path d="M166 926 L192 926 C196 940 194 954 188 962 L178 966 C170 964 166 950 166 926 Z" fill={U("cv-shoe")} stroke="rgba(0,0,0,0.5)" strokeWidth={0.7} />
            </g>
          ))}
        </g>

        <path d={TORSO} fill={U("cv-torso")} />
        <path d="M150 204 Q170 212 192 206 M208 206 Q230 212 250 204" stroke="rgba(40,20,10,0.35)" strokeWidth={1} fill="none" />

        {train}

        {!loose && (
          <>
            {/* Jupe */}
            {skirt.under && <path d={skirt.under} fill={fill} opacity={0.75} stroke={EDGE} strokeWidth={1} />}
            {shaded(
              skirt.d,
              <g stroke="rgba(0,0,0,0.35)" strokeWidth={3} fill="none" filter={U("cv-blur")}>
                {skirt.folds.map((d) => (
                  <path key={d} d={d} />
                ))}
              </g>,
            )}
            {coupe === "ndokette" && (
              <>
                {shaded(`M112 ${hem - 90} C100 ${hem - 40} 70 ${hem - 6} 60 ${hem + 2} Q200 ${hem + 22} 340 ${hem + 2} C330 ${hem - 6} 300 ${hem - 40} 288 ${hem - 90} Q200 ${hem - 80} 112 ${hem - 90} Z`)}
                {shaded("M156 352 C126 410 96 460 80 490 Q110 500 140 494 Q170 506 200 498 Q230 506 260 494 Q290 500 320 490 C304 460 274 410 244 352 Z")}
              </>
            )}
            {coupe === "taille-basse" &&
              shaded("M158 352 L242 352 C254 400 262 440 264 474 Q232 496 200 488 Q168 496 136 474 C138 440 146 400 158 352 Z")}

            {/* Corsage : dentelle éventuelle, puis le corsage découpé par son décolleté */}
            {lace && (
              <g clipPath={U("cv-lace-clip")}>
                <path d={BODICE} fill={fill} opacity={0.45} />
                <path d={BODICE} fill={U("cv-lace")} />
              </g>
            )}
            <g clipPath={U("cv-neck-clip")}>
              {shaded(BODICE)}
              {corsage?.work === "fronce" && (
                <g fill="none">
                  <path d="M150 300 Q200 308 250 300" stroke={EDGE} strokeWidth={1.2} />
                  <g stroke="rgba(0,0,0,0.3)" strokeWidth={1}>
                    {[164, 178, 192, 208, 222, 236].map((x) => (
                      <path key={x} d={`M${x} 300 Q${x - 3} 270 ${x + 2} 240`} />
                    ))}
                  </g>
                </g>
              )}
              {corsage?.work === "pinces" && (
                <g stroke="rgba(0,0,0,0.35)" strokeWidth={1} fill="none">
                  <path d="M178 362 L180 296" />
                  <path d="M222 362 L220 296" />
                </g>
              )}
              {corsage?.work === "drape" && (
                <g stroke="rgba(0,0,0,0.3)" strokeWidth={2} fill="none" filter={U("cv-blur")}>
                  <path d="M128 262 Q180 300 240 340" />
                  <path d="M134 290 Q186 320 236 352" />
                  <path d="M272 262 Q230 286 204 300" />
                </g>
              )}
              {coupe === "cape" && (
                <path d="M112 198 C90 206 72 240 66 290 Q200 330 334 290 C328 240 310 206 288 198 L230 184 L170 184 Z" fill={fill} stroke={EDGE} strokeWidth={0.9} />
              )}
            </g>
            {corsage?.neck === "bettina" && (
              <g>
                {shaded("M88 228 Q200 252 312 228 L316 262 Q200 286 84 262 Z")}
                <path d="M84 262 Q200 286 316 262" stroke="rgba(0,0,0,0.35)" strokeWidth={1} fill="none" />
                <g stroke="rgba(0,0,0,0.3)" strokeWidth={1}>
                  {[110, 140, 170, 200, 230, 260, 290].map((x) => (
                    <path key={x} d={`M${x} ${240 + Math.abs(200 - x) * -0.05} L${x - 2} 270`} />
                  ))}
                </g>
              </g>
            )}
          </>
        )}

        {/* Bras, manches et mains */}
        {[0, 1].map((k) => (
          <g key={k} transform={k ? MIRROR : undefined}>
            <Arm />
            {!loose && <Sleeve slug={sleeveSlug} fill={fill} />}
            {!loose && <Hand />}
          </g>
        ))}

        {loose && (
          <g clipPath={U("cv-neck-clip")}>
            {shaded(looseBody)}
            {coupe === "grand-boubou" ? (
              <g stroke="rgba(0,0,0,0.35)" strokeWidth={3} fill="none" filter={U("cv-blur")}>
                <path d="M40 520 C70 500 96 492 120 500" />
                <path d="M360 520 C330 500 304 492 280 500" />
                <path d={`M120 520 C112 ${hem - 260} 100 ${hem - 120} 96 ${hem - 8}`} />
                <path d={`M280 520 C288 ${hem - 260} 300 ${hem - 120} 304 ${hem - 8}`} />
              </g>
            ) : (
              <>
                {shaded(kaftanSleeve)}
                <g transform={MIRROR}>{shaded(kaftanSleeve)}</g>
              </>
            )}
          </g>
        )}
        {loose && (
          <>
            <Hand />
            <g transform={MIRROR}>
              <Hand />
            </g>
          </>
        )}

        {/* Robe à cape : voile transparent tombant des épaules */}
        {coupe === "cape" &&
          [0, 1].map((k) => (
            <g key={k} transform={k ? MIRROR : undefined}>
              <path
                d="M70 284 C54 400 50 560 66 760 Q100 784 136 756 C126 600 130 420 144 304 Z"
                fill={fill}
                opacity={0.55}
                stroke={EDGE}
                strokeWidth={0.8}
              />
              <path d="M84 320 C78 460 80 600 92 740" stroke="rgba(255,255,255,0.15)" strokeWidth={2} fill="none" />
            </g>
          ))}

        {embroidery}

        {/* Châle assorti */}
        {foulard === "chale" &&
          [0, 1].map((k) => (
            <g key={k} transform={k ? MIRROR : undefined}>
              {shaded("M184 186 C152 190 120 194 104 212 C94 300 90 420 92 566 L132 566 C130 440 132 320 142 232 C154 212 170 198 184 186 Z")}
              <g stroke={fill} strokeWidth={1.5}>
                {[96, 102, 108, 114, 120, 126].map((x) => (
                  <path key={x} d={`M${x} 566 L${x} 580`} />
                ))}
              </g>
            </g>
          ))}

        <Head foulard={foulard} />

        {/* Foulard (moussor) noué en hauteur */}
        {foulard === "moussor" && (
          <g>
            {shaded(
              "M156 82 C146 40 160 -6 200 -18 C238 -26 264 0 254 46 C252 62 248 74 244 84 C232 60 220 50 200 50 C180 50 166 62 156 82 Z",
              <g stroke="rgba(0,0,0,0.35)" strokeWidth={1.4} fill="none">
                <path d="M162 60 C180 30 220 16 248 30" />
                <path d="M160 40 C186 10 224 0 252 12" />
              </g>,
            )}
            {shaded("M212 -14 C226 -40 256 -44 270 -30 C262 -18 246 -10 226 -6 Z")}
            {shaded("M196 -16 C180 -40 154 -40 144 -26 C156 -16 172 -12 190 -10 Z")}
          </g>
        )}
      </UidCtx.Provider>
    </svg>
  );
}
