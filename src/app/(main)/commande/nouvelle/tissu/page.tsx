"use client";

import { Search } from "lucide-react";

import { useConfigurator } from "@/components/order/configurator-context";
import { FilterChip, MediaOption, SelectGrid, titleCase } from "@/components/order/configurator-ui";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/constants";

export default function FabricStep() {
  const { data, state, update, fabricCategories, filteredFabrics } = useConfigurator();

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={state.fabricQuery}
          onChange={(e) => update({ fabricQuery: e.target.value })}
          placeholder="Rechercher un tissu par nom ou propriété"
          className="pl-9"
        />
      </div>

      {fabricCategories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <FilterChip active={!state.fabricCat} onClick={() => update({ fabricCat: null })}>
            Tous
          </FilterChip>
          {fabricCategories.map((c) => (
            <FilterChip
              key={c}
              active={state.fabricCat === c}
              onClick={() => update({ fabricCat: c })}
            >
              {titleCase(c)}
            </FilterChip>
          ))}
        </div>
      )}

      <p className="text-muted-foreground text-xs">
        {filteredFabrics.length} / {data.fabrics.length} tissus
      </p>

      {filteredFabrics.length ? (
        <SelectGrid
          items={filteredFabrics}
          selected={state.fabricId}
          onSelect={(id) => update({ fabricId: id })}
          getKey={(f) => f.id}
          render={(f) => (
            <MediaOption
              image={f.image_url}
              title={f.name}
              subtitle={`${f.color ?? ""} · ${formatPrice(f.price_per_meter)} / m`}
            />
          )}
        />
      ) : (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Aucun tissu ne correspond à votre recherche.
        </p>
      )}
    </div>
  );
}
