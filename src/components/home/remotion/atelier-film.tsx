import { AbsoluteFill, Easing, Img, interpolate, useCurrentFrame } from "remotion";

/**
 * « L'Atelier en mouvement » — le film signature de la home JALOFA, joué dans
 * un <Player> (voir atelier-hero.tsx). Quatre actes qui racontent le parcours
 * d'une tenue sur mesure : le tissu, la mesure, la couture, la livraison.
 *
 * Convention Remotion : toute l'animation passe par `useCurrentFrame()` +
 * `interpolate()` en style inline (jamais de transition/animation CSS, qui ne
 * seraient pas déterministes). Les actes restent tous montés et se fondent par
 * opacité — le fondu du dernier acte vers le premier assure une boucle propre.
 *
 * Étalonnage monochrome et sombre (charbon + blanc + argent) pour un rendu
 * identique en thème clair comme sombre : le film a sa propre lumière.
 */

export const FILM_FPS = 30;
export const FILM_WIDTH = 1080;
export const FILM_HEIGHT = 1350; // portrait éditorial 4:5
export const FILM_DURATION = 300; // 10 s en boucle

const BG = "#141414"; // charbon (neutre, ≈ --background sombre)
const CREAM = "#f4f4f4"; // blanc cassé neutre
const CREAM_DIM = "rgba(244,244,244,0.60)";
const ACCENT = "#ffffff"; // blanc pur — accent d'emphase (ex-terracotta)
const GOLD = "#c9c9c9"; // argent/platine — métal secondaire (ex-or)
const HAIRLINE = "rgba(244,244,244,0.20)";

const SERIF = "Georgia, 'Times New Roman', 'Noto Serif', serif";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
// Le logotype du film est celui du site : la fonte de <Wordmark /> (Cormorant
// Garamond, cf. --font-wordmark). Le film ne montre jamais un autre logo.
const WORDMARK = "var(--font-cormorant), ui-serif, Georgia, serif";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IO = Easing.bezier(0.4, 0, 0.2, 1);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Les 4 actes, chacun sur ~75 frames avec un chevauchement de fondu.
const ACTS = {
  tissu: [0, 78] as const,
  mesure: [72, 156] as const,
  couture: [150, 234] as const,
  livraison: [228, 300] as const,
};

/** Opacité d'un acte : fondu entrant/sortant sur ses bornes. */
function actOpacity(frame: number, [from, to]: readonly [number, number]) {
  return interpolate(frame, [from, from + 16, to - 16, to], [0, 1, 1, 0], {
    ...clamp,
    easing: EASE_IO,
  });
}

// --- Blocs de légende éditoriale (bas-gauche) ------------------------------

function CaptionBlock({
  local,
  index,
  kicker,
  title,
}: {
  local: number;
  index: string;
  kicker: string;
  title: string;
}) {
  const rise = interpolate(local, [8, 34], [40, 0], { ...clamp, easing: EASE });
  const op = interpolate(local, [8, 30], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        bottom: 132,
        right: 72,
        opacity: op,
        translate: `0px ${rise}px`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontFamily: SANS,
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: ACCENT,
        }}
      >
        <span>{index}</span>
        <span style={{ width: 34, height: 1, background: ACCENT, opacity: 0.7 }} />
        <span style={{ color: CREAM_DIM, letterSpacing: 3 }}>{kicker}</span>
      </div>
      <div
        style={{
          marginTop: 14,
          fontFamily: SERIF,
          fontSize: 74,
          lineHeight: 1.02,
          fontWeight: 500,
          color: CREAM,
          letterSpacing: -1,
        }}
      >
        {title}
      </div>
    </div>
  );
}

// --- Acte 1 · Le tissu ------------------------------------------------------

const SWATCHES = ["/fabrics/8.jpg", "/fabrics/2.jpg", "/fabrics/11.jpg", "/fabrics/5.jpg"];
const SELECTED = 2;

