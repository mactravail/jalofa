"use client";

import { cn } from "@/lib/utils";

/**
 * Le mannequin de couture que l'on habille soi-même (configurateur des robes).
 *
 * Il commence nu ; chaque planche touchée par le client ajoute sa pièce :
 * le décolleté pose le corsage, la silhouette ou la longueur pose la jupe, puis
 * les manches, la ceinture, la traîne, le voile, la matière… Un seul dessin
 * SVG, en couches, dans l'esprit d'un croquis d'atelier (trait sombre, robe
 * gris très clair, pied en bois crème).
 *
 * Repère : viewBox 200 × 520. Encolure à y≈54, épaules (62,66)/(138,66), taille
 * à y=156 (x 76→124), hanches y≈214, sol y≈500.
 */

/** Les robes qui s'habillent sur le mannequin (slug du modèle). */
export const MANNEQUIN_DRESS_SLUGS = new Set([
  "europe-robe",
  "europe-robe-soiree",
  "europe-robe-mariage",
]);

export function dressesOnMannequin(slug: string | null | undefined): boolean {
  return Boolean(slug && MANNEQUIN_DRESS_SLUGS.has(slug));
}

const INK = "#2b2b38";
const FORM = "#ffffff";
const WOOD = "#ece5c4";
const CLOTH = "#ececef";
const FOLD = "#8a8a96";

const WAIST_Y = 156;
const EMPIRE_Y = 120;

// --- Le mannequin -----------------------------------------------------------

const TORSO =
  "M92 52 C80 54 66 56 62 66 C58 80 60 98 66 114 C73 130 76 144 76 156 " +
  "C76 172 64 190 64 214 C64 228 72 236 100 236 C128 236 136 228 136 214 " +
  "C136 190 124 172 124 156 C124 144 127 130 134 114 C140 98 142 80 138 66 " +
  "C134 56 120 54 108 52 Z";

function Form() {
  return (
    <g stroke={INK} strokeWidth={1.4} strokeLinejoin="round">
      {/* Pied tourné en bois */}
      <g fill={WOOD}>
        <path d="M96 236 L96 470 L104 470 L104 236 Z" />
        <ellipse cx="100" cy="252" rx="9" ry="7" />
        <path d="M95 262 C86 276 86 306 94 326 L106 326 C114 306 114 276 105 262 Z" />
        <rect x="90" y="326" width="20" height="8" rx="3" />
        <path d="M95 334 C88 352 86 404 94 436 L106 436 C114 404 112 352 105 334 Z" />
        <rect x="91" y="436" width="18" height="8" rx="3" />
        <path d="M94 444 C92 460 80 470 66 482 C58 489 52 494 56 499 C62 503 74 498 78 492 C84 482 94 474 100 470 C106 474 116 482 122 492 C126 498 138 503 144 499 C148 494 142 489 134 482 C120 470 108 460 106 444 Z" />
        <path d="M96 470 L96 488 C96 494 104 494 104 488 L104 470 Z" />
      </g>
      {/* Buste */}
      <path d={TORSO} fill={FORM} />
      {/* Cou et pommeau */}
      <rect x="92" y="40" width="16" height="13" fill={FORM} />
      <rect x="89" y="36" width="22" height="6" rx="2" fill={WOOD} />
      <path d="M95 36 L93 26 C96 22 104 22 107 26 L105 36 Z" fill={WOOD} />
      <ellipse cx="100" cy="22" rx="4" ry="3" fill={WOOD} />
    </g>
  );
}

// --- Le corsage (décolleté) -------------------------------------------------

type Edge = "shoulder" | "armpit";
type Neckline = { top: string; left: Edge; right: Edge; extra?: React.ReactNode };

