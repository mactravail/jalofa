import type { ShoeModel } from "@/lib/shoe-options";

// Colour-reactive hero preview for the shoe configurator. A single parametric
// side-profile SVG (shoe facing right) whose body is filled with the chosen
// leather colour and whose instep / toe / sole redraw from the current
// selections — the shoe equivalent of the dress configurator's old live
// mannequin. There are no shoe photos in the demo data, so this drawing IS the
// preview. Kept intentionally stylised, not photoreal.

const LOW_OUTLINE =
  "M44 66C34 70 28 92 34 104C70 110 120 110 156 106C178 104 194 100 206 94" +
  "C212 90 208 82 199 82C174 78 150 76 132 74C122 73 118 68 112 64C94 58 66 58 50 62Z";

const BOOT_OUTLINE =
  "M44 30L44 66C34 70 28 92 34 104C70 110 120 110 156 106C178 104 194 100 206 94" +
  "C212 90 208 82 199 82C174 78 150 76 132 74C122 73 118 68 116 60L116 30" +
  "C100 24 60 24 44 30Z";

const SOLE_PATH =
  "M33 103C70 111 120 111 156 107C179 105 195 101 207 95L210 101" +
  "C197 109 179 114 156 114C118 118 70 118 33 111Z";

const WELT_PATH = "M36 101C72 108 120 108 156 104C178 102 194 98 205 93";

// Lacing eyelet rows (side view) — used for oxford / derby / brogue.
const UPPER = [0, 1, 2, 3].map((i) => ({ x: 123 + i * 10, y: 67 + i * 2.4 }));
const LOWER = [0, 1, 2, 3].map((i) => ({ x: 121 + i * 10, y: 74 + i * 2.4 }));

function soleColors(sole: string): { fill: string; welt: boolean } {
  if (sole === "cuir") return { fill: "#c9a15f", welt: false };
  return { fill: "#2a2a2c", welt: sole === "goodyear" };
}

