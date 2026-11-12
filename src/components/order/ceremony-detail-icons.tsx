// Planches de la TENUE DE CÉRÉMONIE FEMME (JALOFA AFRIQUE, slug
// `ceremonie-femme`) : les vraies coupes de cérémonie — grand boubou, robe
// sirène, taille basse, ndokette, robe à cape, kaftan brodé — puis les manches,
// la broderie et le foulard, chacun dessiné sur la tenue.
//
// Mêmes conventions que `gown-detail-icons.tsx` : `currentColor`, trait fin,
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

/** Broderie : un chapelet de points le long du tracé. */
function Embroidery({ d }: { d: string }) {
  return <path d={d} strokeWidth={1.5} strokeDasharray="0.01 1.7" />;
}

type Cut = "grand-boubou" | "sirene" | "taille-basse" | "ndokette" | "cape" | "kaftan";
type Sleeve = "sans" | "courtes" | "trois-quarts" | "longues" | "evasees" | "papillon";
type Brod = "sans" | "encolure" | "plastron" | "manches" | "complete" | "strass";

// --- Corsage ajusté (sirène, taille basse, ndokette, robe à cape) ------------
const FITTED_NECK = "M25.6 6Q26.4 11.8 32 12.2";
const FITTED_SHOULDER = "M25.6 6 21.6 7.6";
const FITTED_BODICE = "M21.6 7.6C21 11.4 20.8 14.8 21 18C22.4 24 24.2 28 24.6 32";
const FITTED_WAIST = "M24.6 32Q28 32.8 32 33";

function sleeveHalf(sleeve: Sleeve): ReactNode {
  switch (sleeve) {
    case "sans":
      return null;
    case "courtes":
      return <path d="M21.6 7.6C18.6 8.8 16.8 12 16 16.6L15.2 21.6 20.4 21.4 21 18" />;
    case "trois-quarts":
      return <path d="M21.6 7.6C18.6 8.8 17 12 16.4 17L14.2 42 18.8 42.4 21 18" />;
    case "longues":
      return <path d="M21.6 7.6C18.6 8.8 17 12 16.4 17L13 58 17.6 58.4 21 18" />;
    case "evasees":
      // Étroite jusqu'au coude, puis s'ouvre en cloche.
      return (
        <path d="M21.6 7.6C18.6 8.8 17 12 16.4 17L15.4 36C12.6 44 10 51 9 58Q13.8 60 18.6 58.6C18.2 50 18.4 42 19.4 35.6L21 18" />
      );
    case "papillon":
      // Une aile de tissu qui part de l'épaule et tombe du bras.
      return (
        <>
          <path d="M21.6 7.6C15.6 8.6 9 13 3.6 19.6Q5.8 30 6.8 38.4Q14.6 31 21 21" />
          <Seam>
            <path d="M14.4 11.6Q12.6 22 9.6 34.6" />
          </Seam>
        </>
      );
  }
}

function fittedTop(sleeve: Sleeve): ReactNode {
  return (
    <>
      <path d={FITTED_NECK} />
      <path d={FITTED_SHOULDER} />
      <path d={FITTED_BODICE} />
      {sleeveHalf(sleeve)}
    </>
  );
}

