"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { canPlayHeroVideo } from "@/lib/motion-capability";
import { cn } from "@/lib/utils";

// Le sujet se déplace dans la moitié gauche du plan : sur un écran vertical, on
// recadre de ce côté plutôt qu'au centre, qui ne montrerait que le rideau noir.
const FRAMING = "object-[35%_center] md:object-center";

/**
 * Fond vidéo du hero : l'image fixe s'affiche tout de suite, la vidéo apparaît
 * par-dessus dès qu'elle joue. `preload="none"` + lecture lancée ici : rien n'est
 * téléchargé sur les appareils qui restent sur l'image (voir `canPlayHeroVideo`).
 */
export function HeroVideo({ poster, alt }: { poster: string; alt: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video || !canPlayHeroVideo()) return;

    const start = () => {
      // React ne pose pas `muted` dans le HTML serveur ; sans lui, pas d'autoplay.
      video.muted = true;
      video.play().catch(() => {
        // Lecture refusée (mode économie d'énergie…) : l'image fixe reste.
      });
    };

    // La vidéo passe après le reste de la page : elle ne doit pas lui voler de débit.
    if (document.readyState === "complete") {
      start();
      return;
    }
    window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  return (
    <>
      <Image
        src={poster}
        alt={alt}
        fill
        preload
        sizes="100vw"
        className={cn("object-cover", FRAMING)}
      />
      <video
        ref={ref}
        aria-hidden
        tabIndex={-1}
        muted
        loop
        playsInline
        preload="none"
        onPlaying={() => setPlaying(true)}
        className={cn(
          "absolute inset-0 size-full object-cover transition-opacity duration-700",
          FRAMING,
          playing ? "opacity-100" : "opacity-0",
        )}
      >
        <source src="/videos/hero-mobile.mp4" type="video/mp4" media="(max-width: 767px)" />
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>
    </>
  );
}
