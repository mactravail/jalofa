// Planches du KAFTAN 2 PIÈCES (slug `kaftan`) — une tunique longue à col rond
// et sa petite patte boutonnée, une poche poitrine, des manches à poignet,
// portée sur un pantalon assorti à taille coulissée. La broderie se pose le
// long de la patte (chevrons, pointillés) ou en plastron.
//
// Même trait que les autres planches : la coupe et la broderie sur le kaftan
// entier ; le col, la patte, la poche, la manche et le pantalon dessinés seuls.

import type { ReactNode } from "react";
import {
  Embroidery,
  Mirror,
  pantalon as pantalonCoulisse,
  pocketCloseUp,
  Seam,
  SQUARE_BOX,
} from "@/components/order/baye-lahat-detail-icons";
import { kaftanCol } from "@/components/order/grand-boubou-detail-icons";
import { pantalon as pantalonCostume } from "@/components/order/agbada-detail-icons";
import { maoCol } from "@/components/order/costume-africain-detail-icons";

type IconDef = { viewBox: string; body: ReactNode };

function mirrored(half: ReactNode): ReactNode {
  return (
    <>
      {half}
      <Mirror>{half}</Mirror>
    </>
  );
}

function diamond(cx: number, cy: number, r: number): string {
  return `M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z`;
}

/** Surpiqûre : la couture visible autour d'une poche. */
function Stitch({ d }: { d: string }) {
  return <path d={d} strokeWidth={0.8} strokeDasharray="2 1.6" />;
}

// --- Le kaftan entier --------------------------------------------------------------

type Cut = "droit" | "cintre" | "long";
type Brod = "chevrons" | "plastron" | "pointilles" | "sans";

const CUTS: Record<Cut, { hem: number; hemX: number; waist: number }> = {
  droit: { hem: 58, hemX: 18.6, waist: 20.4 },
  cintre: { hem: 56, hemX: 19.8, waist: 22 },
  long: { hem: 72, hemX: 17.4, waist: 20.4 },
};

function kaftanHalf(cut: Cut, brod: Brod): ReactNode {
  const { hem, hemX, waist } = CUTS[cut];
  const crotch = Math.max(hem + 1.6, 60);
  const inner =
    hem + 1.6 < 60 ? `L30.8 ${crotch}Q31.6 ${crotch - 1.4} 32 ${crotch - 1.6}` : `L30.8 ${crotch}`;
  return (
    <>
      {/* le col rond et sa bande */}
      <path d="M26.4 5.6Q27.4 11 32 11.4" />
      <path d="M28 5.2Q28.8 9.2 32 9.4" strokeWidth={0.9} />
      {/* épaule, manche longue à poignet, puis le côté */}
      <path
        d={`M26.4 5.6 19.6 7.8C16.4 12 14 30 12.6 50L17.4 51C18.4 40 19.4 28 20.4 21Q${waist} 36 ${hemX} ${hem}`}
      />
      <path d={`M${hemX} ${hem}Q${(hemX + 32) / 2} ${hem + 1.2} 32 ${hem + 1.4}`} />
      <Seam>
        <path d="M12.9 47.4 17.6 48.4" />
        {/* la petite fente sur le côté, le pli du pantalon */}
        <path d={`M${hemX + 0.1} ${hem - 5}L${hemX + 1.6} ${hem + 0.4}`} />
        <path d={`M24.8 ${hem + 2.4}V85.4`} />
      </Seam>
      <path d={`M20.4 ${hem + 1}L19.4 86H29.6${inner}`} />
      {brod === "pointilles" && (
        <>
          <Embroidery d="M24.8 6.8Q26 13.4 32 13.8" />
          <Embroidery d={`M28.6 25V${hem - 2}`} />
        </>
      )}
    </>
  );
}

