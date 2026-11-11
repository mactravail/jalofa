// Planches de la robe de soirée (JALOFA EUROPE) — façon configurateur
// Sumissura : la robe entière où un seul détail change d'une case à l'autre
// (silhouette, manches, longueur, fente, taille), un gros plan du buste pour
// le décolleté et la robe vue de dos pour le dos.
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

type Silhouette = "fourreau" | "sirene" | "trapeze" | "princesse" | "empire" | "trompette";
type Neckline =
  | "v"
  | "rond"
  | "bateau"
  | "coeur"
  | "bustier"
  | "epaules"
  | "asymetrique"
  | "americain"
  | "carre"
  | "bretelles"
  | "montant"
  | "illusion"
  | "reine-anne";
type Finish = "unie" | "perles" | "dentelle" | "drape" | "satin" | "tulle";
type Sleeves =
  | "sans"
  | "mancherons"
  | "courtes"
  | "trois-quarts"
  | "longues"
  | "bouffantes"
  | "dentelle";
type Back = "ferme" | "v" | "nu" | "lace" | "boutons";
/** Traîne de la robe de mariée, de la plus courte à la plus longue. */
type Train = "sans" | "balayeuse" | "chapelle" | "cathedrale";
type Length = "midi" | "cheville" | "sol" | "traine";
type Waist = "sans" | "ceinture" | "noeud" | "bijou";

type DressSpec = {
  silhouette?: Silhouette;
  neckline?: Neckline;
  sleeves?: Sleeves;
  length?: Length;
  slit?: boolean;
  waist?: Waist;
  train?: Train;
  /** Ornement de la robe de cérémonie (dessiné sur la silhouette trapèze). */
  finish?: Finish;
  /** Vue de dos : remplace le décolleté par la découpe du dos. */
  back?: Back;
};

const HEM_Y: Record<Length, number> = { midi: 60, cheville: 74, sol: 80, traine: 80 };

/** Les décolletés qui ont des épaules — les seuls où l'on choisit des manches. */
const WITH_SHOULDERS = new Set<Neckline>([
  "v",
  "rond",
  "bateau",
  "carre",
  "montant",
  "illusion",
  "reine-anne",
]);

const TRAIN_EXTENT: Record<Train, number> = { sans: 0, balayeuse: 4, chapelle: 8, cathedrale: 13 };

/** Encolure gauche (moitié) : ligne du décolleté + couture d'épaule. */
function necklineHalf(neckline: Neckline): ReactNode {
  switch (neckline) {
    case "v":
      return <path d="M22.6 7.4 26 6 32 22" />;
    case "rond":
      return <path d="M22.6 7.4 26 6Q26.6 13.2 32 13.6" />;
    case "bateau":
      return <path d="M22.6 7.4 24.2 6.4Q28 8.8 32 8.9" />;
    case "coeur":
      return <path d="M21 17.6C21.6 13.4 26 11.6 28.6 13Q31 14.4 32 16.8" />;
    case "bustier":
      return <path d="M21 17Q26 15.2 32 15.4" />;
    case "epaules":
      return (
        <>
          <path d="M13.4 13.4Q22 15.6 32 15.2" />
          {/* le volant qui tombe sur le haut du bras */}
          <path d="M13.4 13.4C12.6 15.4 12.4 17.6 12.8 19.6L19.8 20.2 21 18" />
        </>
      );
    case "americain":
      return (
        <>
          <path d="M29.6 4.4C27 10 23.6 14.4 21 18" />
          <path d="M29.6 4.4Q31 11 32 14" />
        </>
      );
    case "carre":
      return <path d="M22.6 7.4 25.6 6V14.4H32" />;
    case "montant":
      return (
        <>
          <path d="M22.6 7.4 28.4 4.2Q30 3.4 32 3.4" />
          <Seam>
            <path d="M28.4 4.2 28.8 6.6Q30.4 6 32 6" />
          </Seam>
        </>
      );
    case "bretelles":
      return (
        <>
          {/* bustier légèrement en cœur, retenu par deux bretelles fines */}
          <path d="M21 17.4C22 14.6 25 14 27.6 14.8Q30.4 15.6 32 17.4" />
          <path d="M25 14.2 25.8 4.6" />
        </>
      );
    case "illusion":
      return (
        <>
          {/* corsage en cœur sous un empiècement de tulle jusqu'au cou */}
          <path d="M21 17.6C21.6 13.4 26 11.6 28.6 13Q31 14.4 32 16.8" />
          <g strokeOpacity={0.55} strokeDasharray="1.3 1.1">
            <path d="M22.6 7.4 28.4 4.2Q30 3.4 32 3.4" />
          </g>
        </>
      );
    case "reine-anne":
      return <path d="M22.6 7.4 27.4 4.4V8.6C27.4 11.6 29.6 13.2 32 15.8" />;
    case "asymetrique":
      return null; // dessiné en entier dans `necklineExtra`
  }
}