/** Le haut du corsage, de son point gauche à son point droit. */
function neckline(slug: string | undefined): Neckline {
  switch (slug) {
    case "v":
      return { top: "M62 66 L86 54 L100 104 L114 54 L138 66", left: "shoulder", right: "shoulder" };
    case "bateau":
      return { top: "M62 66 L72 59 Q100 70 128 59 L138 66", left: "shoulder", right: "shoulder" };
    case "carre":
      return {
        top: "M62 66 L84 55 L84 84 L116 84 L116 55 L138 66",
        left: "shoulder",
        right: "shoulder",
      };
    case "montant":
      return {
        top: "M62 66 L90 53 L90 38 L110 38 L110 53 L138 66",
        left: "shoulder",
        right: "shoulder",
      };
    case "illusion":
      return {
        top: "M66 102 C74 92 90 92 100 106 C110 92 126 92 134 102",
        left: "armpit",
        right: "armpit",
        // Empiècement de tulle jusqu'au cou.
        extra: (
          <path
            d="M62 66 L90 53 L90 40 L110 40 L110 53 L138 66 C142 80 138 94 134 102 C126 92 110 92 100 106 C90 92 74 92 66 102 C62 94 58 80 62 66 Z"
            fill={FORM}
            fillOpacity={0.55}
            stroke={INK}
            strokeWidth={0.8}
            strokeDasharray="2 2"
          />
        ),
      };
    case "reine-anne":
      return {
        top: "M62 66 L86 54 C84 72 90 82 100 90 C110 82 116 72 114 54 L138 66",
        left: "shoulder",
        right: "shoulder",
      };
    case "coeur":
      return {
        top: "M66 100 C74 90 90 90 100 106 C110 90 126 90 134 100",
        left: "armpit",
        right: "armpit",
      };
    case "bustier":
      return { top: "M66 102 L134 102", left: "armpit", right: "armpit" };
    case "bretelles":
      return {
        top: "M66 100 C76 96 90 98 100 104 C110 98 124 96 134 100",
        left: "armpit",
        right: "armpit",
        extra: (
          <g stroke={INK} strokeWidth={1.6} fill="none">
            <path d="M78 98 L84 56" />
            <path d="M122 98 L116 56" />
          </g>
        ),
      };
    case "epaules":
      return {
        top: "M66 98 Q100 112 134 98",
        left: "armpit",
        right: "armpit",
        extra: (
          <path
            d="M44 82 Q100 104 156 82 L156 95 Q100 117 44 95 Z"
            fill={CLOTH}
            stroke={INK}
            strokeWidth={1.4}
          />
        ),
      };
    case "americain":
      return {
        top: "M66 104 L90 52 L110 52 L134 104",
        left: "armpit",
        right: "armpit",
        extra: <rect x="89" y="46" width="22" height="7" rx="2" fill={CLOTH} stroke={INK} strokeWidth={1.2} />,
      };
    case "asymetrique":
      return { top: "M62 66 L82 58 L134 106", left: "shoulder", right: "armpit" };

    // --- Corsages de la robe de cérémonie (groupe « corsage ») ---
    case "tiffany-fronce":
    case "tiffany-pinces":
      return { top: "M62 66 L82 55 C84 66 92 72 100 72 C108 72 116 66 118 55 L138 66", left: "shoulder", right: "shoulder" };
    case "coeur-fronce":
      return {
        top: "M62 66 L82 55 C82 76 86 86 94 88 C98 89 100 92 100 98 C100 92 102 89 106 88 C114 86 118 76 118 55 L138 66",
        left: "shoulder",
        right: "shoulder",
      };
    case "rond-profond-fronce":
    case "rond-profond-pinces":
      return { top: "M62 66 L84 54 C84 90 92 102 100 102 C108 102 116 90 116 54 L138 66", left: "shoulder", right: "shoulder" };
    case "rond-fronce":
    case "rond-pinces":
      return { top: "M62 66 L84 54 C84 74 92 82 100 82 C108 82 116 74 116 54 L138 66", left: "shoulder", right: "shoulder" };
    case "cupidon-fronce":
    case "cupidon-pinces":
      return {
        top: "M62 66 L78 56 C80 70 84 78 92 78 C96 78 98 80 100 86 C102 80 104 78 108 78 C116 78 120 70 122 56 L138 66",
        left: "shoulder",
        right: "shoulder",
      };
    case "bustier-drape":
      return {
        top: "M62 66 L76 56 L84 84 C88 96 96 98 100 92 C104 98 112 96 116 84 L124 56 L138 66",
        left: "shoulder",
        right: "shoulder",
        extra: <rect x="96" y="94" width="8" height="8" rx="2" fill={CLOTH} stroke={INK} strokeWidth={1.1} />,
      };
    case "v-profond":
      return { top: "M62 66 L84 54 L100 110 L116 54 L138 66", left: "shoulder", right: "shoulder" };
    case "carre-arrondi":
      return {
        top: "M62 66 L84 54 L84 84 Q84 90 90 90 L110 90 Q116 90 116 84 L116 54 L138 66",
        left: "shoulder",
        right: "shoulder",
      };
    case "bettina": {
      const flutter = (
        <path
          d="M70 82 C58 78 48 70 44 58 C52 54 62 54 70 58 C74 64 74 72 70 82 Z"
          fill={CLOTH}
          stroke={INK}
          strokeWidth={1.2}
        />
      );
      return {
        top: "M62 66 L100 92 L138 66",
        left: "shoulder",
        right: "shoulder",
        extra: (
          <g>
            {flutter}
            <g transform="matrix(-1 0 0 1 200 0)">{flutter}</g>
          </g>
        ),
      };
    }
    case "princesse-dentelle": {
      const lace = <path d="M84 54 L100 112 L95 120 L76 58 Z" fill="url(#mq-lace)" stroke={INK} strokeWidth={0.9} />;
      return {
        top: "M62 66 L84 54 L100 112 L116 54 L138 66",
        left: "shoulder",
        right: "shoulder",
        extra: (
          <g>
            {lace}
            <g transform="matrix(-1 0 0 1 200 0)">{lace}</g>
          </g>
        ),
      };
    }
    case "grace":
    case "grace-coeur":
    case "bandeau-grace": {
      const seam =
        slug === "grace-coeur"
          ? "C126 86 112 86 100 104 C88 86 74 86 63 92"
          : slug === "bandeau-grace"
            ? "L63 92"
            : "C120 96 108 100 100 108 C92 100 80 96 63 92";
      return {
        top: "M62 66 L86 53 Q100 60 114 53 L138 66",
        left: "shoulder",
        right: "shoulder",
        extra: (
          <g>
            <path
              d={`M62 66 L86 53 Q100 60 114 53 L138 66 C140 76 139 86 137 92 ${seam} C61 86 60 76 62 66 Z`}
              fill="url(#mq-lace)"
              stroke={INK}
              strokeWidth={1}
            />
            {slug === "bandeau-grace" && (
              <path d="M66 112 L134 112 L133 122 L67 122 Z" fill={CLOTH} stroke={INK} strokeWidth={1.1} />
            )}
          </g>
        ),
      };
    }

    case "rond":
    default:
      return { top: "M62 66 L86 54 Q100 76 114 54 L138 66", left: "shoulder", right: "shoulder" };
  }
}

