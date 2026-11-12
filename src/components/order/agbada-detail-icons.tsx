// Planches de l'AGBADA (slug `agbada`) — un trois-pièces, bonnet en option :
//  · la grande robe de dessus, qui passe un peu sous le genou, avec ses
//    larges pans sur les bras et UNE seule grande poche qui couvre le ventre ;
//  · la chemise du dessous, plus courte, à col chemise ou col Mao ;
//  · un pantalon droit, comme un pantalon de costume ;
//  · le bonnet (fila), avec ou sans.
//
// Même trait que le Baye Lahat et le grand boubou : la coupe et la broderie
// sur l'agbada entier, chaque détail (col, poche, chemise, pantalon, bonnet)
// dessiné seul.

import type { ReactNode } from "react";
import {
  colCloseUp,
  Cloth,
  Embroidery,
  Mirror,
  Seam,
  SQUARE_BOX,
} from "@/components/order/baye-lahat-detail-icons";
import { kaftanCol } from "@/components/order/grand-boubou-detail-icons";

type IconDef = { viewBox: string; body: ReactNode };

function mirrored(half: ReactNode): ReactNode {
  return (
    <>
      {half}
      <Mirror>{half}</Mirror>
    </>
  );
}

/** Surpiqûre : la couture visible autour de la poche. */
function Stitch({ d }: { d: string }) {
  return <path d={d} strokeWidth={0.8} strokeDasharray="2 1.6" />;
}

// --- L'agbada entier ------------------------------------------------------------

type Cut = "classique" | "ample" | "moderne";
type Brod = "sans" | "encolure" | "plastron" | "poche" | "devant";

/**
 * `w`   — bout du pan sur le bras (plus petit = plus large) ;
 * `hem` — le bas de l'agbada, un peu sous le genou ;
 * `hemX`— le coin du bas.
 */
const CUTS: Record<Cut, { w: number; hem: number; hemX: number }> = {
  classique: { w: 3, hem: 60, hemX: 12.6 },
  ample: { w: 0.6, hem: 62, hemX: 10.2 },
  moderne: { w: 7, hem: 59, hemX: 16 },
};

/** Moitié gauche : le pan, la manche de la chemise dessous, le pantalon. */
function agbadaHalf(cut: Cut, brod: Brod): ReactNode {
  const { w, hem, hemX } = CUTS[cut];
  // le bord replié du pan, d'où sort le bras
  const back = w + 10.4;
  return (
    <>
      {/* le pan : de l'épaule au bout du bras, puis le côté jusqu'en bas */}
      <path
        d={`M27 5.6C20 7.6 ${w + 5} 12 ${w} 19L${w + 0.6} 44Q${w + 5} 46.4 ${back} 45.4L${hemX} ${hem}`}
      />
      <path d={`M${hemX} ${hem}Q${(hemX + 32) / 2} ${hem + 1.6} 32 ${hem + 1.8}`} />
      {/* l'encolure */}
      <path d="M27 5.6Q27.8 10.6 32 11" />
      <Seam>
        {/* le pli du tissu sur le bras, la couture du panneau de devant */}
        <path d={`M${w + 5.4} 17Q${w + 6.4} 32 ${w + 6.6} 44.8`} />
        <path d={`M22 9.4 20.6 ${hem + 1}`} />
      </Seam>
      {/* la manche de la chemise du dessous, qui sort sous le pan */}
      <path d={`M${w + 1.6} 45 ${w + 2.2} 52.4H${w + 8}L${w + 8.6} 45.8`} />
      <Seam>
        <path d={`M${w + 2.1} 50.2H${w + 8.1}`} />
      </Seam>
      {/* le pantalon droit, avec son pli */}
      <path d={`M18 ${hem + 1.6}L17.6 86H29.4L30.8 ${hem + 2}`} />
      <Seam>
        <path d={`M23.8 ${hem + 2.2}V85.4`} />
      </Seam>
      {(brod === "encolure" || brod === "devant") && (
        <Embroidery d="M25.6 6.8Q26.6 12.8 32 13.2" />
      )}
      {brod === "devant" && <Embroidery d={`M23.4 10 22 ${hem}`} />}
    </>
  );
}

