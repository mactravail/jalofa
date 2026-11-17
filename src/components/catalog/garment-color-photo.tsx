"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

import { GarmentGallery } from "@/components/catalog/garment-gallery";

/**
 * La couleur choisie dans le bloc d'achat montre sa photo dans la grande
 * galerie de la fiche. Les deux sont voisins dans une page serveur : ce
 * contexte les relie. Sans fournisseur, le bloc d'achat ne fait rien de plus.
 */
type ColorPhoto = {
  photo: string | null;
  setPhoto: (photo: string | null) => void;
  /** Le client vient de toucher une couleur avec photo : la lui montrer. */
  reveal: () => void;
  revealSeq: number;
};

const ColorPhotoContext = createContext<ColorPhoto | null>(null);

export function GarmentColorPhotoProvider({ children }: { children: ReactNode }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [revealSeq, setRevealSeq] = useState(0);
  const reveal = useCallback(() => setRevealSeq((n) => n + 1), []);
  return (
    <ColorPhotoContext.Provider value={{ photo, setPhoto, reveal, revealSeq }}>
      {children}
    </ColorPhotoContext.Provider>
  );
}

/** Pour le bloc d'achat : la galerie reliée, ou `null` s'il n'y en a pas. */
export function useGarmentColorPhoto(): Pick<ColorPhoto, "setPhoto" | "reveal"> | null {
  const ctx = useContext(ColorPhotoContext);
  return ctx ? { setPhoto: ctx.setPhoto, reveal: ctx.reveal } : null;
}

/** La galerie de la fiche, qui ouvre sur la photo de la couleur choisie. */
export function ColorAwareGarmentGallery(props: ComponentProps<typeof GarmentGallery>) {
  const ctx = useContext(ColorPhotoContext);
  const photo = ctx?.photo ?? null;
  const revealSeq = ctx?.revealSeq ?? 0;
  const ref = useRef<HTMLDivElement>(null);

  // Sur téléphone, la galerie est au-dessus du bloc d'achat, hors de vue : on
  // remonte jusqu'à elle pour que le client voie la couleur qu'il a touchée.
  useEffect(() => {
    if (revealSeq === 0) return;
    const el = ref.current;
    if (!el) return;
    const { top, bottom } = el.getBoundingClientRect();
    const hidden = top < 0 || bottom > window.innerHeight;
    if (hidden && bottom < window.innerHeight * 0.75) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [revealSeq]);

  const photos = photo ? [photo, ...props.photos.filter((p) => p !== photo)] : props.photos;
  // Remonter la galerie la ramène sur la première vue : la photo de la couleur.
  return (
    <div ref={ref} className="scroll-mt-20">
      <GarmentGallery key={photo ?? "default"} {...props} photos={photos} />
    </div>
  );
}
