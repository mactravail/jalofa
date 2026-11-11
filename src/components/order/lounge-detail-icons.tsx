// Planches de la tenue détente femme (JALOFA EUROPE) : le haut (style,
// encolure, manches) puis le bas (style, taille).
//
// Mêmes conventions que `womens-suit-detail-icons.tsx` : `currentColor`, trait
// fin, moitié gauche dessinée une fois puis renvoyée en miroir autour de x = 32.

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
  return <circle cx={x} cy={y} r={0.95} />;
}

const BOX = "0 0 64 84";

// ---------------------------------------------------------------------------
// Le haut — ample, tombant
// ---------------------------------------------------------------------------

type TopKind = "tshirt" | "sweat" | "chemise" | "debardeur";
type Neck = "rond" | "v" | "bateau";
type Sleeves = "courtes" | "longues";

type TopSpec = { kind?: TopKind; neck?: Neck; sleeves?: Sleeves };

function top({ kind = "tshirt", neck = "rond", sleeves = "courtes" }: TopSpec): ReactNode {
  const tank = kind === "debardeur";
  const shirt = kind === "chemise";
  const sweat = kind === "sweat";
  const long = sweat || (!tank && sleeves === "longues");
  // Encolure bateau : plus large, l'épaule commence plus loin du centre.
  const nx = neck === "bateau" && !shirt ? 22 : 26;

  let sleeve: ReactNode;
  if (tank) {
    sleeve = <path d={`M${nx - 4} 8.6C18 18 17 23 15 27`} />;
  } else if (long) {
    sleeve = (
      <>
        <path d="M14 11C11 14 9 20 8.6 28L7 62H13.4L15.2 28" />
        {(sweat || shirt) && (
          <Seam>
            <path d="M7.2 57.6H13.5" />
          </Seam>
        )}
      </>
    );
  } else {
    sleeve = <path d="M14 11 6.4 24.6 12.8 27.8 15.2 25" />;
  }

  // Le bas du haut : droit, en bord-côte (sweat) ou arrondi (chemise).
  const hem = shirt ? (
    <path d="M14.6 63Q23 70 32 68" />
  ) : (
    <>
      <path d="M14 66H32" />
      {sweat && (
        <Seam>
          <path d="M14.2 61.6H32" />
        </Seam>
      )}
    </>
  );

  const half = (
    <>
      {tank ? <path d={`M${nx} 8 ${nx - 4} 8.6`} /> : <path d={`M${nx} 8 14 11`} />}
      {sleeve}
      <path d={shirt ? "M15 26 14.6 63" : "M15 26 14 66"} />
      {hem}
    </>
  );

  let neckline: ReactNode;
  if (shirt) {
    // Col de chemise ouvert et patte boutonnée.
    const collar = <path d="M26 8 28.4 15.4 32 12.4" />;
    neckline = (
      <>
        {collar}
        <Mirror>{collar}</Mirror>
        <path d="M32 12.4V68" />
        {[22, 32, 42, 52, 62].map((y) => (
          <Button key={y} x={33.6} y={y} />
        ))}
      </>
    );
  } else if (neck === "v") {
    neckline = <path d={`M${nx} 8 32 20 ${64 - nx} 8`} />;
  } else if (neck === "bateau") {
    neckline = <path d={`M${nx} 8Q32 11.4 ${64 - nx} 8`} />;
  } else {
    neckline = <path d={`M${nx} 8Q32 15 ${64 - nx} 8`} />;
  }

  return (
    <>
      {half}
      <Mirror>{half}</Mirror>
      <path d={`M${nx} 8Q32 6.2 ${64 - nx} 8`} />
      {neckline}
      {sweat && neck === "rond" && (
        <Seam>
          <path d="M26.6 9.4Q32 13.4 37.4 9.4" />
        </Seam>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Le bas — souple, taille confortable
// ---------------------------------------------------------------------------

type Bottom = "large" | "droit" | "jogging" | "short" | "jupe";
type Waist = "elastique" | "cordon" | "nouer";

type BottomSpec = { bottom?: Bottom; waist?: Waist };

function bottomPiece({ bottom = "large", waist = "elastique" }: BottomSpec): ReactNode {
  let half: ReactNode;
  switch (bottom) {
    case "droit":
      half = <path d="M18 11 16.6 80H30.4L32 28" />;
      break;
    case "jogging":
      half = (
        <>
          <path d="M18 11C16 40 18 64 19.6 74V80H29V74C30 60 31 42 32 28" />
          <Seam>
            <path d="M19.6 74H29" />
          </Seam>
        </>
      );
      break;
    case "short":
      half = <path d="M18 11 14 40H29.8L32 28" />;
      break;
    case "jupe":
      half = (
        <>
          <path d="M18 11C16.4 30 14 58 12 78Q22 80.6 32 80.4" />
          <Seam>
            <path d="M24 16Q21 48 19.6 79.4" />
          </Seam>
        </>
      );
      break;
    default:
      half = <path d="M18 11 11 80H29.6L32 28" />;
  }

  let band: ReactNode;
  if (waist === "cordon") {
    band = (
      <>
        <path d="M18 6H46V11H18Z" />
        <path d="M30.6 9.6Q29.6 16 28 20.6M33.4 9.6Q34.4 16 36 20.6" />
        <circle cx={27.8} cy={21.4} r={0.9} />
        <circle cx={36.2} cy={21.4} r={0.9} />
      </>
    );
  } else if (waist === "nouer") {
    band = (
      <>
        <path d="M18 6H46V11H18Z" />
        {/* nœud : deux boucles et deux pans */}
        <path d="M32 8.6C28 4.6 24.6 6.6 26 9.4 27 11.4 30 10 32 8.6Z" />
        <path d="M32 8.6C36 4.6 39.4 6.6 38 9.4 37 11.4 34 10 32 8.6Z" />
        <path d="M31.4 9.4 28.4 21M32.6 9.4 35.6 21" />
      </>
    );
  } else {
    // Élastique : bande froncée.
    band = (
      <>
        <path d="M18 6H46V11H18Z" />
        <Seam>
          {[21, 24.5, 28, 36, 39.5, 43].map((x) => (
            <path key={x} d={`M${x} 6.6V10.4`} />
          ))}
        </Seam>
      </>
    );
  }

  return (
    <>
      {band}
      {bottom !== "jupe" && (
        <Seam>
          <path d="M32 11V28" />
        </Seam>
      )}
      {half}
      <Mirror>{half}</Mirror>
    </>
  );
}

// ---------------------------------------------------------------------------

const ICONS = {
  // === Le haut ==============================================================
  "dt-haut-tshirt": { viewBox: BOX, body: top({ kind: "tshirt" }) },
  "dt-haut-sweat": { viewBox: BOX, body: top({ kind: "sweat" }) },
  "dt-haut-chemise": { viewBox: BOX, body: top({ kind: "chemise", sleeves: "longues" }) },
  "dt-haut-debardeur": { viewBox: BOX, body: top({ kind: "debardeur" }) },
  "dt-encolure-rond": { viewBox: BOX, body: top({ neck: "rond" }) },
  "dt-encolure-v": { viewBox: BOX, body: top({ neck: "v" }) },
  "dt-encolure-bateau": { viewBox: BOX, body: top({ neck: "bateau" }) },
  "dt-manches-courtes": { viewBox: BOX, body: top({ sleeves: "courtes" }) },
  "dt-manches-longues": { viewBox: BOX, body: top({ sleeves: "longues" }) },

  // === Le bas ===============================================================
  "dt-bas-large": { viewBox: BOX, body: bottomPiece({ bottom: "large" }) },
  "dt-bas-droit": { viewBox: BOX, body: bottomPiece({ bottom: "droit" }) },
  "dt-bas-jogging": { viewBox: BOX, body: bottomPiece({ bottom: "jogging", waist: "cordon" }) },
  "dt-bas-short": { viewBox: BOX, body: bottomPiece({ bottom: "short" }) },
  "dt-bas-jupe": { viewBox: BOX, body: bottomPiece({ bottom: "jupe" }) },
  "dt-taille-elastique": { viewBox: BOX, body: bottomPiece({ waist: "elastique" }) },
  "dt-taille-cordon": { viewBox: BOX, body: bottomPiece({ waist: "cordon" }) },
  "dt-taille-nouer": { viewBox: BOX, body: bottomPiece({ waist: "nouer" }) },
} satisfies Record<string, IconDef>;

export type LoungeDetailIconName = keyof typeof ICONS;

export function isLoungeArt(name: string): name is LoungeDetailIconName {
  return name in ICONS;
}

export function loungeArtIsTall(name: LoungeDetailIconName): boolean {
  return ICONS[name].viewBox === BOX;
}

export function LoungeDetailIcon({ name, className }: { name: LoungeDetailIconName; className?: string }) {
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
