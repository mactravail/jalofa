// Planches du BAYE LAHAT (slug `baye-lahat`) — le grand boubou mouride porté à
// la façon de Serigne Abdou Lahat Mbacké : un boubou très ample, en bazin,
// sobre, souvent accompagné d'une écharpe (kaala).
//
// Planches : la coupe, le col, la broderie et l'écharpe, sur le boubou entier.
//
// Mêmes conventions que `ceremony-detail-icons.tsx` : `currentColor`, trait
// fin, moitié gauche dessinée une fois puis renvoyée en miroir autour de x = 32.
// Ce qui n'existe que d'un côté (poche poitrine) est dessiné à part, sans miroir.

import type { ReactNode } from "react";

type IconDef = { viewBox: string; body: ReactNode };

export function Mirror({ children }: { children: ReactNode }) {
  return <g transform="matrix(-1 0 0 1 64 0)">{children}</g>;
}

export function Seam({ children }: { children: ReactNode }) {
  return (
    <g strokeWidth={0.8} strokeOpacity={0.6}>
      {children}
    </g>
  );
}

/** Broderie : un chapelet de points le long du tracé. */
export function Embroidery({ d }: { d: string }) {
  return <path d={d} strokeWidth={1.5} strokeDasharray="0.01 1.7" />;
}

/** Un tissu posé par-dessus (écharpe) : légèrement teinté. */
export function Cloth({ d }: { d: string }) {
  return <path d={d} fill="currentColor" fillOpacity={0.12} />;
}

export type Cut = "classique" | "royal" | "moderne" | "trois-pieces" | "court";
export type Col = "rond" | "fente" | "mao" | "carre" | "v" | "uni";
type Brod = "sans" | "encolure" | "plastron" | "poche" | "devant";

/** Aile (bout de manche), bas du boubou et son bord. */
const CUTS: Record<Cut, { wing: number; hem: number; hemX: number }> = {
  classique: { wing: 2.6, hem: 79, hemX: 10.6 },
  royal: { wing: 0.8, hem: 84.4, hemX: 6.4 },
  moderne: { wing: 8, hem: 78, hemX: 15 },
  "trois-pieces": { wing: 2.6, hem: 79, hemX: 10.6 },
  // Court (3/4) : le boubou s'arrête sous le genou, le pantalon se voit.
  court: { wing: 2.6, hem: 70, hemX: 11.2 },
};

/**
 * La manche du boubou, c'est son aile :
 *  · `evasee`     — l'aile classique ;
 *  · `tres-large` — l'aile poussée jusqu'au bout des bras ;
 *  · `cape`       — l'aile qui tombe bas, presque jusqu'aux genoux ;
 *  · `bord-brode` — l'aile classique, bordée de broderie ;
 *  · `ajustee`    — un boubou moderne à vraies manches, serrées au poignet.
 */
export type Sleeve = "evasee" | "tres-large" | "cape" | "bord-brode" | "ajustee";

// --- Le boubou ----------------------------------------------------------------

