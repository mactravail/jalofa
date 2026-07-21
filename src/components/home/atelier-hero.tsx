"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// Le film « L'Atelier en mouvement » est purement décoratif : le poster ci-dessous
// est le LCP, peint immédiatement, et sert aussi de repli permanent. Le moteur
// Remotion (lourd) n'est chargé qu'à la demande, via un `import()` dynamique sans
// SSR — il ne pèse donc pas sur le bundle initial de la home.
const AtelierFilmPlayer = dynamic(
  () => import("@/components/home/remotion/atelier-film-player"),
  { ssr: false },
);

// On ne charge/joue le film que si l'appareil peut se le permettre sans nuire à
// l'expérience — sinon (mobile, économiseur de données, reduced-motion, machine
// modeste) on s'en tient au poster : zéro octet Remotion téléchargé, zéro boucle
// 30 fps à faire tourner. Cible : les téléphones d'entrée de gamme (marché
// sénégalais) ne paient jamais pour la décoration.
function canPlayFilm() {
  if (typeof window === "undefined") return false;
  const desktopSteady = window.matchMedia(
    "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
  ).matches;
  if (!desktopSteady) return false;

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData) return false;
  if ((nav.hardwareConcurrency ?? 8) < 4) return false;
  if ((nav.deviceMemory ?? 8) < 4) return false;
  return true;
}

export function AtelierHero() {
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canPlayFilm()) return;

    const el = frameRef.current;
    if (!el) return;

    // Le film n'est monté que lorsque le cadre est (proche d')à l'écran, et
    // démonté dès qu'il le quitte : la boucle de rendu s'arrête, on rend la
    // main au thread principal et on ménage la batterie.
    const io = new IntersectionObserver(
      ([entry]) => setPlaying(entry.isIntersecting),
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[26rem] lg:max-w-none">
      {/* Halo */}
      <div className="bg-foreground/15 absolute -inset-6 -z-10 rounded-[3rem] blur-3xl" />

      <div
        ref={frameRef}
        className="ring-foreground/10 relative aspect-4/5 overflow-hidden rounded-[2rem] bg-[#141414] shadow-2xl ring-1"
      >
        {/* Poster = fond permanent (LCP + repli mobile / reduced-motion) */}
        <Image
          src="/models/grand-boubou.jpg"
          alt="Grand boubou sur mesure cousu par un tailleur JALOFA"
          fill
          preload
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
            <AtelierFilmPlayer />
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
