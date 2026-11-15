"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * L'avatar qui porte la chemise (configurateur des chemises JALOFA EUROPE).
 *
 * Un homme ou une femme, de face, habillé de la chemise en cours de
 * personnalisation : chaque planche choisie à l'étape Style se voit tout de
 * suite sur l'avatar (manches, façon de la porter, col, poignets, boutonnage,
 * poche, bas, chemise ou blouse). Le tissu choisi habille la chemise.
 *
 * Repère : viewBox 200 × 460. Encolure y≈70, épaules y=80, taille y≈200 (homme)
 * / 178 (femme), poignets y=208, sol y≈446.
 */

export type ShirtWearer = "homme" | "femme";

/** Les chemises portées par l'avatar (slug du modèle → silhouette). */
const SHIRT_AVATAR_SLUGS: Record<string, ShirtWearer> = {
  "europe-chemise-homme": "homme",
  "europe-chemise-femme": "femme",
};

export function shirtWearerFor(slug: string | null | undefined): ShirtWearer | null {
  return (slug && SHIRT_AVATAR_SLUGS[slug]) || null;
}

const INK = "#2b2b38";
const CLOTH = "#f1f1f4";
const FOLD = "#9a9aa6";
const SKIN = "#8a5a3c";
const HAIR = "#17171c";
const TROUSERS = "#7b7d88";
const SHOES = "#3a2a22";

const WRIST_Y = 208;

type Fig = {
  /** Point d'épaule gauche (côté gauche de l'image). */
  shX: number;
  /** Aisselle gauche. */
  apX: number;
  apY: number;
};

const FIG: Record<ShirtWearer, Fig> = {
  homme: { shX: 56, apX: 64, apY: 112 },
  femme: { shX: 62, apX: 68, apY: 110 },
};

const mirror = (x: number) => 200 - x;

/** Bord extérieur du bras gauche à la hauteur y. */
const outerX = (f: Fig, y: number) => f.shX - ((y - 80) * 18) / 128;
/** Bord intérieur du bras gauche à la hauteur y. */
const innerX = (f: Fig, y: number) => f.apX - ((y - f.apY) * 8) / (WRIST_Y - f.apY);

/** Dessine le côté gauche puis son miroir. */
function Both({ children }: { children: React.ReactNode }) {
  return (
    <>
      <g>{children}</g>
      <g transform="translate(200 0) scale(-1 1)">{children}</g>
    </>
  );
}

// --- Le corps -----------------------------------------------------------------

function Head({ wearer }: { wearer: ShirtWearer }) {
  return (
    <g stroke={INK} strokeWidth={1.2} strokeLinejoin="round">
      {wearer === "femme" && (
        <path
          d="M83 36 C80 12 120 12 117 36 C119 52 122 70 114 78 L86 78 C78 70 81 52 83 36 Z"
          fill={HAIR}
        />
      )}
      <rect x={93} y={52} width={14} height={24} fill={SKIN} />
      <ellipse cx={100} cy={38} rx={15} ry={19} fill={SKIN} />
      {wearer === "homme" ? (
        <path
          d="M85 35 C83 18 95 14 104 16 C114 17 118 26 115 35 C112 27 106 24 100 26 C94 24 88 28 85 35 Z"
          fill={HAIR}
        />
      ) : (
        <path d="M85 33 C86 18 96 15 102 17 C110 17 116 24 115 33 C108 26 96 22 85 33 Z" fill={HAIR} />
      )}
    </g>
  );
}

function Arms({ f }: { f: Fig }) {
  const oW = outerX(f, WRIST_Y);
  const iW = innerX(f, WRIST_Y);
  const arm =
    `M${f.shX + 4} 80 Q${f.shX - 6} 92 ${outerX(f, 112)} 112 ` +
    `L${oW} ${WRIST_Y} L${iW} ${WRIST_Y + 1} L${f.apX} ${f.apY - 6} Z`;
  return (
    <Both>
      <path d={arm} fill={SKIN} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
      <ellipse cx={(oW + iW) / 2} cy={WRIST_Y + 12} rx={7} ry={12} fill={SKIN} stroke={INK} strokeWidth={1.2} />
    </Both>
  );
}

