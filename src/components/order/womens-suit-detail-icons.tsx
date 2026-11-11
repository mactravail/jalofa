// Planches de l'ensemble tailleur femme (JALOFA EUROPE) — façon Sumissura :
// la veste (style, boutons, fente, bas de veste), le bas au choix pantalon ou
// jupe (style, ceinture et longueur de jupe) et le gilet.
//
// Mêmes conventions que `shirt-detail-icons.tsx` : `currentColor`, trait fin,
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
  return <circle cx={x} cy={y} r={0.95} />;
}

/** Flèche verticale qui pointe vers le haut, sur l'ourlet (longueur de jupe). */
function arrowUp(x: number, from: number, to: number): ReactNode {
  return <path d={`M${x} ${from}V${to}M${x - 1.4} ${to + 2}L${x} ${to}L${x + 1.4} ${to + 2}`} />;
}

const BOX = "0 0 64 84";
const CLOSE_BOX = "0 0 64 60";

// ---------------------------------------------------------------------------
// Veste femme — cintrée, sans cravate (un top sous la veste)
// ---------------------------------------------------------------------------

type JacketStyle = "croisee" | "essentielle" | "heritage";
type Hem = "arrondi" | "carre" | "biseaute";

type JacketSpec = { style?: JacketStyle; buttons?: 1 | 2; hem?: Hem };

function womensJacket({ style = "essentielle", buttons = 1, hem = "arrondi" }: JacketSpec): ReactNode {
  const db = style === "croisee";
  // Croisée : longue ; Héritage : courte, à la taille ; Essentielle : aux hanches.
  const L = db ? 78 : style === "heritage" ? 64 : 72;
  const nb = style === "heritage" ? 2 : buttons;
  const bp = db ? 40 : nb === 2 ? 38 : 44;
  const btns: [number, number][] = db
    ? [46, 55].flatMap((y): [number, number][] => [
        [27.4, y],
        [36.6, y],
      ])
    : nb === 2
      ? [
          [32, 39.6],
          [32, 50],
        ]
      : [[32, 45.6]];
  const last = Math.max(...btns.map(([, y]) => y));

  const lapel =
    style === "heritage"
      ? `M27.6 9 25.8 15.2 23.8 16.2 21.2 12.8C22 26 27 ${bp - 8} 32 ${bp}`
      : `M27.6 9 25.6 16 24.4 16.8 22.2 16.2C22.8 26 27 ${bp - 8} 32 ${bp}`;

  let front: ReactNode;
  if (db) {
    front = <path d={`M18.6 ${L}H32`} />;
  } else if (hem === "arrondi") {
    front = (
      <>
        <path d={`M18.6 ${L}Q24 ${L + 1} 28.8 ${L - 0.6}`} />
        <path d={`M32 ${bp}V${last}C31.6 ${last + 8} 30.6 ${L - 6} 28.8 ${L - 0.6}`} />
      </>
    );
  } else if (hem === "carre") {
    front = <path d={`M32 ${bp}V${L}H18.6`} />;
  } else {
    front = <path d={`M32 ${bp}V${last + 2}L27 ${L}H18.6`} />;
  }

  const half = (
    <>
      <path d="M27.6 9 14 12" />
      <path d="M14 12C11.8 14.6 11 19 10.8 25L10 66H15.2L18.4 27" />
      <path d={`M18.4 27C20.4 38 20.4 44 18.6 ${L}`} />
      <path d={lapel} />
      <path d={`M27.6 9L32 ${bp}`} />
      {front}
      <path d={`M20.2 ${L - 17}H27.6L27.4 ${L - 13.4}H20.4Z`} />
    </>
  );

  return (
    <>
      {half}
      <Mirror>
        {half}
        <path d="M21.6 28.4 26.4 27.8 26.5 29.1 21.7 29.7Z" />
      </Mirror>
      {db && <path d={`M32 ${bp}L39.4 ${bp + 2}V${L}`} />}
      <path d="M27.6 9Q32 7.2 36.4 9" />
      {/* le haut porté sous la veste */}
      <Seam>
        <path d="M28.6 11.6Q32 15 35.4 11.6" />
      </Seam>
      {btns.map(([x, y]) => (
        <Button key={`${x}-${y}`} x={x} y={y} />
      ))}
    </>
  );
}

