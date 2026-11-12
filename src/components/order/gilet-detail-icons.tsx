// Planches du GILET HOMME (slug `gilet`, catégorie homme) — le gilet sans
// manches porté sur une chemise : décolleté en V, boutonné devant, bas en
// pointes, souvent taillé dans un wax.
//
// Même trait que les autres planches : la coupe sur le gilet entier ; le col,
// le boutonnage, le bas et les poches en gros plan (le même gilet, recadré) ;
// le dos dessiné de dos.

import type { ReactNode } from "react";
import { Cloth, Mirror, Seam } from "@/components/order/baye-lahat-detail-icons";

type IconDef = { viewBox: string; body: ReactNode };

function mirrored(half: ReactNode): ReactNode {
  return (
    <>
      {half}
      <Mirror>{half}</Mirror>
    </>
  );
}

type Cut = "classique" | "cintre" | "long";
type Col = "v-profond" | "v-haut" | "chale" | "cranté" | "mao";
type Bas = "pointes" | "droit" | "arrondi";
type Buttons = 3 | 4 | 5 | "croise";
type Pockets = "sans" | "deux" | "trois" | "rabat";

type Opts = { cut?: Cut; col?: Col; bas?: Bas; buttons?: Buttons; pockets?: Pockets };

/** `waist` — le creux de la taille (plus grand = plus cintré) ; `hem` — le bas. */
const CUTS: Record<Cut, { waist: number; hem: number; sideX: number }> = {
  classique: { waist: 17.4, hem: 58, sideX: 15.4 },
  cintre: { waist: 19.6, hem: 56, sideX: 16.6 },
  long: { waist: 17.8, hem: 74, sideX: 14.6 },
};

/** Où le V se referme (le premier bouton). */
const COL_TOP: Record<Col, number> = {
  "v-profond": 30,
  "v-haut": 20,
  chale: 30,
  "cranté": 30,
  mao: 13,
};

const ARMHOLE = "M25 4 16.6 6.4C18.6 14 18.4 22 13.6 27";

/** Le haut du dos qu'on aperçoit dans le décolleté. */
const BACK_NECK = (
  <Seam>
    <path d="M25 4Q28.5 6.6 32 6.8" />
  </Seam>
);

/** Moitié gauche du col (l'ouverture du devant). */
function colHalf(col: Col): ReactNode {
  switch (col) {
    case "v-profond":
      return (
        <>
          <path d="M25 4 32 30" />
          {BACK_NECK}
        </>
      );
    case "v-haut":
      return (
        <>
          <path d="M25 4 32 20" />
          {BACK_NECK}
        </>
      );
    case "chale":
      // Le châle : une bande arrondie qui fait le tour du décolleté.
      return (
        <>
          <path d="M25 4C22.4 14 25.6 23 32 30" />
          <path d="M27.8 5.6C26.6 14 28.6 21 32 25.4" />
          {BACK_NECK}
        </>
      );
    case "cranté":
      // Le revers cranté : une encoche entre le col et le revers.
      return (
        <>
          <path d="M25 4 27.6 9.4 23.8 10.4 21.6 13.6 32 30" />
          <Seam>
            <path d="M27.6 9.4 32 25" />
          </Seam>
          {BACK_NECK}
        </>
      );
    case "mao":
      // Encolure ronde fermée haut, surmontée d'un col droit.
      return (
        <>
          <path d="M25 4Q26.2 12.4 32 13" />
          <path d="M25 4 25.4 0.8Q26.6 9.6 32 10.2V13" />
        </>
      );
  }
}

/** Le bas : la fin du côté, puis la ligne du bas jusqu'au milieu. */
function basHalf(bas: Bas, sideX: number, hem: number): { sideY: number; bottom: string; centerY: number } {
  switch (bas) {
    case "pointes":
      return { sideY: hem - 3, bottom: `M${sideX} ${hem - 3}L30 ${hem + 4}L32 ${hem + 2.4}`, centerY: hem + 2.4 };
    case "droit":
      return { sideY: hem, bottom: `M${sideX} ${hem}H32`, centerY: hem };
    case "arrondi":
      return { sideY: hem, bottom: `M${sideX} ${hem}H25Q31 ${hem} 32 ${hem - 6}`, centerY: hem - 6 };
  }
}

function gilet({
  cut = "classique",
  col = "v-profond",
  bas = "pointes",
  buttons = 4,
  pockets = "sans",
}: Opts): ReactNode {
  const { waist, hem, sideX } = CUTS[cut];
  const { sideY, bottom, centerY } = basHalf(bas, sideX, hem);
  const top = COL_TOP[col];
  const croise = buttons === "croise";
  const pocketY = cut === "long" ? 46 : 42;

  const half = (
    <>
      <path d={`${ARMHOLE}Q${waist} 40 ${sideX} ${sideY}`} />
      <path d={bottom} />
      {!croise && colHalf(col)}
      {(pockets === "deux" || pockets === "trois") && (
        <path d={`M18.4 ${pocketY + 1.2}L25.4 ${pocketY}V${pocketY + 1.4}L18.4 ${pocketY + 2.6}Z`} />
      )}
      {pockets === "rabat" && (
        <path
          d={`M18.4 ${pocketY + 1.2}L25.4 ${pocketY}V${pocketY + 3.6}Q25.4 ${pocketY + 4.6} 24.4 ${pocketY + 4.8}L19.4 ${pocketY + 5.6}Q18.4 ${pocketY + 5.8} 18.4 ${pocketY + 4.8}Z`}
        />
      )}
    </>
  );

  let front: ReactNode;
  if (croise) {
    // Croisé : le pan gauche passe par-dessus, deux rangées de boutons.
    front = (
      <>
        <path d="M25 4 37.6 30" />
        <path d="M39 4 37.6 30" />
        {BACK_NECK}
        <Mirror>{BACK_NECK}</Mirror>
        <path d={`M37.6 30V${bas === "pointes" ? hem + 1.8 : centerY}`} />
        {[34, 41, 48].map((y) => (
          <g key={y}>
            <circle cx={27.6} cy={y} r={0.9} />
            <circle cx={35.4} cy={y} r={0.9} />
          </g>
        ))}
      </>
    );
  } else {
    const count = buttons;
    const first = top + 3;
    const last = centerY - 5;
    const step = (last - first) / (count - 1);
    front = (
      <>
        <path d={`M32 ${top}V${centerY}`} />
        {Array.from({ length: count }, (_, i) => (
          <circle key={i} cx={32} cy={first + i * step} r={0.9} />
        ))}
      </>
    );
  }

  return (
    <>
      {mirrored(half)}
      {front}
      {pockets === "trois" && <path d="M37.8 22.6 43.2 21.8V23.2L37.8 24Z" />}
    </>
  );
}

