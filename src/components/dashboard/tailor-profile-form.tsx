"use client";

import { useState, useTransition } from "react";
import { ImagePlus, Loader2, Scissors, Tag, X } from "lucide-react";
import { toast } from "sonner";

import { saveTailorProfile } from "@/lib/actions/tailors";
import { MAX_UPLOAD_BYTES, resizeImage } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Tailor } from "@/lib/types";

// La photo déjà enregistrée, ou un fichier fraîchement choisi portant l'URL
// objet qui sert à le prévisualiser (révoquée quand la photo est remplacée).
type Photo =
  | { kind: "existing"; url: string }
  | { kind: "new"; file: File; url: string }
  | null;

export function TailorProfileForm({ tailor }: { tailor: Tailor }) {
  const [photo, setPhoto] = useState<Photo>(
    tailor.cover_url ? { kind: "existing", url: tailor.cover_url } : null,
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

      const res = await saveTailorProfile(null, formData);
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
                <Scissors className="size-8" />
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
          defaultValue={tailor.shop_name ?? ""}
          placeholder="Ex. Atelier Fatou Couture"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Ville</Label>
        <Input
          id="city"
          name="city"
          defaultValue={tailor.city ?? ""}
          placeholder="Ex. Dakar"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Présentation</Label>
        <Textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={tailor.bio ?? ""}
          placeholder="Votre spécialité, votre expérience, vos finitions…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="base_price">Prix de confection dès (FCFA)</Label>
          <Input
            id="base_price"
            name="base_price"
            type="number"
            min={0}
            step={500}
            defaultValue={tailor.base_price}
            placeholder="15000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avg_delivery_days">Délai moyen (jours)</Label>
          <Input
            id="avg_delivery_days"
            name="avg_delivery_days"
            type="number"
            min={1}
            max={365}
            step={1}
            defaultValue={tailor.avg_delivery_days}
            placeholder="7"
          />
        </div>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="free_delivery"
          defaultChecked={tailor.free_delivery}
          className="accent-primary mt-0.5 size-4 rounded"
        />
        <span>
          J&apos;offre la livraison à mes clients
          <span className="text-muted-foreground block text-xs">
            Affiché sur votre fiche publique. À la caisse, la livraison à
            domicile n&apos;est pas facturée au client pour les tenues que vous
            confectionnez.
          </span>
        </span>
      </label>

      {/* « À partir de » — le prix de confection saisi ci-dessus est un prix de
          départ. Le client qui prend une création telle quelle le paie ; s'il la
          personnalise, il reçoit un devis (prix final fixé depuis « À traiter »).
          Plus de réglage « prix sur demande » : le devis à la personnalisation
          est désormais le fonctionnement par défaut, pour tous les tailleurs. */}
      <div className="bg-muted/40 flex items-start gap-3 rounded-lg border border-dashed p-3 text-sm">
        <Tag className="text-muted-foreground mt-0.5 size-4 shrink-0" />
        <p className="text-muted-foreground text-xs">
          <span className="text-foreground font-medium">Prix « à partir de ».</span>{" "}
          Le prix de confection ci-dessus est un tarif de départ. Personnalisée,
          la tenue passe par un devis : vous en fixez le prix final depuis
          « À traiter ».
        </p>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={tailor.is_active}
          className="accent-primary mt-0.5 size-4 rounded"
        />
        <span>
          Afficher ma boutique dans l&apos;annuaire
          <span className="text-muted-foreground block text-xs">
            Décochez pour retirer votre fiche publique le temps de la compléter.
            Les clients ne pourront pas vous trouver ni commander tant qu&apos;elle
            est masquée.
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