function Trousers({ wearer }: { wearer: ShirtWearer }) {
  const d =
    wearer === "homme"
      ? "M66 198 L134 198 L137 240 L127 436 L104 436 L100 262 L96 436 L73 436 L63 240 Z"
      : "M74 176 L126 176 C134 196 136 214 134 240 L124 436 L104 436 L100 252 L96 436 L76 436 L66 240 C64 214 66 196 74 176 Z";
  const top = wearer === "homme" ? 198 : 176;
  return (
    <g stroke={INK} strokeWidth={1.3} strokeLinejoin="round">
      <path d={d} fill={TROUSERS} />
      <path d={`M${wearer === "homme" ? 66 : 74} ${top + 7} L${wearer === "homme" ? 134 : 126} ${top + 7}`} />
      <g fill="none" stroke="#5c5e69" strokeWidth={0.9}>
        <path d="M84 280 L85 432" />
        <path d="M116 280 L115 432" />
      </g>
      {/* Chaussures */}
      <Both>
        {wearer === "homme" ? (
          <path d="M73 434 L97 434 L98 444 C90 449 70 449 66 444 C66 440 70 436 73 434 Z" fill={SHOES} />
        ) : (
          <path d="M77 434 L96 434 L97 444 C90 447 78 447 74 444 Z" fill={SHOES} />
        )}
      </Both>
    </g>
  );
}

// --- La chemise ---------------------------------------------------------------

type Hem = { side: number; center: number; d: string };

/** Le bas de la chemise, du côté gauche (x=l) au côté droit. */
function hem(kind: string | undefined, tucked: boolean, l: number, wearer: ShirtWearer): Hem {
  const r = mirror(l);
  if (tucked) return { side: 210, center: 212, d: `L${l} 210 Q100 214 ${r} 210` };
  const base = wearer === "homme" ? 246 : 234;
  if (kind === "droit") return { side: base, center: base, d: `L${l} ${base} L${r} ${base}` };
  return {
    side: base - 10,
    center: base + 8,
    d: `L${l} ${base - 10} C${l + 4} ${base + 4} ${l + 24} ${base + 8} 100 ${base + 8} C${r - 24} ${base + 8} ${r - 4} ${base + 4} ${r} ${base - 10}`,
  };
}

/** Le corps de la chemise (sans les manches). */
function bodyPath(f: Fig, wearer: ShirtWearer, blouse: boolean, sleeveless: boolean, h: Hem, hemL: number) {
  const sh = sleeveless ? f.shX + 7 : f.shX;
  const ap = sleeveless ? f.apX + 1 : f.apX;
  let left: string;
  let right: string;
  if (wearer === "homme") {
    left = `L${ap} ${f.apY} C${ap + 2} 150 ${hemL} 180 `;
    right = `C${mirror(hemL)} 180 ${mirror(ap + 2)} 150 ${mirror(ap)} ${f.apY} `;
  } else if (blouse) {
    left = `L${ap} ${f.apY} C${ap - 2} 140 ${hemL + 2} 180 `;
    right = `C${mirror(hemL + 2)} 180 ${mirror(ap - 2)} 140 ${mirror(ap)} ${f.apY} `;
  } else {
    left = `L${ap} ${f.apY} C${ap - 4} 130 ${ap + 6} 160 ${ap + 7} 178 C${ap + 4} 196 ${hemL} 206 `;
    right = `C${mirror(hemL)} 206 ${mirror(ap + 4)} 196 ${mirror(ap + 7)} 178 C${mirror(ap + 6)} 160 ${mirror(ap - 4)} 130 ${mirror(ap)} ${f.apY} `;
  }
  // L'hem part de (hemL, side) : on remplace son « L » initial par la courbe.
  const hemD = h.d.replace(/^L[\d.]+ [\d.]+/, "");
  return (
    `M88 70 L${sh} 80 ${left}${hemL} ${h.side}${hemD} ` +
    `${right}L${mirror(sh)} 80 L112 70 L100 88 Z`
  );
}

function sleevePath(f: Fig, end: number) {
  return (
    `M${f.shX} 79 Q${f.shX - 8} 92 ${outerX(f, 112) - 2} 112 ` +
    `L${outerX(f, end) - 2} ${end} L${innerX(f, end) + 2} ${end + 1} L${f.apX} ${f.apY} Z`
  );
}

function Cuff({ f, end, slug }: { f: Fig; end: number; slug: string | undefined }) {
  const tall = slug === "mousquetaire";
  const top = end - (tall ? 18 : 13);
  const o1 = outerX(f, top) - 2;
  const i1 = innerX(f, top) + 2;
  const o2 = outerX(f, end) - 2;
  const i2 = innerX(f, end) + 2;
  const d =
    slug === "arrondi"
      ? `M${o1} ${top} L${i1} ${top} L${i2} ${end - 4} Q${i2} ${end + 1} ${i2 - 4} ${end + 1} L${o2 + 4} ${end} Q${o2} ${end} ${o2} ${end - 4} Z`
      : `M${o1} ${top} L${i1} ${top} L${i2} ${end + 1} L${o2} ${end} Z`;
  const bx = i2 - 3;
  return (
    <g stroke={INK} strokeWidth={1.1}>
      <path d={d} fill="inherit" />
      {tall ? (
        <>
          <path d={`M${(o1 + o2) / 2} ${top + 9} L${(i1 + i2) / 2} ${top + 9}`} fill="none" />
          <rect x={bx - 2} y={top + 11} width={4} height={4} fill="#c9a24a" strokeWidth={0.6} />
        </>
      ) : (
        <>
          <circle cx={bx} cy={top + 7} r={1.4} fill="#fff" strokeWidth={0.5} />
          {slug === "deux-boutons" && <circle cx={bx - 4} cy={top + 7} r={1.4} fill="#fff" strokeWidth={0.5} />}
        </>
      )}
    </g>
  );
}

