"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShoppingBag, Wand2 } from "lucide-react";

import { SizePicker, useAddAsIs, type AsIsPreset } from "@/components/catalog/garment-as-is";
import { FabricPicker } from "@/components/catalog/garment-personalise";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/constants";
import type { Fabric } from "@/lib/types";
import { cn } from "@/lib/utils";

type Mode = "as_is" | "custom";

// Le bloc d'achat d'une fiche vêtement. UN SEUL bouton : le client choisit
// d'abord comment il le veut (« Tel quel » ou « Sur mesure »), et le bouton
// suit ce choix. Deux boutons côte à côte prêtaient à confusion.
//
// - Tel quel  : on ne choisit que la taille → « Ajouter au panier ».
// - Sur mesure : on choisit le tissu → « Personnaliser » (configurateur, puis
//   demande de devis : le prix final est fixé par le tailleur).
//
// Pas d'inscription avant : le compte client est créé à la caisse (ou au
// récap du devis) avec un mot de passe — cf. `ensureClientAccount`.
export function GarmentBuyBox({
  preset,
  presentedIn,
  fabrics,
  orderParams,
  initialFabricId,
}: {
  preset: AsIsPreset;
  /** Nom du tissu dans lequel le modèle est présenté. */
  presentedIn?: string | null;
  fabrics: Fabric[];
  /** Query string du configurateur, sans `fabric` (type / model / tailor). */
  orderParams: string;
  /** Tissu déjà retenu en amont (ex. arrivé de /tissus) → ouvre « Sur mesure ». */
  initialFabricId?: string | null;
}) {
  const router = useRouter();
  const addAsIs = useAddAsIs(preset);
  const [mode, setMode] = useState<Mode>(initialFabricId ? "custom" : "as_is");
  const [size, setSize] = useState<string | null>(null);
  const [fabricId, setFabricId] = useState<string | null>(
    initialFabricId ?? fabrics[0]?.id ?? null,
  );

  const onCta = () => {
    if (mode === "as_is") {
      addAsIs(size);
      return;
    }
    router.push(
      fabricId
        ? `/commande/nouvelle?${orderParams}&fabric=${fabricId}`
        : `/commande/nouvelle?${orderParams}`,
    );
  };

  const options: { key: Mode; label: string; hint: string }[] = [
    { key: "as_is", label: "Tel quel", hint: "Juste votre taille" },
    { key: "custom", label: "Sur mesure", hint: "Votre tissu, votre style" },
  ];

  return (
    <div className="bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-muted-foreground text-sm">
          {mode === "as_is" ? "Prix" : "À partir de"}
        </span>
        <span className="text-primary text-xl font-bold whitespace-nowrap">
          {formatPrice(preset.total)}
        </span>
      </div>

      {/* Comment le voulez-vous ? — un choix, pas un second bouton d'achat. */}
      <div role="radiogroup" aria-label="Comment le voulez-vous ?" className="mt-4 grid grid-cols-2 gap-2">
        {options.map((o) => {
          const active = mode === o.key;
          return (
            <button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMode(o.key)}
              className={cn(
                "rounded-xl border-2 px-3 py-2.5 text-left transition-colors",
                active ? "border-primary bg-primary/5" : "hover:bg-muted border-border",
              )}
            >
              <span className="block text-sm font-semibold">{o.label}</span>
              <span className="text-muted-foreground block text-xs">{o.hint}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {mode === "as_is" ? (
          <SizePicker
            value={size}
            onChange={setSize}
            note={
              preset.note ??
              `Le modèle présenté${presentedIn ? `, en ${presentedIn}` : ""}, ajusté à votre taille.`
            }
          />
        ) : (
          <>
            <FabricPicker fabrics={fabrics} value={fabricId} onChange={setFabricId} />
            <p className="text-muted-foreground mt-3 text-xs">
              Ensuite : le style, le tailleur et vos mesures. Vous recevez un devis
              gratuit, sans engagement.
            </p>
          </>
        )}
      </div>

      <Button size="lg" className="mt-5 h-12 w-full text-base" onClick={onCta}>
        {mode === "as_is" ? (
          <>
            <ShoppingBag className="size-4" /> Ajouter au panier
          </>
        ) : (
          <>
            <Wand2 className="size-4" /> Personnaliser
          </>
        )}
      </Button>
      <p className="text-muted-foreground mt-2 text-center text-xs">
        Pas besoin de créer un compte
      </p>
    </div>
  );
}
