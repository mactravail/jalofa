"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fileToStyleRef, STYLE_REF_ERROR_LABELS, type StyleRef } from "@/lib/style-refs";
import { useT } from "@/components/i18n/locale-provider";

/**
 * Broderie « Je choisis » (récap) : le client montre la broderie qu'il veut
 * (une photo), la décrit avec ses mots et donne sa couleur. Le tailleur reçoit
 * tout avec la demande de devis. Photo compressée (~100 Ko) dans le navigateur.
 */
export function EmbroideryRequest({
  photo,
  note,
  color,
  onChange,
}: {
  photo: StyleRef | null;
  note: string;
  color: string;
  onChange: (patch: {
    embroideryPhoto?: StyleRef | null;
    embroideryNote?: string;
    embroideryColor?: string;
  }) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useT();

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const result = await fileToStyleRef(file);
    setBusy(false);
    if (result.ok) onChange({ embroideryPhoto: result.ref });
    else setError(`${t("Cette photo")} ${t(STYLE_REF_ERROR_LABELS[result.error])}.`);
  }

  return (
    <section className="space-y-4 rounded-xl border p-4">
      <div>
        <h3 className="text-sm font-semibold">{t("Votre broderie")}</h3>
        <p className="text-muted-foreground text-xs">
          {t("Montrez au tailleur la broderie que vous voulez : une photo, quelques mots et la couleur.")}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>{t("Photo de la broderie")}</Label>
        {photo ? (
          <div className="relative w-32">
            {/* Data URL locale : rien à optimiser. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.dataUrl}
              alt={t("Photo de la broderie")}
              className="aspect-square w-full rounded-lg border object-cover"
            />
            <button
              type="button"
              onClick={() => onChange({ embroideryPhoto: null })}
              aria-label={t("Retirer la photo")}
              className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full border bg-black text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="hover:border-foreground/40 flex h-28 w-32 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-sm transition-colors"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}
            {t("Ajouter une photo")}
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {error && <p className="text-destructive text-xs">{error}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="embroidery-note">{t("Comment voulez-vous la broderie ?")}</Label>
        <Textarea
          id="embroidery-note"
          value={note}
          maxLength={500}
          onChange={(e) => onChange({ embroideryNote: e.target.value })}
          placeholder={t("Ex. broderie autour du col et au bout des manches, motif fleuri")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="embroidery-color">{t("Couleur de la broderie")}</Label>
        <Input
          id="embroidery-color"
          value={color}
          maxLength={80}
          onChange={(e) => onChange({ embroideryColor: e.target.value })}
          placeholder={t("Ex. doré, argent, blanc")}
        />
      </div>
    </section>
  );
}
