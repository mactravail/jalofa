"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import {
  MAX_STYLE_REFS,
  STYLE_REF_ERROR_LABELS,
  fileToStyleRef,
  type StyleRef,
} from "@/lib/style-refs";
import { cn } from "@/lib/utils";

/**
 * Grille d'inspiration de l'étape « Style » : jusqu'à cinq photos que le
 * tailleur recevra avec la commande. Sélection par clic ou glisser-déposer.
 */
export function StyleInspiration({
  refs,
  onChange,
}: {
  refs: StyleRef[];
  onChange: (refs: StyleRef[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const remaining = MAX_STYLE_REFS - refs.length;
  const full = remaining <= 0;

  const addFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      // On tronque à ce qui reste plutôt que de tout refuser : le client qui
      // dépose sept photos en garde cinq et sait pourquoi.
      const accepted = files.slice(0, Math.max(0, MAX_STYLE_REFS - refs.length));
      if (files.length > accepted.length) {
        toast.info(`Maximum ${MAX_STYLE_REFS} photos — les suivantes ont été ignorées.`);
      }
      if (!accepted.length) return;

      setBusy(true);
      try {
        const results = await Promise.all(accepted.map(fileToStyleRef));
        const added = results.flatMap((r) => (r.ok ? [r.ref] : []));
        for (const r of results) {
          if (!r.ok) toast.error(`« ${r.name} » ${STYLE_REF_ERROR_LABELS[r.error]}.`);
        }
        if (added.length) onChange([...refs, ...added]);
      } finally {
        setBusy(false);
      }
    },
    [refs, onChange],
  );

  const remove = (id: string) => onChange(refs.filter((r) => r.id !== id));

  return (
    <section>
      <h3 className="text-base font-semibold tracking-tight">Votre inspiration</h3>
      <p className="text-muted-foreground mt-0.5 text-xs">
        Une tenue vue quelque part, un croquis, une photo à vous — jusqu&apos;à{" "}
        {MAX_STYLE_REFS} photos pour que le tailleur voie ce que vous avez en tête.
      </p>

      <div
        onDragOver={(e) => {
          if (full || busy) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (full || busy) return;
          void addFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "mt-3 grid grid-cols-3 gap-2.5 rounded-xl transition-colors",
          dragging && "ring-primary ring-2 ring-offset-2",
        )}
      >
        {refs.map((ref, i) => (
          <figure
            key={ref.id}
            className="bg-muted/40 group relative aspect-square overflow-hidden rounded-xl border"
          >
            <Image
              src={ref.dataUrl}
              alt={ref.name}
              fill
              sizes="120px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => remove(ref.id)}
              aria-label={`Retirer la photo ${i + 1}`}
              className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-black/55 text-white opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
            >
              <X className="size-3.5" strokeWidth={3} />
            </button>
          </figure>
        ))}

        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className={cn(
              "text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed transition-colors disabled:opacity-60",
              dragging ? "border-primary text-primary" : "border-border/60",
            )}
          >
            {busy ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ImagePlus className="size-5" />
            )}
            <span className="text-[11px] leading-tight">
              {busy ? "Ajout…" : "Ajouter"}
            </span>
          </button>
        )}
      </div>

      <p className="text-muted-foreground mt-2 text-xs" aria-live="polite">
        {full
          ? `${MAX_STYLE_REFS} photos sur ${MAX_STYLE_REFS} — retirez-en une pour en ajouter une autre.`
          : `${refs.length} sur ${MAX_STYLE_REFS} · JPG ou PNG`}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void addFiles(Array.from(e.target.files ?? []));
          // Sinon re-choisir le même fichier après l'avoir retiré ne déclenche
          // aucun change.
          e.target.value = "";
        }}
      />
    </section>
  );
}
