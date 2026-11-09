"use client";

import {
  Check,
  ChevronDown,
  Crown,
  Heart,
  Landmark,
  Shirt,
  Sparkles,
  Star,
  Store,
  Sun,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, type ComponentType } from "react";

import { ModelCareTips } from "@/components/catalog/model-care-tips";
import { BoubouDetailIcon } from "@/components/order/boubou-detail-icons";
import { useConfigurator } from "@/components/order/configurator-context";
import {
  detailFamilyFor,
  GarmentDetailIcon,
  type DetailGroup,
} from "@/components/order/garment-detail-icons";
import { StyleIcon } from "@/components/order/style-icons";
import { StyleInspiration } from "@/components/order/style-inspiration";
import { formatPrice } from "@/lib/constants";
import { styleGroupsFor } from "@/lib/style-options";
import { cn } from "@/lib/utils";

// Finishing groups whose drawing is composed onto the chosen garment's bust
// (a boubou collar ≠ a costume collar). Coupe + Longueur keep their own
// full-garment silhouettes from `style-icons.tsx`.
const DETAIL_GROUPS = new Set<string>(["col", "broderie", "manches"]);

// Les planches en pied (silhouette, plastron, poche) sont dessinées en portrait,
// les détails cadrés (col, manche) au carré : on donne à la vignette le format
// du dessin, sinon un boubou entier flotte dans une case carrée.
const TALL_GROUPS = new Set<string>(["coupe", "broderie", "poches", "longueur"]);

// Les planches photo de l'atelier sont en 3/4 avec une légende incrustée sous
// le vêtement. On cadre la vignette un peu plus haut que l'image et on l'ancre
// en haut : le vêtement tient entier, la légende tombe hors champ (le nom de
// l'option est déjà écrit sous la case).
const PHOTO_TILE = "aspect-[8/9]";

// Occasion sits in the `styles` table; give each slug a small glyph so it reads
// as a section alongside the illustrated garment groups.
const OCCASION_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  moderne: Shirt,
  traditionnel: Landmark,
  elegant: Sparkles,
  mariage: Heart,
  casual: Sun,
  luxe: Crown,
};