function bodicePath(n: Neckline): string {
  const right =
    n.right === "shoulder" ? "C142 80 140 98 134 114" : "L134 114";
  const left = n.left === "shoulder" ? "C60 98 58 80 62 66" : "L66 102";
  return (
    `${n.top} ${right} C127 130 124 144 124 ${WAIST_Y} ` +
    `L76 ${WAIST_Y} C76 144 73 130 66 114 ${left} Z`
  );
}

// --- Les manches (dessinées à gauche, reflétées à droite) -------------------

function sleevePath(slug: string | undefined): string | null {
  switch (slug) {
    // Manches de la robe de cérémonie (groupe « manches », pièce par pièce).
    case "courte-volant":
      return "M62 66 C52 74 46 88 42 100 Q48 105 52 100 Q57 106 62 101 C63 98 64 94 66 92 C62 84 61 74 62 66 Z";
    case "courte-papillon":
      return "M62 66 C46 74 36 92 32 108 Q40 114 46 108 Q52 114 58 106 C62 100 64 96 66 92 C62 84 61 74 62 66 Z";
    case "coude-ajustee":
      return "M62 66 C52 84 46 108 42 128 L56 132 C58 116 62 104 66 96 C62 86 61 74 62 66 Z";
    case "coude-cloche":
      return "M62 66 C54 82 50 100 48 112 C42 120 36 128 32 136 Q44 142 58 134 C60 120 62 108 66 96 C62 86 61 74 62 66 Z";
    case "coude-volant":
      return "M62 66 C46 82 32 110 28 128 C36 136 50 132 58 124 C62 114 64 102 66 96 C62 86 61 76 62 66 Z";
    case "coude-papillon":
      return "M62 66 C40 80 26 112 22 138 Q30 144 36 138 Q42 146 48 138 Q54 144 58 132 C62 116 64 104 66 96 C62 86 61 74 62 66 Z";
    case "longue-cloche":
      return "M62 66 C52 90 46 130 42 160 C36 176 30 190 26 204 Q40 210 54 204 C54 186 56 170 56 160 C60 130 63 110 66 98 C62 88 61 76 62 66 Z";
    case "longue-volant":
      return "M62 66 C40 96 28 150 24 202 Q30 208 36 202 Q42 210 48 202 Q54 206 56 196 C58 150 62 116 66 98 C62 88 61 76 62 66 Z";
    case "mancherons":
    case "cap":
      return "M62 66 C52 70 49 82 52 92 C56 94 61 95 65 93 C62 84 62 74 62 66 Z";
    case "courte-ajustee":
    case "courtes":
      return "M62 66 C54 76 50 90 46 102 L62 108 C63 100 64 94 66 92 C62 84 61 74 62 66 Z";
    case "trois-quarts":
      return "M62 66 C52 86 44 116 38 148 L53 152 C57 130 62 110 66 96 C62 86 61 74 62 66 Z";
    case "longues":
    case "dentelle":
      return "M62 66 C50 96 42 150 34 198 L49 201 C55 160 61 120 66 98 C62 88 61 76 62 66 Z";
    case "bouffantes":
    case "longue-bishop":
      return "M62 66 C34 80 28 150 38 188 C40 192 44 194 48 194 C50 160 56 124 66 98 C62 88 61 76 62 66 Z";
    case "papillon":
    case "evasees":
      return "M62 66 C46 82 32 110 28 128 C36 136 50 132 58 124 C62 114 64 102 66 96 C62 86 61 76 62 66 Z";
    default:
      return null;
  }
}