/** Ce qui n'est pas symétrique : le tour de cou du dos-nu américain, l'épaule unique. */
function necklineExtra(neckline: Neckline): ReactNode {
  if (neckline === "americain") return <path d="M29.6 4.4Q32 3 34.4 4.4" />;
  if (neckline === "asymetrique") {
    return (
      <>
        <path d="M24 5.6C22.6 10 21.6 14 21 18" />
        <path d="M24 5.6 27.6 5.2C34 9 39 13 43 17.4" />
      </>
    );
  }
  return null;
}

/** Découpe du dos (moitié gauche), robe vue de dos. */
function backHalf(back: Back): ReactNode {
  switch (back) {
    case "ferme":
      return <path d="M22.6 7.4 26 6Q29 7.2 32 7.4" />;
    case "v":
      return <path d="M22.6 7.4 26 6 32 27" />;
    case "nu":
      return <path d="M22.6 7.4 26 6C25 21 28 30 32 30.4" />;
    case "lace":
      return <path d="M22.6 7.4 26 6C26.6 16 27.4 24 28 30" />;
    case "boutons":
      return <path d="M22.6 7.4 26 6Q29 7.2 32 7.4" />;
  }
}

function sleeveLeft(sleeves: Sleeves): ReactNode {
  switch (sleeves) {
    case "sans":
      return <path d="M22.6 7.4C21.8 11 21.2 14.6 21 18" />;
    case "mancherons":
      return <path d="M22.6 7.4C19.8 8.4 18.2 10.6 17.8 13L21 18" />;
    case "courtes":
      return <path d="M22.6 7.4C19 8.6 17 12 16.2 17L15.4 22 20.6 21.6 21 18" />;
    case "trois-quarts":
      return <path d="M22.6 7.4C19 8.6 17.2 12 16.6 17L14.4 42 19 42.4 21 18" />;
    case "longues":
      return <path d="M22.6 7.4C19 8.6 17.2 12 16.6 17L13 58 17.6 58.4 21 18" />;
    case "bouffantes":
      return (
        <>
          <path d="M22.6 7.4C16.6 6 13.4 11.6 16.2 17.4L13 58 17.6 58.4 21 18" />
          <Seam>
            <path d="M16.2 17.4Q18.6 18.8 21 18M18.4 8.4Q17.6 12 18.4 16.8" />
          </Seam>
        </>
      );
    case "dentelle":
      return (
        <>
          <path d="M22.6 7.4C19 8.6 17.2 12 16.6 17L13 58M17.6 58.4 21 18" />
          <Seam>
            <path d="M13 58q.6 1.6 1.15 0q.6 1.6 1.15 0q.6 1.6 1.15 0q.6 1.6 1.15 0" />
            <path d="M16.4 24 18.6 27M15.4 34 17.8 37.4M14.6 44 17 47.4M18.2 20 19.6 21.6" />
          </Seam>
        </>
      );
  }
}

