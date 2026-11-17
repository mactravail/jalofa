"use client";

import { createContext, useContext, useState, type ComponentProps, type ReactNode } from "react";

import { GarmentGallery } from "@/components/catalog/garment-gallery";

/**
 * La couleur choisie dans le bloc d'achat montre sa photo dans la grande
 * galerie de la fiche. Les deux sont voisins dans une page serveur : ce
 * contexte les relie. Sans fournisseur, le bloc d'achat ne fait rien de plus.
 */
const ColorPhotoContext = createContext<{
  photo: string | null;
  setPhoto: (photo: string | null) => void;
} | null>(null);

export function GarmentColorPhotoProvider({ children }: { children: ReactNode }) {
  const [photo, setPhoto] = useState<string | null>(null);
  return (
    <ColorPhotoContext.Provider value={{ photo, setPhoto }}>{children}</ColorPhotoContext.Provider>
  );
}

/** Pour le bloc d'achat : afficher (ou retirer) la photo de la couleur choisie. */
export function useSetGarmentColorPhoto(): ((photo: string | null) => void) | null {
  return useContext(ColorPhotoContext)?.setPhoto ?? null;
}

/** La galerie de la fiche, qui ouvre sur la photo de la couleur choisie. */
export function ColorAwareGarmentGallery(props: ComponentProps<typeof GarmentGallery>) {
  const photo = useContext(ColorPhotoContext)?.photo ?? null;
  const photos = photo ? [photo, ...props.photos.filter((p) => p !== photo)] : props.photos;
  // Remonter la galerie la ramène sur la première vue : la photo de la couleur.
  return <GarmentGallery key={photo ?? "default"} {...props} photos={photos} />;
}