function ActTissu({ frame }: { frame: number }) {
  const local = frame - ACTS.tissu[0];
  const ringP = interpolate(local, [40, 58], [0, 1], { ...clamp, easing: EASE });
  return (
    <AbsoluteFill style={{ opacity: actOpacity(frame, ACTS.tissu) }}>
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 72,
          right: 72,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 28,
        }}
      >
        {SWATCHES.map((src, i) => {
          const delay = 6 + i * 7;
          const rise = interpolate(local, [delay, delay + 22], [90, 0], {
            ...clamp,
            easing: EASE,
          });
          const op = interpolate(local, [delay, delay + 16], [0, 1], clamp);
          const isSel = i === SELECTED;
          return (
            <div
              key={src}
              style={{
                position: "relative",
                aspectRatio: "1 / 1",
                borderRadius: 26,
                overflow: "hidden",
                opacity: op,
                translate: `0px ${rise}px`,
                boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
                outline: isSel ? `4px solid ${ACCENT}` : "1px solid rgba(255,255,255,0.06)",
                outlineOffset: isSel ? 6 : 0,
              }}
            >
              <Img
                src={src}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {isSel && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(160deg, transparent 55%, ${ACCENT}55)`,
                    opacity: ringP,
                  }}
                />
              )}
              {isSel && (
                <div
                  style={{
                    position: "absolute",
                    right: 16,
                    bottom: 16,
                    width: 52,
                    height: 52,
                    borderRadius: 999,
                    background: ACCENT,
                    color: "#141414",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 30,
                    fontWeight: 700,
                    scale: `${ringP}`,
                    boxShadow: "0 10px 24px rgba(0,0,0,0.45)",
                  }}
                >
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>
      <CaptionBlock local={local} index="01" kicker="Le tissu" title="Choisissez votre étoffe." />
    </AbsoluteFill>
  );
}

// --- Acte 2 · La mesure -----------------------------------------------------

function GuideLine({
  local,
  x1,
  y1,
  x2,
  y2,
  delay,
}: {
  local: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay: number;
}) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const draw = interpolate(local, [delay, delay + 20], [len, 0], { ...clamp, easing: EASE });
  return (
    <>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={GOLD}
        strokeWidth={2.5}
        strokeDasharray={len}
        strokeDashoffset={draw}
      />
      {[
        [x1, y1],
        [x2, y2],
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={7}
          fill={BG}
          stroke={GOLD}
          strokeWidth={2.5}
          opacity={interpolate(local, [delay + 14, delay + 22], [0, 1], clamp)}
        />
      ))}
    </>
  );
}

function ActMesure({ frame }: { frame: number }) {
  const local = frame - ACTS.mesure[0];
  const zoom = interpolate(local, [0, 84], [1.12, 1.22], { ...clamp, easing: Easing.linear });
  const chest = Math.round(interpolate(local, [16, 46], [0, 108], clamp));
  const waist = Math.round(interpolate(local, [24, 54], [0, 84], clamp));
  return (
    <AbsoluteFill style={{ opacity: actOpacity(frame, ACTS.mesure) }}>
      <div
        style={{
          position: "absolute",
          top: 132,
          left: 132,
          right: 132,
          height: 720,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 40px 90px rgba(0,0,0,0.5)",
        }}
      >
        <Img
          src="/models/grand-boubou.jpg"
          style={{ width: "100%", height: "100%", objectFit: "cover", scale: `${zoom}` }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(20,20,20,0.15), rgba(20,20,20,0.55))",
          }}
        />
        <svg
          viewBox="0 0 816 720"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          <GuideLine local={local} x1={250} y1={214} x2={566} y2={214} delay={12} />
          <GuideLine local={local} x1={286} y1={396} x2={530} y2={396} delay={20} />
          <GuideLine local={local} x1={408} y1={150} x2={408} y2={630} delay={4} />
        </svg>

        {[
          { top: 186, value: chest, label: "Poitrine" },
          { top: 368, value: waist, label: "Taille" },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              position: "absolute",
              right: 26,
              top: m.top,
              background: "rgba(20,20,20,0.82)",
              backdropFilter: "blur(6px)",
              border: `1px solid ${HAIRLINE}`,
              borderRadius: 16,
              padding: "12px 18px",
              opacity: interpolate(local, [14, 30], [0, 1], clamp),
            }}
          >
            <div
              style={{
                fontFamily: SANS,
                fontSize: 16,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: CREAM_DIM,
              }}
            >
              {m.label}
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 40, color: CREAM, fontWeight: 600 }}>
              {m.value} cm
            </div>
          </div>
        ))}
      </div>
      <CaptionBlock local={local} index="02" kicker="La mesure" title="Taillé à vos mesures." />
    </AbsoluteFill>
  );
}

// --- Acte 3 · La couture ----------------------------------------------------

function ActCouture({ frame }: { frame: number }) {
  const local = frame - ACTS.couture[0];
  const zoom = interpolate(local, [0, 84], [1.2, 1.08], { ...clamp, easing: Easing.linear });
  const stitch = interpolate(local, [10, 60], [0, 100], { ...clamp, easing: EASE });
  const price = Math.round(interpolate(local, [18, 52], [0, 45000], clamp));
  const chips = ["Col Mao brodé", "Fil or", "Wax premium"];
  return (
    <AbsoluteFill style={{ opacity: actOpacity(frame, ACTS.couture) }}>
      <div
        style={{
          position: "absolute",
          top: 132,
          left: 132,
          right: 132,
          height: 720,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 40px 90px rgba(0,0,0,0.5)",
        }}
      >
        <Img
          src="/models/robe.jpg"
          style={{ width: "100%", height: "100%", objectFit: "cover", scale: `${zoom}` }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(20,20,20,0.05), rgba(20,20,20,0.6))",
          }}
        />

        {/* Ligne de couture qui progresse */}
        <div
          style={{
            position: "absolute",
            left: 40,
            right: 40,
            top: 92,
            height: 3,
            background: HAIRLINE,
            borderRadius: 3,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${stitch}%`,
              background: `repeating-linear-gradient(90deg, ${GOLD} 0 14px, transparent 14px 26px)`,
              borderRadius: 3,
            }}
          />
        </div>

        {/* Chips détails */}
        <div
          style={{
            position: "absolute",
            left: 30,
            bottom: 30,
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {chips.map((c, i) => {
            const d = 20 + i * 8;
            return (
              <div
                key={c}
                style={{
                  fontFamily: SANS,
                  fontSize: 22,
                  fontWeight: 600,
                  color: CREAM,
                  background: "rgba(20,20,20,0.78)",
                  border: `1px solid ${HAIRLINE}`,
                  borderRadius: 999,
                  padding: "12px 22px",
                  opacity: interpolate(local, [d, d + 12], [0, 1], clamp),
                  translate: `${interpolate(local, [d, d + 16], [24, 0], { ...clamp, easing: EASE })}px 0px`,
                }}
              >
                {c}
              </div>
            );
          })}
        </div>

        {/* Carte prix */}
        <div
          style={{
            position: "absolute",
            right: 26,
            top: 132,
            background: "rgba(20,20,20,0.85)",
            backdropFilter: "blur(6px)",
            border: `1px solid ${HAIRLINE}`,
            borderRadius: 20,
            padding: "18px 24px",
            opacity: interpolate(local, [16, 30], [0, 1], clamp),
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontSize: 16,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: CREAM_DIM,
            }}
          >
            Sur mesure
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 46, color: GOLD, fontWeight: 700 }}>
            {price.toLocaleString("fr-FR")} FCFA
          </div>
        </div>
      </div>
      <CaptionBlock local={local} index="03" kicker="La couture" title="Cousu main, avec soin." />
    </AbsoluteFill>
  );
}

// --- Acte 4 · La livraison --------------------------------------------------

function ActLivraison({ frame }: { frame: number }) {
  const local = frame - ACTS.livraison[0];
  const logoScale = interpolate(local, [8, 40], [0.82, 1], { ...clamp, easing: EASE });
  const logoOp = interpolate(local, [8, 30], [0, 1], clamp);
  const rule = interpolate(local, [26, 50], [0, 240], { ...clamp, easing: EASE });
  const tagOp = interpolate(local, [34, 52], [0, 1], clamp);
  const haloScale = interpolate(local, [0, 60], [0.6, 1.15], { ...clamp, easing: Easing.linear });
  return (
    <AbsoluteFill
      style={{
        opacity: actOpacity(frame, ACTS.livraison),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 620,
          height: 620,
          borderRadius: 999,
          background: `radial-gradient(circle, ${ACCENT}44, transparent 70%)`,
          scale: `${haloScale}`,
          filter: "blur(10px)",
        }}
      />
      <div style={{ textAlign: "center", opacity: logoOp, scale: `${logoScale}` }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: ACCENT,
            fontWeight: 600,
          }}
        >
          04 · La livraison
        </div>
        <div
          style={{
            marginTop: 22,
            fontFamily: WORDMARK,
            fontSize: 132,
            fontWeight: 500,
            letterSpacing: 24,
            // L'interlettrage ajoute un blanc après le dernier A ; ce retrait le
            // rattrape pour que le mot reste optiquement centré.
            paddingLeft: 24,
            textTransform: "uppercase",
            color: CREAM,
          }}
        >
          JALOFA
        </div>
        <div
          style={{
            margin: "18px auto 0",
            width: rule,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          }}
        />
        <div
          style={{
            marginTop: 26,
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 40,
            color: CREAM_DIM,
            opacity: tagOp,
          }}
        >
          Sur mesure, livré chez vous.
        </div>
      </div>
    </AbsoluteFill>
  );
}

