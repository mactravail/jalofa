// Planches du smoking et du costume 3 pièces homme (JALOFA EUROPE) — inspirées du configurateur
// Hockerty : la veste entière où un seul détail change (boutonnage, poches),
// des vues rapprochées du revers, et le pantalon (bandes de satin, longueur,
// pinces, réglage de la taille).
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

function Button({ x, y, r = 0.95 }: { x: number; y: number; r?: number }) {
  return <circle cx={x} cy={y} r={r} />;
}

/** Flèche de `a` vers `b`, pointe en `b`. */
function arrow(x1: number, y1: number, x2: number, y2: number, key?: string): ReactNode {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = 1.6;
  const p1 = `${x2 - h * Math.cos(a - 0.5)} ${y2 - h * Math.sin(a - 0.5)}`;
  const p2 = `${x2 - h * Math.cos(a + 0.5)} ${y2 - h * Math.sin(a + 0.5)}`;
  return <path key={key} d={`M${x1} ${y1}L${x2} ${y2}M${p1}L${x2} ${y2}L${p2}`} />;
}

// ---------------------------------------------------------------------------
// Veste (viewBox 64 × 84)
// ---------------------------------------------------------------------------

type Closure = "1" | "2" | "3" | "db2" | "db4" | "db6";
type Lapel = "cran" | "pointe" | "chale";
type Width = "etroit" | "moyen" | "large";
type Pockets = "rabat" | "passepoil" | "ticket" | "plaquee" | "rabat3";
/** Nœud papillon (smoking) ou cravate (costume). */
type Neckwear = "noeud" | "cravate";

type JacketSpec = {
  closure?: Closure;
  lapel?: Lapel;
  width?: Width;
  pockets?: Pockets;
  neckwear?: Neckwear;
};

/** Cravate dans l'ouverture du col, du nœud jusqu'à `bottom`. */
function tie(bottom: number): ReactNode {
  return (
    <>
      <path d="M30.6 11.2H33.4L32.8 14H31.2Z" />
      <path d={`M31.2 14 30.4 ${bottom - 3}L32 ${bottom}L33.6 ${bottom - 3}L32.8 14`} />
    </>
  );
}

const WIDTH_SHIFT: Record<Width, number> = { etroit: 2, moyen: 0, large: -2.2 };

/** Revers gauche : col, cran (ou pointe, ou châle) jusqu'au point de boutonnage. */
function lapelLeft(lapel: Lapel, width: Width, bp: number): ReactNode {
  const w = WIDTH_SHIFT[width];
  const h = w / 2;
  let d: string;
  switch (lapel) {
    case "cran":
      d = `M27.5 9L${24.8 + h} 16.6L${23.4 + h} 17.6L${20.8 + w} 17C${21.2 + w} 27 26.4 ${bp - 8} 32 ${bp}`;
      break;
    case "pointe":
      d = `M27.5 9L${25.2 + h} 15.6L${22.8 + h} 16.8L${19.4 + w} 13.2C${20.4 + w} 26 26.2 ${bp - 8} 32 ${bp}`;
      break;
    case "chale":
      d = `M27.5 9C${20.2 + w} 15 ${20.6 + w} ${bp - 14} 32 ${bp}`;
      break;
  }
  return (
    <>
      <path d={d} />
      {/* ligne de cassure : l'ouverture sur la chemise */}
      <path d={`M27.5 9L32 ${bp}`} />
    </>
  );
}