function skirtLeft(silhouette: Silhouette, hemY: number): { d: string; hemX: number } {
  switch (silhouette) {
    case "fourreau":
      return { d: `M24.6 32C23.2 36 22.8 39 22.8 42L23.4 ${hemY}`, hemX: 23.4 };
    case "sirene":
      return {
        d: `M24.6 32C22.6 38 22.6 46 24 56C23 64 18 ${hemY - 4} 13.6 ${hemY}`,
        hemX: 13.6,
      };
    case "trapeze":
      return { d: `M24.6 32Q21 55 15 ${hemY}`, hemX: 15 };
    case "princesse":
      return { d: `M24.6 32C17 38 10 60 8 ${hemY}`, hemX: 8 };
    case "empire":
      return { d: `M22 22Q22 50 17 ${hemY}`, hemX: 17 };
    case "trompette":
      // Ajustée jusqu'à mi-cuisse, puis s'ouvre en corolle.
      return {
        d: `M24.6 32C23 37 22.8 42 23.2 48C21.4 58 16 ${hemY - 6} 11.6 ${hemY}`,
        hemX: 11.6,
      };
  }
}

/**
 * Ornement (moitié gauche) sur la robe par défaut — trapèze, longueur au sol :
 * le bord gauche suit le corsage (21 18 → 24.6 32) puis la jupe (→ 15 80).
 */
function finishHalf(finish: Finish): ReactNode {
  const edge = (y: number) => (y < 32 ? 21 + ((y - 18) / 14) * 3.6 : 24.6 - ((y - 32) / 48) * 9.6);
  switch (finish) {
    case "unie":
      return null;
    case "perles": {
      const dots: ReactNode[] = [];
      let row = 0;
      for (let y = 19; y <= 58; y += 3, row++) {
        // Semis dense sur le corsage, qui s'éclaircit vers le bas de la jupe.
        const step = y < 33 ? 2.6 : 3.6;
        const start = edge(y) + 1.4 + (row % 2 ? step / 2 : 0);
        for (let x = start; x <= 31.2; x += step) {
          dots.push(
            <circle
              key={`${x.toFixed(1)}-${y}`}
              cx={x}
              cy={y}
              r={y < 33 ? 0.55 : 0.45}
              fill="currentColor"
              stroke="none"
            />,
          );
        }
      }
      return <>{dots}</>;
    }
    case "dentelle": {
      let scallops = "M15.6 78.4";
      for (let x = 15.6; x < 31.5; x += 2.2) scallops += `q1.1 -1.8 2.2 0`;
      return (
        <Seam>
          <path d={scallops} />
          <path d="M26.8 7.2 32 19.6" />
          <path d="M21.8 21.4C23 25 24 28 24.2 30.6" />
        </Seam>
      );
    }
    case "drape":
      return (
        <Seam>
          <path d="M21.8 21 31 28.6M22.6 25 31.4 31.8M23.6 28.6 30 33" />
          <path d="M27.4 33.6Q25.6 56 21.8 79.4M30.2 33.8Q29.8 56 28.4 80.6" />
        </Seam>
      );
    case "satin":
      // Un seul reflet long : la lumière qui glisse sur le satin.
      return (
        <g strokeOpacity={0.45} strokeWidth={0.9}>
          <path d="M26.6 36Q25 56 21.6 77" />
          <path d="M23.4 20.6 24.4 27" />
        </g>
      );
    case "tulle":
      // Jupons superposés : plusieurs ourlets décalés, plis souples.
      return (
        <Seam>
          <path d="M16.2 75.6Q24 77 32 77.2M17.6 70.6Q25 71.8 32 72" />
          <path d="M27.6 33.8Q25.8 56 21 79.6M30.4 34Q29.8 56 27.6 80.8" />
        </Seam>
      );
  }
}