function kaftan(cut: Cut, brod: Brod = "chevrons"): ReactNode {
  return (
    <>
      {mirrored(kaftanHalf(cut, brod))}
      {/* la petite patte boutonnée sous le col */}
      <path d="M30.4 11.4V24H33.6V11.4" />
      <circle cx={32} cy={14.6} r={0.7} />
      <circle cx={32} cy={19.6} r={0.7} />
      {/* la poche poitrine, sauf sous un plastron */}
      {brod !== "plastron" && <path d="M36.6 18H43V25.6H36.6Z" />}
      {brod === "chevrons" && (
        <>
          {[26, 28.2, 30.4, 32.6].map((y) => (
            <path key={y} d={`M30.6 ${y}L32 ${y + 1.4}L33.4 ${y}`} strokeWidth={0.8} />
          ))}
          <Embroidery d="M29 12.4V35" />
          <Embroidery d="M35 12.4V35" />
        </>
      )}
      {brod === "plastron" && (
        <>
          <path d="M25.4 11V30L32 34.6 38.6 30V11" />
          <Embroidery d="M26.8 12.4V29.2L32 33 37.2 29.2V12.4" />
          <path d="M27.6 14.6H29.8L27.6 17Z" strokeWidth={0.9} />
          <path d={diamond(32, 27, 1.8)} strokeWidth={0.9} />
          <path d={diamond(32, 31, 1.4)} strokeWidth={0.9} />
        </>
      )}
    </>
  );
}

// --- Le col, en gros plan ----------------------------------------------------------

/** Col rond à bande, comme sur la photo, avec le haut de la patte. */
function roundCol(): ReactNode {
  return (
    <>
      {mirrored(
        <>
          <path d="M20 14C13 15.6 6 18.4 -1 22" />
          <path d="M20 14Q22 30 32 31" />
          <path d="M23.6 12.8Q25.4 26 32 26.8" />
          <path d="M30 31V54" />
        </>,
      )}
      <path d="M30 54H34" />
      <circle cx={32} cy={37} r={1.2} />
      <circle cx={32} cy={47} r={1.2} />
    </>
  );
}

// --- La patte, en gros plan (le haut du devant) ------------------------------------

type Patte = "courte" | "longue" | "cachee" | "sans";

function patte(kind: Patte): ReactNode {
  const top = mirrored(
    <>
      <path d="M22 9C15 10.6 7 13 0 16" />
      <path d="M22 9Q24 17 32 17.6" />
      <path d="M24.4 8.4Q26 14.6 32 15" strokeWidth={0.9} />
    </>,
  );
  switch (kind) {
    case "courte":
      return (
        <>
          {top}
          <path d="M29.6 17.6V38H34.4V17.6" />
          <circle cx={32} cy={23} r={1.3} />
          <circle cx={32} cy={31} r={1.3} />
        </>
      );
    case "longue":
      return (
        <>
          {top}
          {mirrored(<path d="M29.6 17.6V62" />)}
          {[24, 34, 44, 54].map((y) => (
            <circle key={y} cx={32} cy={y} r={1.3} />
          ))}
        </>
      );
    case "cachee":
      return (
        <>
          {top}
          <path d="M34.4 17.6V40" />
          <Seam>
            <path d="M35.8 17.6V40M34.4 40H29.6" />
          </Seam>
        </>
      );
    case "sans":
      // Sans patte : le kaftan s'enfile par la tête.
      return top;
  }
}

// --- La poche passepoilée ----------------------------------------------------------

function weltPocket(): ReactNode {
  return (
    <>
      <path d="M10 26H54V34H10Z" />
      <path d="M10 30H54" strokeWidth={0.8} />
      <Stitch d="M10 38.4H54" />
      <path d="M10 26V34M54 26V34" strokeWidth={2} />
    </>
  );
}

// --- Une manche seule --------------------------------------------------------------

type Sleeve = "poignet" | "simple" | "courtes";