function jacketHalf(spec: Required<JacketSpec>, bp: number, lastButton: number): ReactNode {
  const db = spec.closure.startsWith("db");
  const pocket =
    spec.pockets === "rabat" || spec.pockets === "rabat3" ? (
      <path d="M18.8 55H27.4L27.2 59.2H19Z" />
    ) : spec.pockets === "plaquee" ? (
      <path d="M18.8 53.4H27.4V59.4Q27.4 61.4 25.4 61.4H20.8Q18.8 61.4 18.8 59.4Z" />
    ) : (
      <path d="M18.8 56H27.4V57.4H18.8Z" />
    );
  return (
    <>
      {/* épaule, manche, côté */}
      <path d="M27.5 9 12 12.4" />
      <path d="M12 12.4C9.6 15 8.8 20 8.6 26L7.6 70H13.4L17 28" />
      <Seam>
        <path d="M9.4 66.6 13.6 66.4" />
      </Seam>
      <path d="M17 28 17.5 76" />
      {/* bas : arrondi sur une veste droite, droit sur une croisée */}
      {db ? (
        <path d="M17.5 76H32" />
      ) : (
        <>
          <path d="M17.5 76Q23 77 28.6 75.6" />
          <path d={`M32 ${bp}L32 ${lastButton}C31.6 62 30.4 70 28.6 75.6`} />
        </>
      )}
      {lapelLeft(spec.lapel, spec.width, bp)}
      {pocket}
    </>
  );
}

function jacket(input: JacketSpec): ReactNode {
  const spec: Required<JacketSpec> = {
    closure: "1",
    lapel: "pointe",
    width: "moyen",
    pockets: "passepoil",
    neckwear: "noeud",
    ...input,
  };
  const db = spec.closure.startsWith("db");
  const bp = spec.closure === "3" ? 35 : spec.closure === "2" ? 40 : db ? 42 : 46;

  let buttons: [number, number][] = [];
  switch (spec.closure) {
    case "1":
      buttons = [[32, 47.6]];
      break;
    case "2":
      buttons = [
        [32, 41.6],
        [32, 52],
      ];
      break;
    case "3":
      buttons = [
        [32, 36.6],
        [32, 45],
        [32, 53.4],
      ];
      break;
    case "db2":
      buttons = [
        [27.4, 50],
        [36.6, 50],
      ];
      break;
    case "db4":
      buttons = [44, 54].flatMap((y): [number, number][] => [
        [27.4, y],
        [36.6, y],
      ]);
      break;
    case "db6":
      buttons = [38, 46, 54].flatMap((y): [number, number][] => [
        [27.4, y],
        [36.6, y],
      ]);
      break;
  }
  const lastButton = Math.max(...buttons.map(([, y]) => y));

  return (
    <>
      {jacketHalf(spec, bp, lastButton)}
      <Mirror>
        {jacketHalf(spec, bp, lastButton)}
        {/* poche poitrine : côté cœur */}
        <path d="M20.6 29.6 25.8 29 25.9 30.4 20.7 31Z" />
      </Mirror>
      {spec.pockets === "ticket" && <path d="M21.4 50.8H27.4V52H21.4Z" />}
      {spec.pockets === "rabat3" && <path d="M21.4 50H27.4L27.3 52.6H21.5Z" />}
      {/* croisé : le pan du dessus croise jusqu'à droite */}
      {db && <path d={`M32 ${bp}L39 ${bp + 2}V76`} />}
      {/* col de la veste, nœud papillon, plastron de chemise */}
      <path d="M27.5 9Q32 7 36.5 9" />
      {spec.neckwear === "noeud" ? (
        <>
          <path d="M32 12.6 29 10.9V14.3ZM32 12.6 35 10.9V14.3Z" />
          <Seam>
            <path d={`M32 14V${bp - 2}`} />
          </Seam>
        </>
      ) : (
        tie(bp - 1.5)
      )}
      {buttons.map(([x, y]) => (
        <Button key={`${x}-${y}`} x={x} y={y} />
      ))}
    </>
  );
}

const JACKET_BOX = "0 0 64 84";

/** Vue rapprochée du revers gauche (même dessin, cadré sur le col). */
const LAPEL_BOX = "13 4 24 24";

// ---------------------------------------------------------------------------
// Pantalon (viewBox 64 × 84)
// ---------------------------------------------------------------------------

type TrouserSpec = { stripe?: boolean; length?: "long" | "bermuda"; pleats?: 0 | 1 | 2 };