/** Moitié gauche d'une coupe de cérémonie. */
function cutHalf(cut: Cut, sleeve: Sleeve): ReactNode {
  switch (cut) {
    case "grand-boubou":
      // Le grand boubou : un grand pan de tissu, bras ouverts, qui tombe au sol.
      return (
        <>
          <path d="M27 5.6Q27.8 10.6 32 11" />
          {/* l'aile : de l'épaule au poignet, puis le pan qui retombe en biais */}
          <path d="M27 5.6C19 8 10 11.6 3 15.6C2.4 24 2 32 2.6 40C6 46 11 50 15.4 52.6C13.4 62 11.4 72 9.6 81" />
          <path d="M9.6 81Q20.8 83 32 83.2" />
          <Embroidery d="M25.4 7Q26.6 13.4 32 13.8" />
          <Embroidery d="M29.6 15V30" />
          <Seam>
            <path d="M8.6 14Q9.8 32 15.4 52.6" />
            <path d="M20.4 56Q19.4 70 18.4 82.4" />
          </Seam>
        </>
      );
    case "sirene":
      return (
        <>
          {fittedTop(sleeve)}
          <Seam>
            <path d={FITTED_WAIST} />
          </Seam>
          <path d="M24.6 32C22.6 38 22.6 46 24 56C23 64 18 76 13.6 80" />
          <path d="M13.6 80Q22.8 81.2 32 81.4" />
          <Seam>
            <path d="M24 56Q28 57 32 57.2" />
          </Seam>
        </>
      );
    case "taille-basse":
      // Haut ajusté qui descend sur les hanches, pagne droit jusqu'aux chevilles.
      return (
        <>
          {fittedTop(sleeve)}
          <Seam>
            <path d={FITTED_WAIST} />
          </Seam>
          <path d="M24.6 32C24 36 22.6 40 21.2 44" />
          <path d="M21.2 44Q26.6 45.6 32 45.8" />
          <path d="M23.2 45.2 22.4 78" />
          <path d="M22.4 78Q27.2 78.8 32 79" />
        </>
      );
    case "ndokette":
      // Haut évasé à deux volants, sur une jupe droite.
      return (
        <>
          {fittedTop(sleeve)}
          <Seam>
            <path d={FITTED_WAIST} />
          </Seam>
          <path d="M24.6 32C22.4 36 19 40 16 44" />
          <path d="M16 44Q24 46.4 32 46.6" />
          <path d="M18.2 45.4C16.8 48 14.8 50.6 12.8 53" />
          <path d="M12.8 53Q22.4 55.4 32 55.6" />
          <path d="M23 55.2 22.4 78" />
          <path d="M22.4 78Q27.2 78.8 32 79" />
        </>
      );
    case "cape":
      // Robe fourreau, et une cape de voile qui tombe des épaules.
      return (
        <>
          {fittedTop("sans")}
          <Seam>
            <path d={FITTED_WAIST} />
          </Seam>
          <path d="M24.6 32C23.2 36 22.8 39 22.8 42L23.4 80" />
          <path d="M23.4 80Q27.7 80.6 32 80.8" />
          <path
            d="M21.6 7.6C15 9.6 9.6 17 7.4 28C6 40 6.6 52 8.4 64Q15 63.4 21.6 62"
            fill="currentColor"
            fillOpacity={0.08}
          />
          <Seam>
            <path d="M15.4 13Q12.4 36 13.4 63.2" />
          </Seam>
        </>
      );
    case "kaftan":
      return kaftanHalf(true);
  }
}

/** Kaftan : tunique droite et longue, manches droites, plastron au milieu. */
function kaftanHalf(plastron: boolean): ReactNode {
  return (
    <>
      <path d="M27.2 5.8Q28 10.4 32 10.8" />
      <path d="M27.2 5.8 20.4 7.6 11.4 33.4 16.4 35.2 20.6 22 18.6 80" />
      <path d="M18.6 80Q25.3 81 32 81.2" />
      {plastron && (
        <Seam>
          <path d="M28.6 10.6V36H32" />
        </Seam>
      )}
    </>
  );
}

function cut(c: Cut, sleeve: Sleeve = "longues"): ReactNode {
  const half = cutHalf(c, sleeve);
  return (
    <>
      {half}
      <Mirror>{half}</Mirror>
    </>
  );
}

/** La broderie, posée sur le kaftan (moitié gauche). */
function embroideryHalf(brod: Brod): ReactNode {
  const neck = <Embroidery d="M25.8 7.2Q26.8 12.6 32 13" />;
  const plastron = <Embroidery d="M29.4 13.2V35.4" />;
  const cuff = <Embroidery d="M12.4 30.4 17.4 32.2" />;
  switch (brod) {
    case "sans":
      return null;
    case "encolure":
      return neck;
    case "plastron":
      return (
        <>
          {neck}
          {plastron}
        </>
      );
    case "manches":
      return (
        <>
          {neck}
          {cuff}
        </>
      );
    case "complete":
      return (
        <>
          {neck}
          {plastron}
          {cuff}
          <Embroidery d="M19 76.6Q25.5 77.6 32 77.8" />
          <Embroidery d="M23.4 18Q24 40 22.4 66" />
        </>
      );
    case "strass": {
      // Semis de strass, dense sur le haut, plus léger vers le bas.
      const dots: ReactNode[] = [];
      let row = 0;
      for (let y = 14; y <= 60; y += 3.2, row++) {
        // Bord gauche du kaftan : l'aisselle (20.6, 22) puis le côté (→ 18.6, 80).
        const left = y < 22 ? 21.4 : 20.6 - ((y - 22) * 2) / 58;
        const step = y < 36 ? 2.6 : 3.8;
        for (let x = left + 1.2 + (row % 2 ? step / 2 : 0); x <= 31.2; x += step) {
          dots.push(
            <circle
              key={`${x.toFixed(1)}-${y.toFixed(1)}`}
              cx={x}
              cy={y}
              r={y < 36 ? 0.55 : 0.45}
              fill="currentColor"
              stroke="none"
            />,
          );
        }
      }
      return <>{dots}</>;
    }
  }
}

function embroidered(brod: Brod): ReactNode {
  const half = (
    <>
      {kaftanHalf(false)}
      {embroideryHalf(brod)}
    </>
  );
  return (
    <>
      {half}
      <Mirror>{half}</Mirror>
    </>
  );
}