/** Moitié gauche du boubou, sans le col. */
function bodyHalf(cut: Cut, sleeve: Sleeve = "evasee"): ReactNode {
  const { hem, hemX } = CUTS[cut];
  const wing = sleeve === "tres-large" ? 0.4 : CUTS[cut].wing;
  // le pantalon assorti, aux chevilles — le modèle royal tombe au sol
  const pants = cut !== "royal" && (
    <path d={`M25.4 ${hem + 2.1}V${cut === "court" ? 86 : hem + 6.4}H30.4V${hem + 2.2}`} />
  );
  const hemLine = <path d={`M${hemX} ${hem}Q${(hemX + 32) / 2} ${hem + 2} 32 ${hem + 2.2}`} />;

  if (sleeve === "ajustee") {
    // Vraies manches : de l'épaule au poignet, puis le corps tombe droit.
    return (
      <>
        <path
          d={`M27 5.6 19.6 7.8C16 14 13.6 32 12 52L16.8 53C18 40 19.4 28 20.6 21L${hemX + 4} ${hem}`}
        />
        <path d={`M${hemX + 4} ${hem}Q${(hemX + 36) / 2} ${hem + 1.6} 32 ${hem + 1.8}`} />
        <Seam>
          <path d="M12.4 48.6 17.2 49.6" />
        </Seam>
        {pants}
      </>
    );
  }

  // Bas de l'aile et retour sous le bras : la cape tombe beaucoup plus bas.
  const cape = sleeve === "cape";
  const endY = cape ? 72 : sleeve === "tres-large" ? 56 : 50;
  const armY = cape ? Math.min(75, hem - 3) : sleeve === "tres-large" ? 63 : 59;
  const armX = wing + 12.8;
  const dropY = armY + (hem - armY) * 0.4;
  return (
    <>
      {/* l'aile : de l'épaule au bout du bras, puis retour sous le bras */}
      <path
        d={`M27 5.6C20 8 ${wing + 6} 14 ${wing} 22C${wing - 0.6} 32 ${wing - 0.4} ${endY - 8} ${wing + 0.4} ${endY}C${wing + 4} ${endY + 4} ${wing + 9} ${armY - 2} ${armX} ${armY}C${armX - 2} ${dropY} ${hemX + 1.4} ${hem - 6} ${hemX} ${hem}`}
      />
      {hemLine}
      <Seam>
        {/* le pli du tissu sur le bras, puis le tombé jusqu'au sol */}
        <path d={`M${wing + 6.4} 19Q${wing + 7.6} 40 ${armX} ${armY}`} />
        <path d={`M21 ${armY + 3}L${hemX + 9} ${hem + 1.4}`} />
      </Seam>
      {sleeve === "bord-brode" && (
        <Embroidery d={`M${wing + 1.8} 23C${wing + 1.2} 32 ${wing + 1.4} 42 ${wing + 2.2} 48.6`} />
      )}
      {pants}
    </>
  );
}

/** Moitié gauche du col. */
function colHalf(col: Col): ReactNode {
  switch (col) {
    case "uni":
      return <path d="M27 5.6Q27.8 10.6 32 11" />;
    case "rond":
      return (
        <>
          <path d="M27 5.6Q27.8 10.6 32 11" />
          <Embroidery d="M25.6 6.8Q26.6 12.8 32 13.2" />
        </>
      );
    case "fente":
      return (
        <>
          <path d="M27 5.6Q27.8 10.6 32 11V23" />
          <Embroidery d="M25.6 6.8Q26.6 12.8 30.6 13V23.6" />
        </>
      );
    case "mao":
      return (
        <>
          <path d="M27.2 6Q28 9.4 32 9.6" />
          <path d="M27.2 6 27.4 2.8Q28.4 6.6 32 6.8" />
          <Embroidery d="M26 7.6Q27 11.4 32 11.6" />
        </>
      );
    case "carre":
      return (
        <>
          <path d="M27 5.6V12.4H32" />
          <Embroidery d="M25.6 6.4V13.8H32" />
        </>
      );
    case "v":
      return (
        <>
          <path d="M27 5.6 32 17" />
          <Embroidery d="M25.6 6.6 32 19.8" />
        </>
      );
  }
}

/** Boubou entier, symétrique : corps + col + ce qu'on y ajoute des deux côtés. */
export function boubou(
  cut: Cut,
  col: Col,
  extraHalf?: ReactNode,
  solo?: ReactNode,
  sleeve: Sleeve = "evasee",
): ReactNode {
  const half = (
    <>
      {bodyHalf(cut, sleeve)}
      {colHalf(col)}
      {extraHalf}
    </>
  );
  return (
    <>
      {half}
      <Mirror>{half}</Mirror>
      {solo}
    </>
  );
}

// --- Col, en gros plan ---------------------------------------------------------

/** Broderie à l'échelle du gros plan : des points plus gros, plus espacés. */
export function EmbroideryLg({ d }: { d: string }) {
  return <path d={d} strokeWidth={2.2} strokeDasharray="0.01 3" />;
}

/** Moitié gauche du col vu de près : l'encolure et le haut de l'épaule. */
function colCloseHalf(col: Exclude<Col, "uni">): ReactNode {
  const shoulder = <path d="M20 14C13 15.6 6 18.4 -1 22" />;
  switch (col) {
    case "rond":
      return (
        <>
          {shoulder}
          <path d="M20 14Q22 30 32 31" />
          <EmbroideryLg d="M16.4 15.2Q19 35 32 36" />
        </>
      );
    case "fente":
      return (
        <>
          {shoulder}
          <path d="M20 14Q22 30 32 31V54" />
          <EmbroideryLg d="M16.4 15.2Q19 35 28.4 36V55.6" />
        </>
      );
    case "mao":
      // Le col droit monte au-dessus de l'encolure.
      return (
        <>
          <path d="M20 18C13 19.6 6 22.4 -1 26" />
          <path d="M20 18Q22 26 32 26.6" />
          <path d="M20 18 20.4 8.6Q22.4 17.6 32 18.2" />
          <EmbroideryLg d="M20.4 13.4Q22.4 21.8 32 22.4" />
        </>
      );
    case "carre":
      return (
        <>
          {shoulder}
          <path d="M20 14V34H32" />
          <EmbroideryLg d="M16 15.2V38H32" />
        </>
      );
    case "v":
      return (
        <>
          {shoulder}
          <path d="M20 14 32 46" />
          <EmbroideryLg d="M16.4 15.4 32 52.6" />
        </>
      );
  }
}

