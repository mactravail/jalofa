"use client";

import { useState, useTransition } from "react";
import { ImagePlus, Loader2, Store, X } from "lucide-react";
import { toast } from "sonner";

import { saveVendorProfile } from "@/lib/actions/vendors";
import { MAX_UPLOAD_BYTES, resizeImage } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Vendor } from "@/lib/types";

// La photo déjà enregistrée, ou un fichier fraîchement choisi portant l'URL
// objet qui sert à le prévisualiser (révoquée quand la photo est remplacée).
type Photo =
  | { kind: "existing"; url: string }
  | { kind: "new"; file: File; url: string }
  | null;

export function VendorProfileForm({ vendor }: { vendor: Vendor }) {
  const [photo, setPhoto] = useState<Photo>(
    vendor.cover_url ? { kind: "existing", url: vendor.cover_url } : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function pickFile(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setPhoto((prev) => {
      if (prev?.kind === "new") URL.revokeObjectURL(prev.url);
      return { kind: "new", file, url: URL.createObjectURL(file) };
    });
    setError(null);
  }

  function removePhoto() {
    setPhoto((prev) => {
      if (prev?.kind === "new") URL.revokeObjectURL(prev.url);
      return null;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const current = photo;

    startTransition(async () => {
      // La photo voyage sous `photo` : l'URL existante à conserver, ou le
      // fichier redimensionné à téléverser. Un cliché brut dépasse la limite du
      // Server Action, d'où le redimensionnement avant envoi.
      if (current?.kind === "existing") {
        formData.set("photo", current.url);
      } else if (current?.kind === "new") {
        const image = await resizeImage(current.file);
        if (image.size > MAX_UPLOAD_BYTES) {
          setError("La photo est trop lourde. Choisissez-en une plus légère.");
          return;
        }
        formData.set("photo", image);
      } else {
        formData.set("photo", "");
      }

      const res = await saveVendorProfile(null, formData);
      if (res?.ok) {
        toast.success("Profil public mis à jour.");
      } else if (res) {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {/* Photo de profil — telle qu'elle apparaît sur la fiche publique. */}
      <div className="space-y-2">
        <Label>Photo de profil</Label>
        <div className="flex items-center gap-4">
          <div className="bg-muted relative size-24 shrink-0 overflow-hidden rounded-full border">
            {photo ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={removePhoto}
                  aria-label="Retirer la photo"
                  className="bg-background/85 text-foreground hover:bg-background absolute top-1 right-1 grid size-5 place-items-center rounded-full shadow-sm"
                >
                  <X className="size-3" />
                </button>
              </>
            ) : (
              <span className="text-muted-foreground flex size-full items-center justify-center">
                <Store className="size-8" />
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="border-input hover:bg-muted inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium">
              <ImagePlus className="size-4" />
              {photo ? "Changer la photo" : "Ajouter une photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={(e) => {
                  pickFile(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <p className="text-muted-foreground text-xs">
              JPEG, PNG ou WebP — redimensionnée automatiquement.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="shop_name">Nom de la boutique</Label>
        <Input
          id="shop_name"
          name="shop_name"
          required
          defaultValue={vendor.shop_name ?? ""}
          placeholder="Ex. Tissus Marché HLM"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Ville</Label>
        <Input
          id="city"
          name="city"
          defaultValue={vendor.city ?? ""}
          placeholder="Ex. Dakar"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Présentation</Label>
        <Textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={vendor.bio ?? ""}
          placeholder="Vos étoffes, votre spécialité, votre marché…"
        />
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="free_delivery"
          defaultChecked={vendor.free_delivery}
          className="accent-primary mt-0.5 size-4 rounded"
        />
        <span>
          J&apos;offre la livraison à mes clients
          <span className="text-muted-foreground block text-xs">
            Affiché sur votre fiche publique. À la caisse, la livraison à
            domicile n&apos;est pas facturée au client pour les tissus que vous
            vendez.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={vendor.is_active}
          className="accent-primary mt-0.5 size-4 rounded"
        />
        <span>
          Afficher ma boutique dans l&apos;annuaire
          <span className="text-muted-foreground block text-xs">
            Décochez pour retirer votre fiche publique le temps de la compléter.
            Les clients ne pourront pas vous trouver tant qu&apos;elle est masquée.
          </span>
        </span>
      </label>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
