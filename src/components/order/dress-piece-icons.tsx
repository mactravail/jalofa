// Planches de la robe de CÉRÉMONIE (JALOFA EUROPE, slug `europe-robe`) — la
// robe se compose pièce par pièce, comme chez un couturier : le CORSAGE (17
// hauts, froncés sous la poitrine ou à pinces, dentelle « Grace »…), les
// MANCHES (14, de sans manches à la longue bouffante) et la JUPE (8, du cercle
// au crayon). Chaque vignette ne montre que sa pièce.
//
// Mêmes conventions que `gown-detail-icons.tsx` : `currentColor`, trait fin,
// moitié gauche dessinée une fois puis renvoyée en miroir autour de x = 32.

import type { ReactNode } from "react";

type IconDef = { viewBox: string; body: ReactNode };

function Mirror({ children }: { children: ReactNode }) {
  return <g transform="matrix(-1 0 0 1 64 0)">{children}</g>;
}

function Both({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Mirror>{children}</Mirror>
    </>
  );
}

function Seam({ children }: { children: ReactNode }) {
  return (
    <g strokeWidth={0.8} strokeOpacity={0.6}>
      {children}
    </g>
  );
}

/** Dentelle : un semis de petites boucles dans une zone. */
function Lace({ d, id, outline = true }: { d: string; id: string; outline?: boolean }) {
  return (
    <>
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill="currentColor" fillOpacity={0.06} stroke="none" />
      <g clipPath={`url(#${id})`} strokeWidth={0.6} strokeOpacity={0.75}>
        {Array.from({ length: 9 }).flatMap((_, r) =>
          Array.from({ length: 12 }).map((__, c) => (
            <circle key={`${r}-${c}`} cx={c * 5.6 + (r % 2) * 2.8} cy={r * 4.4} r={1.1} />
          )),
        )}
      </g>
      {outline && <path d={d} />}
    </>
  );
}

// =============================================================================
// Le CORSAGE — buste vu de face, des épaules à la taille (viewBox 64 × 64).
// =============================================================================

const BODICE_BOX = "0 0 64 64";

/** Taille du corsage. */
const WAIST = 58;

type Finish = "fronce" | "pinces" | "princesse";

/**
 * Le côté gauche du corsage : bretelle (de `strapIn` à `strapOut`), emmanchure,
 * couture de côté puis taille, jusqu'au milieu devant.
 */
function side(strapIn: number, strapOut: number): string {
  return (
    `M${strapIn} 6 L${strapOut} 8 ` +
    `C${strapOut - 1} 18 ${strapOut - 3} 24 11 30 ` +
    `C12 40 14 50 15 ${WAIST} L32 ${WAIST}`
  );
}

/** Bande froncée sous la poitrine, ou pinces, ou coutures princesse. */
function Finishing({ kind }: { kind: Finish }) {
  if (kind === "fronce")
    return (
      <>
        <Both>
          <path d={`M13 44 L32 44`} />
          <Seam>
            <path d="M18 44 Q17 40 19 36" />
            <path d="M22 44 Q21 39 23 35" />
            <path d="M26 44 Q25 40 27 37" />
          </Seam>
        </Both>
      </>
    );
  if (kind === "princesse")
    return (
      <Seam>
        <Both>
          <path d={`M22 ${WAIST} C22 46 20 38 16 30`} />
        </Both>
      </Seam>
    );
  return (
    <Seam>
      <Both>
        <path d={`M23 ${WAIST} L24 40`} />
      </Both>
    </Seam>
  );
}

type BodiceSpec = {
  /** Encolure, du haut de la bretelle gauche jusqu'au milieu devant. */
  neck: string;
  strapIn?: number;
  strapOut?: number;
  finish?: Finish;
  /** Couture du milieu devant (col en V). */
  center?: boolean;
  /** Détails propres à la pièce, dessinés par-dessus (déjà symétriques). */
  extra?: ReactNode;
};

function bodice({
  neck,
  strapIn = 19,
  strapOut = 12,
  finish = "pinces",
  center,
  extra,
}: BodiceSpec): ReactNode {
  return (
    <g>
      <Both>
        <path d={side(strapIn, strapOut)} />
        <path d={neck} />
      </Both>
      {center && (
        <Seam>
          <path d={`M32 34 L32 ${WAIST}`} />
        </Seam>
      )}
      <Finishing kind={finish} />
      {extra}
    </g>
  );
}