function dressHalf(spec: Required<Omit<DressSpec, "back">> & { back?: Back }): ReactNode {
  const hemY = HEM_Y[spec.length];
  const empire = spec.silhouette === "empire";
  const waist = empire ? { x: 22, y: 22 } : { x: 24.6, y: 32 };
  const skirt = skirtLeft(spec.silhouette, hemY);
  const shoulders = spec.back ? true : WITH_SHOULDERS.has(spec.neckline);

  return (
    <>
      {spec.back ? backHalf(spec.back) : necklineHalf(spec.neckline)}
      {shoulders && sleeveLeft(spec.sleeves)}
      {/* corsage jusqu'à la taille */}
      <path d={empire ? "M21 18 22 22" : "M21 18C22.6 24 24.4 28 24.6 32"} />
      <Seam>
        <path d={`M${waist.x} ${waist.y}Q28 ${waist.y + 0.8} 32 ${waist.y + 1}`} />
      </Seam>
      {spec.waist !== "sans" && (
        <path
          d={`M${waist.x - 0.2} ${waist.y - 1.3}Q28 ${waist.y - 0.5} 32 ${waist.y - 0.3}M${waist.x + 0.1} ${waist.y + 1.4}Q28 ${waist.y + 2.2} 32 ${waist.y + 2.4}`}
        />
      )}
      <path d={skirt.d} />
      <path d={`M${skirt.hemX} ${hemY}Q${(skirt.hemX + 32) / 2} ${hemY + 1.2} 32 ${hemY + 1.4}`} />
      {spec.train !== "sans" && (
        <path
          d={`M${skirt.hemX} ${hemY}C${skirt.hemX - TRAIN_EXTENT[spec.train] * 0.55} ${hemY + TRAIN_EXTENT[spec.train] * 0.4} ${skirt.hemX - TRAIN_EXTENT[spec.train] * 0.35} ${hemY + TRAIN_EXTENT[spec.train]} 32 ${hemY + TRAIN_EXTENT[spec.train] + 0.6}`}
        />
      )}
      {spec.length === "traine" && (
        <path d={`M${skirt.hemX} ${hemY}C${skirt.hemX - 4} ${hemY + 3} ${skirt.hemX - 2} ${hemY + 6} 32 ${hemY + 6.6}`} />
      )}
    </>
  );
}

function dress(input: DressSpec): ReactNode {
  const spec = {
    silhouette: "trapeze" as Silhouette,
    neckline: "v" as Neckline,
    sleeves: "sans" as Sleeves,
    length: "sol" as Length,
    slit: false,
    waist: "sans" as Waist,
    finish: "unie" as Finish,
    train: "sans" as Train,
    ...input,
  };
  const hemY = HEM_Y[spec.length];
  const waist = spec.silhouette === "empire" ? { x: 22, y: 22 } : { x: 24.6, y: 32 };
  return (
    <>
      {dressHalf(spec)}
      <Mirror>
        {dressHalf(spec)}
        {finishHalf(spec.finish)}
      </Mirror>
      {finishHalf(spec.finish)}
      {!spec.back && necklineExtra(spec.neckline)}
      {spec.back === "lace" &&
        [12, 16, 20, 24].map((y) => (
          <path
            key={y}
            d={`M${27 + (y - 6) * 0.04} ${y}L${37 - (y - 6) * 0.04} ${y + 4}M${37 - (y - 6) * 0.04} ${y}L${27 + (y - 6) * 0.04} ${y + 4}`}
            strokeWidth={0.8}
          />
        ))}
      {spec.back === "ferme" && (
        <Seam>
          <path d={`M32 7.4V${waist.y + 8}`} />
        </Seam>
      )}
      {spec.back === "boutons" &&
        Array.from({ length: 13 }, (_, i) => (
          <circle key={i} cx={32} cy={9.6 + i * 2.6} r={0.55} fill="currentColor" stroke="none" />
        ))}
      {spec.waist === "bijou" &&
        [25.6, 28.8, 32, 35.2, 38.4].map((x) => (
          <path
            key={x}
            d={`M${x} ${waist.y - 0.6}l1 1.2 -1 1.2 -1 -1.2Z`}
            fill="currentColor"
            stroke="none"
          />
        ))}
      {spec.slit && <path d={`M25 50 23.6 ${hemY + 0.6}M25 50 27.4 ${hemY + 1.1}`} />}
      {spec.waist === "noeud" && (
        <path
          d={`M27 ${waist.y + 0.6}C24.6 ${waist.y - 2.4} 22.8 ${waist.y + 0.4} 24.8 ${waist.y + 2}Z M27 ${waist.y + 0.6}C29.4 ${waist.y - 2.2} 31.2 ${waist.y + 0.8} 29 ${waist.y + 2.2}Z M26.6 ${waist.y + 1}L25.4 ${waist.y + 7}M27.4 ${waist.y + 1}L28.4 ${waist.y + 6.6}`}
        />
      )}
    </>
  );
}

