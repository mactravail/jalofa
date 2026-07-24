"use client";

import { Player } from "@remotion/player";

import {
  FabricFilm,
  FILM_FPS,
  FILM_HEIGHT,
  FILM_WIDTH,
  filmDuration,
  type FabricFilmProps,
} from "@/components/catalog/remotion/fabric-film";

// Le <Player> et toute la dépendance Remotion (moteur de rendu + composition)
// sont isolés dans CE module pour qu'un `import()` dynamique les découpe dans un
// chunk chargé à la demande — jamais dans le bundle initial de la fiche tissu,
// et jamais sur un téléphone d'entrée de gamme (cf. fabric-showcase.tsx, qui ne
// le monte que sur grand écran capable). Aucun autre fichier ne doit importer
// `remotion`/`@remotion/*` de façon statique.

export default function FabricFilmPlayer(props: FabricFilmProps) {
  return (
    <Player
      component={FabricFilm}
      inputProps={props}
      durationInFrames={filmDuration(props.uses.length)}
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