const NECK = {
  tiffany: "M19 6 C20 12 25 15 32 15",
  coeur: "M18 6 C18 14 19 20 25 21 C29 21 31 24 32 27",
  rondProfond: "M19 6 C19 22 24 31 32 31",
  rond: "M19 6 C19 15 24 21 32 21",
  cupidon: "M16 6 C17 12 19 17 24 17 C28 17 30 19 32 22",
  v: "M20 6 L32 34",
  carre: "M19 6 L19 22 Q19 25 22 25 L32 25",
};

/** Dentelle « Grace » : empiècement du col montant jusqu'à la couture `seam`. */
function graceYoke(seam: string, id: string): ReactNode {
  // Moitié gauche du col jusqu'à l'épaule, puis la couture, refermée au milieu.
  // (Pas de contour : il tracerait un trait au milieu ; on ne dessine que la couture.)
  const left = `M32 9 C27 9 23 8 21 5 L12 8 C11 14 11 18 11 21 ${seam} Z`;
  return (
    <>
      <Lace d={left} id={`${id}-l`} outline={false} />
      <Mirror>
        <Lace d={left} id={`${id}-r`} outline={false} />
      </Mirror>
      <Both>
        <path d={`M11 21 ${seam}`} />
      </Both>
    </>
  );
}

/** Corsage « Grace » : col haut, empiècement de dentelle, coutures princesse. */
function grace(seam: string, id: string, band = false): ReactNode {
  return (
    <g>
      <Both>
        <path d={`M21 5 L12 8 C11 18 11 24 11 30 C12 40 14 50 15 ${WAIST} L32 ${WAIST}`} />
        <path d="M21 5 C23 8 27 9 32 9" />
      </Both>
      {graceYoke(seam, id)}
      {band ? (
        <Both>
          <path d="M11 30 L32 30" />
          <path d="M11.5 35 L32 35" />
        </Both>
      ) : (
        <Seam>
          <Both>
            <path d={`M22 ${WAIST} C22 46 21 36 19 26`} />
          </Both>
        </Seam>
      )}
    </g>
  );
}

const BODICES = {
  "dp-corsage-tiffany-fronce": bodice({ neck: NECK.tiffany, finish: "fronce" }),
  "dp-corsage-coeur-fronce": bodice({ neck: NECK.coeur, strapIn: 18, finish: "fronce" }),
  "dp-corsage-rond-profond-fronce": bodice({ neck: NECK.rondProfond, finish: "fronce" }),
  "dp-corsage-rond-fronce": bodice({ neck: NECK.rond, finish: "fronce" }),
  "dp-corsage-cupidon-fronce": bodice({ neck: NECK.cupidon, strapIn: 16, strapOut: 10, finish: "fronce" }),
  "dp-corsage-bustier-drape": bodice({
    neck: "M17 6 L21 22 C23 30 28 31 32 27",
    strapIn: 17,
    strapOut: 11,
    extra: (
      <g>
        <Both>
          <path d="M14 34 C20 44 28 44 32 38" />
        </Both>
        {/* Le drapé noué au milieu */}
        <Seam>
          <path d="M32 28 C28 32 26 36 26 41" />
          <path d="M32 28 C36 32 38 36 38 41" />
          <path d="M32 28 C30 33 30 37 30 42" />
          <path d="M32 28 C34 33 34 37 34 42" />
        </Seam>
        <rect x="29.5" y="30" width="5" height="5" rx="1.5" />
      </g>
    ),
  }),
  "dp-corsage-tiffany-pinces": bodice({ neck: NECK.tiffany }),
  "dp-corsage-v-profond": bodice({ neck: NECK.v, strapIn: 20, strapOut: 13, center: true }),
  "dp-corsage-rond-profond-pinces": bodice({ neck: NECK.rondProfond }),
  "dp-corsage-rond-pinces": bodice({ neck: NECK.rond }),
  "dp-corsage-cupidon-pinces": bodice({ neck: NECK.cupidon, strapIn: 16, strapOut: 10 }),
  "dp-corsage-carre-arrondi": bodice({ neck: NECK.carre }),
  "dp-corsage-bettina": (
    <g>
      <Both>
        <path d={`M14 18 L32 26`} />
        <path d={`M14 18 C12 22 11 26 11 30 C12 40 14 50 15 ${WAIST} L32 ${WAIST}`} />
        {/* Petit volant froncé posé sur l'épaule */}
        <path d="M14 18 C10 14 6 10 4 5 C8 3 12 3 16 4 C18 6 19 9 19 12 C18 15 16 17 14 18 Z" />
        <Seam>
          <path d="M14 18 L7 6" />
          <path d="M14 18 L11 4.5" />
          <path d="M14 18 L15 4.5" />
        </Seam>
      </Both>
      <Finishing kind="princesse" />
    </g>
  ),
  "dp-corsage-princesse-dentelle": (
    <g>
      <Both>
        <path d={side(18, 11)} />
        <path d="M18 6 L32 38" />
      </Both>
      {/* Bretelles de dentelle qui bordent le V */}
      <Lace d="M18 6 L32 38 L29 44 L13 9 L11 8 L18 6 Z" id="dp-pd-l" />
      <Mirror>
        <Lace d="M18 6 L32 38 L29 44 L13 9 L11 8 L18 6 Z" id="dp-pd-r" />
      </Mirror>
      <Seam>
        <path d={`M32 44 L32 ${WAIST}`} />
      </Seam>
      <Finishing kind="princesse" />
    </g>
  ),
  "dp-corsage-grace": grace("C18 23 26 27 32 33", "dp-gr"),
  "dp-corsage-grace-coeur": grace("C15 18 22 17 26 21 C29 24 31 27 32 30", "dp-gc"),
  "dp-corsage-bandeau-grace": grace("C18 21 26 21 32 21", "dp-bg", true),
} satisfies Record<string, ReactNode>;

