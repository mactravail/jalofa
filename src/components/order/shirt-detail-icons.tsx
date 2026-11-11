// Planches de la chemise (JALOFA EUROPE) — l'équivalent du configurateur
// Sumissura : une chemise entière vue de face où UN seul détail change d'une
// case à l'autre (manches, boutonnage, poche, bas), plus des vues rapprochées
// pour le col et le poignet.
//
// Même conventions que `boubou-detail-icons.tsx` : `currentColor`, trait fin,
// sans remplissage (sauf les boutons). Le côté gauche de la chemise est dessiné
// une fois puis renvoyé en miroir : les deux moitiés restent symétriques au
// pixel près et chaque planche ne décrit que ce qui la distingue.

import type { ReactNode } from "react";

type IconDef = { viewBox: string; body: ReactNode; strokeWidth?: number };

/** Miroir horizontal autour de l'axe x = 32 (cadres de 64 de large). */
function Mirror({ children }: { children: ReactNode }) {
  return <g transform="matrix(-1 0 0 1 64 0)">{children}</g>;
}

/** Couture secondaire : plus fine et atténuée que le contour. */
function Seam({ children }: { children: ReactNode }) {
  return (
    <g strokeWidth={0.9} strokeOpacity={0.6}>
      {children}
    </g>
  );
}

function Button({ x, y, r = 0.85 }: { x: number; y: number; r?: number }) {
  return <circle cx={x} cy={y} r={r} fill="currentColor" stroke="none" />;
}

// ---------------------------------------------------------------------------
// Chemise entière (viewBox 64 × 84)
// ---------------------------------------------------------------------------

type Sleeve = "longues" | "trois-quarts" | "courtes" | "sans";
type Placket = "classique" | "cachee" | "sans-patte";
type Pocket = "sans" | "une" | "deux";
type Hem = "arrondi" | "droit";

type ShirtSpec = {
  sleeve?: Sleeve;
  placket?: Placket;
  pocket?: Pocket;
  hem?: Hem;
  fitted?: boolean;
};

/** Moitié gauche : épaule, manche et côté du corps jusqu'au bas. */
function leftHalf(sleeve: Sleeve, fitted: boolean, sideEnd: number): ReactNode {
  const bottomX = fitted ? 18.2 : 17.5;
  const side = fitted
    ? `M17.5 29C19.7 40 19.7 52 ${bottomX} ${sideEnd}`
    : `M17.5 29L${bottomX} ${sideEnd}`;

  let arm: ReactNode;
  let shoulderEnd = "13 13";
  switch (sleeve) {
    case "longues":
      arm = (
        <>
          <path d="M13 13C10.6 15.6 9.6 19.6 9.3 25.4L7.6 57.5" />
          <path d="M17.5 29 13.6 57.5" />
          <path d="M7.6 57.5H13.6L13.8 64H7.2Z" />
          <Seam>
            <path d="M11.9 50.5 11.6 57.5" />
          </Seam>
        </>
      );
      break;
    case "trois-quarts":
      arm = (
        <>
          <path d="M13 13C10.6 15.6 9.6 19.6 9.3 25.4L8.6 45" />
          <path d="M17.5 29 14.5 45" />
          <path d="M8.6 45H14.5" />
          <Seam>
            <path d="M8.7 42.4H14.9" />
          </Seam>
        </>
      );
      break;
    case "courtes":
      arm = (
        <>
          <path d="M13 13C10.8 15.4 9.6 18.6 9 22.6L8.2 32" />
          <path d="M8.2 32 16.3 33.2 17.5 29" />
          <Seam>
            <path d="M8.4 29.8 16.7 31" />
          </Seam>
        </>
      );
      break;
    case "sans":
      shoulderEnd = "15.6 12.3";
      arm = <path d="M15.6 12.3C16.4 18.4 16.4 24.6 17.5 29" />;
      break;
  }

  return (
    <>
      <path d={`M27 9L${shoulderEnd}`} />
      {arm}
      <path d={side} />
    </>
  );
}

