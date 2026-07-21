"use client";

import { Player } from "@remotion/player";

import {
  AtelierFilm,
  FILM_DURATION,
  FILM_FPS,
  FILM_HEIGHT,
  FILM_WIDTH,
} from "@/components/home/remotion/atelier-film";

// Le <Player> et toute la dépendance Remotion (lourde : moteur de rendu +
// composition) sont isolés dans CE module pour qu'un `import()` dynamique les
// découpe dans un chunk chargé à la demande — jamais dans le bundle initial, et
// jamais sur mobile (cf. atelier-hero.tsx, qui ne le monte que sur grand écran
// capable). Aucun autre fichier ne doit importer `remotion`/`@remotion/*` de
// façon statique, sous peine de réintégrer tout le moteur au bundle de la home.

export default function AtelierFilmPlayer() {
  return (
    <Player
      component={AtelierFilm}
      durationInFrames={FILM_DURATION}
      compositionWidth={FILM_WIDTH}
      compositionHeight={FILM_HEIGHT}
      fps={FILM_FPS}
      autoPlay
      loop
      controls={false}
      clickToPlay={false}
      doubleClickToFullscreen={false}
      spaceKeyToPlayOrPause={false}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