export default function StyleStep() {
  const { data, state, update, model, setPreviewPhoto } = useConfigurator();
  const [occasionOpen, setOccasionOpen] = useState(false);
  const chosenOccasion = data.styles.find((s) => s.slug === state.styleSlug)?.name;

  // Only this garment's own cuts and finishings — a jupe gets no collar group,
  // a robe never sees a kaftan.
  const groups = styleGroupsFor(model);
  // The bust archetype the finishing drawings are composed onto.
  const family = detailFamilyFor(model);
  // Le modèle d'un tailleur : ses vraies photos, son nom, ses conseils.
  const author = model?.tailor_id
    ? (data.tailors.find((t) => t.id === model.tailor_id) ?? null)
    : null;
  const isTailorModel = Boolean(model?.tailor_id);

  return (
    <div className="space-y-8">
      {author && (
        <section className="rounded-xl border p-3">
          <Link
            href={`/tailleurs/${author.id}`}
            target="_blank"
            className="flex items-center gap-3"
          >
            <span className="bg-muted relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full">
              {author.cover_url ? (
                <Image
                  src={author.cover_url}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <Store className="text-muted-foreground size-5" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-muted-foreground block text-xs">Modèle publié par</span>
              <span className="block truncate text-base font-semibold">{author.shop_name}</span>
              {author.rating_count > 0 && (
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Star className="size-3 fill-current" />
                  {author.rating.toFixed(1)} · {author.rating_count} avis
                </span>
              )}
            </span>
          </Link>
          {model?.description && (
            <p className="text-muted-foreground mt-3 border-t pt-3 text-sm">{model.description}</p>
          )}
        </section>
      )}

      {/* Occasion — compact chips (feeds styleSlug / the styles table). Choix
          facultatif : replié par défaut, on clique sur le titre pour le voir ;
          re-toucher une occasion la retire. */}
      <section>
        <h3>
          <button
            type="button"
            onClick={() => setOccasionOpen((open) => !open)}
            aria-expanded={occasionOpen}
            className="flex min-h-11 w-full items-center gap-x-2 text-left text-base font-semibold tracking-tight"
          >
            Occasion
            <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs font-normal">
              · {chosenOccasion ?? "optionnel"}
            </span>
            <ChevronDown
              className={cn(
                "text-muted-foreground size-5 shrink-0 transition-transform",
                occasionOpen && "rotate-180",
              )}
            />
          </button>
        </h3>
        {occasionOpen && (
          <div className="mt-2 flex flex-wrap gap-2">
            {data.styles.map((s) => {
              const Icon = OCCASION_ICONS[s.slug] ?? Sparkles;
              const active = state.styleSlug === s.slug;
              return (
                <button
                  type="button"
                  key={s.slug}
                  onClick={() => update({ styleSlug: active ? null : s.slug })}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  {active ? <Check className="size-4" /> : <Icon className="size-4" />}
                  {s.name}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Planches illustrées du vêtement — Coupe · Col · Broderie · … Une
          vignette dessinée par option, le choix courant rappelé dans le titre :
          la planche d'un tailleur, à laquelle on répond détail par détail. */}
      {groups.map((group) => {
        const chosen = group.options.find((o) => o.slug === state.styleDetails[group.slug]);
        return (
          <section key={group.slug}>
            <h3 className="mb-3 flex flex-wrap items-baseline gap-x-2">
              <span className="text-base font-semibold tracking-tight">{group.name}</span>
              {chosen && (
                <span className="text-muted-foreground text-xs font-normal">
                  · {chosen.name}
                </span>
              )}
            </h3>
            <div className={cn("grid gap-2", isTailorModel ? "grid-cols-2" : "grid-cols-3")}>
              {group.options.map((opt) => {
                const active = state.styleDetails[group.slug] === opt.slug;
                return (
                  <button
                    type="button"
                    key={opt.slug}
                    onClick={() => {
                      update({
                        styleDetails: { ...state.styleDetails, [group.slug]: opt.slug },
                      });
                      if (isTailorModel && opt.photo) setPreviewPhoto(opt.photo);
                    }}
                    aria-pressed={active}
                    className="group/opt flex flex-col items-center gap-1.5 text-center"
                  >
                    <span
                      className={cn(
                        "bg-card relative flex w-full items-center justify-center rounded-lg border transition-colors",
                        isTailorModel
                          ? "aspect-[4/5]"
                          : opt.photo
                            ? PHOTO_TILE
                            : cn("p-2", TALL_GROUPS.has(group.slug) ? "aspect-[4/5]" : "aspect-square"),
                        active
                          ? "border-primary ring-primary/40 ring-1"
                          : "border-border/60 group-hover/opt:border-foreground/30",
                      )}
                    >
                      {active && (
                        <span className="text-primary-foreground bg-primary absolute -right-1.5 -top-1.5 z-10 grid size-5 place-items-center rounded-full">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                      )}
                      {opt.photo ? (
                        <Image
                          src={opt.photo}
                          alt={opt.name}
                          fill
                          sizes={
                            isTailorModel
                              ? "(min-width: 1024px) 170px, 50vw"
                              : "(min-width: 1024px) 160px, 30vw"
                          }
                          className={cn(
                            "rounded-[7px] object-cover transition-opacity",
                            !isTailorModel && "object-top",
                            active ? "opacity-100" : "opacity-80 group-hover/opt:opacity-100",
                          )}
                        />
                      ) : opt.art ? (
                        <BoubouDetailIcon
                          name={opt.art}
                          className={cn(
                            "h-full w-full",
                            active ? "text-foreground" : "text-muted-foreground/80",
                          )}
                        />
                      ) : DETAIL_GROUPS.has(group.slug) ? (
                        <GarmentDetailIcon
                          family={family}
                          group={group.slug as DetailGroup}
                          variant={opt.slug}
                          className={cn(
                            "h-full w-full",
                            active ? "text-foreground" : "text-muted-foreground/80",
                          )}
                        />
                      ) : (
                        <StyleIcon
                          name={opt.icon}
                          className={cn(
                            "h-full w-full",
                            active ? "text-foreground" : "text-muted-foreground/80",
                          )}
                        />
                      )}
                    </span>
                    <span
                      className={cn(
                        isTailorModel
                          ? "text-sm leading-tight"
                          : "text-[10px] uppercase leading-tight tracking-wide",
                        active ? "text-foreground font-semibold" : "text-muted-foreground",
                      )}
                    >
                      {opt.name}
                    </span>
                    {opt.extra ? (
                      <span className="text-primary text-xs font-semibold whitespace-nowrap">
                        +{formatPrice(opt.extra)}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      {isTailorModel && groups.length === 0 && (
        <p className="text-muted-foreground rounded-xl border p-3 text-sm">
          Ce modèle est cousu tel qu&apos;il est présenté. Une envie particulière ?
          Ajoutez une photo ci-dessous ou écrivez au tailleur au récapitulatif.
        </p>
      )}

      <ModelCareTips tips={model?.care_tips} />

      {/* Références libres — ce que les groupes illustrés ne savent pas dire. */}
      <StyleInspiration
        refs={state.styleRefs}
        onChange={(styleRefs) => update({ styleRefs })}
      />
    </div>
  );
}
