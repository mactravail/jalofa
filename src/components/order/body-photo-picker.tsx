"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";

import { fileToStyleRef, STYLE_REF_ERROR_LABELS, type StyleRef } from "@/lib/style-refs";
import { useT } from "@/components/i18n/locale-provider";

/**
 * Avec une taille standard (S, M, L…), le client qui ne connaît pas ses mesures
 * peut montrer sa silhouette au tailleur : une photo de lui, ou d'une personne
 * qui lui ressemble. Facultatif. La photo est compressée dans le navigateur
 * (~100 Ko) avant de voyager dans le brouillon, puis dans le panier.
 */
export function BodyPhotoPicker({
  photo,
  onChange,
}: {
  photo: StyleRef | null;
  onChange: (photo: StyleRef | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const t = useT();
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const result = await fileToStyleRef(file);
    setBusy(false);
    if (result.ok) onChange(result.ref);
    else setError(`${t("Cette photo")} ${t(STYLE_REF_ERROR_LABELS[result.error])}.`);
  }

  return (
    <div className="rounded-xl border p-4">
      <p className="font-semibold">{t("Vous ne connaissez pas vos mesures ?")}</p>
      <p className="text-muted-foreground mt-0.5 text-sm">
        {t("Ajoutez une photo de vous, debout, en entier. Ou la photo d'une personne qui a votre corps. Le tailleur ajuste mieux.")}
      </p>

      {photo ? (
        <div className="mt-3 flex items-end gap-3">
          <div className="relative w-28">
            {/* Data URL locale : rien à optimiser. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.dataUrl}
              alt={t("Votre photo")}
              className="aspect-3/4 w-full rounded-lg border object-cover object-top"
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label={t("Retirer la photo")}
              className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full border bg-black text-white"
            >
              <X className="size-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
          >
            {t("Changer")}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="mt-3 inline-flex h-12 items-center gap-2 rounded-lg border px-5 text-sm font-semibold transition-colors hover:bg-white hover:text-black disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}
          {t("Ajouter une photo")}
        </button>
      )}

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <p className="text-muted-foreground mt-3 text-xs">
        {t("Facultatif. Seul votre tailleur la voit, et seulement après votre paiement.")}
      </p>

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
    </div>
  );
}