function Sleeves({ slug }: { slug: string | undefined }) {
  const d = sleevePath(slug);
  if (!d) return null;
  const lace = slug === "dentelle";
  const cuff =
    slug === "bouffantes" || slug === "longue-bishop" ? "M36 186 L50 190 L49 199 L35 196 Z" : null;
  const one = (
    <g>
      <path
        d={d}
        fill={lace ? "url(#mq-lace)" : CLOTH}
        fillOpacity={lace ? 0.9 : 1}
        stroke={INK}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      {cuff && <path d={cuff} fill={CLOTH} stroke={INK} strokeWidth={1.2} />}
    </g>
  );
  return (
    <g>
      {one}
      <g transform="matrix(-1 0 0 1 200 0)">{one}</g>
    </g>
  );
}

// --- La jupe -----------------------------------------------------------------

function hemY(longueur: string | undefined): number {
  switch (longueur) {
    case "midi":
      return 340;
    case "cheville":
      return 410;
    default:
      return 440; // au sol, avec traîne
  }
}

/** Contour de la jupe, de la taille (ou sous la poitrine) jusqu'à l'ourlet. */
function skirtPath(
  silhouette: string | undefined,
  hem: number,
): { d: string; top: number; under?: string } {
  const h = hem;
  switch (silhouette) {
    // --- Jupes de la robe de cérémonie (groupe « jupe ») ---
    case "cercle":
      return {
        top: WAIST_Y,
        d: `M76 ${WAIST_Y} C44 180 18 260 8 ${h} Q30 ${h + 14} 54 ${h + 4} Q77 ${h + 16} 100 ${h + 4} Q123 ${h + 16} 146 ${h + 4} Q170 ${h + 14} 192 ${h} C182 260 156 180 124 ${WAIST_Y} Z`,
      };
    case "trois-quarts-cercle":
      return {
        top: WAIST_Y,
        d: `M76 ${WAIST_Y} C50 180 30 260 20 ${h} Q42 ${h + 12} 64 ${h + 3} Q100 ${h + 16} 136 ${h + 3} Q158 ${h + 12} 180 ${h} C170 260 150 180 124 ${WAIST_Y} Z`,
      };
    case "demi-cercle":
    case "plissee":
      return {
        top: WAIST_Y,
        d: `M76 ${WAIST_Y} C64 200 50 ${h - 80} 36 ${h} Q100 ${h + 12} 164 ${h} C150 ${h - 80} 136 200 124 ${WAIST_Y} Z`,
      };
    case "plongeant":
      return {
        top: WAIST_Y,
        d: `M76 ${WAIST_Y} C62 200 46 ${h - 80} 30 ${h} Q100 ${h - 90} 170 ${h} C154 ${h - 80} 138 200 124 ${WAIST_Y} Z`,
        under: `M30 ${h} C30 ${h + 8} 40 ${h + 14} 56 ${h + 16} Q100 ${h + 22} 144 ${h + 16} C160 ${h + 14} 170 ${h + 8} 170 ${h} Q100 ${h - 90} 30 ${h} Z`,
      };
    case "panneaux":
      return {
        top: WAIST_Y,
        d: `M76 ${WAIST_Y} C68 180 64 200 64 222 C62 260 56 ${h - 80} 38 ${h} Q100 ${h + 10} 162 ${h} C144 ${h - 80} 138 260 136 222 C136 200 132 180 124 ${WAIST_Y} Z`,
      };
    case "ligne-a":
      return {
        top: WAIST_Y,
        d: `M76 ${WAIST_Y} C70 200 62 ${h - 80} 56 ${h} Q100 ${h + 6} 144 ${h} C138 ${h - 80} 130 200 124 ${WAIST_Y} Z`,
      };
    case "crayon":
    case "fourreau":
      return {
        top: WAIST_Y,
        d: `M76 ${WAIST_Y} C70 176 64 196 64 214 C64 260 68 ${h - 60} 70 ${h} Q100 ${h + 4} 130 ${h} C132 ${h - 60} 136 260 136 214 C136 196 130 176 124 ${WAIST_Y} Z`,
      };
    case "sirene":
      return {
        top: WAIST_Y,
        d: `M76 ${WAIST_Y} C68 180 64 200 64 222 C64 262 70 292 74 310 C62 ${h - 40} 44 ${h - 12} 34 ${h} Q100 ${h + 8} 166 ${h} C156 ${h - 12} 138 ${h - 40} 126 310 C130 292 136 262 136 222 C136 200 132 180 124 ${WAIST_Y} Z`,
      };
    case "trompette":
      return {
        top: WAIST_Y,
        d: `M76 ${WAIST_Y} C68 180 64 200 64 222 C64 250 66 262 68 272 C60 ${h - 60} 48 ${h - 20} 42 ${h} Q100 ${h + 8} 158 ${h} C152 ${h - 20} 140 ${h - 60} 132 272 C134 262 136 250 136 222 C136 200 132 180 124 ${WAIST_Y} Z`,
      };
    case "princesse":
      return {
        top: WAIST_Y,
        d: `M76 ${WAIST_Y} C52 176 34 250 20 ${h} Q100 ${h + 14} 180 ${h} C166 250 148 176 124 ${WAIST_Y} Z`,
      };
    case "empire":
      return {
        top: EMPIRE_Y,
        d: `M68 ${EMPIRE_Y} C60 200 54 ${h - 80} 48 ${h} Q100 ${h + 8} 152 ${h} C146 ${h - 80} 140 200 132 ${EMPIRE_Y} Z`,
      };
    case "trapeze":
    default:
      return {
        top: WAIST_Y,
        d: `M76 ${WAIST_Y} C66 200 52 ${h - 80} 40 ${h} Q100 ${h + 10} 160 ${h} C148 ${h - 80} 134 200 124 ${WAIST_Y} Z`,
      };
  }
}