/** Petit col chemise classique, à l'échelle de la chemise entière. */
const SMALL_COLLAR = (
  <>
    <path d="M27 8Q32 6 37 8" />
    <path d="M27 8 25.6 15.4 31.4 13.2M27 8Q29 11.6 31.4 13.2" />
    <path d="M37 8 38.4 15.4 32.6 13.2M37 8Q35 11.6 32.6 13.2" />
    <Seam>
      <path d="M27.6 8.6Q32 11 36.4 8.6" />
    </Seam>
  </>
);

function shirt({
  sleeve = "longues",
  placket = "classique",
  pocket = "sans",
  hem = "arrondi",
  fitted = false,
}: ShirtSpec): ReactNode {
  const sideEnd = hem === "arrondi" ? 70 : 76;
  const hemY = hem === "arrondi" ? 78.8 : 76;
  const bottomX = fitted ? 18.2 : 17.5;
  const hemHalf =
    hem === "arrondi"
      ? `M${bottomX} 70C${bottomX} 75.6 22.4 78.6 32 78.8`
      : `M${bottomX} 76H32`;

  const pocketPath = (
    <>
      <path d="M20.6 27H26.4V33.4L23.5 34.9 20.6 33.4Z" />
      <Seam>
        <path d="M20.6 28.6H26.4" />
      </Seam>
    </>
  );

  const buttonsY = [17.5, 25.5, 33.5, 41.5, 49.5, 57.5, 65.5];

  let front: ReactNode;
  switch (placket) {
    case "classique":
      front = (
        <>
          <path d={`M30.6 13.6V${hemY}M33.4 13.6V${hemY}`} />
          {buttonsY.map((y) => (
            <Button key={y} x={32} y={y} />
          ))}
        </>
      );
      break;
    case "cachee":
      front = (
        <>
          <path d={`M33.4 13.6V${hemY}`} />
          <Seam>
            <path d={`M30.4 15V${hemY - 3}`} strokeDasharray="1.4 1.4" />
          </Seam>
          <Button x={32} y={15.6} />
        </>
      );
      break;
    case "sans-patte":
      front = (
        <>
          <path d={`M32 13.4V${hemY}`} />
          {buttonsY.map((y) => (
            <Button key={y} x={30.6} y={y} />
          ))}
        </>
      );
      break;
  }

  return (
    <>
      {leftHalf(sleeve, fitted, sideEnd)}
      <path d={hemHalf} />
      <Mirror>
        {leftHalf(sleeve, fitted, sideEnd)}
        <path d={hemHalf} />
        {pocket === "deux" && pocketPath}
      </Mirror>
      {pocket !== "sans" && pocketPath}
      {SMALL_COLLAR}
      {front}
    </>
  );
}

const SHIRT_BOX = "0 0 64 84";

// ---------------------------------------------------------------------------
// Col rapproché (viewBox 64 × 60) — épaules et patte communes, seule la forme
// du col change d'une case à l'autre.
// ---------------------------------------------------------------------------

function collarFrame(placketTop: number, withPlacket = true): ReactNode {
  return (
    <>
      <path d="M24 13C17 14.5 10 17 3 21" />
      <Mirror>
        <path d="M24 13C17 14.5 10 17 3 21" />
      </Mirror>
      {withPlacket && (
        <>
          <path d={`M30.4 ${placketTop}V60M33.6 ${placketTop}V60`} />
          <Button x={32} y={38} r={1.2} />
          <Button x={32} y={52} r={1.2} />
        </>
      )}
    </>
  );
}

/** Feuille gauche d'un col à pointes : dos → pointe → milieu, + pli au cou. */
function leaf(point: string, meet = "31.2 23.2"): ReactNode {
  return (
    <>
      <path d={`M24 12L${point}L${meet}`} />
      <path d={`M24 12Q26.6 19 ${meet}`} />
    </>
  );
}

const COLLAR_BACK = (
  <>
    <path d="M24 12Q32 8.6 40 12" />
    <Seam>
      <path d="M25 12.4Q32 16.6 39 12.4" />
    </Seam>
  </>
);