// =============================================================================
// Les MANCHES — demi-buste vu de face, côté droit, jusqu'à la taille ; la manche
// part de l'épaule (viewBox 64 × 80, vignette en portrait).
// =============================================================================

const SLEEVE_BOX = "0 0 64 80";

/** Demi-buste : milieu devant, encolure, épaule, emmanchure, côté, taille. */
function HalfBody({ armhole = true }: { armhole?: boolean }) {
  return (
    <g>
      <path d="M14 12 C20 12 25 9 27 4 L40 10" />
      {armhole && <path d="M40 10 C42 18 41 25 38 30" />}
      <path d="M38 30 C38 42 37 52 37 62 L14 62 L14 12" />
      {/* Départ de la jupe */}
      <Seam>
        <path d="M14 62 L14 76" />
        <path d="M37 62 C40 67 42 72 44 76" />
        <path d="M26 40 L25 62" />
      </Seam>
    </g>
  );
}

/** Une manche : son contour, et quelques plis pour les manches fluides. */
function sleeve(d: string | null, folds: string[] = [], extra?: ReactNode): ReactNode {
  return (
    <g>
      <HalfBody />
      {d && <path d={d} fill="currentColor" fillOpacity={0.06} />}
      {folds.length > 0 && (
        <Seam>
          {folds.map((f) => (
            <path key={f} d={f} />
          ))}
        </Seam>
      )}
      {extra}
    </g>
  );
}