export function ShoePreview({
  model,
  color,
  suede,
  toe,
  sole,
  laceColor,
  monogram,
  className,
}: {
  model: ShoeModel;
  color: string;
  suede?: boolean;
  toe: string;
  sole: string;
  laceColor: string;
  monogram?: string;
  className?: string;
}) {
  const outline = model.shape === "boot" ? BOOT_OUTLINE : LOW_OUTLINE;
  const { fill: soleFill, welt } = soleColors(sole);
  const brogued = toe === "fleuri" || model.slug === "brogue";

  return (
    <svg
      viewBox="0 0 240 150"
      className={className}
      role="img"
      aria-label={`Aperçu ${model.name}`}
    >
      {/* ground shadow */}
      <ellipse cx="122" cy="123" rx="94" ry="9" fill="rgba(0,0,0,0.18)" />

      {/* stacked heel + sole */}
      <path d="M32 103L30 120L50 120L52 108Z" fill={soleFill} />
      <path d="M32 103L30 120L50 120L52 108Z" fill="rgba(0,0,0,0.18)" />
      <path d={SOLE_PATH} fill={soleFill} />
      <path d={SOLE_PATH} fill="rgba(0,0,0,0.12)" />
      {welt && (
        <path
          d={WELT_PATH}
          fill="none"
          stroke="#e4c98a"
          strokeWidth={1.4}
          strokeDasharray="2.5 2.5"
          strokeLinecap="round"
        />
      )}

      {/* upper body — filled with the chosen leather colour */}
      <path d={outline} fill={color} stroke="rgba(0,0,0,0.45)" strokeWidth={1.4} />
      {/* top rim highlight so dark leathers keep their edge */}
      <path
        d={outline}
        fill="none"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth={0.9}
      />

      {/* leather gloss (skipped for suede) */}
      {!suede && (
        <>
          <ellipse cx="150" cy="88" rx="36" ry="9" fill="#ffffff" opacity="0.1" />
          <ellipse cx="188" cy="90" rx="12" ry="3.5" fill="#ffffff" opacity="0.14" />
        </>
      )}

      {/* heel seam */}
      <path
        d="M47 63C43 80 43 92 45 104"
        fill="none"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={1.1}
      />

      {/* ---- toe treatment ---- */}
      {toe === "golf" && (
        <path
          d="M168 78C174 88 176 96 174 104"
          fill="none"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={1.3}
        />
      )}
      {toe === "fleuri" && (
        <>
          <path
            d="M150 75C158 86 162 96 164 105M170 78C176 88 178 96 176 105"
            fill="none"
            stroke="rgba(0,0,0,0.4)"
            strokeWidth={1.3}
          />
        </>
      )}
      {brogued &&
        [
          [150, 76],
          [157, 78],
          [164, 80],
          [172, 85],
          [176, 93],
          [174, 101],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="1" fill="rgba(0,0,0,0.4)" />
        ))}

      {/* ---- instep by model ---- */}
      {model.vamp === "lace" && (
        <>
          {/* facing panel */}
          <path
            d="M116 63C132 66 150 73 158 80L154 85C140 78 126 71 113 68Z"
            fill="rgba(0,0,0,0.14)"
          />
          {/* eyelets */}
          {UPPER.map((p, i) => (
            <circle
              key={`u${i}`}
              cx={p.x}
              cy={p.y}
              r="1.6"
              fill="rgba(0,0,0,0.35)"
              stroke="#e4c98a"
              strokeWidth={0.7}
            />
          ))}
          {LOWER.map((p, i) => (
            <circle
              key={`l${i}`}
              cx={p.x}
              cy={p.y}
              r="1.6"
              fill="rgba(0,0,0,0.35)"
              stroke="#e4c98a"
              strokeWidth={0.7}
            />
          ))}
          {/* crossed laces */}
          {[0, 1, 2].map((i) => (
            <g key={`x${i}`} stroke={laceColor} strokeWidth={2.2} strokeLinecap="round">
              <line x1={UPPER[i].x} y1={UPPER[i].y} x2={LOWER[i + 1].x} y2={LOWER[i + 1].y} />
              <line x1={UPPER[i + 1].x} y1={UPPER[i + 1].y} x2={LOWER[i].x} y2={LOWER[i].y} />
            </g>
          ))}
          {/* derby open-flap hint */}
          {model.slug === "derby" && (
            <path
              d="M113 68L112 61M154 85L156 78"
              fill="none"
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={1}
            />
          )}
        </>
      )}

      {model.vamp === "buckle" && (
        <>
          {[
            "M118 60L150 74L147 80L115 66Z",
            "M132 66L164 80L161 86L129 72Z",
          ].map((d, i) => (
            <path key={i} d={d} fill="rgba(0,0,0,0.22)" stroke="rgba(0,0,0,0.35)" strokeWidth={0.8} />
          ))}
          {[
            [147, 72],
            [161, 78],
          ].map(([x, y], i) => (
            <g key={`b${i}`} stroke="#c9a15f" strokeWidth={1.1} fill="none">
              <rect x={x} y={y} width="6" height="6" rx="1" />
              <line x1={x + 3} y1={y} x2={x + 3} y2={y + 6} />
            </g>
          ))}
        </>
      )}

      {model.vamp === "strap" && (
        <>
          {/* moccasin apron seam */}
          <path
            d="M120 66C142 70 162 78 176 88"
            fill="none"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth={1.1}
            strokeDasharray="2.5 2.5"
          />
          {/* penny keeper */}
          <path
            d="M150 71C150 82 172 82 172 70L168 70C168 79 154 79 154 71Z"
            fill="rgba(0,0,0,0.16)"
          />
          <path d="M158 74H164" stroke="rgba(0,0,0,0.35)" strokeWidth={1} />
        </>
      )}

      {/* chelsea gusset + pull tab */}
      {model.shape === "boot" && (
        <>
          <path
            d="M116 34L116 60C108 60 100 58 98 50L98 40C100 36 108 34 116 34Z"
            fill="rgba(0,0,0,0.22)"
          />
          {[40, 45, 50, 55].map((y) => (
            <path key={y} d={`M100 ${y}H114`} stroke="rgba(0,0,0,0.28)" strokeWidth={0.8} />
          ))}
          <path
            d="M44 30C38 27 34 30 35 35C36 39 40 40 44 39"
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </>
      )}

      {/* engraved monogram on the heel counter */}
      {monogram ? (
        <text
          x="64"
          y="92"
          fontSize="9"
          fontWeight={700}
          letterSpacing="1.5"
          textAnchor="middle"
          fill="#e4c98a"
          opacity="0.9"
          fontFamily="ui-serif, Georgia, serif"
        >
          {monogram}
        </text>
      ) : null}
    </svg>
  );
}
