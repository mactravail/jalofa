"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ruler, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import { STANDARD_SIZES, formatPrice } from "@/lib/constants";
import { cn } from "@/lib/utils";

// « Prendre le vêtement tel quel » : le client accepte le modèle tel qu'il est
// présenté — même tissu, mêmes finitions — et ne choisit QUE sa taille. Tout le
// reste (tissu, finitions, prix, tailleur) est figé par la page qui monte ce
// composant, si bien qu'il n'y a ici qu'un sélecteur de taille et l'ajout au
// panier. Le parcours « personnalisé » vit ailleurs (configurateur ou commande).
export type AsIsPreset = {
  type: "full" | "own_fabric";
  modelId: string;
  modelName: string;
  image: string | null;
  styleDetails: Record<string, string>;
  fabricId: string | null;
  fabricMeters: number | null;
  tailorId: string | null;
  tailorName: string | null;
  /** Le tailleur figé par ce preset offre la livraison. Absent = pas de tailleur
   *  encore lié (ex. boubou pris tel quel), donc livraison non offerte. */
  freeDelivery?: boolean;
  /** Récap court affiché sur la ligne du panier. */
  personalisation: { group: string; option: string }[];
  /** Spécifications complètes transmises au tailleur (notes). */
  notesSpec: string;
  fabricPrice: number;
  tailoringPrice: number;
  total: number;
  /** Sous-titre de la ligne panier (ex. « Modèle présenté · à votre taille »). */
  subtitle?: string;
  /** Phrase d'accompagnement au-dessus du sélecteur de taille. */
  note?: string;
};

export function GarmentAsIs({ preset }: { preset: AsIsPreset }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [size, setSize] = useState<string | null>(null);

  const addToCart = () => {
    if (!size) {
      toast.error("Choisissez d'abord votre taille");
      return;
    }
    addItem({
      type: preset.type,
      modelId: preset.modelId,
      styleSlug: null,
      styleDetails: preset.styleDetails,
      styleRefs: [],
      fabricId: preset.fabricId,
      fabricMeters: preset.fabricMeters,
      tailorId: preset.tailorId,
      measurement: { mode: "standard", standard_size: size, values: {} },
      notes: preset.notesSpec,
      title: preset.modelName,
      subtitle: preset.subtitle ?? "Modèle présenté · à votre taille",
      image: preset.image,
      styleName: null,
      tailorName: preset.tailorName,
      freeDelivery: preset.freeDelivery ?? false,
      personalisation: preset.personalisation,
      measurementLabel: `Taille ${size}`,
      unitFabricPrice: preset.fabricPrice,
      unitTailoringPrice: preset.tailoringPrice,
      unitPrice: preset.total,
    });
    toast.success(`${preset.modelName} ajouté au panier`, {
      description: `Taille ${size} · ${formatPrice(preset.total)}`,
    });
    router.push("/panier");
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Ruler className="text-primary size-4" /> Choisissez votre taille
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {preset.note ??
            "Même tissu et mêmes finitions que le modèle présenté — le tailleur l'ajuste à votre taille."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {STANDARD_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              aria-pressed={size === s}
              className={cn(
                "size-12 rounded-lg border text-sm font-semibold transition-colors",
                size === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Libellé seul : le prix est déjà annoncé au-dessus, dans l'en-tête de la
          carte « Le prendre tel quel ». */}
      <Button size="lg" className="h-11 w-full text-base" onClick={addToCart}>
        <ShoppingBag className="size-4" /> Ajouter au panier
      </Button>
    </div>
  );
}