const SLEEVES = {
  "dp-manche-sans": sleeve(null),
  "dp-manche-cap": sleeve("M40 10 C46 11 49 16 48 22 C45 23 42 22 40 20 C41 17 41 13 40 10 Z"),
  "dp-manche-courte-ajustee": sleeve("M40 10 C46 12 50 22 53 31 L44 34 C42 31 40 30 38 30 C41 24 42 17 40 10 Z"),
  "dp-manche-courte-volant": sleeve(
    "M40 10 C46 12 52 20 56 30 Q53 34 50 31 Q47 35 44 32 C42 31 40 30 38 30 C41 24 42 17 40 10 Z",
    ["M44 14 C48 20 51 26 53 32"],
  ),
  "dp-manche-courte-papillon": sleeve(
    "M40 10 C50 12 58 24 62 36 Q58 40 55 36 Q51 41 47 36 Q44 39 41 34 C40 32 39 31 38 30 C41 24 42 17 40 10 Z",
    ["M44 14 C50 22 54 30 55 37", "M42 18 C45 26 47 32 47 37"],
  ),
  "dp-manche-coude-ajustee": sleeve("M40 10 C46 14 50 30 52 46 L44 48 C43 40 41 34 38 30 C41 24 42 17 40 10 Z"),
  "dp-manche-coude-cloche": sleeve(
    "M40 10 C46 14 49 26 50 32 C54 38 58 44 60 50 Q52 55 43 51 C43 42 41 35 38 30 C41 24 42 17 40 10 Z",
    ["M50 34 C52 42 52 48 51 53"],
  ),
  "dp-manche-coude-volant": sleeve(
    "M40 10 C50 16 56 34 59 48 Q56 52 53 49 Q50 53 47 49 Q44 52 42 48 C42 40 40 34 38 30 C41 24 42 17 40 10 Z",
    ["M44 14 C49 24 52 36 53 49", "M42 20 C45 30 47 40 47 50"],
  ),
  "dp-manche-coude-papillon": sleeve(
    "M40 10 C54 14 62 34 63 52 Q60 56 57 52 Q53 57 50 52 Q46 56 43 51 C42 42 40 34 38 30 C41 24 42 17 40 10 Z",
    ["M44 13 C52 22 57 36 57 53", "M42 18 C47 28 50 40 50 53"],
  ),
  "dp-manche-trois-quarts": sleeve("M40 10 C46 16 50 34 52 56 L45 58 C44 46 42 36 38 30 C41 24 42 17 40 10 Z"),
  "dp-manche-longue": sleeve(
    "M40 10 C46 16 50 32 51 44 C53 54 56 64 58 72 L51 74 C49 64 46 54 45 46 C43 38 41 33 38 30 C41 24 42 17 40 10 Z",
  ),
  "dp-manche-longue-cloche": sleeve(
    "M40 10 C46 16 49 32 50 44 C54 56 58 66 62 76 Q54 80 46 76 C46 66 46 56 45 46 C43 38 41 33 38 30 C41 24 42 17 40 10 Z",
    ["M50 48 C52 58 53 68 53 78"],
  ),
  "dp-manche-longue-volant": sleeve(
    "M40 10 C52 20 59 48 62 74 Q59 78 56 75 Q53 79 50 75 Q47 78 44 74 C44 56 42 40 38 30 C41 24 42 17 40 10 Z",
    ["M44 14 C51 30 55 52 56 76", "M42 22 C46 38 49 56 50 76"],
  ),
  "dp-manche-longue-bishop": sleeve(
    "M40 10 C52 18 60 48 58 66 C56 70 52 70 50 68 C48 56 44 40 38 30 C41 24 42 17 40 10 Z",
    ["M44 16 C50 30 54 48 54 68", "M57 62 Q55 66 56 69", "M53 62 Q52 66 53 69"],
    <path d="M50 68 C53 70 56 70 58 67 L59 73 C56 75 53 75 51 74 Z" />,
  ),
} satisfies Record<string, ReactNode>;

// =============================================================================
// La JUPE — de la taille à l'ourlet, vue de face (viewBox 64 × 64).
// =============================================================================

const SKIRT_BOX = "0 0 64 64";

/** Ourlet ondulé : `n` vagues de `x1` à `x2` autour de `y`. */
function wavyHem(x1: number, x2: number, y: number, n: number, depth: number): string {
  const w = (x2 - x1) / n;
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = x2 - i * w;
    d += ` Q${a - w / 2} ${y + (i % 2 ? -depth : depth)} ${a - w} ${y}`;
  }
  return d;
}

function skirt(outline: string, folds: string[] = [], extra?: ReactNode): ReactNode {
  return (
    <g>
      <path d={outline} fill="currentColor" fillOpacity={0.06} />
      <path d="M22 9 L42 9" />
      <Seam>
        {folds.map((f) => (
          <path key={f} d={f} />
        ))}
      </Seam>
      {extra}
    </g>
  );
}