/** Quelques plis tombant de la taille : le croquis respire. */
function folds(silhouette: string | undefined, hem: number, top: number): string[] {
  if (silhouette === "fourreau" || silhouette === "crayon")
    return [`M100 ${top + 20} L100 ${hem - 4}`];
  if (silhouette === "ligne-a")
    return [`M88 ${top} L89 ${top + 26}`, `M112 ${top} L111 ${top + 26}`];
  if (silhouette === "plongeant")
    return [`M90 ${top + 10} C84 240 72 ${hem - 70} 62 ${hem - 34}`, `M110 ${top + 10} C116 240 128 ${hem - 70} 138 ${hem - 34}`];
  if (silhouette === "plissee")
    return [80, 86, 92, 100, 108, 114, 120].map(
      (x) => `M${x} ${top + 2} C${x + (x - 100) * 0.3} 240 ${100 + (x - 100) * 2.6} ${hem - 60} ${100 + (x - 100) * 3} ${hem + 4}`,
    );
  if (silhouette === "panneaux")
    return [
      `M88 ${top} C86 230 78 ${hem - 60} 70 ${hem + 4}`,
      `M100 ${top + 66} L100 ${hem + 8}`,
      `M112 ${top} C114 230 122 ${hem - 60} 130 ${hem + 4}`,
    ];
  if (silhouette === "cercle" || silhouette === "trois-quarts-cercle")
    return [
      `M86 ${top + 4} C74 260 50 ${hem - 60} 36 ${hem + 6}`,
      `M94 ${top + 6} C90 260 80 ${hem - 60} 74 ${hem + 10}`,
      `M106 ${top + 6} C110 260 120 ${hem - 60} 126 ${hem + 10}`,
      `M114 ${top + 4} C126 260 150 ${hem - 60} 164 ${hem + 6}`,
    ];
  if (silhouette === "princesse")
    return [
      `M88 ${top + 4} C80 260 66 ${hem - 60} 60 ${hem + 2}`,
      `M100 ${top + 6} L100 ${hem + 6}`,
      `M112 ${top + 4} C120 260 134 ${hem - 60} 140 ${hem + 2}`,
    ];
  if (silhouette === "sirene" || silhouette === "trompette")
    return [
      `M86 ${hem - 70} C80 ${hem - 40} 70 ${hem - 14} 64 ${hem + 2}`,
      `M114 ${hem - 70} C120 ${hem - 40} 130 ${hem - 14} 136 ${hem + 2}`,
    ];
  return [
    `M90 ${top + 10} C86 260 78 ${hem - 60} 72 ${hem + 2}`,
    `M110 ${top + 10} C114 260 122 ${hem - 60} 128 ${hem + 2}`,
  ];
}

