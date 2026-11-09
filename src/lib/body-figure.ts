// Le dessin d'une silhouette, calculé plutôt que tracé à la main : un même
// squelette, dont seules les largeurs changent. Les corps restent ainsi comparables
// d'une case à l'autre (même taille, même pose) — seule la carrure diffère.
//
// Coordonnées : viewBox 0 0 100 190, axe de symétrie en x = 50. Toutes les largeurs
// ci-dessous sont des demi-largeurs, mesurées depuis cet axe.

export type BodyFigureKind = "homme" | "femme";
export type BodyFigureShape = "mince" | "moyen" | "muscle" | "fort" | "tres_fort";

type Widths = {
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  thigh: number;
  knee: number;
  ankle: number;
  arm: number;
};

const w = (
  shoulder: number,
  chest: number,
  waist: number,
  hip: number,
  thigh: number,
  knee: number,
  ankle: number,
  arm: number,
): Widths => ({ shoulder, chest, waist, hip, thigh, knee, ankle, arm });

const WIDTHS: Record<BodyFigureKind, Record<BodyFigureShape, Widths>> = {
  homme: {
    mince: w(16, 13, 10, 11, 5.6, 4.2, 3, 2.9),
    moyen: w(20, 18, 15, 15.5, 7.6, 5.5, 3.6, 4),
    muscle: w(27, 25, 16, 16.5, 8.2, 6.2, 4, 6),
    fort: w(22, 24, 26, 24, 11.5, 7.5, 4.6, 5.5),
    tres_fort: w(24, 28, 31, 28, 13.5, 8.5, 5, 6.5),
  },
  femme: {
    mince: w(14, 13, 9.5, 14, 6.8, 4.5, 3, 2.8),
    moyen: w(16, 15.5, 12, 18, 8.8, 5.2, 3.4, 3.4),
    muscle: w(20, 18.5, 13, 18, 8.8, 6, 3.8, 4.8),
    fort: w(19, 21, 21, 25, 12, 7.5, 4.4, 5),
    tres_fort: w(21, 25, 26, 29, 14, 8.5, 4.8, 6),
  },
};

type Point = readonly [number, number];

const round = (n: number) => Math.round(n * 100) / 100;

/** Une courbe fermée et douce (Catmull-Rom) passant par chaque point. */
function smoothClosedPath(points: Point[]): string {
  const at = (i: number) => points[(i + points.length) % points.length];
  let d = `M${round(points[0][0])} ${round(points[0][1])}`;
  points.forEach((p1, i) => {
    const p0 = at(i - 1);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(p2[0])} ${round(p2[1])}`;
  });
  return `${d}Z`;
}

const CENTER = 50;
const right = ([x, y]: Point): Point => [CENTER + x, y];
const left = ([x, y]: Point): Point => [CENTER - x, y];

/** Le tronc et les jambes, d'un seul contour, du cou à l'entrejambe puis en miroir. */
function torsoPath(s: Widths): string {
  const neck = 4 + s.shoulder * 0.06;
  const inner = { thigh: 1.2, knee: 2.2, ankle: 3.2 };
  const side: Point[] = [
    // Le haut du cou se cache dans la tête : la courbe y fait un coude invisible.
    [neck, 22],
    [neck, 35],
    [s.shoulder * 0.72, 40],
    [s.shoulder, 47],
    [s.chest, 63],
    [s.waist, 84],
    [s.hip, 104],
    [inner.thigh + s.thigh * 2, 124],
    [inner.knee + s.knee * 2, 150],
    [inner.ankle + s.ankle * 2, 178],
    [inner.ankle + s.ankle * 2 + 1.5, 187],
    [inner.ankle, 187],
    [inner.ankle, 178],
    [inner.knee, 150],
    [inner.thigh, 124],
    [0, 113],
  ];
  return smoothClosedPath([...side.map(right), ...side.slice(0, -1).reverse().map(left)]);
}

/** Un bras : il s'écarte du corps juste assez pour ne jamais se fondre dans le ventre. */
function armPoints(s: Widths): Point[] {
  const clearance = 2.5;
  const belly = Math.max(s.chest, s.waist);
  const top = { x: s.shoulder, half: s.arm * 1.1 };
  const elbowHalf = s.arm * 0.9;
  const wristHalf = s.arm * 0.7;
  const wristX = Math.max(s.hip, belly) + wristHalf + clearance;
  const elbowX = Math.max((top.x + wristX) / 2, belly + elbowHalf + clearance);
  return [
    [top.x - 1, 41],
    [top.x + top.half, 49],
    [elbowX + elbowHalf, 80],
    [wristX + wristHalf, 108],
    [wristX, 118],
    [wristX - wristHalf, 108],
    [elbowX - elbowHalf, 80],
    [top.x - top.half, 54],
  ];
}

export type BodyFigurePaths = {
  head: { cx: number; cy: number; rx: number; ry: number };
  paths: string[];
};

export function bodyFigurePaths(
  kind: BodyFigureKind,
  shape: BodyFigureShape,
): BodyFigurePaths {
  const s = WIDTHS[kind][shape];
  const arm = armPoints(s);
  return {
    head: { cx: CENTER, cy: 18, rx: 10 + s.waist * 0.03, ry: 13 },
    paths: [
      torsoPath(s),
      smoothClosedPath(arm.map(right)),
      smoothClosedPath(arm.map(left)),
    ],
  };
}