/** La grande poche, au milieu, qui couvre tout le ventre. */
function bigPocket(brod: Brod): ReactNode {
  const embroidered = brod === "poche" || brod === "devant";
  const plastron = brod === "plastron" || brod === "devant";
  return (
    <>
      <path d="M21.4 21H42.6V47H21.4Z" />
      <Seam>
        <path d="M21.4 24.4H42.6" />
      </Seam>
      {embroidered && <Embroidery d="M23 26V45.4H41V26" />}
      {plastron && (
        <>
          {/* le motif en pointe, entre le col et la poche */}
          <Embroidery d="M26.4 21 32 13.8 37.6 21" />
          <Embroidery d="M29 21 32 17.2 35 21" />
        </>
      )}
    </>
  );
}

function agbada(cut: Cut, brod: Brod = "plastron"): ReactNode {
  return (
    <>
      {mirrored(agbadaHalf(cut, brod))}
      {bigPocket(brod)}
    </>
  );
}

// --- La poche, en gros plan -------------------------------------------------------

type PocketShape = "carree" | "arrondie" | "pointe";

function pocketCloseUp(shape: PocketShape): ReactNode {
  const outline = {
    carree: "M10 8H54V54H10Z",
    arrondie: "M10 8H54V40Q54 55 32 55Q10 55 10 40Z",
    pointe: "M10 8H54V42L32 56 10 42Z",
  }[shape];
  const stitch = {
    carree: "M13 17V51H51V17",
    arrondie: "M13 17V40Q13 52 32 52Q51 52 51 40V17",
    pointe: "M13 17V40.6L32 52.6 51 40.6V17",
  }[shape];
  return (
    <>
      <path d={outline} />
      {/* l'ouverture de la poche, en haut */}
      <path d="M10 14H54" />
      <Stitch d={stitch} />
    </>
  );
}

// --- Col Mao de la chemise du dessous, en gros plan ------------------------------

function maoShirtCol(): ReactNode {
  return (
    <>
      {mirrored(
        <>
          <path d="M20 18C13 19.6 6 22.4 -1 26" />
          {/* le col droit, qui monte au-dessus de l'encolure */}
          <path d="M20 18Q22 26 31 26.6" />
          <path d="M20 18 20.4 8.6Q22.4 17.6 31 18.2V26.6" />
          <path d="M30 26.6V58" />
        </>,
      )}
      <circle cx={32} cy={22.4} r={1.2} />
      <circle cx={32} cy={38} r={1.2} />
      <circle cx={32} cy={50} r={1.2} />
    </>
  );
}

// --- Le pantalon, dessiné seul ----------------------------------------------------

type Pants = "droit" | "ajuste";

/** Un pantalon de costume : ceinture à passants, poche en biais, pli devant. */
function pantsHalf(pants: Pants): ReactNode {
  const leg =
    pants === "droit"
      ? "M17 11 15.4 84H29L31 30Q31.6 28.6 32 28.4"
      : "M17 11Q15.6 40 18.4 84H28.2L31 30Q31.6 28.6 32 28.4";
  return (
    <>
      <path d="M17 6H32M17 6V11H32" />
      {/* un passant de ceinture */}
      <path d="M21.6 5.2V11.8" strokeWidth={1.6} />
      <path d={leg} />
      <Seam>
        <path d="M17.4 13.4 22.4 21" />
        <path d={pants === "droit" ? "M22.6 13V83" : "M22.8 13Q22.6 50 23.4 83"} />
      </Seam>
    </>
  );
}

export function pantalon(pants: Pants): ReactNode {
  return (
    <>
      {mirrored(pantsHalf(pants))}
      {/* la braguette, d'un seul côté */}
      <Seam>
        <path d="M32 11V27Q32 29 29.6 29.4" />
      </Seam>
      <circle cx={32} cy={8.5} r={0.9} />
    </>
  );
}

// --- Le bonnet (fila) -------------------------------------------------------------