function Collar({ slug }: { slug: string | undefined }) {
  const stand = (h: number) => (
    <path d={`M88 ${70 - h} Q100 ${75 - h} 112 ${70 - h} L112 71 Q100 76 88 71 Z`} />
  );
  const wings = (l: string) => (
    <Both>
      <path d={l} />
    </Both>
  );
  switch (slug) {
    case "mao":
      return (
        <g>
          <path d="M100 90 L88 70 L112 70 Z" stroke="none" />
          <path d="M88 62 Q100 67 112 62 L112 71 Q100 78 88 71 Z" />
        </g>
      );
    case "rond":
      return (
        <g>
          {stand(4)}
          {wings("M100 82 C93 74 82 72 81 82 C80 92 94 94 100 84 Z")}
        </g>
      );
    case "lavalliere":
      return (
        <g>
          {stand(5)}
          <path d="M100 82 C92 74 84 74 84 80 C84 88 94 86 100 82 Z" />
          <path d="M100 82 C108 74 116 74 116 80 C116 88 106 86 100 82 Z" />
          <path d="M98 84 C94 98 90 112 88 124 L94 125 C96 112 99 98 101 86 Z" />
          <path d="M102 84 C104 98 106 110 110 120 L115 117 C111 106 106 96 103 84 Z" />
          <rect x={97} y={78} width={6} height={7} rx={2} />
        </g>
      );
    case "italien":
      return (
        <g>
          {stand(6)}
          {wings("M100 80 L90 63 L76 70 L79 83 Z")}
        </g>
      );
    case "pointes-courtes":
      return (
        <g>
          {stand(5)}
          {wings("M100 80 L90 63 L83 71 L88 84 Z")}
        </g>
      );
    case "classique-2":
      return (
        <g>
          {stand(9)}
          {wings("M100 80 L90 60 L81 70 L85 92 Z")}
          <circle cx={100} cy={64} r={1.2} fill="#fff" strokeWidth={0.5} />
          <circle cx={100} cy={70} r={1.2} fill="#fff" strokeWidth={0.5} />
        </g>
      );
    case "boutonne":
      return (
        <g>
          {stand(6)}
          {wings("M100 80 L90 63 L81 72 L85 92 Z")}
          <Both>
            <circle cx={86} cy={88} r={1.3} fill="#fff" strokeWidth={0.5} />
          </Both>
        </g>
      );
    default:
      return (
        <g>
          {stand(6)}
          {wings("M100 80 L90 63 L81 72 L85 92 Z")}
        </g>
      );
  }
}

function Placket({ slug, top, bottom }: { slug: string | undefined; top: number; bottom: number }) {
  const buttons: number[] = [];
  for (let y = top + 8; y < bottom - 6; y += 22) buttons.push(y);
  if (slug === "cachee") {
    return <path d={`M102 ${top} L102 ${bottom}`} stroke={INK} strokeWidth={1} fill="none" />;
  }
  return (
    <g>
      {slug === "sans-patte" ? (
        <path d={`M100 ${top} L100 ${bottom}`} stroke={INK} strokeWidth={1} fill="none" />
      ) : (
        <g stroke={INK} strokeWidth={0.9} fill="none">
          <path d={`M96 ${top} L96 ${bottom}`} />
          <path d={`M104 ${top} L104 ${bottom}`} />
        </g>
      )}
      {buttons.map((y) => (
        <circle key={y} cx={100} cy={y} r={1.6} fill="#fff" stroke={INK} strokeWidth={0.6} />
      ))}
    </g>
  );
}

function Pockets({ slug, wearer }: { slug: string | undefined; wearer: ShirtWearer }) {
  if (!slug || slug === "sans") return null;
  const y = wearer === "homme" ? 104 : 112;
  const pocket = `M108 ${y} L126 ${y} L126 ${y + 17} L117 ${y + 21} L108 ${y + 17} Z`;
  const flap = `M107 ${y - 2} L127 ${y - 2} L127 ${y + 6} L117 ${y + 9} L107 ${y + 6} Z`;
  const one = (
    <g stroke={INK} strokeWidth={1}>
      <path d={pocket} fill="inherit" />
      {slug === "rabat" && (
        <>
          <path d={flap} fill="inherit" />
          <circle cx={117} cy={y + 5} r={1.3} fill="#fff" strokeWidth={0.5} />
        </>
      )}
    </g>
  );
  return (
    <>
      {one}
      {slug === "deux" && <g transform="translate(200 0) scale(-1 1)">{one}</g>}
    </>
  );
}

