"use client";

import { useEffect, useState } from "react";
import { Scissors, X } from "lucide-react";

import Link from "@/components/i18n/link";
import { useT } from "@/components/i18n/locale-provider";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import {
  CONFIGURATOR_DRAFT_KEY,
  clearPendingOutfit,
  onPendingOutfitChange,
  readPendingOutfit,
  savePendingOutfit,
  type PendingOutfit,
} from "@/lib/pending-outfit";

/**
 * Rappel flottant : « Vous aviez choisi ce tissu pour votre Agbada ».
 * Deux issues claires — reprendre le sur-mesure là où on l'a laissé, ou
 * acheter le tissu seul — et une croix pour oublier.
 */
export function PendingOutfitReminder() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [pending, setPending] = useState<PendingOutfit | null>(null);

  useEffect(() => {
    const sync = () => setPending(readPendingOutfit());
    sync();
    return onPendingOutfitChange(sync);
  }, []);

  if (!pending) return null;
  // Pas de rappel là où l'on est déjà en train d'agir sur ce tissu ou de payer.
  if (
    pathname.startsWith(`/tissus/${pending.fabricId}`) ||
    pathname.startsWith("/panier") ||
    pathname.startsWith("/caisse")
  ) {
    return null;
  }

  const resume = () => {
    if (pending.modelId && pending.stepUrl && pending.draft) {
      try {
        sessionStorage.setItem(CONFIGURATOR_DRAFT_KEY, JSON.stringify(pending.draft));
      } catch {
        // Sans brouillon, le configurateur repart du modèle : on y renvoie.
        router.push(`/commande/nouvelle?model=${pending.modelId}&fabric=${pending.fabricId}`);
        return;
      }
      router.push(pending.stepUrl);
      return;
    }
    if (pending.modelId) {
      router.push(`/commande/nouvelle?model=${pending.modelId}&fabric=${pending.fabricId}`);
      return;
    }
    router.push(`/tissus/${pending.fabricId}/tenue`);
  };

  return (
    <div className="fixed inset-x-3 bottom-[calc(var(--spacing-bottom-nav)+0.75rem)] z-40 md:inset-x-auto md:right-5 md:bottom-5 md:w-[380px]">
      <div className="bg-card rounded-2xl border p-3.5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <div className="bg-muted size-14 overflow-hidden rounded-lg">
              {(pending.modelImage ?? pending.fabricImage) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(pending.modelImage ?? pending.fabricImage)!}
                  alt=""
                  className="size-full object-cover"
                />
              )}
            </div>
            {pending.modelImage && pending.fabricImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pending.fabricImage}
                alt=""
                className="border-card absolute -right-1.5 -bottom-1.5 size-7 rounded-full border-2 object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t("Votre tenue vous attend")}</p>
            <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
              {pending.modelName
                ? t("Vous aviez choisi {fabric} pour votre {model}.", {
                    fabric: pending.fabricName,
                    model: pending.modelName,
                  })
                : t("Vous aviez choisi {fabric} pour vous faire coudre une tenue.", {
                    fabric: pending.fabricName,
                  })}
            </p>
          </div>
          <button
            type="button"
            onClick={clearPendingOutfit}
            aria-label={t("Fermer")}
            className="text-muted-foreground hover:text-foreground -mt-1 -mr-1 p-1"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={resume}
            className="bg-foreground text-background hover:bg-foreground/90 flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold"
          >
            <Scissors className="size-3.5" /> {t("Continuer")}
          </button>
          <Link
            href={`/tissus/${pending.fabricId}`}
            className="hover:bg-muted flex h-10 items-center justify-center rounded-lg border text-sm font-medium"
          >
            {t("Acheter le tissu")}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Posé sur « Que coudre avec ce tissu ? » : le tissu est retenu dès l'arrivée. */
export function RememberFabric({
  fabricId,
  fabricName,
  fabricImage,
}: {
  fabricId: string;
  fabricName: string;
  fabricImage: string | null;
}) {
  useEffect(() => {
    savePendingOutfit({
      fabricId,
      fabricName,
      fabricImage,
      modelId: null,
      modelName: null,
      modelImage: null,
      stepUrl: null,
      draft: null,
    });
  }, [fabricId, fabricName, fabricImage]);
  return null;
}
