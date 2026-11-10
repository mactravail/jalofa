"use client";

import { useRouter } from "@/lib/i18n/navigation";
import { useMemo, useState } from "react";
import { ShoppingBag, Truck, Wand2 } from "lucide-react";

import { SizePicker, useAddAsIs, type AsIsPreset } from "@/components/catalog/garment-as-is";
import { FabricPicker } from "@/components/catalog/garment-personalise";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/constants";
import { isFabricAvailable } from "@/lib/fabric-metrage";
import { buildGenericAsIsPreset } from "@/lib/garment-preset";
import type { Fabric, GarmentModel, Tailor } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

type Mode = "as_is" | "custom";

/** Un modèle publié par un tailleur : ses tissus et son prix font foi. */
export type TailorOffer = {
  model: GarmentModel;
  photos: string[];
  tailor: Pick<
    Tailor,
    "id" | "shop_name" | "base_price" | "free_delivery" | "free_delivery_zone"
  >;
  /** Les tissus publiés pour ce modèle — le choix du « Tel quel ». */
  asIsFabrics: Fabric[];
  /** Tous les tissus en ligne de ce tailleur — première rangée du « Sur mesure ». */
  tailorFabrics: Fabric[];
};

// Le bloc d'achat d'une fiche vêtement. UN SEUL bouton : le client choisit
// d'abord comment il le veut (« Tel quel » ou « Sur mesure »), et le bouton
// suit ce choix. Deux boutons côte à côte prêtaient à confusion.
//
// - Tel quel  : un tissu du tailleur et la taille → « Ajouter au panier ».
// - Sur mesure : un tissu du tailleur ou d'un autre vendeur → « Personnaliser »
//   (configurateur, puis demande de devis : le prix final est fixé par le tailleur).
//
// Pas d'inscription avant : le compte client est créé à la caisse (ou au
// récap du devis) avec un mot de passe — cf. `ensureClientAccount`.
export function GarmentBuyBox({
  preset,
  presentedIn,
  fabrics: allFabrics,
  orderParams,
  initialFabricId,
  offer,
}: {
  preset: AsIsPreset;
  /** Nom du tissu dans lequel le modèle est présenté. */
  presentedIn?: string | null;
  fabrics: Fabric[];
  /** Query string du configurateur, sans `fabric` (type / model / tailor). */
  orderParams: string;
  /** Tissu déjà retenu en amont (ex. arrivé de /tissus) → ouvre « Sur mesure ». */
  initialFabricId?: string | null;
  /** Absent pour les aperçus du catalogue et les pages dédiées. */
  offer?: TailorOffer;
}) {
  const router = useRouter();
  const t = useT();
  // Un tissu épuisé n'est jamais proposé.
  const fabrics = allFabrics.filter(isFabricAvailable);
  const tailorFabrics = offer?.tailorFabrics.filter(isFabricAvailable) ?? [];
  const carriedFabricId = fabrics.some((f) => f.id === initialFabricId)
    ? initialFabricId
    : null;
  // Sans tissu publié par le tailleur, « Tel quel » n'a rien à proposer.
  const canAsIs = !offer || offer.asIsFabrics.length > 0;
  const [mode, setMode] = useState<Mode>(
    carriedFabricId || !canAsIs ? "custom" : "as_is",
  );
  const [size, setSize] = useState<string | null>(null);
  const [asIsFabricId, setAsIsFabricId] = useState<string | null>(
    offer?.asIsFabrics[0]?.id ?? null,
  );
  // Un tissu sans vendeur ne peut être envoyé par personne : il n'est pas proposé
  // sur le modèle d'un tailleur.
  const otherFabrics = offer
    ? fabrics.filter((f) => f.vendor_id && f.vendor_id !== offer.tailor.id)
    : [];
  const [fabricId, setFabricId] = useState<string | null>(
    carriedFabricId ??
      (offer
        ? (tailorFabrics[0]?.id ?? otherFabrics[0]?.id ?? null)
        : (fabrics[0]?.id ?? null)),
  );

  // Le prix suit le tissu choisi dans le mode courant.
  const activeFabricId = mode === "as_is" ? asIsFabricId : fabricId;
  const activeFabric = fabrics.find((f) => f.id === activeFabricId) ?? null;
  const shownPreset = useMemo(
    () =>
      offer && activeFabric
        ? buildGenericAsIsPreset({
            model: offer.model,
            photos: offer.photos,
            tailor: offer.tailor,
            fabric: activeFabric,
          })
        : preset,
    [offer, activeFabric, preset],
  );
  const addAsIs = useAddAsIs(shownPreset);

  const fabricGoesToAtelier =
    mode === "custom" &&
    Boolean(
      offer && activeFabric?.vendor_id && activeFabric.vendor_id !== offer.tailor.id,
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
    { key: "as_is", label: t("Tel quel"), hint: t("Juste votre taille") },
    { key: "custom", label: t("Sur mesure"), hint: t("Votre tissu, votre style") },
  ];

  const customGroups = offer
    ? [
        { label: t("Tissus de {name}", { name: offer.tailor.shop_name ?? t("l'atelier") }), fabrics: tailorFabrics },
        { label: t("Autres vendeurs"), fabrics: otherFabrics },
      ]
    : undefined;

  return (
    <div className="bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-muted-foreground text-sm">
          {mode === "as_is" ? t("Prix") : t("À partir de")}
        </span>
        <span className="text-primary text-xl font-bold whitespace-nowrap">
          {formatPrice(shownPreset.total)}
        </span>
      </div>

      {/* Comment le voulez-vous ? — un choix, pas un second bouton d'achat. */}
      {canAsIs && (
        <div role="radiogroup" aria-label={t("Comment le voulez-vous ?")} className="mt-4 grid grid-cols-2 gap-2">
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
      )}

      <div className="mt-5">
        {mode === "as_is" ? (
          <>
            {offer && (
              <div className="mb-5">
                <FabricPicker
                  fabrics={offer.asIsFabrics}
                  value={asIsFabricId}
                  onChange={setAsIsFabricId}
                />
              </div>
            )}
            <SizePicker
              value={size}
              onChange={setSize}
              note={
                offer
                  ? t("Le modèle présenté, ajusté à votre taille.")
                  : preset.note
                    ? t(preset.note)
                    : presentedIn
                      ? t("Le modèle présenté, en {fabric}, ajusté à votre taille.", { fabric: presentedIn })
                      : t("Le modèle présenté, ajusté à votre taille.")
              }
            />
          </>
        ) : (
          <>
            <FabricPicker
              fabrics={fabrics}
              groups={customGroups}
              value={fabricId}
              onChange={setFabricId}
            />
            {fabricGoesToAtelier && (
              <p className="bg-muted/50 mt-3 flex items-start gap-2 rounded-lg p-2.5 text-sm">
                <Truck className="text-primary mt-0.5 size-4 shrink-0" />
                {t("Ce tissu sera envoyé directement à l'atelier du tailleur.")}
              </p>
            )}
            <p className="text-muted-foreground mt-3 text-xs">
              {t("Ensuite : le style, le tailleur et vos mesures. Vous recevez un devis gratuit, sans engagement.")}
            </p>
          </>
        )}
      </div>

      <Button size="lg" className="mt-5 h-12 w-full text-base" onClick={onCta}>
        {mode === "as_is" ? (
          <>
            <ShoppingBag className="size-4" /> {t("Ajouter au panier")}
          </>
        ) : (
          <>
            <Wand2 className="size-4" /> {t("Personnaliser")}
          </>
        )}
      </Button>
      <p className="text-muted-foreground mt-2 text-center text-xs">
        {t("Pas besoin de créer un compte")}
      </p>
    </div>
  );
}