function trainDepth(slug: string | undefined, longueur: string | undefined): number {
  switch (slug) {
    case "balayeuse":
      return 14;
    case "chapelle":
      return 28;
    case "cathedrale":
      return 46;
    default:
      return longueur === "traine" ? 28 : 0;
  }
}

// --- Le voile ----------------------------------------------------------------

function Veil({ slug }: { slug: string | undefined }) {
  if (!slug || slug === "sans") return null;
  const end = slug === "court" ? 170 : slug === "mantille" ? 300 : 470;
  const spread = slug === "court" ? 40 : slug === "mantille" ? 58 : 74;
  return (
    <path
      d={`M100 24 C${100 - spread / 2} 40 ${100 - spread} ${end - 80} ${100 - spread} ${end} Q100 ${end + 16} ${100 + spread} ${end} C${100 + spread} ${end - 80} ${100 + spread / 2} 40 100 24 Z`}
      fill={FORM}
      fillOpacity={0.7}
      stroke={INK}
      strokeWidth={0.9}
      strokeDasharray={slug === "mantille" ? "1 2.5" : "3 3"}
    />
  );
}

// --- La matière (texture posée sur toute la robe) ----------------------------

const TEXTURE: Record<string, string> = {
  dentelle: "url(#mq-lace)",
  perles: "url(#mq-pearls)",
  tulle: "url(#mq-tulle)",
  drape: "url(#mq-drape)",
  satin: "url(#mq-satin)",
};

