// Planches du COSTUME AFRICAIN (slug `costume-africain`) — la tunique ou la
// veste à col Mao portée sur un pantalon de costume assorti :
//  · la longueur : veste aux hanches, tunique mi-cuisse ou tunique au genou ;
//  · la fermeture : boutons visibles, patte cachée, croisée en biais, demi-patte ;
//  · le col : Mao ou officier — jamais de broderie sur ce costume ;
//  · le décor du devant : bandes rayées, empiècement matelassé, liseré contrasté ;
//  · les poches : passepoilée (avec ou sans pochette), à rabat, côtés.
//
// Même trait que le Baye Lahat, le grand boubou, l'agbada et le dashiki :
// la coupe et le décor sur le costume entier, chaque détail dessiné seul.

import type { ReactNode } from "react";
import {
  Cloth,
  Mirror,
  pocketCloseUp,
  Seam,
  SQUARE_BOX,
} from "@/components/order/baye-lahat-detail-icons";
import { pantalon } from "@/components/order/agbada-detail-icons";

type IconDef = { viewBox: string; body: ReactNode };

function mirrored(half: ReactNode): ReactNode {
  return (
    <>
      {half}
      <Mirror>{half}</Mirror>
    </>
  );
}

/** Surpiqûre : la couture visible autour d'une poche. */
function Stitch({ d }: { d: string }) {
  return <path d={d} strokeWidth={0.8} strokeDasharray="2 1.6" />;
}

// --- Le costume entier ------------------------------------------------------------

type Cut = "veste" | "tunique" | "longue";
type Decor = "uni" | "bandes" | "matelasse" | "lisere";

/** `hem` — le bas du haut ; `hemX` — son coin. */
const CUTS: Record<Cut, { hem: number; hemX: number }> = {
  veste: { hem: 44, hemX: 19.8 },
  tunique: { hem: 56, hemX: 18.8 },
  longue: { hem: 70, hemX: 17.6 },
};

/** Moitié gauche : col Mao, manche longue ajustée, côté, pantalon dessous. */
function costumeHalf(cut: Cut, decor: Decor): ReactNode {
  const { hem, hemX } = CUTS[cut];
  // l'entrejambe du pantalon, caché sous une tunique longue
  const crotch = Math.max(hem + 1.6, 60);
  const inner =
    hem + 1.6 < 60 ? `L30.8 ${crotch}Q31.6 ${crotch - 1.4} 32 ${crotch - 1.6}` : `L30.8 ${crotch}`;
  return (
    <>
      {/* le col Mao, droit, qui se ferme au milieu */}
      <path d="M27.2 6Q28 9.4 32 9.6" />
      <path d="M27.2 6 27.4 2.8Q28.4 6.6 32 6.8" />
      {/* épaule, manche longue jusqu'au poignet, puis le côté */}
      <path
        d={`M27.2 6 19.6 7.8C16.4 12 14 30 12.6 50L17.4 51C18.4 40 19.4 28 20.4 21L${hemX} ${hem}`}
      />
      <path d={`M${hemX} ${hem}Q${(hemX + 32) / 2} ${hem + 1.2} 32 ${hem + 1.4}`} />
      <Seam>
        <path d="M12.9 47.4 17.6 48.4" />
        {cut !== "veste" && <path d={`M${hemX + 0.1} ${hem - 5}L${hemX + 1.6} ${hem + 0.4}`} />}
        {/* le pli du pantalon */}
        <path d={`M24.8 ${hem + 2.4}V85.4`} />
      </Seam>
      {/* le pantalon de costume, qui sort dessous */}
      <path d={`M20.4 ${hem + 1}L19.4 86H29.6${inner}`} />
      <Seam>
        {/* la patte de boutonnage */}
        <path d={`M30.2 9.6V${hem + 0.8}`} />
      </Seam>
      {decor === "lisere" && (
        <>
          {/* le liseré contrasté, de l'épaule jusqu'en bas */}
          <path d={`M23.6 7.2Q22.2 30 22.4 ${hem + 0.6}`} />
          <path d={`M24.8 6.9Q23.4 30 23.6 ${hem + 0.8}`} strokeWidth={0.6} />
        </>
      )}
    </>
  );
}