function Shirt({
  wearer,
  details,
  fill,
}: {
  wearer: ShirtWearer;
  details: Record<string, string>;
  fill: string;
}) {
  const f = FIG[wearer];
  const manches = details.manches ?? "longues";
  const blouse = wearer === "femme" && details.modele === "blouse";
  const tucked = wearer === "homme" && details.porter === "dedans";
  const sleeveless = manches === "sans";
  const hemL = wearer === "homme" ? 66 : blouse ? 60 : 67;
  const h = hem(details.bas, tucked, hemL, wearer);
  const body = bodyPath(f, wearer, blouse, sleeveless, h, hemL);
  const sleeveEnd =
    manches === "courtes" ? 132 : manches === "trois-quarts" ? 172 : manches === "sans" ? 0 : WRIST_Y - 1;
  const hasCuff = manches === "longues" || manches === "trois-quarts";
  const closedNeck = details.col === "mao";

  return (
    <g fill={fill} stroke={INK} strokeWidth={1.3} strokeLinejoin="round">
      {/* Peau dans l'encolure ouverte */}
      {!closedNeck && <path d="M88 70 L100 90 L112 70 Z" fill={SKIN} stroke="none" />}

      <path d={body} />

      {sleeveEnd > 0 && (
        <Both>
          <path d={sleevePath(f, sleeveEnd)} />
          {hasCuff && <Cuff f={f} end={sleeveEnd} slug={details.poignets} />}
          {manches === "courtes" && (
            <path
              d={`M${outerX(f, 126) - 2} 126 L${innerX(f, 126) + 2} 127`}
              fill="none"
              stroke={FOLD}
              strokeWidth={0.9}
            />
          )}
        </Both>
      )}

      {/* Plis : blouse froncée sous l'empiècement, chemise rentrée qui blouse */}
      <g fill="none" stroke={FOLD} strokeWidth={0.8}>
        {blouse && (
          <>
            <path d="M74 92 Q100 98 126 92" />
            {[80, 88, 112, 120].map((x) => (
              <path key={x} d={`M${x} 95 Q${x - 2} 140 ${x + (x < 100 ? -6 : 6)} 220`} />
            ))}
          </>
        )}
        {tucked && (
          <>
            <path d="M74 194 Q78 186 82 196" />
            <path d="M118 196 Q122 186 126 194" />
          </>
        )}
        {!blouse && !tucked && (
          <>
            <path d={`M84 150 Q83 ${h.side - 30} 82 ${h.side - 6}`} />
            <path d={`M116 150 Q117 ${h.side - 30} 118 ${h.side - 6}`} />
          </>
        )}
      </g>

      <Placket slug={details.boutonnage} top={closedNeck ? 76 : 88} bottom={h.center - 1} />
      <Pockets slug={details.poche} wearer={wearer} />
      <Collar slug={details.col} />
    </g>
  );
}

// --- Assemblage ----------------------------------------------------------------

export function ShirtAvatar({
  wearer,
  details,
  fabricImage,
  className,
}: {
  wearer: ShirtWearer;
  /** Les choix du configurateur (groupe → option). */
  details: Record<string, string>;
  /** La photo du tissu choisi : elle habille la chemise. */
  fabricImage?: string | null;
  className?: string;
}) {
  const patternId = `shirt-fabric-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const fill = fabricImage ? `url(#${patternId})` : CLOTH;
  const tucked = wearer === "homme" && details.porter === "dedans";
  const f = FIG[wearer];

  return (
    <svg
      viewBox="0 0 200 460"
      role="img"
      aria-label={wearer === "homme" ? "Avatar homme en chemise" : "Avatar femme en chemise"}
      className={cn("h-full w-auto", className)}
    >
      {fabricImage && (
        <defs>
          <pattern id={patternId} patternUnits="userSpaceOnUse" x={20} y={50} width={160} height={220}>
            <rect width={160} height={220} fill={CLOTH} />
            <image
              href={fabricImage}
              width={160}
              height={220}
              preserveAspectRatio="xMidYMid slice"
            />
          </pattern>
        </defs>
      )}
      <ellipse cx={100} cy={447} rx={52} ry={5} fill="#000" opacity={0.25} />
      <Arms f={f} />
      {!tucked && <Trousers wearer={wearer} />}
      <Head wearer={wearer} />
      <Shirt wearer={wearer} details={details} fill={fill} />
      {tucked && <Trousers wearer={wearer} />}
    </svg>
  );
}
