// Dessins techniques dédiés au grand boubou — l'équivalent des planches
// « collar / sleeve / embroidery selector » d'un configurateur de tailleur
// (Lanieri, Hockerty) mais dessiné pour la coupe sénégalaise.
//
// Pourquoi un fichier à part plutôt que `garment-detail-icons.tsx` : là-bas une
// finition est COMPOSÉE (un buste par famille + une surcouche par option), ce
// qui suffit tant qu'un vêtement offre 3–4 variantes génériques. Le grand
// boubou, lui, se choisit détail par détail — neuf cols, dix broderies, dix
// manches —, et chaque planche est un dessin propre : un « motif Ségou » ou une
// « manche cape » ne se déduisent d'aucune surcouche paramétrique.
//
// Conventions communes au reste des icônes maison :
//   · tout est en `currentColor`, trait fin, sans remplissage (palette
//     monochrome — cf. AGENTS.md) ;
//   · le contour du vêtement est au trait plein, la broderie passe dans
//     `<Stitch>` (trait plus fin et atténué) pour que l'œil lise d'abord la
//     coupe, puis le motif — c'est le rôle que joue le bleu sur les planches
//     d'inspiration.

import type { ReactNode } from "react";

type IconDef = { viewBox: string; body: ReactNode };

// ---------------------------------------------------------------------------
// Primitives de broderie
// ---------------------------------------------------------------------------

/** Broderie : plus fine et plus claire que le contour du vêtement. */
function Stitch({ children, width = 0.9 }: { children: ReactNode; width?: number }) {
  return (
    <g strokeWidth={width} strokeOpacity={0.62}>
      {children}
    </g>
  );
}

/** Étoile du Sahel — le motif qui signe un sfifa brodé. */
function star(cx: number, cy: number, r: number, key?: string): ReactNode {
  const s = r * 0.3;
  const m = r * 0.42;
  const d = r * 0.66;
  const i = r * 0.3;
  return (
    <g key={key}>
      <path
        d={`M${cx} ${cy - r}L${cx + s} ${cy - s}L${cx + r} ${cy}L${cx + s} ${cy + s}L${cx} ${cy + r}L${cx - s} ${cy + s}L${cx - r} ${cy}L${cx - s} ${cy - s}Z`}
      />
      <path d={`M${cx} ${cy - m}L${cx + m} ${cy}L${cx} ${cy + m}L${cx - m} ${cy}Z`} />
      <path
        d={`M${cx - d} ${cy - d}L${cx - i} ${cy - i}M${cx + d} ${cy - d}L${cx + i} ${cy - i}M${cx - d} ${cy + d}L${cx - i} ${cy + i}M${cx + d} ${cy + d}L${cx + i} ${cy + i}`}
      />
    </g>
  );
}

function diamond(cx: number, cy: number, r: number, key?: string): ReactNode {
  return (
    <path key={key} d={`M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z`} />
  );
}

/** Semis de losanges en quinconce — la broderie « maillée ». */
function lattice(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  step: number,
  r = 1.3,
): ReactNode[] {
  const out: ReactNode[] = [];
  let row = 0;
  for (let y = y1; y <= y2 + 0.01; y += step, row++) {
    const offset = row % 2 ? step / 2 : 0;
    for (let x = x1 + offset; x <= x2 + 0.01; x += step) {
      out.push(diamond(x, y, r, `l${row}-${x.toFixed(1)}`));
    }
  }
  return out;
}

/** Rangées de piqûres horizontales — les « barres » du plastron. */
function rungs(x1: number, x2: number, ys: number[]): ReactNode[] {
  return ys.map((y) => <path key={`r${y}`} d={`M${x1} ${y}H${x2}`} />);
}

/** Chevrons empilés, pointe en bas — la trame géométrique. */
function chevrons(x1: number, x2: number, ys: number[], depth = 4): ReactNode[] {
  const mid = (x1 + x2) / 2;
  return ys.map((y) => (
    <path key={`c${y}`} d={`M${x1} ${y}L${mid} ${y + depth}L${x2} ${y}`} />
  ));
}

