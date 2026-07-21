"use client";

import { Check, Crown, Heart, Landmark, Shirt, Sparkles, Sun } from "lucide-react";
import type { ComponentType } from "react";

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
  const { data, state, update } = useConfigurator();

  // Only this garment's own cuts and finishings — a jupe gets no collar group,
  // a robe never sees a kaftan.
  const groups = styleGroupsFor(state.modelId);
  // The bust archetype the finishing drawings are composed onto.
  const family = detailFamilyFor(state.modelId);

  return (
    <div className="space-y-8">
      {/* Occasion — compact chips (feeds styleSlug / the styles table) */}
      <section>
        <h3 className="mb-3 text-base font-semibold tracking-tight">Occasion</h3>
        <div className="flex flex-wrap gap-2">
          {data.styles.map((s) => {
            const Icon = OCCASION_ICONS[s.slug] ?? Sparkles;
            const active = state.styleSlug === s.slug;
            return (
              <button
                type="button"
                key={s.slug}
                onClick={() => update({ styleSlug: s.slug })}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                <Icon className="size-3.5" />
                {s.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Illustrated groups for the chosen garment — Coupe · Col · … */}
      {groups.map((group) => (
        <section key={group.slug}>
          <h3 className="mb-3 text-base font-semibold tracking-tight">{group.name}</h3>
          <div className="grid grid-cols-3 gap-2.5">
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
                  className={cn(
                    "relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors",
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border/60 hover:border-border hover:bg-muted/40",
                  )}
                >
                  {active && (
                    <span className="text-primary-foreground bg-primary absolute left-1.5 top-1.5 grid size-5 place-items-center rounded-full">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                  {DETAIL_GROUPS.has(group.slug) ? (
                    <GarmentDetailIcon
                      family={family}
                      group={group.slug as DetailGroup}
                      variant={opt.slug}
                      className={cn(
                        "h-16 w-full",
                        active ? "text-foreground" : "text-muted-foreground/70",
                      )}
                    />
                  ) : (
                    <StyleIcon
                      name={opt.icon}
                      className={cn(
                        "h-16 w-full",
                        active ? "text-foreground" : "text-muted-foreground/70",
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "text-xs leading-tight",
                      active ? "text-foreground font-medium" : "text-muted-foreground",
                    )}
                  >
                    {opt.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {/* Références libres — ce que les groupes illustrés ne savent pas dire. */}
      <StyleInspiration
        refs={state.styleRefs}
        onChange={(styleRefs) => update({ styleRefs })}
      />
    </div>
  );
}
