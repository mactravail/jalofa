"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";

import type { ReviewFormState } from "@/lib/actions/reviews";
import { MAX_UPLOAD_BYTES, resizeImage } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MAX_PHOTOS = 3;

type Picked = { file: File; url: string };

type ReviewAction = (
  prev: ReviewFormState,
  formData: FormData,
) => Promise<ReviewFormState>;

/**
 * Formulaire d'avis partagé (tailleur & vendeur) : note en étoiles, commentaire
 * et jusqu'à 3 photos. Chaque photo est redimensionnée dans le navigateur avant
 * l'envoi — un cliché de téléphone brut dépasse sinon la limite de corps d'une
 * Server Action. Les champs propres à la cible (`tailor_id`, `vendor_id`…) sont
 * passés en `hidden`.
 */
export function ReviewForm({
  action,
  hidden,
  description,
  placeholder,
}: {
  action: ReviewAction;
  hidden: Record<string, string>;
  description: string;
  placeholder: string;
}) {
  const [state, formAction, isPending] = useActionState<ReviewFormState, FormData>(
    action,
    null,
  );
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [photos, setPhotos] = useState<Picked[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Suit les photos courantes pour libérer leurs URLs au démontage sans
  // révoquer celles encore affichées à chaque changement.
  const photosRef = useRef(photos);
  const submitted = state?.ok === true;

  useEffect(() => {
    if (state?.ok) toast.success("Merci ! Votre avis a été publié.");
  }, [state]);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url));
  }, []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) return;
    const next = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, room)
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // On saute silencieusement toute photo qui reste trop lourde après réduction.
    for (const { file } of photos) {
      const image = await resizeImage(file);
      if (image.size <= MAX_UPLOAD_BYTES) formData.append("photos", image);
    }
    formAction(formData);
  }

  if (submitted) {
    return (
      <div className="bg-primary/5 border-primary/30 rounded-xl border px-4 py-6 text-center text-sm">
        Merci d&apos;avoir partagé votre expérience !
      </div>
    );
  }

  const active = hover || rating;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card space-y-4 rounded-xl border p-4"
    >
      <div>
        <h3 className="font-semibold">Laisser un avis</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      {state && !state.ok && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {state.error}
        </p>
      )}

      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input type="hidden" name="rating" value={rating} />

      <div className="space-y-2">
        <Label>Votre note</Label>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {Array.from({ length: 5 }, (_, i) => {
            const value = i + 1;
            return (
              <button
                key={value}
                type="button"
                aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                onMouseEnter={() => setHover(value)}
                onClick={() => setRating(value)}
                className="rounded-sm p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "size-7",
                    value <= active
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-comment">Votre commentaire (facultatif)</Label>
        <Textarea
          id="review-comment"
          name="comment"
          rows={3}
          maxLength={1000}
          placeholder={placeholder}
        />
      </div>

      <div className="space-y-2">
        <Label>Vos photos (facultatif)</Label>
        <div className="flex flex-wrap items-center gap-2">
          {photos.map((photo, i) => (
            <div
              key={photo.url}
              className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-lg border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label="Retirer cette photo"
                className="bg-foreground/70 text-background absolute right-1 top-1 flex size-5 items-center justify-center rounded-full transition-colors hover:bg-foreground"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}

          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-muted-foreground hover:border-foreground/40 hover:text-foreground flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed transition-colors"
            >
              <ImagePlus className="size-5" />
              <span className="text-[10px]">Ajouter</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <p className="text-muted-foreground text-xs">
          Jusqu&apos;à {MAX_PHOTOS} photos. Elles sont redimensionnées
          automatiquement.
        </p>
      </div>

      <Button type="submit" disabled={isPending || rating === 0}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Publier mon avis
      </Button>
    </form>
  );
}