/** Contour d'un plastron : rectangle terminé en pointe. */
function plastron(x1: number, x2: number, y1: number, y2: number, tip = 6): string {
  return `M${x1} ${y1}H${x2}V${y2}L${(x1 + x2) / 2} ${y2 + tip}L${x1} ${y2}Z`;
}

/** Galon vertical : deux rails et une chaîne de losanges — le sfifa du devant. */
function braid(x: number, y1: number, y2: number, w = 4.4, pitch = 5.2): ReactNode[] {
  const out: ReactNode[] = [
    <path key="rails" d={`M${x - w / 2} ${y1}V${y2}M${x + w / 2} ${y1}V${y2}`} />,
  ];
  for (let y = y1 + pitch * 0.6; y < y2 - 0.5; y += pitch) {
    out.push(diamond(x, y, w / 2 - 0.7, `bd${y.toFixed(1)}`));
  }
  return out;
}

/** Pampille : la pendeloque qui termine une encolure richement brodée. */
function tassel(x: number, y: number, key?: string): ReactNode {
  return (
    <g key={key}>
      <path d={`M${x - 2} ${y}h4l-2 3.2z`} />
      <path
        d={`M${x - 1.6} ${y + 3.4}l-.8 3.6M${x} ${y + 3.4}v4M${x + 1.6} ${y + 3.4}l.8 3.6`}
      />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Cadres partagés — un même gabarit par groupe, pour que les planches restent
// calées d'une option à l'autre (seul le détail change, jamais le vêtement).
// ---------------------------------------------------------------------------

/**
 * Buste au col (viewBox 64 × 60) — le gabarit de TOUTES les planches de col :
 * épaules tombantes, emmanchure, manche évasée et côtés du corps, coupés par le
 * bas du cadre. L'encolure, elle, est laissée ouverte entre (25 14) et (39 14) :
 * c'est le seul endroit que chaque option redessine, si bien que les neuf cases
 * restent calées au pixel près d'une option à l'autre.
 */
const COL_FRAME = (
  <>
    {/* épaules — larges et à peine tombantes : un torse, pas une arche */}
    <path d="M25 14C20.6 13.4 14.4 14.4 8.2 17.2" />
    <path d="M39 14c4.4-.6 10.6.4 16.8 3.2" />
    {/* manches — le bord extérieur tombe droit jusqu'au bas du champ */}
    <path d="M8.2 17.2C6 18.4 4.8 20.8 4.6 23.8L4.2 59" />
    <path d="M55.8 17.2c2.2 1.2 3.4 3.6 3.6 6.6l.4 35.2" />
    {/* coutures de manche — plus légères, elles ne doivent pas concurrencer
        le col */}
    <path
      d="M12.8 15.4c1.8 4.2 2.6 8.8 2.4 13.8L14.8 59"
      strokeWidth={1.1}
      strokeOpacity={0.62}
    />
    <path
      d="M51.2 15.4c-1.8 4.2-2.6 8.8-2.4 13.8L49.2 59"
      strokeWidth={1.1}
      strokeOpacity={0.62}
    />
  </>
);

/** Boubou entier vu de face, col mandarin fermé (viewBox 64 × 84). */
const BOUBOU_FRAME = (
  <>
    <path d="M26 13 26.5 7q5.5-2.5 11 0L38 13" />
    <path d="M26 13q6 4.5 12 0" />
    <path d="M26 13C18 14 12 17 8 24" />
    <path d="M38 13c8 1 14 4 18 11" />
    <path d="M8 24 5 76" />
    <path d="M56 24 59 76" />
    <path d="M5 76q27 4 54 0" />
  </>
);

// ---------------------------------------------------------------------------
// Silhouette du grand boubou (planches « Coupe », viewBox 96 × 92)
//
// Un grand boubou n'est PAS une robe droite : c'est un rectangle de tissu plié,
// donc à plat il se lit comme un poncho — l'épaule file quasi à l'horizontale
// jusqu'à une pointe très au large, l'ouverture de manche redescend en diagonale
// vers l'aisselle, puis les côtés se rouvrent en trapèze jusqu'à l'ourlet. Le
// point le plus large est en haut (le bout de manche), pas en bas.
//
// Tout est paramétré ici : une coupe = six nombres, et corriger l'allure du
// vêtement se fait en un seul endroit pour les cinq planches.
// ---------------------------------------------------------------------------

type Cut = {
  /** x du bout de manche — plus il est petit, plus le boubou est ample. */
  tipX: number;
  /** y de l'épaule au bout de manche (le haut de la pointe). */
  shoulderY: number;
  /** y du bas de la pointe de manche. */
  tipY: number;
  /** Aisselle : là où l'ouverture de manche rejoint le corps. */
  armX: number;
  armY: number;
  /** Bas du côté — plus petit que `armX`, le boubou s'évase vers le bas. */
  hemX: number;
  hemY: number;
};

/** Contour fermé du vêtement, de l'encolure gauche à l'encolure droite. */
function cutOutline(c: Cut): string {
  const { tipX, shoulderY, tipY, armX, armY, hemX, hemY } = c;
  return [
    `M42 13`,
    `L${tipX + 5} ${shoulderY}`,
    `Q${tipX} ${shoulderY + 1.5} ${tipX + 1} ${tipY}`,
    `L${armX} ${armY}`,
    `L${hemX} ${hemY}`,
    `Q48 ${hemY + 4} ${96 - hemX} ${hemY}`,
    `L${96 - armX} ${armY}`,
    `L${95 - tipX} ${tipY}`,
    `Q${96 - tipX} ${shoulderY + 1.5} ${91 - tipX} ${shoulderY}`,
    `L54 13`,
  ].join("");
}

/** Col mandarin + fente centrale — commun à toutes les coupes. */
const CUT_NECK = (
  <>
    <path d="M42 13 42.5 6.5q5.5-2.5 11 0L54 13" />
    <path d="M42 13q6 4.5 12 0" />
    <path d="M48 8.5V29" />
  </>
);

/** Les deux plis qui tombent de l'aisselle — ce qui donne le drapé. */
function drape(c: Cut): ReactNode {
  const x = c.armX + 8;
  const y = c.armY + 2;
  const dy = c.hemY - 2;
  return (
    <path
      d={`M${x} ${y}C${x - 1} ${(y + dy) / 2} ${x - 2} ${dy - 8} ${x - 3} ${dy}M${96 - x} ${y}c1 ${(dy - y) / 2} 2 ${dy - y - 8} 3 ${dy - y}`}
      strokeWidth={1.1}
      strokeOpacity={0.7}
    />
  );
}

// Les cinq coupes du catalogue. L'ampleur se lit à `tipX` (le bout de manche)
// et à l'écart `armX` → `hemX` (l'évasement du bas).
const CUT_CLASSIQUE: Cut = {
  tipX: 6,
  shoulderY: 20,
  tipY: 27,
  armX: 27,
  armY: 48,
  hemX: 13,
  hemY: 80,
};
const CUT_ROYAL: Cut = { tipX: 1, shoulderY: 18, tipY: 30, armX: 23, armY: 54, hemX: 5, hemY: 84 };
const CUT_MODERNE: Cut = {
  tipX: 13,
  shoulderY: 19,
  tipY: 25,
  armX: 32,
  armY: 44,
  hemX: 23,
  hemY: 78,
};
const CUT_TROIS_PIECES: Cut = { ...CUT_CLASSIQUE, hemY: 66 };
const CUT_COURT: Cut = { ...CUT_CLASSIQUE, armY: 44, hemX: 18, hemY: 54 };

/** Manche évasée classique — base des variantes amples (viewBox 48 × 64). */
const SLEEVE_FLARED = (
  <>
    <path d="M10 19Q24 3 38 19" />
    <path d="M10 19C8 33 6 45 5 54" />
    <path d="M38 19c2 14 4 26 5 35" />
    <path d="M5 54q19 6 38 0" />
  </>
);

/** Manche ajustée, poignet net — base des variantes étroites. */
const SLEEVE_FITTED = (
  <>
    <path d="M13 17Q24 4 35 17" />
    <path d="M13 17C13 31 15 42 16 50" />
    <path d="M35 17c0 14-2 25-3 33" />
    <path d="M16 50h16" />
  </>
);

// ---------------------------------------------------------------------------
// Planches
// ---------------------------------------------------------------------------

const ICONS = {
  // === Coupe — silhouettes entières =========================================
  "bb-coupe-classique": {
    viewBox: "0 0 96 92",
    body: (
      <>
        <path d={cutOutline(CUT_CLASSIQUE)} />
        {CUT_NECK}
        {drape(CUT_CLASSIQUE)}
      </>
    ),
  },
  "bb-coupe-royal": {
    viewBox: "0 0 96 92",
    body: (
      <>
        <path d={cutOutline(CUT_ROYAL)} />
        {CUT_NECK}
        {drape(CUT_ROYAL)}
      </>
    ),
  },
  "bb-coupe-moderne": {
    viewBox: "0 0 96 92",
    body: (
      <>
        <path d={cutOutline(CUT_MODERNE)} />
        {CUT_NECK}
        {drape(CUT_MODERNE)}
      </>
    ),
  },
  "bb-coupe-trois-pieces": {
    viewBox: "0 0 96 92",
    body: (
      <>
        <path d={cutOutline(CUT_TROIS_PIECES)} />
        {CUT_NECK}
        {drape(CUT_TROIS_PIECES)}
        {/* Les trois pièces se lisent en trois étages sous l'ourlet du boubou :
            le kaftan intérieur, puis le pantalon (tubay). */}
        <path d="M31 68 30 77h36l-1-9" />
        <path d="M35 78 33 88h12l3-8 3 8h12l-2-10" />
      </>
    ),
  },
  "bb-coupe-court": {
    viewBox: "0 0 96 92",
    body: (
      <>
        <path d={cutOutline(CUT_COURT)} />
        {CUT_NECK}
        {drape(CUT_COURT)}
        <path d="M33 58 31 88h13l4-18 4 18h13l-2-30" />
      </>
    ),
  },

  // === Col ==================================================================
  // Les neuf encolures de la planche du tailleur. Chacune se dessine sur
  // `COL_FRAME` : le vêtement ne bouge pas, seule l'encolure change.
  "bb-col-rond": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {COL_FRAME}
        <path d="M25 14c.4 6.4 3.2 10.2 7 10.2s6.6-3.8 7-10.2" />
        <Stitch>
          {/* la bande brodée qui cercle l'encolure, échelonnée */}
          <path d="M22.4 13.8c.5 8.4 4.1 13 9.6 13s9.1-4.6 9.6-13" />
          <path d="M27.6 14c.2 3.4 1.9 5.2 4.4 5.2s4.2-1.8 4.4-5.2" />
          <path d="M25.6 19 23 19.4M27.4 22.6 25.4 24.6M32 24.2v2.6M36.6 22.6l2 2M38.4 19l2.6.4" />
          {/* et le galon qui descend jusqu'au bas du champ */}
          {braid(32, 27, 59)}
        </Stitch>
      </>
    ),
  },
  "bb-col-mao": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {COL_FRAME}
        {/* pied de col mandarin, ouvert au centre — aucune broderie */}
        <path d="M25 14 25.4 7.6C27.8 6.4 29.9 5.9 31.6 5.9L31.7 14" />
        <path d="M39 14 38.6 7.6C36.2 6.4 34.1 5.9 32.4 5.9L32.3 14" />
        <path d="M25 14c4.6 2.8 9.4 2.8 14 0" />
        <path d="M32 14.4V59" />
      </>
    ),
  },
  "bb-col-encolure-brodee": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {COL_FRAME}
        <path d="M25 14c.5 7.4 3.6 11.8 7 11.8s6.5-4.4 7-11.8" />
        <Stitch>
          {/* large bande d'encolure, à trois rangs */}
          <path d="M21.2 13.6c.6 10.8 4.9 16.8 10.8 16.8s10.2-6 10.8-16.8" />
          <path d="M27.2 14c.2 3.6 1.9 5.6 4.8 5.6s4.6-2 4.8-5.6" />
          <path d="M25.4 19.6 22 20.4M27.4 24l-2.8 2.6M32 25.8v4.6M36.6 24l2.8 2.6M38.6 19.6l3.4.8" />
          {/* panneau brodé descendant, terminé en pointe */}
          <path d={plastron(27.4, 36.6, 30.2, 50, 5)} />
          {star(32, 37.4, 4.4)}
          {rungs(27.4, 36.6, [44, 47.4])}
          {diamond(32, 52.4, 1.8)}
          {/* les deux pampilles qui pendent aux extrémités de la bande */}
          {tassel(24, 27.6)}
          {tassel(40, 27.6)}
        </Stitch>
      </>
    ),
  },
  "bb-col-fente": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {COL_FRAME}
        <path d="M25 14c.4 5.6 3.2 9 7 9s6.6-3.4 7-9" />
        <path d="M32 23V41.5" />
        <Stitch>
          {/* un galon en T, sobre : l'encolure puis la fente */}
          <path d="M22.8 13.8c.5 7.4 4 11.4 9.2 11.4s8.7-4 9.2-11.4" />
          <path d="M29.4 24.8V42.4c1.8 2.2 3.4 2.2 5.2 0V24.8" />
          {rungs(29.4, 34.6, [28.5, 32.5, 36.5, 40.5])}
        </Stitch>
      </>
    ),
  },
  "bb-col-croise-plastron": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {COL_FRAME}
        {/* le pan droit passe par-dessus : son bord file jusqu'à l'ourlet,
            celui du pan de dessous s'arrête au croisement */}
        <path d="M25 14c4.4 2.2 9.6 2.2 14 0" />
        <path d="M39 14 17 59" />
        <path d="M25 14 32 28.3" />
        <Stitch>
          {/* le plastron : un large galon brodé le long du croisement */}
          <path d="M45.3 17.1 24.8 59" />
          <path d="M36.4 19.4l6.3 3.1M32.8 26.6l6.3 3.1M25.8 41l6.3 3.1M22.3 48.2l6.3 3.1" />
          {star(32.5, 35.3, 3.8)}
          {diamond(37.8, 24.5, 1.6)}
          {diamond(27.2, 46.1, 1.6)}
        </Stitch>
      </>
    ),
  },
  "bb-col-v": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {COL_FRAME}
        <path d="M25 14 32 37 39 14" />
        <Stitch>
          {/* galon sur les deux branches du V, échelonné et fleuronné */}
          <path d="M21.2 15.2 32 41 42.8 15.2" />
          <path d="M26 17.4 22.8 19.1M27.5 22 25 24.2M28.9 26.7 27.1 29.4M30.3 31.3 29.3 34.6" />
          <path d="M38 17.4l3.2 1.7M36.5 22l2.5 2.2M35.1 26.7l1.8 2.7M33.7 31.3l1 3.3" />
          {[
            [25.3, 20.7],
            [27.1, 25.6],
            [28.9, 30.5],
            [38.7, 20.7],
            [36.9, 25.6],
            [35.1, 30.5],
          ].map(([x, y]) => diamond(x, y, 1.2, `v${x}-${y}`))}
          {diamond(32, 38.8, 1.4)}
        </Stitch>
      </>
    ),
  },
  "bb-col-mao-brode": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {COL_FRAME}
        {/* même pied de col que le Mao, mais brodé — et court sur le devant */}
        <path d="M25 14 25.4 7.6C27.8 6.4 29.9 5.9 31.6 5.9L31.7 14" />
        <path d="M39 14 38.6 7.6C36.2 6.4 34.1 5.9 32.4 5.9L32.3 14" />
        <path d="M25 14c4.6 2.8 9.4 2.8 14 0" />
        <Stitch>
          <path d="M25.9 9.2c1.8-.9 3.7-1.4 5.4-1.5M38.1 9.2c-1.8-.9-3.7-1.4-5.4-1.5" />
          <path d="M25.7 11.9h5.6M38.3 11.9h-5.6" />
          {[27.2, 29.6, 34.4, 36.8].map((x) => diamond(x, 10.6, 1.1, `mb${x}`))}
          {braid(32, 15.6, 33, 4.2, 5)}
        </Stitch>
      </>
    ),
  },
  "bb-col-chemise": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {COL_FRAME}
        {/* pied de col — l'encolure passe dessous, on ne la dessine pas : deux
            traits qui se croisent au milieu du col font une tache noire. */}
        <path d="M25 14 26.2 7.2C29.8 5.9 34.2 5.9 37.8 7.2L39 14" />
        {/* les deux pointes retombent, cassure au centre */}
        <path d="M26.2 7.2 27.8 18.8 32 12.4" />
        <path d="M37.8 7.2 36.2 18.8 32 12.4" />
        <Stitch>
          {/* patte de propreté : deux piqûres, aucun bouton apparent */}
          <path d="M29.6 18V59M34.4 18V59" />
        </Stitch>
      </>
    ),
  },
  "bb-col-croise": {
    viewBox: "0 0 64 60",
    body: (
      <>
        {COL_FRAME}
        <path d="M25 14c4.4 2.2 9.6 2.2 14 0" />
        <path d="M39 14 17 59" />
        <path d="M25 14 32 28.3" />
        <Stitch>
          <path d="M42.6 15.8 21.5 59" />
        </Stitch>
      </>
    ),
  },

  // === Broderie — le plastron, sur le boubou entier =========================
  "bb-brod-etoile": {
    viewBox: "0 0 64 84",
    body: (
      <>
        {BOUBOU_FRAME}
        <Stitch>
          <path d={plastron(24, 40, 18, 58)} />
          {rungs(24, 40, [22, 25])}
          {star(32, 36, 7)}
          {chevrons(25, 39, [46, 50])}
          {rungs(24, 40, [55])}
        </Stitch>
      </>
    ),
  },
  "bb-brod-maillee": {
    viewBox: "0 0 64 84",
    body: (
      <>
        {BOUBOU_FRAME}
        <Stitch>
          <path d={plastron(23, 41, 18, 56, 7)} />
          {lattice(26, 23, 38, 51, 4)}
          <path d="M23 20H41M23 54H41" />
        </Stitch>
      </>
    ),
  },
  "bb-brod-geometrique": {
    viewBox: "0 0 64 84",
    body: (
      <>
        {BOUBOU_FRAME}
        <Stitch>
          <path d="M21 18H43V52L32 62 21 52Z" />
          {chevrons(23, 41, [22, 27, 32], 5)}
          <path d="M25 39h14v10H25z" />
          <path d="M25 44h14M32 39v10" />
          {[26, 30, 34, 38].map((x) => diamond(x, 55, 1.5, `g${x}`))}
        </Stitch>
      </>
    ),
  },
  "bb-brod-croix": {
    viewBox: "0 0 64 84",
    body: (
      <>
        {BOUBOU_FRAME}
        <Stitch>
          <path d="M28 18h8v42h-8z" />
          <path d="M22 28h20v8H22z" />
          {star(32, 32, 3.6)}
          {[22, 46, 54].map((y) => (
            <path key={`k${y}`} d={`M29 ${y}h6`} />
          ))}
          <path d="M23 30h-2M43 30h2" />
        </Stitch>
      </>
    ),
  },
  "bb-brod-plastron-reduit": {
    viewBox: "0 0 64 84",
    body: (
      <>
        {BOUBOU_FRAME}
        <Stitch>
          <path d={plastron(27, 37, 18, 40, 5)} />
          {rungs(27, 37, [22, 26, 30, 34])}
          {diamond(32, 43, 2)}
        </Stitch>
      </>
    ),
  },
  "bb-brod-segou": {
    viewBox: "0 0 64 84",
    body: (
      <>
        {BOUBOU_FRAME}
        <Stitch>
          <path d="M20 17H44V60H20Z" />
          <path d="M20 24H44M20 46H44M20 53H44" />
          {chevrons(21, 43, [18, 21], 3)}
          {lattice(22.5, 28, 26.5, 42, 4.5, 1.4)}
          {lattice(37.5, 28, 41.5, 42, 4.5, 1.4)}
          {star(32, 35, 5.5)}
          {rungs(22, 42, [49])}
          {[23, 29, 35, 41].map((x) => diamond(x, 56.5, 1.8, `s${x}`))}
          <path d="M28 60v4h8v-4" />
        </Stitch>
      </>
    ),
  },
  "bb-brod-diamant": {
    viewBox: "0 0 64 84",
    body: (
      <>
        {BOUBOU_FRAME}
        <path d="M32 18v14" />
        <Stitch>
          {diamond(32, 40, 5)}
          {diamond(32, 40, 2.2)}
          {diamond(26, 40, 1.6)}
          {diamond(38, 40, 1.6)}
        </Stitch>
      </>
    ),
  },
  "bb-brod-fente-plastron": {
    viewBox: "0 0 64 84",
    body: (
      <>
        {BOUBOU_FRAME}
        <path d="M32 18v20" />
        <Stitch>
          <path d="M29 19V37M35 19V37" />
          {rungs(29, 35, [23, 28, 33])}
          <path d="M39 40h11v13l-5.5 4L39 53Z" />
          {star(44.5, 46, 3.5)}
          <path d="M30.5 39 32 41.5l1.5-2.5" />
        </Stitch>
      </>
    ),
  },
  "bb-brod-doree": {
    viewBox: "0 0 64 84",
    body: (
      <>
        {BOUBOU_FRAME}
        <Stitch>
          <path d="M28 20 32 16l4 4v40l-4 4-4-4Z" />
          <path d="M29.5 22 32 19.5l2.5 2.5v36L32 60.5 29.5 58Z" />
          {star(32, 34, 4)}
          {rungs(29.5, 34.5, [25, 44, 48, 52])}
          {diamond(32, 56, 2)}
          {diamond(24.5, 34, 1.8)}
          {diamond(39.5, 34, 1.8)}
        </Stitch>
      </>
    ),
  },
  "bb-brod-sans": {
    viewBox: "0 0 64 84",
    body: (
      <>
        {BOUBOU_FRAME}
        <Stitch>
          <path d="M32 18v14" />
        </Stitch>
      </>
    ),
  },

  // === Poches ===============================================================
  "bb-poche-poitrine": {
    viewBox: "0 0 64 84",
    body: (
      <>
        {BOUBOU_FRAME}
        <path d="M37 30h13v16H37z" />
        <Stitch>
          <path d="M37 34h13" />
          <path d="M32 18v12" />
        </Stitch>
      </>
    ),
  },
  "bb-poche-poitrine-brodee": {
    viewBox: "0 0 64 84",
    body: (
      <>
        {BOUBOU_FRAME}
        <path d="M37 30h13v14l-6.5 4.5L37 44Z" />
        <Stitch>
          {star(43.5, 37, 4)}
          <path d="M37 33h13" />
          <path d="M32 18v12" />
        </Stitch>
      </>
    ),
  },
  "bb-poche-laterales": {
    viewBox: "0 0 64 84",
    body: (
      <>
        {BOUBOU_FRAME}
        <path d="M8 50 15 56M56 50l-7 6" />
        <Stitch>
          <path d="M9.5 52.5 14 56M54.5 52.5 50 56" />
          <path d="M32 18v12" />
        </Stitch>
      </>
    ),
  },
  "bb-poche-poitrine-laterales": {
    viewBox: "0 0 64 84",
    body: (
      <>
        {BOUBOU_FRAME}
        <path d="M37 30h13v16H37z" />
        <path d="M8 54 15 60M56 54l-7 6" />
        <Stitch>
          <path d="M37 34h13" />
          <path d="M32 18v12" />
        </Stitch>
      </>
    ),
  },
  "bb-poche-sans": {
    viewBox: "0 0 64 84",
    body: (
      <>
        {BOUBOU_FRAME}
        <Stitch>
          <path d="M32 18v12" />
        </Stitch>
      </>
    ),
  },

  // === Manches ==============================================================
  "bb-manche-evasee": {
    viewBox: "0 0 48 64",
    body: SLEEVE_FLARED,
  },
  "bb-manche-tres-large": {
    viewBox: "0 0 48 64",
    body: (
      <>
        <path d="M12 16Q24 6 36 16" />
        <path d="M12 16 3 52M36 16l9 36" />
        <path d="M3 52q21 7 42 0" />
      </>
    ),
  },
  "bb-manche-cape": {
    viewBox: "0 0 48 64",
    body: (
      <>
        <path d="M14 14Q24 4 34 14" />
        <path d="M14 14C10 24 5 34 2 44" />
        <path d="M34 14c4 10 9 20 12 30" />
        <path d="M2 44q22 14 44 0" />
        <Stitch>
          <path d="M6 40q18 12 36 0" />
        </Stitch>
      </>
    ),
  },
  "bb-manche-evasee-brodee": {
    viewBox: "0 0 48 64",
    body: (
      <>
        {SLEEVE_FLARED}
        <Stitch>
          <path d="M6 45q18 6 36 0" />
          {chevrons(8, 40, [37], 3)}
          {[12, 20, 28, 36].map((x) => diamond(x, 49, 1.6, `m${x}`))}
        </Stitch>
      </>
    ),
  },
  "bb-manche-evasee-motif": {
    viewBox: "0 0 48 64",
    body: (
      <>
        {SLEEVE_FLARED}
        <Stitch>
          {star(24, 30, 8)}
          <path d="M9 22q15-5 30 0" />
          <path d="M6 44q18 6 36 0" />
          {rungs(8, 40, [48])}
        </Stitch>
      </>
    ),
  },
  "bb-manche-ajustee": {
    viewBox: "0 0 48 64",
    body: (
      <>
        {SLEEVE_FITTED}
        <path d="M15.5 44h17" />
        <circle cx="24" cy="47" r="1.2" />
      </>
    ),
  },
  "bb-manche-ajustee-brodee": {
    viewBox: "0 0 48 64",
    body: (
      <>
        {SLEEVE_FITTED}
        <Stitch>
          <path d="M17 30h14v18H17z" />
          {star(24, 39, 5)}
          <path d="M15.5 26h17" />
        </Stitch>
      </>
    ),
  },
  "bb-manche-ajustee-bord": {
    viewBox: "0 0 48 64",
    body: (
      <>
        {SLEEVE_FITTED}
        <path d="M15.5 42h17" />
        <Stitch>
          {rungs(16.5, 31.5, [45, 48])}
          {[19, 24, 29].map((x) => diamond(x, 46.5, 1.4, `b${x}`))}
        </Stitch>
      </>
    ),
  },
  "bb-manche-fente-boutons": {
    viewBox: "0 0 48 64",
    body: (
      <>
        {SLEEVE_FITTED}
        <path d="M15.5 42h17" />
        <path d="M28 42v-10" />
        <circle cx="20" cy="46" r="1.2" />
        <circle cx="26" cy="46" r="1.2" />
      </>
    ),
  },
  "bb-manche-rabat": {
    viewBox: "0 0 48 64",
    body: (
      <>
        {SLEEVE_FITTED}
        <path d="M18 22h12v9l-6 3-6-3Z" />
        <circle cx="24" cy="27" r="1.2" />
        <path d="M15.5 44h17" />
      </>
    ),
  },
} satisfies Record<string, IconDef>;

export type BoubouDetailIconName = keyof typeof ICONS;

export function BoubouDetailIcon({
  name,
  className,
}: {
  name: BoubouDetailIconName;
  className?: string;
}) {
  const icon = ICONS[name];
  return (
    <svg
      viewBox={icon.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icon.body}
    </svg>
  );
}