function pointedCollar(point: string, extra?: ReactNode): ReactNode {
  return (
    <>
      {collarFrame(23.6)}
      {COLLAR_BACK}
      {leaf(point)}
      <Mirror>{leaf(point)}</Mirror>
      {extra}
    </>
  );
}

// Recadré sur le col (même rapport 64 × 60) : le col remplit la case, les
// épaules sortent du champ.
const COLLAR_BOX = "12 4 40 37.5";

// ---------------------------------------------------------------------------
// Poignet rapproché (viewBox 64 × 60) — bas de manche + revers.
// ---------------------------------------------------------------------------

const SLEEVE_END = (
  <>
    <path d="M17 0 20 30M47 0 44 30" />
    <Seam>
      <path d="M26 23.5 26.5 30M29.6 24.5 29.9 30" />
      <path d="M37.2 16 37.8 30" />
    </Seam>
    <Button x={37.5} y={22.5} r={0.8} />
  </>
);

const CUFF_BOX = "0 0 64 60";

// ---------------------------------------------------------------------------
// Chemise homme — « Comment la porterez-vous ? » (viewBox 64 × 84) : la chemise
// rentrée dans le pantalon, ou portée par-dessus.
// ---------------------------------------------------------------------------

/** Les deux jambes du pantalon, à partir de la taille `top`. */
function trousers(top: number, withWaistband: boolean): ReactNode {
  const legTop = withWaistband ? top + 5 : top;
  const leg = (
    <>
      <path d={`M17.5 ${legTop}L16.6 84`} />
      <path d={`M31.4 ${legTop + 7}L30.6 84`} />
    </>
  );
  return (
    <>
      {withWaistband && (
        <>
          <path d={`M17.5 ${top}H46.5V${top + 5}H17.5Z`} />
          <Seam>
            <path d={`M22 ${top}V${top + 5}M42 ${top}V${top + 5}`} />
          </Seam>
        </>
      )}
      {leg}
      <Mirror>{leg}</Mirror>
      <path d={`M31.4 ${legTop + 7}Q32 ${legTop + 5.6} 32.6 ${legTop + 7}`} />
      <Seam>
        <path d={`M32 ${legTop}V${legTop + 5.6}`} />
      </Seam>
    </>
  );
}

