// Planches du DASHIKI (slug `dashiki`) — la tunique panafricaine à enfiler :
// large et carrée, manches courtes et amples, encolure en V entourée de son
// grand plastron brodé, petites fentes sur les côtés.
//
// Même trait que le Baye Lahat, le grand boubou et l'agbada : la coupe et la
// broderie sur le dashiki entier ; le col, la manche, les poches et le
// pantalon dessinés seuls.

import type { ReactNode } from "react";
import {
  colCloseUp,
  Embroidery,
  Mirror,
  pantalon,
  pocketCloseUp,
  Seam,
  SQUARE_BOX,
} from "@/components/order/baye-lahat-detail-icons";

type IconDef = { viewBox: string; body: ReactNode };

function mirrored(half: ReactNode): ReactNode {
  return (
    <>
      {half}
      <Mirror>{half}</Mirror>
    </>
  );
}

/** Un petit losange brodé, centré en (cx, cy). */
function diamond(cx: number, cy: number, r: number): string {
  return `M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z`;
}

// --- Le dashiki entier ------------------------------------------------------------

type Cut = "classique" | "longue" | "ajustee";
type Brod = "sans" | "encolure" | "plastron" | "manches" | "devant";

/**
 * `ux`  — l'aisselle (plus petit = plus large) ;
 * `hem` — le bas : mi-cuisse, ou au genou pour la version longue ;
 * `hemX`— le coin du bas.
 */
const CUTS: Record<Cut, { ux: number; hem: number; hemX: number }> = {
  classique: { ux: 15, hem: 58, hemX: 13 },
  longue: { ux: 15, hem: 76, hemX: 11.4 },
  ajustee: { ux: 18.4, hem: 56, hemX: 18.2 },
};

/** Moitié gauche : épaule, manche courte et ample, côté fendu, encolure en V. */
function dashikiHalf(cut: Cut, brod: Brod): ReactNode {
  const { ux, hem, hemX } = CUTS[cut];
  const sleeveBand = brod === "manches" || brod === "devant";
  const plastron = brod === "plastron" || brod === "devant";
  return (
    <>
      {/* épaule tombante, manche courte évasée, puis le côté jusqu'en bas */}
      <path
        d={`M26 5.6 ${ux - 1.4} 8.8 ${ux - 10.4} 23.4 ${ux - 4} 27 ${ux} 21.4 ${hemX} ${hem}`}
      />
      <path d={`M${hemX} ${hem}Q${(hemX + 32) / 2} ${hem + 1.2} 32 ${hem + 1.4}`} />
      {/* l'encolure en V, et le haut du dos derrière */}
      <path d="M26 5.6 32 18" />
      <Seam>
        <path d="M26 5.6Q29 7.2 32 7.4" />
        {/* la couture d'épaule, la petite fente sur le côté */}
        <path d={`M${ux - 1.4} 8.8 ${ux} 21.4`} />
        <path d={`M${hemX + 0.3} ${hem - 6}L${hemX + 2.2} ${hem + 0.4}`} />
      </Seam>
      {brod === "encolure" && <Embroidery d="M24.4 6.4 32 21.6" />}
      {plastron && (
        <>
          {/* le grand plastron : un V à pointes qui encadre l'encolure */}
          <path d="M21.6 7.4 22.6 17.6 27.4 21 32 29.6" />
          <Embroidery d="M23.6 8 24.4 16.4 28.6 19.6 32 25.8" />
          <Embroidery d="M27.4 7 32 16" />
          <path d={diamond(25.8, 12.4, 1.6)} strokeWidth={0.9} />
        </>
      )}
      {sleeveBand && <Embroidery d={`M${ux - 9.4} 21.6 ${ux - 3.6} 24.8`} />}
      {sleeveBand && (
        <Embroidery d={`M${hemX + 0.4} ${hem - 3}Q${(hemX + 32) / 2} ${hem - 1.8} 32 ${hem - 1.6}`} />
      )}
    </>
  );
}

function dashiki(cut: Cut, brod: Brod = "plastron"): ReactNode {
  return (
    <>
      {mirrored(dashikiHalf(cut, brod))}
      {/* le losange du milieu, sous la pointe du V */}
      {(brod === "plastron" || brod === "devant") && (
        <path d={diamond(32, 24.4, 1.8)} strokeWidth={0.9} />
      )}
    </>
  );
}

// --- Une manche seule -------------------------------------------------------------

type Sleeve = "courtes" | "trois-quarts" | "longues";

/**
 * Une manche seule, vue de face : l'emmanchure à droite (de l'épaule à
 * l'aisselle), l'ouverture du bras en bas à gauche — même gabarit que les
 * manches du grand boubou.
 */
