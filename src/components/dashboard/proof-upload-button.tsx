"use client";

import { useRef, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { T } from "@/components/i18n/t";
import { uploadOrderProof, type ProofKind } from "@/lib/actions/order-workflow";
import { translateNow } from "@/lib/i18n/translate";

/** Côté le plus long, en pixels : assez pour lire un tissu, léger pour le réseau. */
const MAX_SIDE = 1600;

/** Réduit la photo dans le navigateur avant l'envoi (JPEG). */
function compress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Photo illisible."));
    };
    img.src = url;
  });
}

/**
 * Preuve photo d'une étape (envoi, réception, tissu avant/après découpe).
 * Horodatée par le serveur, visible du client, du pro et de JALOFA.
 */
export function ProofUploadButton({
  orderId,
  kind,
  label,
}: {
  orderId: string;
  kind: ProofKind;
  label: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const send = (file: File) =>
    startTransition(async () => {
      try {
        const res = await uploadOrderProof(orderId, kind, await compress(file));
        if (res.ok) toast.success(translateNow("Photo enregistrée."));
        else toast.error(translateNow(res.error));
      } catch (e) {
        toast.error(translateNow(e instanceof Error ? e.message : "Photo illisible."));
      }
    });

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-12 rounded-xl"
        disabled={isPending}
        onClick={() => input.current?.click()}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
        <T>{label}</T>
      </Button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) send(file);
        }}
      />
    </>
  );
}