/** Les boutons du milieu, du col jusqu'en bas. */
function buttons(hem: number): ReactNode {
  const count = Math.round((hem - 14) / 8) + 1;
  const step = (hem - 6 - 14) / (count - 1);
  return Array.from({ length: count }, (_, i) => (
    <circle key={i} cx={32} cy={14 + i * step} r={0.8} />
  ));
}

/** Bandes rayées sur un seul côté du devant. */
function stripes(hem: number): ReactNode {
  return Array.from({ length: 8 }, (_, i) => {
    const x = 35 + i * 1.15;
    const top = x < 36.8 ? 9.6 - ((x - 32) / 4.8) * 3.6 + 0.6 : 6 + (x - 36.8) * (1.8 / 7.6) + 0.6;
    return (
      <path
        key={i}
        d={`M${x.toFixed(2)} ${top.toFixed(2)}V${(hem + 1.1).toFixed(2)}`}
        strokeWidth={i % 2 ? 0.5 : 1}
      />
    );
  });
}

/** Empiècement matelassé : un quadrillage en losanges des épaules à la poitrine. */
function quilting(): ReactNode {
  const lines: string[] = [];
  for (let k = -30; k <= 64; k += 3) {
    lines.push(`M${k} 0L${k + 30} 30`, `M${k} 30L${k + 30} 0`);
  }
  return (
    <>
      <defs>
        <clipPath id="ca-yoke-clip">
          <path d="M19.7 8 27.2 6Q28 9.4 30.2 9.6V26H20.5Z" />
          <path d="M44.3 8 36.8 6Q36 9.4 33.8 9.6V26H43.5Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#ca-yoke-clip)" strokeWidth={0.5}>
        <path d={lines.join("")} />
      </g>
      {mirrored(<path d="M20.5 26H30.2" />)}
    </>
  );
}

function costume(cut: Cut, decor: Decor = "uni"): ReactNode {
  const { hem } = CUTS[cut];
  return (
    <>
      {mirrored(costumeHalf(cut, decor))}
      {buttons(hem)}
      {decor === "bandes" && stripes(hem)}
      {decor === "matelasse" && quilting()}
    </>
  );
}

// --- Le col, en gros plan ----------------------------------------------------------

/** Col Mao : une bande droite, ses deux bords se touchent au milieu. */
export function maoCol(): ReactNode {
  return (
    <>
      {mirrored(
        <>
          <path d="M20 18C13 19.6 6 22.4 -1 26" />
          <path d="M20 18Q22 26 31 26.6" />
          <path d="M20 18 20.4 8.6Q22.4 17.6 31 18.2V26.6" />
          <path d="M29.6 26.6V58" />
        </>,
      )}
      <circle cx={32} cy={40} r={1.2} />
      <circle cx={32} cy={52} r={1.2} />
    </>
  );
}

/**
 * Col officier : la bande monte plus haut, ses coins arrondis s'écartent un
 * peu devant, et une agrafe la ferme sous le menton.
 */
function officierCol(): ReactNode {
  return (
    <>
      {mirrored(
        <>
          <path d="M20 18C13 19.6 6 22.4 -1 26" />
          <path d="M20 18Q22 26 31 26.6" />
          <path d="M20 18 20.2 6Q22.6 14.6 27.4 15.4Q30.4 16 30.4 19.4V26.6" />
          <Seam>
            {/* la surpiqûre qui suit le bord du col */}
            <path d="M21.6 9.6Q23.6 16.6 27.4 17.4Q28.8 17.8 28.8 20V25.6" />
          </Seam>
          <path d="M29.6 26.6V58" />
        </>,
      )}
      <circle cx={32} cy={22.6} r={1.2} />
      <circle cx={32} cy={40} r={1.2} />
      <circle cx={32} cy={52} r={1.2} />
    </>
  );
}

// --- La fermeture, en gros plan (le haut du devant) --------------------------------

type Closure = "boutons" | "cachee" | "biais" | "demi";