/** Voile de mariée : la mariée de face, tête comprise (viewBox 64 × 96). */
function veil(kind: "sans" | "court" | "long" | "mantille"): ReactNode {
  const figure = (
    <>
      <circle cx={32} cy={10} r={4.4} />
      <path d="M30 14.4V17M34 14.4V17" />
      <path d="M30 17Q23 18 20 22L22 40Q22 66 14 92Q32 95 50 92Q42 66 42 40L44 22Q41 18 34 17" />
      <Seam>
        <path d="M22 40Q32 41.4 42 40" />
      </Seam>
    </>
  );
  const veilHalf = (d: string, lace = false) => (
    <>
      <path d={d} fill="currentColor" fillOpacity={0.08} strokeOpacity={0.75} />
      {lace && (
        <Seam>
          <path d="M9.6 60q1.4 1.6 2.8 .4q1.4 1.6 2.8 .4q1.4 1.6 2.8 .4q1.4 1.6 2.8 .4q1.4 1.6 2.8 .4q1.4 1.6 2.8 .2q1.4 1.6 2.8 0" />
        </Seam>
      )}
    </>
  );
  switch (kind) {
    case "sans":
      return figure;
    case "court":
      return (
        <>
          {figure}
          {veilHalf("M29.4 6.2C23 9 18.6 20 16.4 36Q24.2 38 32 37.6")}
          <Mirror>{veilHalf("M29.4 6.2C23 9 18.6 20 16.4 36Q24.2 38 32 37.6")}</Mirror>
        </>
      );
    case "long":
      return (
        <>
          {figure}
          {veilHalf("M29.4 6.2C21 12 11 52 4 94Q18 95.6 32 95.6")}
          <Mirror>{veilHalf("M29.4 6.2C21 12 11 52 4 94Q18 95.6 32 95.6")}</Mirror>
        </>
      );
    case "mantille":
      // Posée sur la tête et bordée de dentelle, elle encadre le visage.
      return (
        <>
          {figure}
          <path d="M26.6 9.6Q32 3.4 37.4 9.6" strokeOpacity={0.75} />
          {veilHalf("M26.6 9.6C22 18 12 40 9.6 60Q20.8 62.4 32 62.4", true)}
          <Mirror>{veilHalf("M26.6 9.6C22 18 12 40 9.6 60Q20.8 62.4 32 62.4", true)}</Mirror>
        </>
      );
  }
}

const VEIL_BOX = "0 0 64 96";
/**
 * Traîne : la robe de PROFIL (de face, une traîne ne se voit pas). Le devant
 * tombe à gauche, le dos s'étire vers la droite, d'autant plus loin que la
 * traîne est longue (viewBox 84 × 92).
 */
function trainProfile(train: Train): ReactNode {
  const e = TRAIN_EXTENT[train] * 2.5;
  const back =
    train === "sans"
      ? "M36 6C37.4 14 36 24 35.6 32C36.6 50 40 68 44 84"
      : `M36 6C37.4 14 36 24 35.6 32C36.6 50 40 68 ${44 + e * 0.25} 82C${46 + e * 0.6} 84.6 ${44 + e * 0.8} 86.2 ${44 + e} 86.8`;
  const hem = train === "sans" ? "M22 84Q33 85.6 44 84" : `M22 84Q33 86.4 ${44 + e} 86.8`;
  return (
    <>
      {/* épaule et devant : buste, taille, jupe */}
      <path d="M30 6Q33 5 36 6" />
      <path d="M30 6C27 10 26 16 27 22C28 26 29 30 29 32C28 50 24 70 22 84" />
      <path d={back} />
      <path d={hem} />
      <Seam>
        <path d="M29 32Q32.2 32.8 35.6 32" />
        <path d="M30.4 6.4C31 14 31.6 22 32 31.4" />
      </Seam>
    </>
  );
}