/** Dos de la veste, en bas (viewBox 64 × 60) : avec ou sans fente. */
function jacketBack(vent: boolean): ReactNode {
  return (
    <>
      <path d="M12 2 9 48Q32 51 55 48L52 2" />
      <Seam>
        <path d="M5 2 3.4 40M59 2 60.6 40" />
        <path d={vent ? "M32 2V32" : "M32 2V50.4"} />
      </Seam>
      {vent && (
        <>
          <path d="M32 32V50.4M33.6 32.6V50.2" />
          <path d="M32 33.6 33.6 50.2" strokeOpacity={0.5} />
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Bas — pantalon (large ou droit) ou jupe (crayon ou évasée)
// ---------------------------------------------------------------------------

function trousers(wide: boolean): ReactNode {
  const half = (
    <>
      <path d={wide ? "M18 10 12.6 80H29.6L32 26" : "M18 10 17 80H30.6L32 26"} />
      <Seam>
        <path d="M20.6 10 22.4 18" />
        <path d={wide ? "M24.4 14 21.2 79" : "M24.6 14 23.8 79"} />
      </Seam>
    </>
  );
  return (
    <>
      <path d="M18 6H46V10H18Z" />
      <Seam>
        <path d="M32 10V26M32 26Q34.4 24 34.4 20V10" />
      </Seam>
      {half}
      <Mirror>{half}</Mirror>
    </>
  );
}

type SkirtSpec = { flare?: boolean; band?: boolean; hemY?: number; arrow?: boolean };

function skirt({ flare = false, band = true, hemY = 50, arrow = false }: SkirtSpec): ReactNode {
  const top = band ? 10 : 8;
  const half = flare ? (
    <>
      <path d={`M19 ${top}C17 24 13 ${hemY - 30} 9 ${hemY}Q20.5 ${hemY + 3} 32 ${hemY + 2}`} />
      <Seam>
        <path d={`M24 ${top + 6}Q20 ${hemY - 18} 17 ${hemY + 1.4}M28.4 ${top + 6}Q27 ${hemY - 18} 25.4 ${hemY + 2.2}`} />
      </Seam>
    </>
  ) : (
    <path d={`M19 ${top}C16.8 20 17.4 ${hemY - 18} 19.6 ${hemY}H32`} />
  );
  return (
    <>
      {band ? <path d="M19 6H45V10H19Z" /> : <path d="M19 8Q32 8.8 45 8" />}
      {half}
      <Mirror>{half}</Mirror>
      {arrow && arrowUp(40, hemY + 22, hemY + 2)}
    </>
  );
}

// ---------------------------------------------------------------------------
// Gilet femme
// ---------------------------------------------------------------------------

function vest(): ReactNode {
  const half = (
    <>
      <path d="M27.6 9 21 10C20.6 20 17.6 25 15 28L16 60 25 62 31.4 67" />
      <path d="M27.6 9 32 30 31.4 67" />
      <Seam>
        <path d="M18.4 48 24 48.8" />
      </Seam>
    </>
  );
  return (
    <>
      {half}
      <Mirror>{half}</Mirror>
      <path d="M27.6 9Q32 7.2 36.4 9" />
      {[34, 41, 48, 55].map((y) => (
        <Button key={y} x={32} y={y} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------

const ICONS = {
  // === Veste ================================================================
  "tf-veste-croisee": { viewBox: BOX, body: womensJacket({ style: "croisee" }) },
  "tf-veste-essentielle": { viewBox: BOX, body: womensJacket({ style: "essentielle" }) },
  "tf-veste-heritage": { viewBox: BOX, body: womensJacket({ style: "heritage" }) },
  "tf-boutons-1": { viewBox: BOX, body: womensJacket({ buttons: 1 }) },
  "tf-boutons-2": { viewBox: BOX, body: womensJacket({ buttons: 2 }) },
  "tf-fente-sans": { viewBox: CLOSE_BOX, body: jacketBack(false) },
  "tf-fente-centrale": { viewBox: CLOSE_BOX, body: jacketBack(true) },
  "tf-bas-arrondi": { viewBox: BOX, body: womensJacket({ hem: "arrondi" }) },
  "tf-bas-carre": { viewBox: BOX, body: womensJacket({ hem: "carre" }) },
  "tf-bas-biseaute": { viewBox: BOX, body: womensJacket({ hem: "biseaute" }) },

  // === Bas : pantalon ou jupe ===============================================
  "tf-pantalon-large": { viewBox: BOX, body: trousers(true) },
  "tf-pantalon-droit": { viewBox: BOX, body: trousers(false) },
  "tf-jupe-crayon": { viewBox: BOX, body: skirt({}) },
  "tf-jupe-evasee": { viewBox: BOX, body: skirt({ flare: true, hemY: 60 }) },
  "tf-ceinture-avec": { viewBox: BOX, body: skirt({ band: true }) },
  "tf-ceinture-sans": { viewBox: BOX, body: skirt({ band: false }) },
  "tf-longueur-courte": { viewBox: BOX, body: skirt({ hemY: 38, arrow: true }) },
  "tf-longueur-genou": { viewBox: BOX, body: skirt({ hemY: 50, arrow: true }) },
  "tf-longueur-midi": { viewBox: BOX, body: skirt({ hemY: 66 }) },

  // === Gilet ================================================================
  "tf-gilet-sans": {
    viewBox: BOX,
    body: (
      <>
        <g strokeOpacity={0.5}>{vest()}</g>
        <path d="M12 72 52 6" strokeWidth={2} />
      </>
    ),
  },
  "tf-gilet-avec": { viewBox: BOX, body: vest() },
} satisfies Record<string, IconDef>;

export type WomensSuitDetailIconName = keyof typeof ICONS;

export function isWomensSuitArt(name: string): name is WomensSuitDetailIconName {
  return name in ICONS;
}

export function womensSuitArtIsTall(name: WomensSuitDetailIconName): boolean {
  return ICONS[name].viewBox === BOX;
}

export function WomensSuitDetailIcon({
  name,
  className,
}: {
  name: WomensSuitDetailIconName;
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
