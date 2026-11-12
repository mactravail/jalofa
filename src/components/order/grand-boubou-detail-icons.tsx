// Planches du GRAND BOUBOU HOMME (slug `grand-boubou`), redessinées dans le
// même trait que celles du Baye Lahat, dont elles reprennent les pièces
// (`baye-lahat-detail-icons.tsx`) :
//  · la coupe et la broderie sur le boubou entier ;
//  · le col, les poches et les manches dessinés seuls, en gros plan ;
//  · le pantalon dessiné seul.
//
// Le grand boubou est plus riche que le Baye Lahat : broderies « étoile »,
// « Ségou », fil d'or, cols brodés, manches cape…

import type { ReactNode } from "react";
import {
  boubou,
  broderie,
  colCloseUp,
  coupe,
  Cloth,
  Embroidery,
  EmbroideryLg,
  Mirror,
  pantalon,
  pocketCloseUp,
  SQUARE_BOX,
  starPath,
  Seam,
  type Sleeve,
} from "@/components/order/baye-lahat-detail-icons";

type IconDef = { viewBox: string; body: ReactNode };

// --- Cols en gros plan propres au grand boubou ------------------------------

const SHOULDER = "M20 14C13 15.6 6 18.4 -1 22";

function mirrored(half: ReactNode): ReactNode {
  return (
    <>
      {half}
      <Mirror>{half}</Mirror>
    </>
  );
}

/** Encolure brodée complexe : trois rangs de broderie et des pointes. */
function colEncolureBrodee(): ReactNode {
  return mirrored(
    <>
      <path d={SHOULDER} />
      <path d="M20 14Q22 30 32 31" />
      <EmbroideryLg d="M16.4 15.2Q19 35 32 36" />
      <EmbroideryLg d="M12.8 16.6Q16 40 32 41.4" />
      {/* les pointes qui descendent de l'encolure */}
      <path d="M22.4 39.4 25 46 27.4 40.6M15.6 33 16.4 40.6 20.4 36.4" strokeWidth={1} />
    </>,
  );
}

/** Col Mao brodé : le col droit brodé et une patte brodée qui descend. */
function colMaoBrode(): ReactNode {
  return mirrored(
    <>
      <path d="M20 18C13 19.6 6 22.4 -1 26" />
      <path d="M20 18Q22 26 32 26.6" />
      <path d="M20 18 20.4 8.6Q22.4 17.6 32 18.2" />
      <EmbroideryLg d="M20.4 11.6Q22.4 20 32 20.6" />
      <EmbroideryLg d="M20.2 15.2Q22.2 23.6 32 24.2" />
      <path d="M29.2 26.4V56" />
      <EmbroideryLg d="M30.6 28.6V54" />
    </>,
  );
}

// --- Broderies propres au grand boubou --------------------------------------

/** Losange plein (motif de broderie). */
function diamond(cx: number, cy: number, r: number): string {
  return `M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z`;
}

function brodEtoile(): ReactNode {
  return boubou(
    "classique",
    "rond",
    <>
      <Seam>
        <path d="M26.4 14V44L32 48" />
      </Seam>
    </>,
    <path d={starPath(32, 27, 6.4)} strokeWidth={1.1} />,
  );
}

function brodSegou(): ReactNode {
  // Un grand plastron rectangulaire couvert de losanges, pointe en bas.
  const motifs: string[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      const x = 26.6 + col * 5.4 + (row % 2 ? 2.7 : 0);
      if (x > 38) continue;
      motifs.push(diamond(x, 18 + row * 5.2, 1.3));
    }
  }
  return boubou(
    "classique",
    "rond",
    <Embroidery d="M23.6 13.4V44L32 50.4" />,
    <>
      <path d={motifs.join("")} fill="currentColor" fillOpacity={0.5} strokeWidth={0.6} />
      <Seam>
        <path d="M24.6 44.6 32 39.6 39.4 44.6" />
      </Seam>
    </>,
  );
}

function brodDoree(): ReactNode {
  // Fil d'or : un plastron entièrement rempli de broderie, plus dense.
  return boubou(
    "classique",
    "rond",
    <>
      <Cloth d="M25.6 12.6Q25 30 32 42V12.8Z" />
      <Embroidery d="M24.4 8Q23.4 30 32 44" />
      <Embroidery d="M27.4 14.4Q27 28 32 36.6" />
      <Embroidery d="M29.8 16V31" />
    </>,
  );
}

// --- Manches ---------------------------------------------------------------------

/**
 * Une manche seule, vue de face : l'emmanchure à droite (de l'épaule à
 * l'aisselle), l'ouverture du bras en bas à gauche.
 */