function capDrawing(): ReactNode {
  // Le fila : un bonnet haut et souple, dont le sommet retombe sur le côté.
  const crown = "M15 44C13 32 15 20 22 12C28 6 40 5 47 9C53 13 56 21 54 30C51 32 47 30 45 26C47 32 49 38 49 44";
  return (
    <>
      <Cloth d={crown + "Q32 47 15 44Z"} />
      <path d={crown} />
      {/* le pli du sommet replié */}
      <path d="M22 12C30 15 39 20 45 26" />
      <Seam>
        <path d="M20 42C19 32 21 24 27 17" />
        <path d="M33 45C33 37 35 30 39 24" />
      </Seam>
      {/* le bandeau */}
      <path d="M15 44Q32 47.6 49 44V52Q32 55.6 15 52Z" />
    </>
  );
}

function bonnet(withCap: boolean): ReactNode {
  if (withCap) return capDrawing();
  return (
    <>
      <g opacity={0.35}>{capDrawing()}</g>
      <path d="M10 58 54 6" strokeWidth={2} />
    </>
  );
}

const BOX = "0 0 64 88";
/** Gros plan (les cols). */
const CLOSE_BOX = "0 4 64 54";

const ICONS = {
  // === Coupe ==================================================================
  "ag-coupe-classique": { viewBox: BOX, body: agbada("classique") },
  "ag-coupe-ample": { viewBox: BOX, body: agbada("ample") },
  "ag-coupe-moderne": { viewBox: BOX, body: agbada("moderne") },

  // === Col (gros plan) ========================================================
  "ag-col-rond": { viewBox: CLOSE_BOX, body: colCloseUp("rond") },
  "ag-col-fente": { viewBox: CLOSE_BOX, body: colCloseUp("fente") },
  "ag-col-v": { viewBox: CLOSE_BOX, body: colCloseUp("v") },
  "ag-col-carre": { viewBox: CLOSE_BOX, body: colCloseUp("carre") },

  // === Broderie ===============================================================
  "ag-brod-plastron": { viewBox: BOX, body: agbada("classique", "plastron") },
  "ag-brod-encolure": { viewBox: BOX, body: agbada("classique", "encolure") },
  "ag-brod-poche": { viewBox: BOX, body: agbada("classique", "poche") },
  "ag-brod-devant": { viewBox: BOX, body: agbada("classique", "devant") },
  "ag-brod-sans": { viewBox: BOX, body: agbada("classique", "sans") },

  // === La grande poche (gros plan) ===========================================
  "ag-poche-carree": { viewBox: SQUARE_BOX, body: pocketCloseUp("carree") },
  "ag-poche-arrondie": { viewBox: SQUARE_BOX, body: pocketCloseUp("arrondie") },
  "ag-poche-pointe": { viewBox: SQUARE_BOX, body: pocketCloseUp("pointe") },

  // === Chemise du dessous (son col, en gros plan) =============================
  "ag-dessous-chemise": { viewBox: CLOSE_BOX, body: kaftanCol("chemise") },
  "ag-dessous-mao": { viewBox: CLOSE_BOX, body: maoShirtCol() },

  // === Pantalon (dessiné seul) ===============================================
  "ag-pantalon-droit": { viewBox: BOX, body: pantalon("droit") },
  "ag-pantalon-ajuste": { viewBox: BOX, body: pantalon("ajuste") },

  // === Bonnet ================================================================
  "ag-bonnet-sans": { viewBox: SQUARE_BOX, body: bonnet(false) },
  "ag-bonnet-avec": { viewBox: SQUARE_BOX, body: bonnet(true) },
} satisfies Record<string, IconDef>;

export type AgbadaDetailIconName = keyof typeof ICONS;

export function isAgbadaArt(name: string): name is AgbadaDetailIconName {
  return name in ICONS;
}

/** L'agbada entier et le pantalon en portrait ; les gros plans en carré. */
export function agbadaArtIsTall(name: AgbadaDetailIconName): boolean {
  return name.startsWith("ag-coupe-") || name.startsWith("ag-brod-") || name.startsWith("ag-pantalon-");
}

export function AgbadaDetailIcon({
  name,
  className,
}: {
  name: AgbadaDetailIconName;
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