export function colCloseUp(col: Exclude<Col, "uni">): ReactNode {
  const half = colCloseHalf(col);
  return (
    <>
      {half}
      <Mirror>{half}</Mirror>
    </>
  );
}

// --- Coupe --------------------------------------------------------------------

export function coupe(cut: Cut): ReactNode {
  if (cut !== "trois-pieces") return boubou(cut, "rond");
  // Trois pièces : le boubou s'ouvre en V sur la tunique brodée qu'il recouvre,
  // et la manche droite de la tunique sort sous l'aile.
  const tunic = (
    <>
      <path d="M28.4 7.4Q29 12 32 12.4" />
      <Embroidery d="M29.8 13.4V30H32" />
      <Seam>
        <path d="M9.4 54.4 7.6 57.8 11.6 59.6" />
      </Seam>
    </>
  );
  return boubou(cut, "v", tunic);
}

// --- Broderie -----------------------------------------------------------------

export function broderie(brod: Brod): ReactNode {
  switch (brod) {
    case "sans":
      return boubou("classique", "uni");
    case "encolure":
      return boubou(
        "classique",
        "rond",
        <Embroidery d="M24.4 7.6Q25.4 15 32 15.6" />,
      );
    case "plastron":
      return boubou(
        "classique",
        "rond",
        <>
          <Embroidery d="M28.2 13.4V36.4H32" />
          <Embroidery d="M30 13.6V34.6" />
        </>,
      );
    case "poche":
      // La grande poche poitrine brodée, d'un seul côté.
      return boubou(
        "classique",
        "rond",
        undefined,
        <>
          <path d="M17.4 20H24.6V28.6H17.4Z" />
          <Embroidery d="M18.8 21.4H23.2V27.2H18.8Z" />
        </>,
      );
    case "devant":
      // Tout le devant brodé : un grand plastron en U et une rosace.
      return boubou(
        "classique",
        "rond",
        <>
          <Embroidery d="M24.6 8.4Q23.4 31 32 45" />
          <Embroidery d="M27 12.6Q26.4 30 32 38.8" />
          <Embroidery d="M29 24.4A3 3 0 0 1 32 21.4" />
          <Embroidery d="M29 24.4A3 3 0 0 0 32 27.4" />
        </>,
      );
  }
}

// --- Poches (dessinées seules, en gros plan) ------------------------------------

export type Pocket = "sans" | "poitrine" | "poitrine-brodee" | "devant" | "laterales";

/** Surpiqûre : la couture visible tout autour de la poche. */
function Stitch({ d }: { d: string }) {
  return <path d={d} strokeWidth={0.8} strokeDasharray="2 1.6" />;
}