function closure(kind: Closure): ReactNode {
  const top = mirrored(
    <>
      <path d="M22 9C15 10.6 7 13 0 16" />
      <path d="M22 9 22.4 3Q24.4 8 31.6 8.4V13" />
      <path d="M22 9Q24 12.6 31.6 13" />
    </>,
  );
  switch (kind) {
    case "boutons":
      return (
        <>
          {top}
          {mirrored(<path d="M29.4 13V62" />)}
          {[20, 31, 42, 53].map((y) => (
            <circle key={y} cx={32} cy={y} r={1.4} />
          ))}
        </>
      );
    case "cachee":
      // La patte recouvre les boutons : on ne voit qu'une couture.
      return (
        <>
          {top}
          <path d="M34.4 13V62" />
          <Seam>
            <path d="M36.2 13V62" />
          </Seam>
        </>
      );
    case "biais":
      // Le pan croise en diagonale sous le col, boutonné sur le côté.
      return (
        <>
          {top}
          <path d="M32 13C30 18 24.6 20.4 22.6 24.4V62" />
          <circle cx={28.6} cy={16.4} r={1.3} />
          {[27, 35, 43, 51, 59].map((y) => (
            <g key={y}>
              <circle cx={25} cy={y} r={1.3} />
              <Seam>
                <path d={`M26.4 ${y}H29`} />
              </Seam>
            </g>
          ))}
        </>
      );
    case "demi":
      // Demi-patte : deux boutons sous le col, puis le devant uni.
      return (
        <>
          {top}
          <path d="M29.6 13V36H34.4V13" />
          <circle cx={32} cy={19} r={1.4} />
          <circle cx={32} cy={28} r={1.4} />
        </>
      );
  }
}

// --- Les poches, en gros plan ------------------------------------------------------

function weltPocket(withSquare: boolean): ReactNode {
  return (
    <>
      {withSquare && (
        <>
          {/* la pochette, pliée en pointes, qui dépasse de la poche */}
          <Cloth d="M18 32 22 16 28 24 34 12 40 23 46 18 47 32Z" />
          <path d="M18 32 22 16 28 24 34 12 40 23 46 18 47 32" />
        </>
      )}
      {/* le passepoil : une fente bordée, sans poche plaquée */}
      <path d="M10 32H54V40H10Z" />
      <path d="M10 36H54" strokeWidth={0.8} />
      <Stitch d="M10 44.4H54" />
      <path d="M10 32V40M54 32V40" strokeWidth={2} />
    </>
  );
}

function flapPocket(): ReactNode {
  return (
    <>
      <path d="M14 24V58Q14 60 16 60H48Q50 60 50 58V24" />
      {/* le pli creux au milieu */}
      <path d="M29 26V60M35 26V60" />
      <Seam>
        <path d="M29 26 31.4 30V60M35 26 32.6 30V60" />
      </Seam>
      {/* le rabat, boutonné */}
      <path d="M12 12H52V21Q52 25 48 25H16Q12 25 12 21Z" />
      <Stitch d="M14.4 14.4H49.6V21Q49.6 22.6 47.6 22.6H16.4Q14.4 22.6 14.4 21Z" />
      <circle cx={32} cy={21} r={1.8} />
    </>
  );
}

// --- Une manche seule --------------------------------------------------------------

type Sleeve = "longues" | "boutons" | "contraste" | "courtes" | "chemise";