function Patterns() {
  return (
    <defs>
      <pattern id="mq-lace" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill={CLOTH} />
        <circle cx="5" cy="5" r="2.2" fill="none" stroke={FOLD} strokeWidth="0.6" />
        <circle cx="0" cy="0" r="1" fill={FOLD} />
        <circle cx="10" cy="10" r="1" fill={FOLD} />
      </pattern>
      <pattern id="mq-pearls" width="9" height="9" patternUnits="userSpaceOnUse">
        <circle cx="4.5" cy="4.5" r="1" fill={FOLD} />
      </pattern>
      <pattern id="mq-tulle" width="5" height="5" patternUnits="userSpaceOnUse">
        <path d="M0 0 L5 5 M5 0 L0 5" stroke={FOLD} strokeWidth="0.3" />
      </pattern>
      <pattern id="mq-drape" width="40" height="18" patternUnits="userSpaceOnUse">
        <path d="M0 14 Q20 2 40 14" fill="none" stroke={FOLD} strokeWidth="0.6" />
      </pattern>
      <pattern id="mq-satin" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M8 0 Q20 30 10 60" fill="none" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.9" />
      </pattern>
    </defs>
  );
}

// --- La ceinture ---------------------------------------------------------------

function Belt({ slug, y }: { slug: string | undefined; y: number }) {
  if (!slug || slug === "sans") return null;
  const x1 = y === EMPIRE_Y ? 67 : 75;
  const x2 = 200 - x1;
  return (
    <g stroke={INK} strokeWidth={1.2}>
      <rect x={x1} y={y - 5} width={x2 - x1} height={9} rx={2} fill={slug === "bijou" ? "#d9d9de" : CLOTH} />
      {slug === "bijou" &&
        [0, 1, 2, 3, 4, 5, 6].map((i) => (
          <circle key={i} cx={x1 + 6 + i * ((x2 - x1 - 12) / 6)} cy={y - 0.5} r={1.6} fill={FORM} strokeWidth={0.6} />
        ))}
      {slug === "noeud" && (
        <g fill={CLOTH}>
          <path d={`M100 ${y} L84 ${y - 9} L84 ${y + 9} Z`} />
          <path d={`M100 ${y} L116 ${y - 9} L116 ${y + 9} Z`} />
          <path d={`M98 ${y + 2} L92 ${y + 26} L97 ${y + 24} Z`} />
          <path d={`M102 ${y + 2} L108 ${y + 26} L103 ${y + 24} Z`} />
          <rect x={96} y={y - 4} width={8} height={8} rx={2} />
        </g>
      )}
    </g>
  );
}

// --- Assemblage ----------------------------------------------------------------

const BODICE_GROUPS = ["decollete", "corsage", "ceinture", "finition", "matiere"];
const SKIRT_GROUPS = ["silhouette", "jupe", "longueur", "fente", "traine"];