function manche(sleeve: Sleeve): ReactNode {
  const armhole = (
    <Seam>
      <path d="M50 6Q53.4 20 52 34" />
    </Seam>
  );
  switch (sleeve) {
    case "courtes":
      // Courte et large, elle s'arrête au-dessus du coude.
      return (
        <>
          {armhole}
          <path d="M50 6C40 9 28 14 20 22L14 40" />
          <path d="M14 40Q24 45 34 44L52 34" />
          <Seam>
            <path d="M14.8 36Q24.4 41 33.6 40" />
          </Seam>
        </>
      );
    case "trois-quarts":
      return (
        <>
          {armhole}
          <path d="M50 6C40 9 27 15 21 24L14 56" />
          <path d="M14 56Q22 60 31 59L52 34" />
          <Seam>
            <path d="M14.8 52Q22.4 56 31.6 55" />
          </Seam>
        </>
      );
    case "longues":
      // Longue jusqu'au poignet, un peu resserrée en bas.
      return (
        <>
          {armhole}
          <path d="M50 6C42 8 32 14 28 22L20 72" />
          <path d="M20 72Q26 74 31.4 73L52 34" />
          <Seam>
            <path d="M20.6 68Q26.2 70 32 69" />
          </Seam>
        </>
      );
  }
}

const BOX = "0 0 64 88";
/** Une manche seule, en portrait. */
const SLEEVE_BOX = "0 0 64 82";
/** Gros plan (le col). */
const CLOSE_BOX = "0 4 64 54";

const ICONS = {
  // === Coupe ==================================================================
  "dk-coupe-classique": { viewBox: BOX, body: dashiki("classique") },
  "dk-coupe-longue": { viewBox: BOX, body: dashiki("longue") },
  "dk-coupe-ajustee": { viewBox: BOX, body: dashiki("ajustee") },

  // === Col (gros plan) ========================================================
  "dk-col-v": { viewBox: CLOSE_BOX, body: colCloseUp("v") },
  "dk-col-rond": { viewBox: CLOSE_BOX, body: colCloseUp("rond") },
  "dk-col-fente": { viewBox: CLOSE_BOX, body: colCloseUp("fente") },
  "dk-col-mao": { viewBox: CLOSE_BOX, body: colCloseUp("mao") },

  // === Broderie ===============================================================
  "dk-brod-plastron": { viewBox: BOX, body: dashiki("classique", "plastron") },
  "dk-brod-encolure": { viewBox: BOX, body: dashiki("classique", "encolure") },
  "dk-brod-manches": { viewBox: BOX, body: dashiki("classique", "manches") },
  "dk-brod-devant": { viewBox: BOX, body: dashiki("classique", "devant") },
  "dk-brod-sans": { viewBox: BOX, body: dashiki("classique", "sans") },

  // === Manches (une manche seule) ============================================
  "dk-manche-courtes": { viewBox: SLEEVE_BOX, body: manche("courtes") },
  "dk-manche-trois-quarts": { viewBox: SLEEVE_BOX, body: manche("trois-quarts") },
  "dk-manche-longues": { viewBox: SLEEVE_BOX, body: manche("longues") },

  // === Poches (gros plan) =====================================================
  "dk-poche-sans": { viewBox: SQUARE_BOX, body: pocketCloseUp("sans") },
  "dk-poche-poitrine": { viewBox: SQUARE_BOX, body: pocketCloseUp("poitrine") },
  "dk-poche-laterales": { viewBox: SQUARE_BOX, body: pocketCloseUp("laterales") },

  // === Pantalon (dessiné seul) ===============================================
  "dk-pantalon-sans": {
    viewBox: BOX,
    body: (
      <>
        <g opacity={0.35}>{pantalon("droit")}</g>
        <path d="M12 80 52 8" strokeWidth={2} />
      </>
    ),
  },
  "dk-pantalon-droit": { viewBox: BOX, body: pantalon("droit") },
  "dk-pantalon-saroual": { viewBox: BOX, body: pantalon("thiaya-moyen") },
} satisfies Record<string, IconDef>;

export type DashikiDetailIconName = keyof typeof ICONS;

export function isDashikiArt(name: string): name is DashikiDetailIconName {
  return name in ICONS;
}

/** Le dashiki entier, la manche et le pantalon en portrait ; col et poches en carré. */
export function dashikiArtIsTall(name: DashikiDetailIconName): boolean {
  return !(name.startsWith("dk-col-") || name.startsWith("dk-poche-"));
}

export function DashikiDetailIcon({
  name,
  className,
}: {
  name: DashikiDetailIconName;
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