function manche(sleeve: Sleeve): ReactNode {
  const armhole = (
    <Seam>
      <path d="M50 6Q53.4 20 52 34" />
    </Seam>
  );
  if (sleeve === "chemise") {
    // Manche de chemise : un peu plus large, froncée par deux plis dans un
    // poignet boutonné, avec la petite patte fendue au-dessus.
    return (
      <>
        {armhole}
        <path d="M50 6C42 8 34 14 30 22L23 60" />
        <path d="M52 34 39 60" />
        <path d="M23 60H39" />
        <path d="M24.4 60V66Q24.4 67.6 26 67.6H36Q37.6 67.6 37.6 66V60" />
        <Seam>
          <path d="M28 60 28.6 56M31 60 31.4 56.4" />
        </Seam>
        <path d="M34.4 60 35.6 49.6" />
        <circle cx={35.4} cy={53} r={0.9} />
        <circle cx={34.8} cy={63.8} r={1.1} />
      </>
    );
  }
  if (sleeve === "courtes") {
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
  return (
    <>
      {armhole}
      <path d="M50 6C42 8 34 14 30 22L24 66" />
      <path d="M52 34 37 66" />
      <path d="M24 66H37" />
      {sleeve === "boutons" && (
        <>
          <Seam>
            <path d="M24.9 59H40.3" />
          </Seam>
          <circle cx={31.4} cy={62.6} r={1.1} />
          <circle cx={34.6} cy={62.6} r={1.1} />
        </>
      )}
      {sleeve === "contraste" && (
        <>
          <Cloth d="M24.9 59H40.3L37 66H24Z" />
          <path d="M24.9 59H40.3" />
        </>
      )}
    </>
  );
}

const BOX = "0 0 64 88";
/** Une manche seule, en portrait. */
const SLEEVE_BOX = "0 0 64 82";
/** Gros plan (le col). */
const CLOSE_BOX = "0 4 64 54";

const ICONS = {
  // === Coupe ==================================================================
  "ca-coupe-veste": { viewBox: BOX, body: costume("veste") },
  "ca-coupe-tunique": { viewBox: BOX, body: costume("tunique") },
  "ca-coupe-longue": { viewBox: BOX, body: costume("longue") },

  // === Col (gros plan) ========================================================
  "ca-col-mao": { viewBox: CLOSE_BOX, body: maoCol() },
  "ca-col-officier": { viewBox: CLOSE_BOX, body: officierCol() },

  // === Fermeture (le haut du devant) =========================================
  "ca-fermeture-boutons": { viewBox: SQUARE_BOX, body: closure("boutons") },
  "ca-fermeture-cachee": { viewBox: SQUARE_BOX, body: closure("cachee") },
  "ca-fermeture-biais": { viewBox: SQUARE_BOX, body: closure("biais") },
  "ca-fermeture-demi": { viewBox: SQUARE_BOX, body: closure("demi") },

  // === Décor du devant (sur le costume entier) ================================
  "ca-decor-uni": { viewBox: BOX, body: costume("tunique", "uni") },
  "ca-decor-bandes": { viewBox: BOX, body: costume("tunique", "bandes") },
  "ca-decor-matelasse": { viewBox: BOX, body: costume("tunique", "matelasse") },
  "ca-decor-lisere": { viewBox: BOX, body: costume("tunique", "lisere") },

  // === Poches (gros plan) =====================================================
  "ca-poche-sans": { viewBox: SQUARE_BOX, body: pocketCloseUp("sans") },
  "ca-poche-poitrine": { viewBox: SQUARE_BOX, body: weltPocket(false) },
  "ca-poche-pochette": { viewBox: SQUARE_BOX, body: weltPocket(true) },
  "ca-poche-rabat": { viewBox: SQUARE_BOX, body: flapPocket() },
  "ca-poche-cotes": { viewBox: SQUARE_BOX, body: pocketCloseUp("laterales") },

  // === Manches (une manche seule) ============================================
  "ca-manche-longues": { viewBox: SLEEVE_BOX, body: manche("longues") },
  "ca-manche-boutons": { viewBox: SLEEVE_BOX, body: manche("boutons") },
  "ca-manche-contraste": { viewBox: SLEEVE_BOX, body: manche("contraste") },
  "ca-manche-chemise": { viewBox: SLEEVE_BOX, body: manche("chemise") },
  "ca-manche-courtes": { viewBox: SLEEVE_BOX, body: manche("courtes") },

  // === Pantalon (dessiné seul) ===============================================
  "ca-pantalon-droit": { viewBox: BOX, body: pantalon("droit") },
  "ca-pantalon-ajuste": { viewBox: BOX, body: pantalon("ajuste") },
} satisfies Record<string, IconDef>;

export type CostumeAfricainDetailIconName = keyof typeof ICONS;

export function isCostumeAfricainArt(name: string): name is CostumeAfricainDetailIconName {
  return name in ICONS;
}

/** Le costume entier, la manche et le pantalon en portrait ; le reste en carré. */
export function costumeAfricainArtIsTall(name: CostumeAfricainDetailIconName): boolean {
  return !(
    name.startsWith("ca-col-") ||
    name.startsWith("ca-fermeture-") ||
    name.startsWith("ca-poche-")
  );
}

export function CostumeAfricainDetailIcon({
  name,
  className,
}: {
  name: CostumeAfricainDetailIconName;
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