function manche(sleeve: Sleeve): ReactNode {
  const armhole = (
    <Seam>
      <path d="M50 6Q53.4 20 52 34" />
    </Seam>
  );
  switch (sleeve) {
    case "poignet":
      // Longue, finie par un poignet boutonné, comme sur la photo.
      return (
        <>
          {armhole}
          <path d="M50 6C42 8 34 14 30 22L24 60" />
          <path d="M52 34 38.4 60" />
          <path d="M24 60H38.4" />
          <path d="M24.6 60V67H37.8V60" />
          <circle cx={34.6} cy={63.6} r={1.1} />
        </>
      );
    case "simple":
      return (
        <>
          {armhole}
          <path d="M50 6C42 8 34 14 30 22L24 66" />
          <path d="M52 34 37 66" />
          <path d="M24 66H37" />
          <Seam>
            <path d="M24.6 62H38.8" />
          </Seam>
        </>
      );
    case "courtes":
      return (
        <>
          {armhole}
          <path d="M50 6C42 8 34 14 30 22L27 42" />
          <path d="M52 34 42 44" />
          <path d="M27 42Q34.6 44.4 42 44" />
          <Seam>
            <path d="M27.6 38.6Q36 41 46 40.2" />
          </Seam>
        </>
      );
  }
}

const BOX = "0 0 64 88";
const SLEEVE_BOX = "0 0 64 82";
const CLOSE_BOX = "0 4 64 54";

const ICONS = {
  // === Coupe ==================================================================
  "kf-coupe-droit": { viewBox: BOX, body: kaftan("droit") },
  "kf-coupe-cintre": { viewBox: BOX, body: kaftan("cintre") },
  "kf-coupe-long": { viewBox: BOX, body: kaftan("long") },

  // === Col (gros plan) ========================================================
  "kf-col-rond": { viewBox: CLOSE_BOX, body: roundCol() },
  "kf-col-mao": { viewBox: CLOSE_BOX, body: maoCol() },
  "kf-col-chemise": { viewBox: CLOSE_BOX, body: kaftanCol("chemise") },

  // === Patte de boutonnage (gros plan) =======================================
  "kf-patte-courte": { viewBox: SQUARE_BOX, body: patte("courte") },
  "kf-patte-longue": { viewBox: SQUARE_BOX, body: patte("longue") },
  "kf-patte-cachee": { viewBox: SQUARE_BOX, body: patte("cachee") },
  "kf-patte-sans": { viewBox: SQUARE_BOX, body: patte("sans") },

  // === Broderie (sur le kaftan entier) ========================================
  "kf-brod-chevrons": { viewBox: BOX, body: kaftan("droit", "chevrons") },
  "kf-brod-plastron": { viewBox: BOX, body: kaftan("droit", "plastron") },
  "kf-brod-pointilles": { viewBox: BOX, body: kaftan("droit", "pointilles") },
  "kf-brod-sans": { viewBox: BOX, body: kaftan("droit", "sans") },

  // === Poche (gros plan) ======================================================
  "kf-poche-sans": { viewBox: SQUARE_BOX, body: pocketCloseUp("sans") },
  "kf-poche-poitrine": { viewBox: SQUARE_BOX, body: pocketCloseUp("poitrine") },
  "kf-poche-passepoilee": { viewBox: SQUARE_BOX, body: weltPocket() },
  "kf-poche-cotes": { viewBox: SQUARE_BOX, body: pocketCloseUp("laterales") },

  // === Manches (une manche seule) ============================================
  "kf-manche-poignet": { viewBox: SLEEVE_BOX, body: manche("poignet") },
  "kf-manche-simple": { viewBox: SLEEVE_BOX, body: manche("simple") },
  "kf-manche-courtes": { viewBox: SLEEVE_BOX, body: manche("courtes") },

  // === Pantalon (dessiné seul) ===============================================
  "kf-pantalon-coulisse": { viewBox: BOX, body: pantalonCoulisse("droit") },
  "kf-pantalon-costume": { viewBox: BOX, body: pantalonCostume("droit") },
  "kf-pantalon-saroual": { viewBox: BOX, body: pantalonCoulisse("thiaya-moyen") },
} satisfies Record<string, IconDef>;

export type KaftanDetailIconName = keyof typeof ICONS;

export function isKaftanArt(name: string): name is KaftanDetailIconName {
  return name in ICONS;
}

/** Le kaftan entier, la manche et le pantalon en portrait ; le reste en carré. */
export function kaftanArtIsTall(name: KaftanDetailIconName): boolean {
  return !(name.startsWith("kf-col-") || name.startsWith("kf-patte-") || name.startsWith("kf-poche-"));
}

export function KaftanDetailIcon({ name, className }: { name: KaftanDetailIconName; className?: string }) {
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
