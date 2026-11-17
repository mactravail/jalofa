"use client";

import { useRouter } from "@/lib/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Package, Palette, ShoppingBag, Truck, Wand2 } from "lucide-react";

import { SizePicker, useAddAsIs, type AsIsPreset } from "@/components/catalog/garment-as-is";
import { useSetGarmentColorPhoto } from "@/components/catalog/garment-color-photo";
import { FabricPicker } from "@/components/catalog/garment-personalise";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/constants";
import { isFabricAvailable } from "@/lib/fabric-metrage";
import { buildGenericAsIsPreset, buildReadyToWearPreset } from "@/lib/garment-preset";
import {
  isReadyToWear,
  readyColorHex,
  readyImageFor,
  readyPriceFor,
  readyPriceRange,
} from "@/lib/ready-to-wear";
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
  /** Tous les tissus en ligne de ce tailleur — première rangée du « Sur mesure ». */
  tailorFabrics: Fabric[];
};

// Le bloc d'achat d'une fiche vêtement. UN SEUL bouton : le client choisit
// d'abord comment il le veut (« Tel quel » ou « Sur mesure »), et le bouton
// suit ce choix. Deux boutons côte à côte prêtaient à confusion.
//
// - Tel quel  : le prêt-à-porter du tailleur (déjà cousu) — couleur + taille →
//   « Ajouter au panier ». Seulement si le tailleur auteur l'a déclaré
//   disponible ; le catalogue JALOFA ne se vend que sur mesure.
// - Sur mesure : un tissu du tailleur ou d'un autre vendeur → « Personnaliser »
//   (configurateur, puis demande de devis : le prix final est fixé par le tailleur).
//
// Pas d'inscription avant : le compte client est créé à la caisse (ou au
// récap du devis) avec un mot de passe — cf. `ensureClientAccount`.
export function GarmentBuyBox({
  preset,
  fabrics: allFabrics,
  orderParams,
  initialFabricId,
  initialMode,
  offer,
}: {
  preset: AsIsPreset;
  /** Nom du tissu dans lequel le modèle est présenté (plus affiché : le
   *  « Tel quel » est désormais le prêt-à-porter du tailleur). */
  presentedIn?: string | null;
  fabrics: Fabric[];
  /** Query string du configurateur, sans `fabric` (type / model / tailor). */
  orderParams: string;
  /** Tissu déjà retenu en amont (ex. arrivé de /tissus) → ouvre « Sur mesure ». */
  initialFabricId?: string | null;
  /** Choix déjà fait en amont (bouton « Personnaliser » / « Prêt-à-porter »
   *  d'une boutique). « Tel quel » n'est retenu que si le modèle l'offre. */
  initialMode?: Mode;
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
  // « Tel quel » = prêt-à-porter déclaré par le tailleur auteur (couleurs).
  const readyPreset = useMemo(
    () =>
      offer && isReadyToWear(offer.model)
        ? buildReadyToWearPreset({ model: offer.model, photos: offer.photos, tailor: offer.tailor })
        : null,
    [offer],
  );
  const readyColors = readyPreset ? (offer?.model.ready_colors ?? []) : [];
  const canAsIs = Boolean(readyPreset);
  const [color, setColor] = useState<string | null>(
    readyColors.length === 1 ? readyColors[0] : null,
  );
  const [mode, setMode] = useState<Mode>(
    initialMode === "custom" || carriedFabricId || !canAsIs ? "custom" : "as_is",
  );
  const [size, setSize] = useState<string | null>(null);
  // « J'envoie mon tissu » : le client apporte son tissu (commande `own_fabric`),
  // il ne paie que la couture et l'envoie à l'atelier une fois le devis payé.
  const [ownFabric, setOwnFabric] = useState(false);
  const sendsOwnFabric = mode === "custom" && ownFabric;
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

  // Sur mesure : le prix « à partir de » suit le tissu choisi.
  const activeFabric = fabrics.find((f) => f.id === fabricId) ?? null;
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
  // Prêt-à-porter : le tailleur peut fixer un prix par couleur.
  const colorPreset = useMemo(() => {
    if (!readyPreset || !offer) return null;
    const p = readyPriceFor(offer.model, color, readyPreset.tailoringPrice);
    // Dans le panier, la ligne montre la photo de la couleur choisie.
    const image = readyImageFor(offer.model, color) ?? readyPreset.image;
    return { ...readyPreset, tailoringPrice: p, total: p, image };
  }, [readyPreset, offer, color]);
  const readyRange =
    readyPreset && offer ? readyPriceRange(offer.model, readyPreset.tailoringPrice) : null;
  const priceVaries = Boolean(readyRange && readyRange.min !== readyRange.max);
  const addAsIs = useAddAsIs(colorPreset ?? preset);

  // La couleur choisie montre sa photo dans la grande galerie de la fiche.
  const setGalleryPhoto = useSetGarmentColorPhoto();
  const colorPhoto = mode === "as_is" && offer ? readyImageFor(offer.model, color) : null;
  useEffect(() => {
    setGalleryPhoto?.(colorPhoto);
  }, [setGalleryPhoto, colorPhoto]);

  const fabricGoesToAtelier =
    mode === "custom" &&
    !ownFabric &&
    Boolean(
      offer && activeFabric?.vendor_id && activeFabric.vendor_id !== offer.tailor.id,
    );

  const onCta = () => {
    if (mode === "as_is") {
      if (readyColors.length > 0 && !color) {
        toast.error(t("Choisissez d'abord la couleur"));
        return;
      }
      addAsIs(size, color);
      return;
    }
    if (ownFabric) {
      const q = new URLSearchParams(orderParams);
      q.set("type", "own_fabric");
      q.delete("fabric");
      router.push(`/commande/nouvelle?${q.toString()}`);
      return;
    }
    router.push(
      fabricId
        ? `/commande/nouvelle?${orderParams}&fabric=${fabricId}`
        : `/commande/nouvelle?${orderParams}`,
    );
  };

  const options: { key: Mode; label: string; hint: string }[] = [
    { key: "as_is", label: t("Tel quel"), hint: t("Prêt-à-porter") },
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
          {mode === "as_is" && !(priceVaries && !color) ? t("Prix") : t("À partir de")}
        </span>
        <span className="text-primary text-xl font-bold whitespace-nowrap">
          {formatPrice(
            mode === "as_is" && colorPreset
              ? color
                ? colorPreset.total
                : (readyRange?.min ?? colorPreset.total)
              : sendsOwnFabric
                ? shownPreset.tailoringPrice
                : shownPreset.total,
          )}
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
            {readyColors.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-medium">{t("Choisissez la couleur")}</p>
                <div role="radiogroup" aria-label={t("Couleur")} className="mt-2 flex flex-wrap gap-2">
                  {readyColors.map((c) => {
                    const active = color === c;
                    const hex = readyColorHex(c);
                    const img = offer ? readyImageFor(offer.model, c) : null;
                    const cPrice =
                      priceVaries && offer && readyPreset
                        ? readyPriceFor(offer.model, c, readyPreset.tailoringPrice)
                        : null;
                    return (
                      <button
                        key={c}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setColor(c)}
                        className={cn(
                          "flex items-center gap-2 rounded-full border-2 py-1 pr-3.5 pl-1 text-sm font-medium transition-colors",
                          active ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
                        )}
                      >
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" className="size-7 rounded-full object-cover" />
                        ) : (
                          <span
                            aria-hidden
                            className="bg-muted grid size-7 place-items-center rounded-full border border-white/20"
                            style={hex ? { background: hex } : undefined}
                          >
                            {active && <Check className="size-4 text-white mix-blend-difference" strokeWidth={3} />}
                          </span>
                        )}
                        {t(c)}
                        {cPrice !== null && (
                          <span className="text-muted-foreground text-xs font-normal whitespace-nowrap">
                            {formatPrice(cPrice)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {/* Sans galerie reliée, la photo de la couleur s'affiche ici. */}
                {!setGalleryPhoto && colorPhoto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={colorPhoto}
                    alt={color ? t(color) : ""}
                    className="mt-3 aspect-[4/5] w-full max-w-xs rounded-xl border object-cover"
                  />
                )}
              </div>
            )}
            <SizePicker
              value={size}
              onChange={setSize}
              note={t("Déjà cousu par {name}, prêt à partir à votre taille.", {
                name: offer?.tailor.shop_name ?? t("l'atelier"),
              })}
            />
          </>
        ) : (
          <>
            {/* D'où vient le tissu ? Celui du site, ou celui du client. */}
            <div
              role="radiogroup"
              aria-label={t("Le tissu")}
              className="mb-4 grid grid-cols-2 gap-2"
            >
              {[
                {
                  own: false,
                  label: t("Je choisis un tissu"),
                  hint: t("Parmi nos tissus"),
                  Icon: Palette,
                  tone: "text-amber-400",
                  on: "border-amber-400 bg-amber-400/10",
                },
                {
                  own: true,
                  label: t("J'envoie mon tissu"),
                  hint: t("Vous payez la couture"),
                  Icon: Package,
                  tone: "text-emerald-400",
                  on: "border-emerald-400 bg-emerald-400/10",
                },
              ].map((o) => {
                const active = ownFabric === o.own;
                return (
                  <button
                    key={String(o.own)}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setOwnFabric(o.own)}
                    className={cn(
                      "rounded-xl border-2 px-3 py-2.5 text-left transition-colors",
                      active ? o.on : "hover:bg-muted border-border",
                    )}
                  >
                    <o.Icon aria-hidden className={cn("mb-1 size-5", o.tone)} />
                    <span className={cn("block text-[13px] leading-tight font-semibold sm:text-sm", active && o.tone)}>
                      {o.label}
                    </span>
                    <span className="text-muted-foreground mt-0.5 block text-[11px] leading-snug sm:text-xs">{o.hint}</span>
                  </button>
                );
              })}
            </div>
            {ownFabric ? (
              <p className="bg-muted/50 flex items-start gap-2 rounded-lg p-2.5 text-sm">
                <Package className="text-primary mt-0.5 size-4 shrink-0" />
                {t("Vous envoyez votre tissu à l'atelier du tailleur. Il vous dit combien de mètres il faut, et son adresse s'affiche après le paiement.")}
              </p>
            ) : (
              <FabricPicker
                fabrics={fabrics}
                groups={customGroups}
                value={fabricId}
                onChange={setFabricId}
              />
            )}
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