function manche(sleeve: Sleeve): ReactNode {
  // L'emmanchure, couture qui relie la manche au corps.
  const armhole = (
    <Seam>
      <path d="M50 6Q53.4 20 52 34" />
    </Seam>
  );
  switch (sleeve) {
    case "evasee":
    case "bord-brode":
      return (
        <>
          {armhole}
          <path d="M50 6C38 10 22 18 14 30L12 58" />
          <path d="M12 58Q25 64 38 64L52 34" />
          <Seam>
            <path d="M42 11Q30 30 25 62" />
          </Seam>
          {sleeve === "bord-brode" && (
            <>
              <Embroidery d="M14.4 53.4Q26 59.4 37 59.4" />
              <Embroidery d="M15 29.4 13.6 52" />
            </>
          )}
        </>
      );
    case "tres-large":
      return (
        <>
          {armhole}
          <path d="M50 6C36 9 14 16 5 28L3 68" />
          <path d="M3 68Q22 76 42 72L52 34" />
          <Seam>
            <path d="M40 10Q22 30 18 72" />
            <path d="M46 20Q36 44 32 74" />
          </Seam>
        </>
      );
    case "cape":
      // Un grand pan arrondi qui tombe bas, comme une cape.
      return (
        <>
          {armhole}
          <path d="M50 6C34 10 12 22 8 44Q6 60 14 74" />
          <path d="M14 74Q30 80 44 72L52 34" />
          <Seam>
            <path d="M40 11Q22 34 24 77" />
            <path d="M47 22Q36 46 36 76" />
          </Seam>
        </>
      );
    case "ajustee":
      // Une vraie manche, serrée, fermée par un poignet boutonné.
      return (
        <>
          {armhole}
          <path d="M50 6C42 8 34 14 30 22L24 60" />
          <path d="M52 34 37 60" />
          <path d="M24 60H37M24 60 23.4 67H36.6L37 60" />
          <circle cx={33.2} cy={63.6} r={0.9} />
          <Seam>
            <path d="M42 12Q34 34 31 60" />
          </Seam>
        </>
      );
  }
}

// --- Kaftan du dessous (dessiné seul) --------------------------------------------

/**
 * Le grand boubou est toujours un trois-pièces : sous le boubou, un kaftan à
 * manches longues — court (aux hanches), moyen (au genou) ou long (aux
 * chevilles) — puis le pantalon.
 */
type KaftanLength = "court" | "moyen" | "long";

const KAFTAN_HEM: Record<KaftanLength, number> = { court: 46, moyen: 62, long: 80 };

function kaftan(length: KaftanLength): ReactNode {
  const hem = KAFTAN_HEM[length];
  return mirrored(
    <>
      <path d="M27.2 5.8Q28 10.4 32 10.8" />
      {/* épaule, manche longue jusqu'au poignet, puis le côté du corps */}
      <path d={`M27.2 5.8 19.6 7.8C16.4 12 14 30 12.6 50L17.4 51C18.4 40 19.4 28 20.4 21L19.4 ${hem}`} />
      <path d={`M19.4 ${hem}Q25.7 ${hem + 1.4} 32 ${hem + 1.6}`} />
      <Seam>
        <path d="M12.9 47.4 17.6 48.4" />
        {/* la petite fente sur le côté */}
        <path d={`M19.5 ${hem - 5}L21 ${hem + 0.4}`} />
      </Seam>
      <Embroidery d="M29.4 12.4V28.6H32" />
    </>,
  );
}

/** Col du kaftan, en gros plan : rond tout simple ou col chemise. */
export function kaftanCol(col: "normal" | "chemise"): ReactNode {
  if (col === "normal") {
    return mirrored(
      <>
        <path d={SHOULDER} />
        <path d="M20 14Q22 30 32 31" />
      </>,
    );
  }
  // Col chemise : deux pointes rabattues, la patte boutonnée au milieu.
  // Descendu un peu : le col monte plus haut que l'encolure.
  return (
    <g transform="translate(0 5)">
      {mirrored(
        <>
          <path d="M17.6 14C11 15.6 5 18.4 -1 22" />
          {/* le haut du col, qui fait le tour de la nuque */}
          <path d="M22 6Q27 3 32 3" />
          {/* la pointe rabattue */}
          <path d="M22 6C19 10 17.2 16 16.8 22L25 33 32 19" />
          <path d="M30 21.6V58" />
        </>,
      )}
      <circle cx={32} cy={40} r={1.2} />
      <circle cx={32} cy={51} r={1.2} />
    </g>
  );
}