const SKIRTS = {
  "dp-jupe-cercle": skirt(
    `M22 6 L42 6 C50 20 58 38 62 52${wavyHem(2, 62, 52, 8, 4)} C6 38 14 20 22 6 Z`,
    ["M27 9 C24 28 18 42 13 54", "M32 9 L32 56", "M37 9 C40 28 46 42 51 54", "M24 9 C18 26 12 40 6 52", "M40 9 C46 26 52 40 58 52"],
  ),
  "dp-jupe-trois-quarts-cercle": skirt(
    `M22 6 L42 6 C48 20 54 38 57 52${wavyHem(7, 57, 52, 6, 3.5)} C10 38 16 20 22 6 Z`,
    ["M27 9 C24 28 20 42 16 54", "M32 9 L32 56", "M37 9 C40 28 44 42 48 54"],
  ),
  "dp-jupe-demi-cercle": skirt(
    `M22 6 L42 6 C46 22 50 38 52 52${wavyHem(12, 52, 52, 4, 2.5)} C14 38 18 22 22 6 Z`,
    ["M28 9 C26 28 23 42 21 53", "M36 9 C38 28 41 42 43 53"],
  ),
  "dp-jupe-plongeant": skirt(
    "M22 6 L42 6 C48 20 54 32 58 44 Q32 34 6 44 C10 32 16 20 22 6 Z",
    ["M28 9 C26 22 22 32 18 38", "M36 9 C38 22 42 32 46 38"],
    // La jupe tombe plus bas derrière : on la voit sous l'ourlet de devant.
    <path d="M6 44 C4 50 6 56 12 58 Q32 62 52 58 C58 56 60 50 58 44" strokeOpacity={0.75} />,
  ),
  "dp-jupe-plissee": skirt(
    "M22 6 L42 6 C46 22 52 38 56 54 Q32 58 8 54 C12 38 18 22 22 6 Z",
    [
      "M24 9 Q23 14 25 18",
      "M27 9 Q26 14 28 19",
      "M30 9 Q29 14 31 19",
      "M33 9 Q32 14 34 19",
      "M36 9 Q35 14 37 19",
      "M39 9 Q38 14 40 18",
      "M24 22 C20 34 16 44 13 55",
      "M32 22 L32 57",
      "M40 22 C44 34 48 44 51 55",
    ],
  ),
  "dp-jupe-panneaux": skirt(
    "M22 6 L42 6 C44 14 44 24 44 30 C48 40 52 50 55 58 Q32 62 9 58 C12 50 16 40 20 30 C20 24 20 14 22 6 Z",
    ["M28 9 C27 28 24 44 21 59", "M36 9 C37 28 40 44 43 59", "M32 30 L32 61"],
  ),
  "dp-jupe-ligne-a": skirt(
    "M22 6 L42 6 C44 22 46 38 48 54 L16 54 C18 38 20 22 22 6 Z",
    ["M27 9 L27.5 17", "M37 9 L36.5 17"],
  ),
  "dp-jupe-crayon": skirt(
    "M22 6 L42 6 C45 16 45 26 44 36 C43 44 42 50 42 56 L22 56 C22 50 21 44 20 36 C19 26 19 16 22 6 Z",
    ["M27 9 L27.5 18", "M37 9 L36.5 18"],
  ),
} satisfies Record<string, ReactNode>;

// =============================================================================

const ICONS: Record<string, IconDef> = {
  ...Object.fromEntries(Object.entries(BODICES).map(([k, body]) => [k, { viewBox: BODICE_BOX, body }])),
  ...Object.fromEntries(Object.entries(SLEEVES).map(([k, body]) => [k, { viewBox: SLEEVE_BOX, body }])),
  ...Object.fromEntries(Object.entries(SKIRTS).map(([k, body]) => [k, { viewBox: SKIRT_BOX, body }])),
};

export type DressPieceIconName =
  | keyof typeof BODICES
  | keyof typeof SLEEVES
  | keyof typeof SKIRTS;

export function isDressPieceArt(name: string): name is DressPieceIconName {
  return name in ICONS;
}

/** Les manches descendent jusqu'au poignet : vignette en portrait. */
export function dressPieceArtIsTall(name: string): boolean {
  return name in SLEEVES;
}

export function DressPieceIcon({ name, className }: { name: DressPieceIconName; className?: string }) {
  const icon = ICONS[name];
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
