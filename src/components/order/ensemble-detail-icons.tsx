// Planches de l'ENSEMBLE FEMME (JALOFA AFRIQUE, slug `ensemble`) : d'abord les
// PIÈCES de l'ensemble (gilet + jupe, chemise + pantalon, les trois…), chaque
// combinaison dessinée en entier, puis le style du gilet. Les autres détails
// (col et manches de la chemise, veste, jupe, pantalon) reprennent les
// planches de ces pièces.
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

function Button({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={0.9} />;
}

type Top = "chemise" | "gilet" | "chemise-gilet" | "veste" | "veste-chemise";
type Bottom = "jupe" | "pantalon";
type GiletStyle = "droit" | "croise" | "long" | "ceinture";

type Pt = [number, number];

/** La ligne `pts`, coupée pour ne commencer qu'à `fromY` (sous le haut). */
function lineFrom(pts: Pt[], fromY: number): string {
  if (fromY <= pts[0][1]) return "M" + pts.map((p) => p.join(" ")).join("L");
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    if (fromY <= y1) {
      const x = x0 + ((x1 - x0) * (fromY - y0)) / (y1 - y0);
      return `M${x.toFixed(2)} ${fromY}` + pts.slice(i).map((p) => `L${p.join(" ")}`).join("");
    }
  }
  return "";
}

// --- Les hauts (moitié gauche) -------------------------------------------------

const LONG_SLEEVE = "M21.6 7.6C18.6 8.8 17 12 16.4 17L14.2 50 18.8 50.4 21.2 18";

function shirtHalf(): ReactNode {
  return (
    <>
      {/* col chemise : pied de col et pointe */}
      <path d="M26.6 5.2Q29 4.2 32 4.2" />
      <path d="M26.6 5.2 25.4 9.8 31.6 12.6" />
      <path d="M26.6 5.6 21.6 7.6" />
      <path d={LONG_SLEEVE} />
      <path d="M21.2 18C21.8 26 22.4 34 22.4 40" />
      <path d="M22.4 40Q27.2 41 32 41.2" />
    </>
  );
}

function giletHalf(style: GiletStyle, overShirt: boolean): { body: ReactNode; hemY: number } {
  const hemY = style === "long" ? 52 : 40;
  const side =
    style === "long" ? "M22 19C22.6 28 22.6 40 22 52" : "M22 19C22.6 27 23 33 23 38";
  const hem =
    style === "long"
      ? "M22 52Q27 53 32 53.2"
      : style === "ceinture"
        ? "M23 38Q27.5 39 32 39.2"
        : "M23 38 28 41.4 32 40";
  return {
    hemY,
    body: (
      <>
        {/* sans manches : l'emmanchure se creuse */}
        <path d={overShirt ? "M25.4 6.6 22.6 7.8" : "M26 6 22.6 7.2"} />
        <path d="M22.6 7.4C21.4 11 21.4 15 22 19" />
        <path d={side} />
        <path d={hem} />
        <path d={overShirt ? "M25.4 6.6 32 24" : "M26 6 32 24"} />
      </>
    ),
  };
}

function jacketHalf(withShirt: boolean): ReactNode {
  return (
    <>
      {withShirt ? (
        <path d="M27.4 5.4 26.6 9.4 31.6 12" />
      ) : (
        <path d="M27.4 5.6Q28.4 10.4 32 10.8" />
      )}
      <path d="M26.6 5.6 21 7.6" />
      <path d="M21 7.6C18.4 8.8 16.8 12 16.2 17L14 51 18.8 51.4 21.2 18" />
      {/* revers et cran */}
      <path d="M26.6 5.6 28.6 13 31.6 24" />
      <path d="M28.6 13 26.4 15.6 30.6 24.6" />
      <path d="M21.2 18C22 26 22.6 36 22.4 44" />
      <path d="M22.4 44Q27 45 31.6 45.2V24" />
    </>
  );
}

function topHalf(top: Top): { body: ReactNode; hemY: number } {
  switch (top) {
    case "chemise":
      return { body: shirtHalf(), hemY: 40 };
    case "gilet":
      return giletHalf("droit", false);
    case "chemise-gilet": {
      const g = giletHalf("droit", true);
      return {
        hemY: 40,
        body: (
          <>
            <path d="M26.6 5.2Q29 4.2 32 4.2" />
            <path d="M26.6 5.2 25.4 9.8 30 11.6" />
            <path d="M26.6 5.6 21.6 7.6" />
            <path d={LONG_SLEEVE} />
            {g.body}
          </>
        ),
      };
    }
    case "veste":
      return { body: jacketHalf(false), hemY: 44 };
    case "veste-chemise":
      return { body: jacketHalf(true), hemY: 44 };
  }
}