export function DressMannequin({
  details,
  dressed,
  className,
}: {
  /** Les choix du configurateur (groupe → option). */
  details: Record<string, string>;
  /** Les groupes réellement touchés : seuls eux habillent le mannequin. */
  dressed: string[];
  className?: string;
}) {
  const on = (g: string) => dressed.includes(g);
  const skirtOn = SKIRT_GROUPS.some(on);
  const bodiceOn = skirtOn || BODICE_GROUPS.some(on);
  // Robe de cérémonie : corsage / jupe pièce par pièce, prioritaires sur les
  // anciens choix « décolleté » / « silhouette » des autres robes.
  const corsage = details.corsage;
  const sleevesOn = on("manches") && corsage !== "bettina";

  const silhouette = details.jupe ?? details.silhouette;
  const longueur = details.longueur;
  const hem = hemY(longueur);
  const skirt = skirtPath(silhouette, hem);
  const neck = neckline(corsage ?? details.decollete);
  const gathered = corsage?.endsWith("-fronce") ?? false;
  const darted = !gathered && Boolean(corsage);
  const bodice = bodicePath(neck);
  const texture = TEXTURE[details.matiere ?? details.finition ?? ""];
  const textured = (on("matiere") || on("finition")) && texture;
  const train = on("traine") || on("longueur") ? trainDepth(details.traine, longueur) : 0;
  const slit = on("fente") && details.fente === "cuisse";
  const beltY = silhouette === "empire" && skirtOn ? EMPIRE_Y : WAIST_Y;

  return (
    <svg
      viewBox="0 0 200 520"
      role="img"
      aria-label="Mannequin"
      className={cn("h-full w-auto", className)}
    >
      <Patterns />
      {on("voile") && <Veil slug={details.voile} />}
      <Form />

      {/* Traîne, derrière la jupe */}
      {skirtOn && train > 0 && (
        <path
          d={`M46 ${hem - 40} C36 ${hem - 10} 28 ${hem + train * 0.3} 26 ${hem + train * 0.45} Q110 ${hem + train} 196 ${hem + train * 0.7} C184 ${hem} 166 ${hem - 20} 156 ${hem - 40} Z`}
          fill={CLOTH}
          stroke={INK}
          strokeWidth={1.4}
        />
      )}

      {sleevesOn && <Sleeves slug={details.manches} />}

      {bodiceOn && (
        <g>
          <path d={bodice} fill={CLOTH} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
          {textured && <path d={bodice} fill={texture} stroke="none" />}
          {neck.extra}
          {/* Bande froncée sous la poitrine, ou pinces */}
          {gathered && (
            <g fill="none" stroke={INK}>
              <path d="M72 132 L128 132" strokeWidth={1.2} />
              <g stroke={FOLD} strokeWidth={0.8}>
                {[82, 90, 110, 118].map((x) => (
                  <path key={x} d={`M${x} 132 Q${x - 2} 124 ${x + 1} 116`} />
                ))}
              </g>
            </g>
          )}
          {darted && (
            <g fill="none" stroke={FOLD} strokeWidth={0.8}>
              <path d={`M88 ${WAIST_Y} L89 122`} />
              <path d={`M112 ${WAIST_Y} L111 122`} />
            </g>
          )}
        </g>
      )}

      {skirtOn && (
        <g>
          {skirt.under && <path d={skirt.under} fill={CLOTH} stroke={INK} strokeWidth={1.2} />}
          <path d={skirt.d} fill={CLOTH} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
          {textured && <path d={skirt.d} fill={texture} stroke="none" />}
          {folds(silhouette, hem, skirt.top).map((d) => (
            <path key={d} d={d} fill="none" stroke={FOLD} strokeWidth={0.8} />
          ))}
          {slit && (
            <path
              d={`M108 ${hem + 3} C112 ${hem - 60} 114 280 116 ${Math.max(skirt.top + 90, 270)} C118 280 122 ${hem - 60} 128 ${hem + 2}`}
              fill={FORM}
              stroke={INK}
              strokeWidth={1.2}
            />
          )}
          {/* Couture de taille (sous la poitrine pour l'empire) */}
          <path
            d={skirt.top === EMPIRE_Y ? `M68 ${EMPIRE_Y} L132 ${EMPIRE_Y}` : `M76 ${WAIST_Y} L124 ${WAIST_Y}`}
            stroke={INK}
            strokeWidth={1.2}
          />
        </g>
      )}

      {bodiceOn && on("ceinture") && <Belt slug={details.ceinture} y={beltY} />}
    </svg>
  );
}
