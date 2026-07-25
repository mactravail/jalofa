"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { createInspirationPost } from "@/lib/actions/inspiration";
import {
  INSPIRATION_MAKER_KINDS,
  INSPIRATION_MAKER_KIND_LABELS,
  type InspirationMakerKind,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MAX_UPLOAD_BYTES, resizeImage } from "@/lib/image";

const MAX_PHOTOS = 3;

type Picked = { file: File; url: string };

/** Placeholder du nom, adapté à la provenance choisie. */
const MAKER_NAME_PLACEHOLDER: Record<InspirationMakerKind, string> = {
  tailleur_quartier: "Nom du tailleur / atelier",
  marche: "Nom du marché (ex. Marché HLM)",
  boutique: "Nom de la boutique",
  jalofa: "Nom du tailleur sur JALOFA",
  autre: "Précisez (facultatif)",
};

/**
 * Formulaire de publication d'une tenue dans la galerie « Inspiration ».
 *
 * Le client joint 1 à 3 photos, décrit la tenue, dit qui l'a confectionnée et où
 * le tissu a été acheté (texte libre + lien facultatif vers un tissu du
 * catalogue). Les photos sont réduites dans le navigateur avant l'envoi — un
 * cliché brut dépasse sinon la limite de corps d'une Server Action.
 */
export function InspirationForm({
  fabrics,
}: {
  fabrics: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [photos, setPhotos] = useState<Picked[]>([]);
  const [makerKind, setMakerKind] =
    useState<InspirationMakerKind>("tailleur_quartier");
  const [fabricId, setFabricId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const photosRef = useRef(photos);

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (photos.length === 0) {
      toast.error("Ajoutez au moins une photo de votre tenue.");
      return;
    }
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      // Réduction des photos dans le navigateur avant l'envoi (cf. review-form).
      for (const { file } of photos) {
        const image = await resizeImage(file);
        if (image.size <= MAX_UPLOAD_BYTES) formData.append("photos", image);
      }
      const res = await createInspirationPost(null, formData);
      if (res?.ok) {
        toast.success("Votre tenue est publiée dans l'inspiration !");
        photos.forEach((p) => URL.revokeObjectURL(p.url));
        setPhotos([]);
        setMakerKind("tailleur_quartier");
        setFabricId("");
        setError(null);
        form.reset();
        router.refresh();
      } else {
        setError(res?.error ?? "Une erreur est survenue. Réessayez.");
      }
    });
  }

  const fabricItems: Record<string, string> = {
    "": "Aucun",
    ...Object.fromEntries(fabrics.map((f) => [f.id, f.name])),
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-card space-y-5 rounded-xl border p-4 sm:p-5"
    >
      {error && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {/* Provenance + nom passés en champs cachés (Select Base UI contrôlé). */}
      <input type="hidden" name="maker_kind" value={makerKind} />
      <input type="hidden" name="fabric_id" value={fabricId} />

      <div className="space-y-2">
        <Label>Vos photos</Label>
        <div className="flex flex-wrap items-center gap-2">
          {photos.map((photo, i) => (
            <div
              key={photo.url}
              className="bg-muted relative size-24 shrink-0 overflow-hidden rounded-lg border"
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
              className="text-muted-foreground hover:border-foreground/40 hover:text-foreground flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed transition-colors"
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="insp-garment">Type de vêtement</Label>
          <Input
            id="insp-garment"
            name="garment_label"
            maxLength={80}
            placeholder="Grand boubou, robe, ensemble…"
          />
        </div>
        <div className="space-y-2">
          <Label>Provenance de la tenue</Label>
          <Select
            value={makerKind}
            onValueChange={(v) => setMakerKind(v as InspirationMakerKind)}
            items={INSPIRATION_MAKER_KIND_LABELS}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INSPIRATION_MAKER_KINDS.map((k) => (
                <SelectItem key={k} value={k}>
                  {INSPIRATION_MAKER_KIND_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="insp-maker">
          Qui l&apos;a réalisée / où l&apos;avez-vous eue ?{" "}
          <span className="text-muted-foreground font-normal">(facultatif)</span>
        </Label>
        <Input
          id="insp-maker"
          name="maker_name"
          maxLength={120}
          placeholder={MAKER_NAME_PLACEHOLDER[makerKind]}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="insp-caption">
          Description{" "}
          <span className="text-muted-foreground font-normal">(facultatif)</span>
        </Label>
        <Textarea
          id="insp-caption"
          name="caption"
          rows={3}
          maxLength={1000}
          placeholder="Racontez cette tenue : l'occasion, la coupe, ce que vous aimez…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="insp-fabric-note">
            Où avez-vous acheté le tissu ?{" "}
            <span className="text-muted-foreground font-normal">(facultatif)</span>
          </Label>
          <Input
            id="insp-fabric-note"
            name="fabric_note"
            maxLength={160}
            placeholder="Ex. Marché HLM, Dakar"
          />
        </div>
        {fabrics.length > 0 && (
          <div className="space-y-2">
            <Label>
              Ou reliez un tissu du catalogue{" "}
              <span className="text-muted-foreground font-normal">
                (facultatif)
              </span>
            </Label>
            <Select
              value={fabricId}
              onValueChange={(v) => setFabricId(v as string)}
              items={fabricItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun</SelectItem>
                {fabrics.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Button type="submit" disabled={isPending || photos.length === 0}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Publier ma tenue
      </Button>
    </form>
  );
}