/** Ce qui se dessine une seule fois, au milieu : boutons, patte de chemise. */
function topCenter(top: Top): ReactNode {
  switch (top) {
    case "chemise":
      return (
        <>
          <Seam>
            <path d="M32 12.6V41" />
          </Seam>
          {[17, 23, 29, 35].map((y) => (
            <Button key={y} x={33.2} y={y} />
          ))}
        </>
      );
    case "gilet":
    case "chemise-gilet":
      return [27, 31, 35].map((y) => <Button key={y} x={32} y={y} />);
    case "veste":
    case "veste-chemise":
      return <Button x={31.6} y={34} />;
  }
}

// --- Les bas ------------------------------------------------------------------

function bottomHalf(bottom: Bottom, fromY: number): ReactNode {
  if (bottom === "jupe") {
    return (
      <>
        <path d={lineFrom([[23.4, 32], [21, 40], [21.8, 68]], fromY)} />
        <path d="M21.8 68Q26.9 69 32 69.2" />
      </>
    );
  }
  return (
    <>
      <path d={lineFrom([[23.4, 32], [19, 84]], fromY)} />
      <path d={lineFrom([[32, 48], [28.6, 84]], fromY)} />
      <path d="M19 84H28.6" />
    </>
  );
}

function outfit(top: Top, bottom: Bottom): ReactNode {
  const t = topHalf(top);
  const half = (
    <>
      {t.body}
      {bottomHalf(bottom, t.hemY)}
    </>
  );
  return (
    <>
      {half}
      <Mirror>{half}</Mirror>
      {topCenter(top)}
    </>
  );
}

/** Le gilet seul, cadré sur le buste. */
function gilet(style: GiletStyle): ReactNode {
  const g = giletHalf(style, false);
  return (
    <>
      {g.body}
      <Mirror>{g.body}</Mirror>
      {style === "droit" && [27, 31, 35].map((y) => <Button key={y} x={32} y={y} />)}
      {style === "long" && [27, 32, 37, 42].map((y) => <Button key={y} x={32} y={y} />)}
      {style === "croise" && (
        // Le pan droit croise par-dessus : son bord descend en biais.
        <>
          <path d="M32 24C34.4 29 35.8 34 36.2 40.4" />
          {[28, 34].flatMap((y) => [
            <Button key={`l${y}`} x={28.4} y={y} />,
            <Button key={`r${y}`} x={38.4} y={y} />,
          ])}
        </>
      )}
      {style === "ceinture" && (
        // Une ceinture nouée à la taille, sans boutons.
        <>
          <path d="M23 30Q32 31.4 41 30M23 33Q32 34.4 41 33" />
          <path d="M32 31.6C29.4 28.8 27.4 30.8 29.2 32.6ZM32 31.6C34.6 28.8 36.6 30.8 34.8 32.6ZM31.4 32.4 30 39M32.6 32.4 34 38.6" />
        </>
      )}
    </>
  );
}

const BOX = "0 0 64 88";
const BUST_BOX = "6 0 52 58";

const ICONS = {
  // === Les pièces ===========================================================
  "en-pieces-gilet-jupe": { viewBox: BOX, body: outfit("gilet", "jupe") },
  "en-pieces-gilet-pantalon": { viewBox: BOX, body: outfit("gilet", "pantalon") },
  "en-pieces-chemise-jupe": { viewBox: BOX, body: outfit("chemise", "jupe") },
  "en-pieces-chemise-pantalon": { viewBox: BOX, body: outfit("chemise", "pantalon") },
  "en-pieces-chemise-gilet-jupe": { viewBox: BOX, body: outfit("chemise-gilet", "jupe") },
  "en-pieces-chemise-gilet-pantalon": { viewBox: BOX, body: outfit("chemise-gilet", "pantalon") },
  "en-pieces-veste-jupe": { viewBox: BOX, body: outfit("veste", "jupe") },
  "en-pieces-veste-pantalon": { viewBox: BOX, body: outfit("veste", "pantalon") },
  "en-pieces-veste-chemise-jupe": { viewBox: BOX, body: outfit("veste-chemise", "jupe") },
  "en-pieces-veste-chemise-pantalon": { viewBox: BOX, body: outfit("veste-chemise", "pantalon") },

  // === Le gilet =============================================================
  "en-gilet-droit": { viewBox: BUST_BOX, body: gilet("droit") },
  "en-gilet-croise": { viewBox: BUST_BOX, body: gilet("croise") },
  "en-gilet-long": { viewBox: BUST_BOX, body: gilet("long") },
  "en-gilet-ceinture": { viewBox: BUST_BOX, body: gilet("ceinture") },
} satisfies Record<string, IconDef>;

export type EnsembleDetailIconName = keyof typeof ICONS;

export function isEnsembleArt(name: string): name is EnsembleDetailIconName {
  return name in ICONS;
}

/** Tenue entière (portrait) ou gilet seul (carré) ? */
export function ensembleArtIsTall(name: EnsembleDetailIconName): boolean {
  return ICONS[name].viewBox === BOX;
}

export function EnsembleDetailIcon({
  name,
  className,
}: {
  name: EnsembleDetailIconName;
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