const TRAIN_BOX = "4 0 84 92";

const DRESS_BOX = "0 0 64 88";
/** Gros plan du buste (même dessin, cadré sur le décolleté). */
const BUST_BOX = "10 0 44 40";

const ICONS = {
  // === Silhouette ===========================================================
  "gw-silhouette-fourreau": { viewBox: DRESS_BOX, body: dress({ silhouette: "fourreau" }) },
  "gw-silhouette-sirene": { viewBox: DRESS_BOX, body: dress({ silhouette: "sirene" }) },
  "gw-silhouette-trapeze": { viewBox: DRESS_BOX, body: dress({ silhouette: "trapeze" }) },
  "gw-silhouette-princesse": { viewBox: DRESS_BOX, body: dress({ silhouette: "princesse" }) },
  "gw-silhouette-empire": { viewBox: DRESS_BOX, body: dress({ silhouette: "empire" }) },

  // === Décolleté (gros plan) ================================================
  "gw-col-v": { viewBox: BUST_BOX, body: dress({ neckline: "v" }) },
  "gw-col-rond": { viewBox: BUST_BOX, body: dress({ neckline: "rond" }) },
  "gw-col-bateau": { viewBox: BUST_BOX, body: dress({ neckline: "bateau" }) },
  "gw-col-coeur": { viewBox: BUST_BOX, body: dress({ neckline: "coeur" }) },
  "gw-col-bustier": { viewBox: BUST_BOX, body: dress({ neckline: "bustier" }) },
  "gw-col-epaules": { viewBox: BUST_BOX, body: dress({ neckline: "epaules" }) },
  "gw-col-asymetrique": { viewBox: BUST_BOX, body: dress({ neckline: "asymetrique" }) },
  "gw-col-americain": { viewBox: BUST_BOX, body: dress({ neckline: "americain" }) },
  "gw-col-carre": { viewBox: BUST_BOX, body: dress({ neckline: "carre" }) },
  "gw-col-bretelles": { viewBox: BUST_BOX, body: dress({ neckline: "bretelles" }) },
  "gw-col-montant": { viewBox: BUST_BOX, body: dress({ neckline: "montant" }) },
  "gw-col-illusion": { viewBox: BUST_BOX, body: dress({ neckline: "illusion" }) },
  "gw-col-reine-anne": { viewBox: BUST_BOX, body: dress({ neckline: "reine-anne" }) },

  // ======================== ROBE DE MARIÉE ===================================
  "gw-silhouette-trompette": { viewBox: DRESS_BOX, body: dress({ silhouette: "trompette" }) },
  "gw-manche-bouffantes": {
    viewBox: DRESS_BOX,
    body: dress({ neckline: "rond", sleeves: "bouffantes" }),
  },
  "gw-manche-dentelle": {
    viewBox: DRESS_BOX,
    body: dress({ neckline: "montant", sleeves: "dentelle" }),
  },
  "gw-dos-boutons": { viewBox: DRESS_BOX, body: dress({ back: "boutons" }) },
  "gw-traine-sans": { viewBox: TRAIN_BOX, body: trainProfile("sans") },
  "gw-traine-balayeuse": {
    viewBox: TRAIN_BOX,
    body: trainProfile("balayeuse"),
  },
  "gw-traine-chapelle": {
    viewBox: TRAIN_BOX,
    body: trainProfile("chapelle"),
  },
  "gw-traine-cathedrale": {
    viewBox: TRAIN_BOX,
    body: trainProfile("cathedrale"),
  },
  "gw-matiere-satin": { viewBox: DRESS_BOX, body: dress({ finish: "satin" }) },
  "gw-matiere-tulle": { viewBox: DRESS_BOX, body: dress({ finish: "tulle" }) },
  "gw-voile-sans": { viewBox: VEIL_BOX, body: veil("sans") },
  "gw-voile-court": { viewBox: VEIL_BOX, body: veil("court") },
  "gw-voile-long": { viewBox: VEIL_BOX, body: veil("long") },
  "gw-voile-mantille": { viewBox: VEIL_BOX, body: veil("mantille") },
  "gw-taille-bijou": { viewBox: DRESS_BOX, body: dress({ waist: "bijou" }) },

  // === Finition (robe de cérémonie) =========================================
  "gw-finition-unie": { viewBox: DRESS_BOX, body: dress({ finish: "unie" }) },
  "gw-finition-perles": { viewBox: DRESS_BOX, body: dress({ finish: "perles" }) },
  "gw-finition-dentelle": { viewBox: DRESS_BOX, body: dress({ finish: "dentelle" }) },
  "gw-finition-drape": { viewBox: DRESS_BOX, body: dress({ finish: "drape" }) },

  // === Manches ==============================================================
  "gw-manche-sans": { viewBox: DRESS_BOX, body: dress({ neckline: "rond", sleeves: "sans" }) },
  "gw-manche-mancherons": {
    viewBox: DRESS_BOX,
    body: dress({ neckline: "rond", sleeves: "mancherons" }),
  },
  "gw-manche-courtes": { viewBox: DRESS_BOX, body: dress({ neckline: "rond", sleeves: "courtes" }) },
  "gw-manche-trois-quarts": {
    viewBox: DRESS_BOX,
    body: dress({ neckline: "rond", sleeves: "trois-quarts" }),
  },
  "gw-manche-longues": { viewBox: DRESS_BOX, body: dress({ neckline: "rond", sleeves: "longues" }) },

  // === Dos (vue de dos) =====================================================
  "gw-dos-ferme": { viewBox: DRESS_BOX, body: dress({ back: "ferme" }) },
  "gw-dos-v": { viewBox: DRESS_BOX, body: dress({ back: "v" }) },
  "gw-dos-nu": { viewBox: DRESS_BOX, body: dress({ back: "nu" }) },
  "gw-dos-lace": { viewBox: DRESS_BOX, body: dress({ back: "lace" }) },

  // === Longueur =============================================================
  "gw-longueur-midi": { viewBox: DRESS_BOX, body: dress({ length: "midi" }) },
  "gw-longueur-cheville": { viewBox: DRESS_BOX, body: dress({ length: "cheville" }) },
  "gw-longueur-sol": { viewBox: DRESS_BOX, body: dress({ length: "sol" }) },
  "gw-longueur-traine": { viewBox: DRESS_BOX, body: dress({ length: "traine" }) },

  // === Fente ================================================================
  "gw-fente-sans": { viewBox: DRESS_BOX, body: dress({ silhouette: "fourreau" }) },
  "gw-fente-cuisse": { viewBox: DRESS_BOX, body: dress({ silhouette: "fourreau", slit: true }) },

  // === Taille ===============================================================
  "gw-taille-sans": { viewBox: DRESS_BOX, body: dress({ waist: "sans" }) },
  "gw-taille-ceinture": { viewBox: DRESS_BOX, body: dress({ waist: "ceinture" }) },
  "gw-taille-noeud": { viewBox: DRESS_BOX, body: dress({ waist: "noeud" }) },
} satisfies Record<string, IconDef>;

export type GownDetailIconName = keyof typeof ICONS;

export function isGownArt(name: string): name is GownDetailIconName {
  return name in ICONS;
}

/** Robe entière (portrait) ou gros plan du buste (carré) ? */
export function gownArtIsTall(name: GownDetailIconName): boolean {
  return ICONS[name].viewBox !== BUST_BOX;
}

export function GownDetailIcon({
  name,
  className,
}: {
  name: GownDetailIconName;
  className?: string;
}) {
  const icon: IconDef = ICONS[name];
  return (
    <svg
      viewBox={icon.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={icon.viewBox === BUST_BOX ? 0.95 : 1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icon.body}
    </svg>
  );
}