/** Étoile à huit branches, centrée en (cx, cy). */
export function starPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI / 8) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)} ${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

function chestPocket(): ReactNode {
  return (
    <>
      <path d="M20 12H44V47Q32 51 20 47Z" />
      <path d="M20 18H44" />
      <Stitch d="M22.4 20.4V45.2Q32 48.6 41.6 45.2V20.4" />
    </>
  );
}

export function pocketCloseUp(pocket: Pocket): ReactNode {
  switch (pocket) {
    case "sans":
      return (
        <>
          <g opacity={0.35}>{chestPocket()}</g>
          <path d="M14 56 50 8" strokeWidth={2} />
        </>
      );
    case "poitrine":
      return chestPocket();
    case "poitrine-brodee":
      // Poche en écusson, bordée de broderie, une étoile au milieu.
      return (
        <>
          <path d="M20 10H44V42L32 52 20 42Z" />
          <path d="M20 16H44" />
          <Embroidery d="M22.8 19V40.6L32 48.4 41.2 40.6V19" />
          <path d={starPath(32, 30.6, 7)} strokeWidth={1.1} />
        </>
      );
    case "devant":
      // Grande poche plaquée, plus large que haute, sur le ventre.
      return (
        <>
          <path d="M8 16H56V44Q32 50 8 44Z" />
          <path d="M8 22H56" />
          <Stitch d="M10.4 24.4V42.2Q32 47.6 53.6 42.2V24.4" />
        </>
      );
    case "laterales":
      // Deux poches fendues, une sur chaque hanche, à passepoil.
      return (
        <>
          {[0, 1].map((side) => (
            <g key={side} transform={side ? "matrix(-1 0 0 1 64 0)" : undefined}>
              <path d="M12 10 18.4 52" />
              <path d="M15.6 9.6 22 51.6" />
              <path d="M12 10H15.6M18.4 52H22" />
              <Stitch d="M10 9.4 16.6 53" />
            </g>
          ))}
        </>
      );
  }
}

// --- Pantalon (dessiné seul) ---------------------------------------------------

type Pants = "droit" | "thiaya-moyen" | "thiaya-large";

/** Moitié gauche du pantalon : ceinture coulissée, puis la jambe. */
function pantsHalf(pants: Pants): ReactNode {
  const waist = (
    <>
      <path d="M18 8H32M18 8V12.4H32" />
      {/* le cordon qui serre la taille */}
      <path d="M31.4 12.4Q30.6 16 28.8 18.4" />
    </>
  );
  // Les fronces sous la ceinture, plus nombreuses quand le thiaya est large.
  const gathers = (
    <Seam>
      <path d="M20.4 13.6 19.8 18M23.4 13.6V18.6M26.4 13.6V18.4" />
    </Seam>
  );
  switch (pants) {
    case "droit":
      return (
        <>
          {waist}
          <path d="M18 12.4 16 82H28.6L31.2 31Q31.6 29.6 32 29.4" />
          <Seam>
            <path d="M22.6 16 22 80" />
          </Seam>
        </>
      );
    case "thiaya-moyen":
      // Ample, l'entrejambe tombe au genou, la cheville resserrée.
      return (
        <>
          {waist}
          {gathers}
          <path d="M18 12.4C12 24 8.4 40 9 56C9.6 66 13.4 73.6 16.8 78" />
          <path d="M16.8 78H26.6M16.8 78 17.2 82.4H26.2L26.6 78" />
          <path d="M26.6 78C27 69 29 61 32 57" />
          <Seam>
            <path d="M15 24Q12.6 44 16 66" />
            <path d="M24 40Q25.6 52 28.6 58" />
          </Seam>
        </>
      );
    case "thiaya-large":
      // Très très large : l'entrejambe pend jusqu'aux chevilles.
      return (
        <>
          {waist}
          {gathers}
          <path d="M18 12.4C7.6 21 1.6 38 2.2 56C2.8 67 7.6 74 13.8 78" />
          <path d="M13.8 78H24.2M13.8 78 14.2 82.4H23.8L24.2 78" />
          <path d="M24.2 78C26 75.4 28.4 73.6 32 73.2" />
          <Seam>
            <path d="M11 22Q5.6 42 9.4 68" />
            <path d="M17.6 30Q15 50 18.6 74" />
            <path d="M22.6 24Q22.6 52 32 64" />
          </Seam>
        </>
      );
  }
}

export function pantalon(pants: Pants): ReactNode {
  const half = pantsHalf(pants);
  return (
    <>
      {half}
      <Mirror>{half}</Mirror>
    </>
  );
}

// --- Écharpe (kaala) ----------------------------------------------------------

/**
 * L'écharpe seule, suspendue : la boucle en haut, deux pans rayés au bout,
 * frangés. « Sans écharpe » montre la même, pâlie et barrée.
 */
function scarfDrawing(): ReactNode {
  // Un pan : de la boucle jusqu'au bout frangé, avec deux rayures tissées.
  const pan = (x1: number, x2: number, top: number, end: number, tilt: number) => (
    <>
      <Cloth d={`M${x1} ${top}L${x1 + tilt} ${end}H${x2 + tilt}L${x2} ${top + 1.4}Z`} />
      <Seam>
        <path d={`M${(x1 + x2) / 2} ${top + 3}L${(x1 + x2) / 2 + tilt * 0.6} ${end - 11}`} />
        <path d={`M${x1 + tilt * 0.82} ${end - 8}H${x2 + tilt * 0.82}M${x1 + tilt * 0.86} ${end - 5.6}H${x2 + tilt * 0.86}`} />
      </Seam>
      <path
        d={Array.from({ length: 7 }, (_, i) => {
          const x = x1 + tilt + 0.6 + (i * (x2 - x1 - 1.2)) / 6;
          return `M${x} ${end + 0.6}v3.4`;
        }).join("")}
      />
    </>
  );
  return (
    <>
      {/* la boucle, là où l'écharpe passe autour du cou */}
      <path d="M13.6 18Q32 -1 50.4 18" />
      <path d="M24.4 19.6Q32 8.6 39.6 19.6" />
      {pan(13.6, 24.4, 18, 78, -1.4)}
      {pan(39.6, 50.4, 18, 68, 1.8)}
    </>
  );
}

export function echarpe(withScarf: boolean): ReactNode {
  if (withScarf) return scarfDrawing();
  return (
    <>
      <g opacity={0.35}>{scarfDrawing()}</g>
      <path d="M12 80 52 8" strokeWidth={2} />
    </>
  );
}

const BOX = "0 0 64 88";
/** Gros plan carré (le col). */
const CLOSE_BOX = "0 4 64 54";
/** Gros plan carré (la poche). */
export const SQUARE_BOX = "0 0 64 62";

const ICONS = {
  // === Coupe ================================================================
  "bl-coupe-classique": { viewBox: BOX, body: coupe("classique") },
  "bl-coupe-royal": { viewBox: BOX, body: coupe("royal") },
  "bl-coupe-moderne": { viewBox: BOX, body: coupe("moderne") },
  "bl-coupe-trois-pieces": { viewBox: BOX, body: coupe("trois-pieces") },

  // === Col ==================================================================
  "bl-col-rond": { viewBox: CLOSE_BOX, body: colCloseUp("rond") },
  "bl-col-fente": { viewBox: CLOSE_BOX, body: colCloseUp("fente") },
  "bl-col-mao": { viewBox: CLOSE_BOX, body: colCloseUp("mao") },
  "bl-col-carre": { viewBox: CLOSE_BOX, body: colCloseUp("carre") },
  "bl-col-v": { viewBox: CLOSE_BOX, body: colCloseUp("v") },

  // === Broderie =============================================================
  "bl-brod-sans": { viewBox: BOX, body: broderie("sans") },
  "bl-brod-encolure": { viewBox: BOX, body: broderie("encolure") },
  "bl-brod-plastron": { viewBox: BOX, body: broderie("plastron") },
  "bl-brod-poche": { viewBox: BOX, body: broderie("poche") },
  "bl-brod-devant": { viewBox: BOX, body: broderie("devant") },

  // === Écharpe ==============================================================
  "bl-poche-sans": { viewBox: SQUARE_BOX, body: pocketCloseUp("sans") },
  "bl-poche-poitrine": { viewBox: SQUARE_BOX, body: pocketCloseUp("poitrine") },
  "bl-poche-devant": { viewBox: SQUARE_BOX, body: pocketCloseUp("devant") },
  "bl-poche-laterales": { viewBox: SQUARE_BOX, body: pocketCloseUp("laterales") },
  "bl-pantalon-sans": {
    viewBox: BOX,
    body: (
      <>
        <g opacity={0.35}>{pantalon("droit")}</g>
        <path d="M12 80 52 8" strokeWidth={2} />
      </>
    ),
  },
  "bl-pantalon-droit": { viewBox: BOX, body: pantalon("droit") },
  "bl-pantalon-thiaya-moyen": { viewBox: BOX, body: pantalon("thiaya-moyen") },
  "bl-pantalon-thiaya-large": { viewBox: BOX, body: pantalon("thiaya-large") },
  "bl-echarpe-sans": { viewBox: BOX, body: echarpe(false) },
  "bl-echarpe-avec": { viewBox: BOX, body: echarpe(true) },

} satisfies Record<string, IconDef>;

export type BayeLahatDetailIconName = keyof typeof ICONS;

export function isBayeLahatArt(name: string): name is BayeLahatDetailIconName {
  return name in ICONS;
}

/** Le boubou entier en portrait ; le col et les poches, en gros plan, en carré. */
export function bayeLahatArtIsTall(name: BayeLahatDetailIconName): boolean {
  return !name.startsWith("bl-col-") && !name.startsWith("bl-poche-");
}

export function BayeLahatDetailIcon({
  name,
  className,
}: {
  name: BayeLahatDetailIconName;
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