/** Manche courte du kaftan, seule (même gabarit que `manche`). */
function kaftanMancheCourte(): ReactNode {
  return (
    <>
      <Seam>
        <path d="M50 6Q53.4 20 52 34" />
      </Seam>
      <path d="M50 6C42 8 34 14 30 22L26 38" />
      <path d="M26 38Q34 42.4 42.6 41.6L52 34" />
      <Seam>
        <path d="M27 34.6Q34.6 38.6 42.8 37.8" />
      </Seam>
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
  "gb-coupe-classique": { viewBox: BOX, body: coupe("classique") },
  "gb-coupe-royal": { viewBox: BOX, body: coupe("royal") },
  "gb-coupe-moderne": { viewBox: BOX, body: coupe("moderne") },
  "gb-coupe-court": { viewBox: BOX, body: coupe("court") },

  // === Col (gros plan) ========================================================
  "gb-col-rond": { viewBox: CLOSE_BOX, body: colCloseUp("rond") },
  "gb-col-encolure-brodee": { viewBox: CLOSE_BOX, body: colEncolureBrodee() },
  "gb-col-fente": { viewBox: CLOSE_BOX, body: colCloseUp("fente") },
  "gb-col-mao": { viewBox: CLOSE_BOX, body: colCloseUp("mao") },
  "gb-col-mao-brode": { viewBox: CLOSE_BOX, body: colMaoBrode() },
  "gb-col-v": { viewBox: CLOSE_BOX, body: colCloseUp("v") },
  "gb-col-carre": { viewBox: CLOSE_BOX, body: colCloseUp("carre") },

  // === Broderie ===============================================================
  "gb-brod-sans": { viewBox: BOX, body: broderie("sans") },
  "gb-brod-encolure": { viewBox: BOX, body: broderie("encolure") },
  "gb-brod-plastron": { viewBox: BOX, body: broderie("plastron") },
  "gb-brod-etoile": { viewBox: BOX, body: brodEtoile() },
  "gb-brod-segou": { viewBox: BOX, body: brodSegou() },
  "gb-brod-devant": { viewBox: BOX, body: broderie("devant") },
  "gb-brod-doree": { viewBox: BOX, body: brodDoree() },

  // === Poches =================================================================
  "gb-poche-sans": { viewBox: SQUARE_BOX, body: pocketCloseUp("sans") },
  "gb-poche-poitrine": { viewBox: SQUARE_BOX, body: pocketCloseUp("poitrine") },
  "gb-poche-poitrine-brodee": { viewBox: SQUARE_BOX, body: pocketCloseUp("poitrine-brodee") },
  "gb-poche-devant": { viewBox: SQUARE_BOX, body: pocketCloseUp("devant") },
  "gb-poche-laterales": { viewBox: SQUARE_BOX, body: pocketCloseUp("laterales") },

  // === Manches ================================================================
  "gb-manche-evasee": { viewBox: SLEEVE_BOX, body: manche("evasee") },
  "gb-manche-tres-large": { viewBox: SLEEVE_BOX, body: manche("tres-large") },
  "gb-manche-cape": { viewBox: SLEEVE_BOX, body: manche("cape") },
  "gb-manche-bord-brode": { viewBox: SLEEVE_BOX, body: manche("bord-brode") },
  "gb-manche-ajustee": { viewBox: SLEEVE_BOX, body: manche("ajustee") },

  // === Pantalon (dessiné seul) ===============================================
  "gb-kaftan-court": { viewBox: BOX, body: kaftan("court") },
  "gb-kaftan-moyen": { viewBox: BOX, body: kaftan("moyen") },
  "gb-kaftan-long": { viewBox: BOX, body: kaftan("long") },
  "gb-kaftan-col-normal": { viewBox: CLOSE_BOX, body: kaftanCol("normal") },
  "gb-kaftan-col-mao": { viewBox: CLOSE_BOX, body: colCloseUp("mao") },
  "gb-kaftan-col-chemise": { viewBox: CLOSE_BOX, body: kaftanCol("chemise") },
  "gb-kaftan-manche-longue": { viewBox: SLEEVE_BOX, body: manche("ajustee") },
  "gb-kaftan-manche-courte": { viewBox: SLEEVE_BOX, body: kaftanMancheCourte() },
  "gb-pantalon-droit": { viewBox: BOX, body: pantalon("droit") },
  "gb-pantalon-thiaya-moyen": { viewBox: BOX, body: pantalon("thiaya-moyen") },
  "gb-pantalon-thiaya-large": { viewBox: BOX, body: pantalon("thiaya-large") },
} satisfies Record<string, IconDef>;

export type GrandBoubouDetailIconName = keyof typeof ICONS;

export function isGrandBoubouArt(name: string): name is GrandBoubouDetailIconName {
  return name in ICONS;
}

/** Le boubou entier en portrait ; le col et les poches, en gros plan, en carré. */
export function grandBoubouArtIsTall(name: GrandBoubouDetailIconName): boolean {
  return !(
    name.startsWith("gb-col-") ||
    name.startsWith("gb-poche-") ||
    name.startsWith("gb-kaftan-col-")
  );
}

export function GrandBoubouDetailIcon({
  name,
  className,
}: {
  name: GrandBoubouDetailIconName;
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