function wornShirt(tucked: boolean): ReactNode {
  // Rentrée : la chemise s'arrête à la ceinture. Par-dessus : bas droit plus
  // bas, le pantalon dépasse dessous.
  const end = tucked ? 54 : 62;
  const buttons = [17.5, 25.5, 33.5, 41.5, 49.5, ...(tucked ? [] : [57.5])];
  const half = (
    <>
      {leftHalf("longues", false, end)}
      {!tucked && <path d={`M17.5 ${end}H32`} />}
    </>
  );
  return (
    <>
      {half}
      <Mirror>{half}</Mirror>
      {SMALL_COLLAR}
      <path d={`M30.6 13.6V${end}M33.4 13.6V${end}`} />
      {buttons.map((y) => (
        <Button key={y} x={32} y={y} />
      ))}
      {tucked ? (
        <>
          {/* le tissu blousant au-dessus de la ceinture */}
          <Seam>
            <path d="M19 51.5Q25 53.6 30.6 52.4M33.4 52.4Q39 53.6 45 51.5" />
          </Seam>
          {trousers(54, true)}
        </>
      ) : (
        trousers(62, false)
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Chemise homme — poche de poitrine en gros plan (viewBox 64 × 60).
// ---------------------------------------------------------------------------

const POCKET_PATH = "M18 16H46V44L32 52 18 44Z";
const POCKET_BOX = "0 0 64 60";

// ---------------------------------------------------------------------------

const ICONS = {
  // === Modèle ===============================================================
  "sh-modele-chemise": { viewBox: SHIRT_BOX, body: shirt({ pocket: "une" }) },
  "sh-modele-blouse": {
    viewBox: SHIRT_BOX,
    body: shirt({ fitted: true, placket: "cachee" }),
  },

  // === Manches ==============================================================
  "sh-manche-longues": { viewBox: SHIRT_BOX, body: shirt({ sleeve: "longues" }) },
  "sh-manche-trois-quarts": { viewBox: SHIRT_BOX, body: shirt({ sleeve: "trois-quarts" }) },
  "sh-manche-courtes": { viewBox: SHIRT_BOX, body: shirt({ sleeve: "courtes" }) },
  "sh-manche-sans": { viewBox: SHIRT_BOX, body: shirt({ sleeve: "sans" }) },

  // === Boutonnage ===========================================================
  "sh-patte-classique": { viewBox: SHIRT_BOX, body: shirt({ placket: "classique" }) },
  "sh-patte-cachee": { viewBox: SHIRT_BOX, body: shirt({ placket: "cachee" }) },
  "sh-patte-sans": { viewBox: SHIRT_BOX, body: shirt({ placket: "sans-patte" }) },

  // === Poche ================================================================
  "sh-poche-sans": { viewBox: SHIRT_BOX, body: shirt({ pocket: "sans" }) },
  "sh-poche-une": { viewBox: SHIRT_BOX, body: shirt({ pocket: "une" }) },
  "sh-poche-deux": { viewBox: SHIRT_BOX, body: shirt({ pocket: "deux" }) },

  // === Bas ==================================================================
  "sh-bas-arrondi": { viewBox: SHIRT_BOX, body: shirt({ hem: "arrondi" }) },
  "sh-bas-droit": { viewBox: SHIRT_BOX, body: shirt({ hem: "droit" }) },

  // === Homme : comment la porter ============================================
  "sh-porter-dedans": { viewBox: SHIRT_BOX, body: wornShirt(true) },
  "sh-porter-dehors": { viewBox: SHIRT_BOX, body: wornShirt(false) },

  // === Homme : poche en gros plan ===========================================
  "sh-pochette-sans": {
    viewBox: POCKET_BOX,
    body: (
      <>
        <g strokeOpacity={0.45} strokeDasharray="2.4 2">
          <path d={POCKET_PATH} />
        </g>
        <path d="M14 54 50 10" />
      </>
    ),
  },
  "sh-pochette-simple": {
    viewBox: POCKET_BOX,
    body: (
      <>
        <path d={POCKET_PATH} />
        <Seam>
          <path d="M18 20H46" />
        </Seam>
      </>
    ),
  },
  "sh-pochette-rabat": {
    viewBox: POCKET_BOX,
    body: (
      <>
        <path d={POCKET_PATH} />
        <path d="M17 14H47V24L32 30 17 24Z" />
        <Button x={32} y={26} r={1.5} />
      </>
    ),
  },

  // === Col ==================================================================
  "sh-col-italien": {
    viewBox: COLLAR_BOX,
    body: pointedCollar("18.2 21.4", <Button x={32} y={20.4} r={1.1} />),
  },
  "sh-col-classique": {
    viewBox: COLLAR_BOX,
    body: pointedCollar("20.4 27.6", <Button x={32} y={20.4} r={1.1} />),
  },
  "sh-col-classique-2": {
    viewBox: COLLAR_BOX,
    body: pointedCollar(
      "20.4 27.6",
      <>
        <Button x={32} y={17.2} r={1} />
        <Button x={32} y={21.2} r={1} />
      </>,
    ),
  },
  "sh-col-pointes-courtes": {
    viewBox: COLLAR_BOX,
    body: pointedCollar("21.4 21.6", <Button x={32} y={20.4} r={1.1} />),
  },
  "sh-col-boutonne": {
    viewBox: COLLAR_BOX,
    body: pointedCollar(
      "20.4 27.6",
      <>
        <Button x={32} y={20.4} r={1.1} />
        <Button x={22.2} y={24.6} r={0.85} />
        <Button x={41.8} y={24.6} r={0.85} />
      </>,
    ),
  },
  "sh-col-rond": {
    viewBox: COLLAR_BOX,
    body: (
      <>
        {collarFrame(23.6)}
        {COLLAR_BACK}
        <path d="M24 12C18.4 15 17.6 24.6 24 25.7C27.2 26.2 29.7 24.8 31.2 23.2" />
        <Mirror>
          <path d="M24 12C18.4 15 17.6 24.6 24 25.7C27.2 26.2 29.7 24.8 31.2 23.2" />
        </Mirror>
        <Button x={32} y={20.4} r={1.1} />
      </>
    ),
  },
  "sh-col-mao": {
    viewBox: COLLAR_BOX,
    body: (
      <>
        {collarFrame(21.2)}
        <path d="M24 12Q32 8.6 40 12" />
        {[0, 1].map((i) => {
          const half = (
            <>
              <path d="M24 12 24.6 18.6Q28.4 21 31.2 21.2V15.8Q27.4 15.4 24 12" />
            </>
          );
          return i === 0 ? <g key={i}>{half}</g> : <Mirror key={i}>{half}</Mirror>;
        })}
        <Button x={32} y={18.4} r={1} />
      </>
    ),
  },
  "sh-col-lavalliere": {
    viewBox: COLLAR_BOX,
    body: (
      <>
        {collarFrame(26)}
        <path d="M24 12Q32 8.6 40 12" />
        <path d="M24 12Q27 21 32 23" />
        <Mirror>
          <path d="M24 12Q27 21 32 23" />
        </Mirror>
        {[0, 1].map((i) => {
          const half = (
            <>
              <path d="M30.6 24C26.4 19.6 21.6 21 22.6 24.6 23.6 27.6 27.8 26.8 30.6 24.6" />
              <path d="M31 25.6 27.4 37 30 37.7 32 26.4" />
            </>
          );
          return i === 0 ? <g key={i}>{half}</g> : <Mirror key={i}>{half}</Mirror>;
        })}
        <ellipse cx={32} cy={24.4} rx={1.8} ry={1.6} />
      </>
    ),
  },

  // === Poignets =============================================================
  "sh-poignet-un-bouton": {
    viewBox: CUFF_BOX,
    body: (
      <>
        {SLEEVE_END}
        <path d="M19.5 30H44.5V45H19.5Z" />
        <circle cx={39.5} cy={37.5} r={1.4} />
      </>
    ),
  },
  "sh-poignet-deux-boutons": {
    viewBox: CUFF_BOX,
    body: (
      <>
        {SLEEVE_END}
        <path d="M19.5 30H44.5V45H19.5Z" />
        <circle cx={36} cy={37.5} r={1.4} />
        <circle cx={40.6} cy={37.5} r={1.4} />
      </>
    ),
  },
  "sh-poignet-mousquetaire": {
    viewBox: CUFF_BOX,
    body: (
      <>
        {SLEEVE_END}
        <path d="M19 30H45V50H19Z" />
        <Seam>
          <path d="M19 40H45" />
        </Seam>
        <circle cx={40} cy={45} r={2.2} />
        <Button x={40} y={45} r={0.8} />
      </>
    ),
  },
  "sh-poignet-arrondi": {
    viewBox: CUFF_BOX,
    body: (
      <>
        {SLEEVE_END}
        <path d="M19.5 30H44.5V40.5Q44.5 45 40 45H24Q19.5 45 19.5 40.5Z" />
        <circle cx={39.5} cy={37} r={1.4} />
      </>
    ),
  },
} satisfies Record<string, IconDef>;

export type ShirtDetailIconName = keyof typeof ICONS;

/** Les noms de planches chemise commencent tous par `sh-`. */
export function isShirtArt(name: string): name is ShirtDetailIconName {
  return name in ICONS;
}

/** Chemise entière (portrait) ou vue rapprochée (carrée) ? */
export function shirtArtIsTall(name: ShirtDetailIconName): boolean {
  return ICONS[name].viewBox === SHIRT_BOX;
}

export function ShirtDetailIcon({
  name,
  className,
}: {
  name: ShirtDetailIconName;
  className?: string;
}) {
  const icon: IconDef = ICONS[name];
  return (
    <svg
      viewBox={icon.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={icon.strokeWidth ?? (icon.viewBox === COLLAR_BOX ? 0.95 : 1.4)}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icon.body}
    </svg>
  );
}