// --- Fond + habillage persistants ------------------------------------------

function Ambience({ frame }: { frame: number }) {
  const drift = Math.sin((frame / FILM_DURATION) * Math.PI * 2);
  return (
    <AbsoluteFill style={{ background: BG }}>
      <div
        style={{
          position: "absolute",
          inset: -200,
          background: `radial-gradient(60% 50% at ${50 + drift * 12}% ${30 - drift * 8}%, ${ACCENT}33, transparent 60%)`,
        }}
      />
      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(0,0,0,0.55))",
        }}
      />
    </AbsoluteFill>
  );
}

function Chrome({ frame }: { frame: number }) {
  const seg = 300 / 4;
  const active = Math.min(3, Math.floor(frame / seg));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* En-tête discret */}
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 72,
          right: 72,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: SANS,
          fontSize: 20,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: CREAM_DIM,
        }}
      >
        <span
          style={{
            fontFamily: WORDMARK,
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: 7,
            color: CREAM,
          }}
        >
          JALOFA
        </span>
        <span>L&apos;Atelier</span>
      </div>
      {/* Progression en 4 segments */}
      <div
        style={{
          position: "absolute",
          bottom: 64,
          left: 72,
          right: 72,
          display: "flex",
          gap: 12,
        }}
      >
        {[0, 1, 2, 3].map((i) => {
          const local = frame - i * seg;
          const fill =
            i < active ? 1 : i > active ? 0 : interpolate(local, [0, seg], [0, 1], clamp);
          return (
            <div
              key={i}
              style={{ flex: 1, height: 4, borderRadius: 4, background: HAIRLINE, overflow: "hidden" }}
            >
              <div style={{ height: "100%", width: `${fill * 100}%`, background: ACCENT }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

export function AtelierFilm() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Ambience frame={frame} />
      <ActTissu frame={frame} />
      <ActMesure frame={frame} />
      <ActCouture frame={frame} />
      <ActLivraison frame={frame} />
      <Chrome frame={frame} />
    </AbsoluteFill>
  );
}
