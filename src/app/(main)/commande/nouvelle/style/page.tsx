"use client";

import { Check, Crown, Heart, Landmark, Shirt, Sparkles, Sun } from "lucide-react";
import Image from "next/image";
import type { ComponentType } from "react";

import { BoubouDetailIcon } from "@/components/order/boubou-detail-icons";
import { useConfigurator } from "@/components/order/configurator-context";
import {
  detailFamilyFor,
  GarmentDetailIcon,
  type DetailGroup,
} from "@/components/order/garment-detail-icons";
import { StyleIcon } from "@/components/order/style-icons";
import { StyleInspiration } from "@/components/order/style-inspiration";
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
  const { data, state, update, model } = useConfigurator();

  // Only this garment's own cuts and finishings — a jupe gets no collar group,
  // a robe never sees a kaftan.
  const groups = styleGroupsFor(model);
  // The bust archetype the finishing drawings are composed onto.
  const family = detailFamilyFor(model);

  return (
    <div className="space-y-8">
      {/* Occasion — compact chips (feeds styleSlug / the styles table). C'est le
          seul choix obligatoire de l'étape : on le dit, sinon « Continuer »
          reste grisé sans qu'on sache pourquoi. */}
      <section>
        <h3 className="mb-3 flex flex-wrap items-center gap-x-2 text-base font-semibold tracking-tight">
          Occasion
          <span className="text-muted-foreground text-xs font-normal">
            {state.styleSlug ? "· modifiable" : "· à choisir"}
          </span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {data.styles.map((s) => {
            const Icon = OCCASION_ICONS[s.slug] ?? Sparkles;
            const active = state.styleSlug === s.slug;
            return (
              <button
                type="button"
                key={s.slug}
                onClick={() => update({ styleSlug: s.slug })}
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
            <div className="grid grid-cols-3 gap-2">
              {group.options.map((opt) => {
                const active = state.styleDetails[group.slug] === opt.slug;
                return (
                  <button
                    type="button"
                    key={opt.slug}
                    onClick={() =>
                      update({
                        styleDetails: { ...state.styleDetails, [group.slug]: opt.slug },
                      })
                    }
                    aria-pressed={active}
                    className="group/opt flex flex-col items-center gap-1.5 text-center"
                  >
                    <span
                      className={cn(
                        "bg-card relative flex w-full items-center justify-center rounded-lg border transition-colors",
                        opt.photo
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
                          sizes="(min-width: 1024px) 160px, 30vw"
                          className={cn(
                            "rounded-[7px] object-cover object-top transition-opacity",
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
                        "text-[10px] uppercase leading-tight tracking-wide",
                        active ? "text-foreground font-semibold" : "text-muted-foreground",
                      )}
                    >
                      {opt.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Références libres — ce que les groupes illustrés ne savent pas dire. */}
      <StyleInspiration
        refs={state.styleRefs}
        onChange={(styleRefs) => update({ styleRefs })}
      />
    </div>
  );
}