// --- Le dos -----------------------------------------------------------------------

type Dos = "tissu" | "doublure" | "martingale";

function dos(kind: Dos): ReactNode {
  const outline = `${ARMHOLE}Q17.4 40 15.4 56H32`;
  return (
    <>
      {kind === "doublure" &&
        mirrored(<Cloth d={`M25 4 16.6 6.4C18.6 14 18.4 22 13.6 27Q17.4 40 15.4 56H32V6Q28.5 5.8 25 4Z`} />)}
      {mirrored(
        <>
          <path d={outline} />
          {/* le dos monte plus haut que le devant */}
          <path d="M25 4Q28.5 5.8 32 6" />
          {kind === "martingale" && <path d="M16.6 43H29V46.4H16.4" />}
        </>,
      )}
      <Seam>
        <path d={kind === "martingale" ? "M32 6V42.6M32 46.8V56" : "M32 6V56"} />
      </Seam>
      {kind === "martingale" && (
        <>
          {/* la boucle qui règle la taille */}
          <path d="M29 42.2H35V47.2H29Z" />
          <path d="M32 42.2V47.2" strokeWidth={0.9} />
        </>
      )}
    </>
  );
}

const BOX = "0 -2 64 84";
/** Le haut du gilet : le col. */
const COL_BOX = "6 -2 52 40";
/** Le milieu du devant : les boutons. */
const BUTTON_BOX = "12 6 40 60";
/** Le bas du gilet. */
const BAS_BOX = "6 40 52 26";
/** La taille : les poches. */
const POCHE_BOX = "8 16 48 36";

const ICONS = {
  // === Coupe ==================================================================
  "gi-coupe-classique": { viewBox: BOX, body: gilet({ cut: "classique" }) },
  "gi-coupe-cintre": { viewBox: BOX, body: gilet({ cut: "cintre" }) },
  "gi-coupe-long": { viewBox: BOX, body: gilet({ cut: "long" }) },

  // === Col (le haut du gilet) =================================================
  "gi-col-v-profond": { viewBox: COL_BOX, body: gilet({ col: "v-profond" }) },
  "gi-col-v-haut": { viewBox: COL_BOX, body: gilet({ col: "v-haut" }) },
  "gi-col-chale": { viewBox: COL_BOX, body: gilet({ col: "chale" }) },
  "gi-col-crante": { viewBox: COL_BOX, body: gilet({ col: "cranté" }) },
  "gi-col-mao": { viewBox: COL_BOX, body: gilet({ col: "mao" }) },

  // === Boutonnage (le milieu du devant) ======================================
  "gi-boutons-3": { viewBox: BUTTON_BOX, body: gilet({ buttons: 3 }) },
  "gi-boutons-4": { viewBox: BUTTON_BOX, body: gilet({ buttons: 4 }) },
  "gi-boutons-5": { viewBox: BUTTON_BOX, body: gilet({ buttons: 5 }) },
  "gi-boutons-croise": { viewBox: BUTTON_BOX, body: gilet({ buttons: "croise" }) },

  // === Bas ====================================================================
  "gi-bas-pointes": { viewBox: BAS_BOX, body: gilet({ bas: "pointes" }) },
  "gi-bas-droit": { viewBox: BAS_BOX, body: gilet({ bas: "droit" }) },
  "gi-bas-arrondi": { viewBox: BAS_BOX, body: gilet({ bas: "arrondi" }) },

  // === Poches =================================================================
  "gi-poche-sans": { viewBox: POCHE_BOX, body: gilet({ pockets: "sans" }) },
  "gi-poche-deux": { viewBox: POCHE_BOX, body: gilet({ pockets: "deux" }) },
  "gi-poche-trois": { viewBox: POCHE_BOX, body: gilet({ pockets: "trois" }) },
  "gi-poche-rabat": { viewBox: POCHE_BOX, body: gilet({ pockets: "rabat" }) },

  // === Dos ====================================================================
  "gi-dos-tissu": { viewBox: BOX, body: dos("tissu") },
  "gi-dos-doublure": { viewBox: BOX, body: dos("doublure") },
  "gi-dos-martingale": { viewBox: BOX, body: dos("martingale") },
} satisfies Record<string, IconDef>;

export type GiletDetailIconName = keyof typeof ICONS;

export function isGiletArt(name: string): name is GiletDetailIconName {
  return name in ICONS;
}

/** Le gilet entier, le dos et le boutonnage en portrait ; le reste en carré. */
export function giletArtIsTall(name: GiletDetailIconName): boolean {
  return name.startsWith("gi-coupe-") || name.startsWith("gi-dos-") || name.startsWith("gi-boutons-");
}

export function GiletDetailIcon({ name, className }: { name: GiletDetailIconName; className?: string }) {
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
