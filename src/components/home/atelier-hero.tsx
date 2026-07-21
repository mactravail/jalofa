"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Player } from "@remotion/player";

import {
  AtelierFilm,
  FILM_DURATION,
  FILM_FPS,
  FILM_HEIGHT,
  FILM_WIDTH,
} from "@/components/home/remotion/atelier-film";

// Le film « L'Atelier en mouvement » dans son cadre éditorial. Le <Player>
// (Remotion) n'est monté qu'après hydratation et jamais si l'utilisateur a
// demandé moins d'animations : dans les deux cas un poster fixe (dernier plan
// du film) reste affiché — c'est aussi le LCP, peint immédiatement.

export function AtelierHero() {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) setPlaying(true);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[26rem] lg:max-w-none">
      {/* Halo */}
      <div className="bg-foreground/15 absolute -inset-6 -z-10 rounded-[3rem] blur-3xl" />

      <div className="ring-foreground/10 relative aspect-4/5 overflow-hidden rounded-[2rem] bg-[#141414] shadow-2xl ring-1">
        {/* Poster = fond permanent (LCP + repli reduced-motion) */}
        <Image
          src="/models/grand-boubou.jpg"
          alt="Grand boubou sur mesure cousu par un tailleur JALOFA"
          fill
          priority
          sizes="(max-width: 1024px) 90vw, 40vw"
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-[#141414]/20" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-[#f4f4f4]">
          <p className="text-[0.7rem] font-semibold tracking-[0.35em] text-white uppercase">
            L&apos;Atelier
          </p>
          <p className="mt-1 font-serif text-2xl">Sur mesure, livré chez vous.</p>
        </div>

        {/* Le film, en fondu par-dessus le poster une fois prêt */}
        {playing && (
          <div className="animate-in fade-in absolute inset-0 duration-1000">
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
          </div>
        )}

        {/* Pastille « lecture en direct » */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 backdrop-blur">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-white" />
          </span>
          <span className="text-[0.6rem] font-semibold tracking-wide text-white/90 uppercase">
            {playing ? "Film" : "Aperçu"}
          </span>
        </div>
      </div>
    </div>
  );
}