function trousersHalf({ stripe = true, length = "long", pleats = 0 }: TrouserSpec): ReactNode {
  const hemY = length === "long" ? 80 : 46;
  const outerX = length === "long" ? 14.5 : 15.3;
  const innerX = length === "long" ? 30.6 : 31.2;
  return (
    <>
      <path d={`M16 11L${outerX} ${hemY}H${innerX}L32 24`} />
      {stripe && (
        <path
          d={`M17.4 11.4L${outerX + 1.3} ${hemY - 0.4}`}
          strokeWidth={2}
          strokeOpacity={0.85}
        />
      )}
      <Seam>
        <path d="M19 11 21.2 19.5" />
        {pleats >= 1 && <path d="M25.2 11 25.5 21" />}
        {pleats === 2 && <path d="M22.8 11 23 18" />}
        {/* pli du pantalon */}
        <path d={`M23.2 ${pleats ? 21 : 13}L${(outerX + innerX) / 2} ${hemY - 1}`} />
      </Seam>
    </>
  );
}

function trousers(spec: TrouserSpec): ReactNode {
  return (
    <>
      <path d="M16 6H48V11H16Z" />
      <Seam>
        <path d="M21 6V11M43 6V11M28 6V11" />
        <path d="M32 11V24M32 24Q34.6 22 34.6 18V11" />
      </Seam>
      {trousersHalf(spec)}
      <Mirror>{trousersHalf(spec)}</Mirror>
    </>
  );
}

const TROUSERS_BOX = "0 0 64 84";

/** Veste et pantalon côte à côte — « Même tissu » / « Tissu différent ». */
function combo(different: boolean): ReactNode {
  return (
    <>
      {jacket({})}
      <g transform="translate(55 4) scale(0.62 0.95)">
        {different && (
          <path
            d="M16 6H48V11L49.5 80H33.4L32 24 30.6 80H14.5L16 11Z"
            fill="currentColor"
            fillOpacity={0.28}
            stroke="none"
          />
        )}
        {trousers({ stripe: false })}
      </g>
    </>
  );
}

// ---------------------------------------------------------------------------
// Poches en gros plan (viewBox 64 × 60)
// ---------------------------------------------------------------------------

const POCKET_BOX = "0 0 64 60";

// ---------------------------------------------------------------------------
// Ceinture en gros plan (viewBox 64 × 60)
// ---------------------------------------------------------------------------

const WAIST_BASE = (
  <>
    <path d="M4 14H60V25H4Z" />
    <path d="M6 25 8 60" />
    <path d="M58 25 57 60" />
    <Seam>
      <path d="M44 25V44Q44 48 40 50" />
      <path d="M14 25 18 40" />
    </Seam>
    <Button x={52} y={19.5} r={1.3} />
  </>
);

const LOOPS = (
  <>
    <path d="M22.5 12H25.5V27H22.5Z" />
    <path d="M36.5 12H39.5V27H36.5Z" />
  </>
);

const WAIST_BOX = "0 0 64 60";

// ---------------------------------------------------------------------------
// Costume 3 pièces — fente du dos, revers du pantalon, gilet
// ---------------------------------------------------------------------------

/** Bas du dos de la veste (viewBox 64 × 60). */
function vent(kind: "sans" | "centrale" | "laterales"): ReactNode {
  return (
    <>
      <path d="M9 4 7 50Q32 54 57 50L55 4" />
      <Seam>
        <path d="M3.6 4 2.4 44M60.4 4 61.6 44" />
        <path d={kind === "centrale" ? "M32 4V34" : "M32 4V52"} />
      </Seam>
      {kind === "centrale" && <path d="M32 34V52M33.6 34.6V51.8" />}
      {kind === "laterales" && <path d="M15 34V51M16.6 34.6V51.2M49 34V51M47.4 34.6V51.2" />}
    </>
  );
}

const VENT_BOX = "0 0 64 60";

/** Bas des jambes du pantalon (viewBox 64 × 60), avec ou sans revers. */
function trouserHem(cuff: boolean): ReactNode {
  const leg = (
    <>
      <path d="M8 2 9 50H29L29.6 2" />
      {cuff && <path d="M8.7 42.4H29.2" />}
      <Seam>
        <path d="M19 2 19 42" />
      </Seam>
    </>
  );
  return (
    <>
      {leg}
      <g transform="translate(26.4 0)">{leg}</g>
    </>
  );
}