/** Le foulard : la femme de face, tête comprise (viewBox 64 × 96). */
function headwear(kind: "sans" | "moussor" | "chale"): ReactNode {
  const figure = (
    <>
      {kind === "moussor" ? (
        // Le haut de la tête est sous le foulard : on ne dessine que le visage.
        <path d="M27.6 10.4A4.4 4.4 0 0 0 36.4 10.4" />
      ) : (
        <circle cx={32} cy={10} r={4.4} />
      )}
      <path d="M30 14.4V17M34 14.4V17" />
      <path d="M30 17Q23 18 20 22L22 40Q22 66 14 92Q32 95 50 92Q42 66 42 40L44 22Q41 18 34 17" />
      <Seam>
        <path d="M22 40Q32 41.4 42 40" />
      </Seam>
    </>
  );
  switch (kind) {
    case "sans":
      return figure;
    case "moussor":
      // Foulard de tête noué haut, en éventail plissé au-dessus du front.
      return (
        <>
          {figure}
          <path
            d="M27 10.6C23.4 7 23.6 .6 28.6-1.6Q32-2.8 35.4-1.6C40.4.6 40.6 7 37 10.6Q32 8.4 27 10.6Z"
            fill="currentColor"
            fillOpacity={0.12}
          />
          <Seam>
            <path d="M29.2-1.4Q29.8 4 28.8 9.4M32-2.2V8.6M34.8-1.4Q34.2 4 35.2 9.4" />
          </Seam>
        </>
      );
    case "chale":
      // Châle assorti posé sur une épaule, qui tombe dans le dos.
      return (
        <>
          {figure}
          <path
            d="M20 22C25 25.4 35 27.6 44 22L45.6 46 40.6 46.6 40.4 30Q30 33 21 27Z"
            fill="currentColor"
            fillOpacity={0.12}
          />
        </>
      );
  }
}

const BOX = "0 0 64 88";
/** Commence un peu au-dessus de 0 : le foulard monte plus haut que la tête. */
const FIGURE_BOX = "0 -4 64 100";

const ICONS = {
  // === Coupe ================================================================
  "cf-coupe-grand-boubou": { viewBox: BOX, body: cut("grand-boubou") },
  "cf-coupe-sirene": { viewBox: BOX, body: cut("sirene", "trois-quarts") },
  "cf-coupe-taille-basse": { viewBox: BOX, body: cut("taille-basse", "courtes") },
  "cf-coupe-ndokette": { viewBox: BOX, body: cut("ndokette", "courtes") },
  "cf-coupe-cape": { viewBox: BOX, body: cut("cape") },
  "cf-coupe-kaftan": { viewBox: BOX, body: cut("kaftan") },

  // === Manches (sur la robe sirène) =========================================
  "cf-manche-sans": { viewBox: BOX, body: cut("sirene", "sans") },
  "cf-manche-courtes": { viewBox: BOX, body: cut("sirene", "courtes") },
  "cf-manche-trois-quarts": { viewBox: BOX, body: cut("sirene", "trois-quarts") },
  "cf-manche-longues": { viewBox: BOX, body: cut("sirene", "longues") },
  "cf-manche-evasees": { viewBox: BOX, body: cut("sirene", "evasees") },
  "cf-manche-papillon": { viewBox: BOX, body: cut("sirene", "papillon") },

  // === Broderie (sur le kaftan) =============================================
  "cf-brod-sans": { viewBox: BOX, body: embroidered("sans") },
  "cf-brod-encolure": { viewBox: BOX, body: embroidered("encolure") },
  "cf-brod-plastron": { viewBox: BOX, body: embroidered("plastron") },
  "cf-brod-manches": { viewBox: BOX, body: embroidered("manches") },
  "cf-brod-complete": { viewBox: BOX, body: embroidered("complete") },
  "cf-brod-strass": { viewBox: BOX, body: embroidered("strass") },

  // === Foulard ==============================================================
  "cf-tete-sans": { viewBox: FIGURE_BOX, body: headwear("sans") },
  "cf-tete-moussor": { viewBox: FIGURE_BOX, body: headwear("moussor") },
  "cf-tete-chale": { viewBox: FIGURE_BOX, body: headwear("chale") },
} satisfies Record<string, IconDef>;

export type CeremonyDetailIconName = keyof typeof ICONS;

export function isCeremonyArt(name: string): name is CeremonyDetailIconName {
  return name in ICONS;
}

/** Toutes les planches montrent la tenue entière : vignette en portrait. */
export function ceremonyArtIsTall(): boolean {
  return true;
}

export function CeremonyDetailIcon({
  name,
  className,
}: {
  name: CeremonyDetailIconName;
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
