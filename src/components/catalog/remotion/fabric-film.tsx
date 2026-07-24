import { AbsoluteFill, Easing, Img, interpolate, useCurrentFrame } from "remotion";

import { StyleIcon, type StyleIconName } from "@/components/order/style-icons";

/**
 * « Le tissu en mouvement » — le film d'une fiche tissu, joué dans un <Player>
 * (voir fabric-film-player.tsx). Il répond en images à la seule question qu'un
 * client se pose devant un rouleau : qu'est-ce que ça devient ? Le tissu occupe
 * le cadre, et les silhouettes des pièces qu'il sert s'y inscrivent l'une après
 * l'autre, chacune avec son métrage mesuré au ruban.
 *
 * Convention Remotion du projet (cf. home/remotion/atelier-film.tsx) : toute
 * l'animation passe par `useCurrentFrame()` + `interpolate()` en style inline —
 * jamais de transition/animation CSS ni de classe d'animation Tailwind, qui ne
 * sont pas déterministes. Les actes restent montés et se fondent par opacité,
 * le dernier revenant vers le premier pour une boucle propre.
 */

export const FILM_FPS = 30;
export const FILM_WIDTH = 1080;
export const FILM_HEIGHT = 1080; // carré — même cadre que la galerie
/** Durée d'un acte, fondu compris. */
const ACT = 66;

const CREAM = "#f4f4f4";
const CREAM_DIM = "rgba(244,244,244,0.62)";
const HAIRLINE = "rgba(244,244,244,0.28)";
const SERIF = "Georgia, 'Times New Roman', 'Noto Serif', serif";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IO = Easing.bezier(0.4, 0, 0.2, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type FilmUse = {
  label: string;
  meters: number;
  icon: StyleIconName;
  /** « Homme », « Femme »… — le public de la pièce. */
  audience: string;
};

export type FabricFilmProps = {
  image: string;
  fabricName: string;
  uses: FilmUse[];
};

/** Nombre de frames pour N actes — la boucle doit finir où elle commence. */
export const filmDuration = (uses: number) => Math.max(1, uses) * ACT;

/**
 * Position dans un acte, mesurée cycliquement et signée : un acte « pas encore
 * arrivé » reçoit un temps négatif (ses éléments restent à leur état d'entrée)
 * plutôt qu'un temps de fin. C'est ce qui rend le raccord de boucle invisible —
 * le dernier acte s'efface pendant que le premier monte, sans passage au noir.
 */
function actLocal(frame: number, from: number, total: number) {
  const d = (((frame - from) % total) + total) % total;
  return d > total / 2 ? d - total : d;
}

/** Opacité d'un acte : plateau au centre, fondu croisé sur les bords. */
function actOpacity(local: number) {
  return interpolate(Math.abs(local - ACT / 2), [ACT / 2 - 8, ACT / 2 + 8], [1, 0], {
    ...clamp,
    easing: EASE_IO,
  });
}

/** Le ruban de couturier : la mesure se déroule, le métrage s'inscrit au bout. */
function MetreRule({ local, meters }: { local: number; meters: number }) {
  const grow = interpolate(local, [12, 48], [0, 1], { ...clamp, easing: EASE });
  return (
    <div style={{ position: "absolute", left: 72, right: 72, bottom: 104 }}>
      <div style={{ position: "relative", height: 22 }}>
        <div
          style={{
            position: "absolute",
            insetInline: 0,
            top: 10,
            height: 1,
            background: HAIRLINE,
          }}
        />
        <div
          style={{
            position: "absolute",
            insetInline: 0,
            top: 10,
            height: 1,
            background: CREAM,
            scale: `${grow} 1`,
            transformOrigin: "left center",
          }}
        />
        {Array.from({ length: 11 }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${i * 10}%`,
              top: i % 5 === 0 ? 2 : 6,
              width: 1,
              height: i % 5 === 0 ? 18 : 9,
              background: CREAM,
              opacity: interpolate(grow, [i / 11, i / 11 + 0.08], [0, 0.75], clamp),
            }}
          />
        ))}
      </div>
      <div
        style={{
          marginTop: 14,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          fontFamily: SANS,
        }}
      >
        <span
          style={{
            fontSize: 20,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: CREAM_DIM,
          }}
        >
          Métrage conseillé
        </span>
        <span
          style={{
            fontSize: 46,
            fontWeight: 600,
            color: CREAM,
            opacity: interpolate(local, [28, 44], [0, 1], clamp),
            translate: `0px ${interpolate(local, [28, 44], [14, 0], { ...clamp, easing: EASE })}px`,
          }}
        >
          {meters.toLocaleString("fr-FR")} m
        </span>
      </div>
    </div>
  );
}

/** Un acte : une pièce que ce tissu sert. */
function Act({ local, use }: { local: number; use: FilmUse }) {
  const rise = interpolate(local, [8, 40], [46, 0], { ...clamp, easing: EASE });
  const drawIn = interpolate(local, [6, 46], [0.86, 1], { ...clamp, easing: EASE });

  return (
    <AbsoluteFill>
      {/* La silhouette, dessinée au trait par-dessus le tissu */}
      <div
        style={{
          position: "absolute",
          right: 96,
          top: 150,
          width: 360,
          height: 450,
          color: CREAM,
          opacity: interpolate(local, [6, 34], [0, 0.92], clamp),
          scale: drawIn,
          transformOrigin: "center",
        }}
      >
        <StyleIcon name={use.icon} className="size-full" />
      </div>

      {/* La légende éditoriale */}
      <div
        style={{
          position: "absolute",
          left: 72,
          bottom: 190,
          right: 400,
          translate: `0px ${rise}px`,
          opacity: interpolate(local, [8, 32], [0, 1], clamp),
        }}
      >
        <div
          style={{
            fontFamily: SANS,
            fontSize: 20,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: CREAM_DIM,
          }}
        >
          {use.audience}
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 78,
            lineHeight: 1.02,
            color: CREAM,
            marginTop: 14,
          }}
        >
          {use.label}
        </div>
      </div>

      <MetreRule local={local} meters={use.meters} />
    </AbsoluteFill>
  );
}

export function FabricFilm({ image, fabricName, uses }: FabricFilmProps) {
  const frame = useCurrentFrame();
  const total = filmDuration(uses.length);

  // Le tissu respire lentement sur toute la boucle, et revient exactement à sa
  // position de départ pour que le raccord ne se voie pas.
  const zoom = interpolate(frame, [0, total / 2, total], [1.06, 1.16, 1.06], {
    ...clamp,
    easing: EASE_IO,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#141414", overflow: "hidden" }}>
      <Img
        src={image}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          scale: zoom,
          transformOrigin: "center",
        }}
      />
      {/* Voile : le trait blanc doit rester lisible sur n'importe quel tissu. */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(20,20,20,0.92) 0%, rgba(20,20,20,0.55) 45%, rgba(20,20,20,0.35) 100%)",
        }}
      />

      {/* En-tête permanent */}
      <div
        style={{
          position: "absolute",
          top: 64,
          left: 72,
          right: 72,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          fontFamily: SANS,
        }}
      >
        <span
          style={{
            fontSize: 20,
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: CREAM,
          }}
        >
          Le tissu en mouvement
        </span>
        <span style={{ fontSize: 22, color: CREAM_DIM }}>{fabricName}</span>
      </div>

      {uses.map((use, i) => {
        const local = actLocal(frame, i * ACT, total);
        return (
          <AbsoluteFill key={use.label} style={{ opacity: actOpacity(local) }}>
            <Act local={local} use={use} />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
}