const HEM_BOX = "0 0 64 60";

type GiletSpec = { closure?: "4" | "5" | "db6"; lapel?: "sans" | "cran" | "pointe" };

/** Gilet vu de face (viewBox 64 × 84), chemise et cravate dans l'encolure. */
function gilet({ closure = "5", lapel = "sans" }: GiletSpec): ReactNode {
  const db = closure === "db6";
  const bp = closure === "4" ? 34 : 30;
  const buttons: [number, number][] =
    closure === "5"
      ? [33, 40.5, 48, 55.5, 63].map((y): [number, number] => [32, y])
      : closure === "4"
        ? [36.5, 45, 53.5, 62].map((y): [number, number] => [32, y])
        : [38, 46, 54].flatMap((y): [number, number][] => [
            [27.4, y],
            [36.6, y],
          ]);
  const half = (
    <>
      <path d="M27.5 9 19 10" />
      <path d="M19 10C18.6 20 15.4 26 12.4 29L13.4 64L24 65.4L31.4 71" />
      {!db && <path d={`M32 ${bp}L31.4 71`} />}
      {lapel === "sans" ? <path d={`M27.5 9L32 ${bp}`} /> : lapelLeft(lapel, "etroit", bp)}
      <Seam>
        <path d="M17 50.4 23.4 51.4" />
      </Seam>
    </>
  );
  return (
    <>
      {half}
      <Mirror>{half}</Mirror>
      {db && <path d={`M32 ${bp}L39 ${bp + 2}V68.4`} />}
      <path d="M27.5 9Q32 7 36.5 9" />
      {tie(bp - 1.5)}
      {buttons.map(([x, y]) => (
        <Button key={`${x}-${y}`} x={x} y={y} />
      ))}
    </>
  );
}

/** Un costume : veste à cravate, poches à rabat, revers crantés. */
const SUIT = { neckwear: "cravate", lapel: "cran", pockets: "rabat", closure: "2" } as const;

/** Veste et pantalon côte à côte, version costume. */
function suitCombo(different: boolean): ReactNode {
  return (
    <>
      {jacket(SUIT)}
      <g transform="translate(55 4) scale(0.62 0.95)">
        {different && (
          <path
            d="M16 6H48V11L49.5 80H33.4L32 24 30.6 80H14.5L16 11Z"
            fill="currentColor"
            fillOpacity={0.28}
            stroke="none"
          />
        )}
        {trousers({ stripe: false })}
      </g>
    </>
  );
}

// ---------------------------------------------------------------------------

const ICONS = {
  // ======================= COSTUME 3 PIÈCES ===============================
  "cs-veste-1": { viewBox: JACKET_BOX, body: jacket({ ...SUIT, closure: "1" }) },
  "cs-veste-2": { viewBox: JACKET_BOX, body: jacket(SUIT) },
  "cs-veste-3": { viewBox: JACKET_BOX, body: jacket({ ...SUIT, closure: "3" }) },
  "cs-tissu-meme": { viewBox: "0 0 90 84", body: suitCombo(false) },
  "cs-tissu-different": { viewBox: "0 0 90 84", body: suitCombo(true) },
  "cs-revers-cran": { viewBox: LAPEL_BOX, body: jacket(SUIT) },
  "cs-revers-pointe": { viewBox: LAPEL_BOX, body: jacket({ ...SUIT, lapel: "pointe" }) },
  "cs-revers-chale": { viewBox: LAPEL_BOX, body: jacket({ ...SUIT, lapel: "chale" }) },
  "cs-poche-plaquee": {
    viewBox: POCKET_BOX,
    body: (
      <>
        <path d="M16 10H48V44Q48 50 42 50H22Q16 50 16 44Z" />
        <path d="M16 15H48" strokeOpacity={0.6} />
      </>
    ),
  },
  "cs-poche-rabat3": {
    viewBox: POCKET_BOX,
    body: (
      <>
        <path d="M28 12H54L53.4 20H28.6Z" />
        <path d="M30 14.4H52" strokeOpacity={0.6} strokeDasharray="1.6 1.6" />
        <path d="M10 30H54L53 42H11Z" />
        <path d="M13 33H51" strokeOpacity={0.6} strokeDasharray="1.6 1.6" />
      </>
    ),
  },
  "cs-fente-sans": { viewBox: VENT_BOX, body: vent("sans") },
  "cs-fente-centrale": { viewBox: VENT_BOX, body: vent("centrale") },
  "cs-fente-laterales": { viewBox: VENT_BOX, body: vent("laterales") },
  "cs-longueur-long": { viewBox: TROUSERS_BOX, body: trousers({ stripe: false }) },
  "cs-longueur-bermuda": {
    viewBox: TROUSERS_BOX,
    body: trousers({ stripe: false, length: "bermuda" }),
  },
  "cs-pinces-0": { viewBox: TROUSERS_BOX, body: trousers({ stripe: false, pleats: 0 }) },
  "cs-pinces-1": { viewBox: TROUSERS_BOX, body: trousers({ stripe: false, pleats: 1 }) },
  "cs-pinces-2": { viewBox: TROUSERS_BOX, body: trousers({ stripe: false, pleats: 2 }) },
  "cs-bas-sans-revers": { viewBox: HEM_BOX, body: trouserHem(false) },
  "cs-bas-revers": { viewBox: HEM_BOX, body: trouserHem(true) },
  "cs-gilet-4": { viewBox: JACKET_BOX, body: gilet({ closure: "4" }) },
  "cs-gilet-5": { viewBox: JACKET_BOX, body: gilet({ closure: "5" }) },
  "cs-gilet-db6": { viewBox: JACKET_BOX, body: gilet({ closure: "db6" }) },
  "cs-gilet-revers-sans": { viewBox: JACKET_BOX, body: gilet({ lapel: "sans" }) },
  "cs-gilet-revers-cran": { viewBox: JACKET_BOX, body: gilet({ lapel: "cran" }) },
  "cs-gilet-revers-pointe": { viewBox: JACKET_BOX, body: gilet({ lapel: "pointe" }) },

  // ============================ SMOKING ===================================
  // === Style de veste =======================================================
  "tx-veste-1": { viewBox: JACKET_BOX, body: jacket({ closure: "1" }) },
  "tx-veste-2": { viewBox: JACKET_BOX, body: jacket({ closure: "2", lapel: "cran" }) },
  "tx-veste-db2": { viewBox: JACKET_BOX, body: jacket({ closure: "db2" }) },
  "tx-veste-db4": { viewBox: JACKET_BOX, body: jacket({ closure: "db4" }) },
  "tx-veste-db6": { viewBox: JACKET_BOX, body: jacket({ closure: "db6" }) },

  // === Combinaison de tissus ================================================
  "tx-tissu-meme": { viewBox: "0 0 90 84", body: combo(false) },
  "tx-tissu-different": { viewBox: "0 0 90 84", body: combo(true) },

  // === Revers ===============================================================
  "tx-revers-cran": { viewBox: LAPEL_BOX, body: jacket({ lapel: "cran" }) },
  "tx-revers-pointe": { viewBox: LAPEL_BOX, body: jacket({ lapel: "pointe" }) },
  "tx-revers-chale": { viewBox: LAPEL_BOX, body: jacket({ lapel: "chale" }) },

  // === Largeur du revers ====================================================
  "tx-largeur-etroit": {
    viewBox: LAPEL_BOX,
    body: (
      <>
        {jacket({ width: "etroit" })}
        <g strokeWidth={0.9}>
          {arrow(14.5, 22, 20, 22, "a")}
          {arrow(30.5, 24, 26, 24, "b")}
        </g>
      </>
    ),
  },
  "tx-largeur-moyen": { viewBox: LAPEL_BOX, body: jacket({ width: "moyen" }) },
  "tx-largeur-large": {
    viewBox: LAPEL_BOX,
    body: (
      <>
        {jacket({ width: "large" })}
        <g strokeWidth={0.9}>
          {arrow(19.5, 22, 14.5, 22, "a")}
          {arrow(25.5, 24, 30.5, 24, "b")}
        </g>
      </>
    ),
  },

  // === Poches ===============================================================
  "tx-poche-rabat": {
    viewBox: POCKET_BOX,
    body: (
      <>
        <path d="M13 27H51" strokeOpacity={0.6} strokeDasharray="1.6 1.6" />
        <path d="M10 24H54L53 36H11Z" />
      </>
    ),
  },
  "tx-poche-passepoil": {
    viewBox: POCKET_BOX,
    body: (
      <>
        <rect x={10} y={26} width={44} height={8} rx={4} />
        <path d="M13 30H51" strokeOpacity={0.6} />
      </>
    ),
  },
  "tx-poche-ticket": {
    viewBox: POCKET_BOX,
    body: (
      <>
        <rect x={28} y={14} width={26} height={6} rx={3} />
        <path d="M30.5 17H51.5" strokeOpacity={0.6} />
        <rect x={10} y={32} width={44} height={8} rx={4} />
        <path d="M13 36H51" strokeOpacity={0.6} />
      </>
    ),
  },

  // === Pantalon : bandes latérales ==========================================
  "tx-bande-sans": { viewBox: TROUSERS_BOX, body: trousers({ stripe: false }) },
  "tx-bande-avec": { viewBox: TROUSERS_BOX, body: trousers({ stripe: true }) },

  // === Pantalon : longueur ==================================================
  "tx-longueur-long": { viewBox: TROUSERS_BOX, body: trousers({ length: "long" }) },
  "tx-longueur-bermuda": { viewBox: TROUSERS_BOX, body: trousers({ length: "bermuda" }) },

  // === Pantalon : pinces ====================================================
  "tx-pinces-0": { viewBox: TROUSERS_BOX, body: trousers({ pleats: 0 }) },
  "tx-pinces-1": { viewBox: TROUSERS_BOX, body: trousers({ pleats: 1 }) },
  "tx-pinces-2": { viewBox: TROUSERS_BOX, body: trousers({ pleats: 2 }) },

  // === Pantalon : réglage de la taille ======================================
  "tx-taille-standard": {
    viewBox: WAIST_BOX,
    body: (
      <>
        {WAIST_BASE}
        {LOOPS}
      </>
    ),
  },
  "tx-taille-pattes": {
    viewBox: WAIST_BOX,
    body: (
      <>
        {WAIST_BASE}
        <path d="M5 16.5H17V22.5H5Z" />
        <path d="M16 15H21V24H16Z" />
        <path d="M18.5 15V24" strokeOpacity={0.6} />
      </>
    ),
  },
  "tx-taille-active": {
    viewBox: WAIST_BOX,
    body: (
      <>
        {WAIST_BASE}
        <Seam>
          {[6, 8, 10, 12, 14, 16, 18].map((x) => (
            <path key={x} d={`M${x} 16.4V22.6`} />
          ))}
        </Seam>
      </>
    ),
  },
} satisfies Record<string, IconDef>;

export type TuxedoDetailIconName = keyof typeof ICONS;

export function isTuxedoArt(name: string): name is TuxedoDetailIconName {
  return name in ICONS;
}

/** Veste ou pantalon entiers (portrait) ou vue rapprochée (carrée) ? */
export function tuxedoArtIsTall(name: TuxedoDetailIconName): boolean {
  return ICONS[name].viewBox === JACKET_BOX;
}

export function TuxedoDetailIcon({
  name,
  className,
}: {
  name: TuxedoDetailIconName;
  className?: string;
}) {
  const icon: IconDef = ICONS[name];
  return (
    <svg
      viewBox={icon.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={icon.viewBox === LAPEL_BOX ? 0.6 : 1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icon.body}
    </svg>
  );
}
