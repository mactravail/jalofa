"use client";

import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_STYLE_GROUPS, MAX_STYLE_OPTIONS } from "@/lib/model-style";
import { stylePresetsFor, type StylePreset } from "@/lib/style-presets";
import type { ModelStyleGroup } from "@/lib/types";

/** Un choix en cours d'édition : sa photo peut être encore sur le téléphone. */
export type DraftStyleOption = {
  slug: string;
  name: string;
  extra: string;
  /** Photo déjà enregistrée. */
  photo: string | null;
  /** Photo choisie, envoyée à l'enregistrement du modèle. */
  file?: File;
  preview?: string;
};

export type DraftStyleGroup = { slug: string; name: string; options: DraftStyleOption[] };

const newSlug = () => Math.random().toString(36).slice(2, 10);

const emptyOption = (name = ""): DraftStyleOption => ({
  slug: newSlug(),
  name,
  extra: "",
  photo: null,
});

export function toDraftStyleGroups(groups: ModelStyleGroup[] | undefined): DraftStyleGroup[] {
  return (groups ?? []).map((group) => ({
    slug: group.slug,
    name: group.name,
    options: group.options.map((o) => ({
      slug: o.slug,
      name: o.name,
      extra: o.extra ? String(o.extra) : "",
      photo: o.photo,
    })),
  }));
}

function revoke(option: DraftStyleOption | undefined) {
  if (option?.preview) URL.revokeObjectURL(option.preview);
}

/**
 * Le style d'un modèle, décrit par son tailleur : les détails qu'il choisit, et
 * une vraie photo pour chaque choix. Un toucher sur une idée ajoute le détail avec
 * ses choix déjà nommés : il ne reste qu'à mettre les photos.
 */
export function ModelStyleEditor({
  modelName,
  groups,
  onChange,
}: {
  /** Le nom du modèle décide des idées proposées : pas de col pour un thiaya. */
  modelName: string;
  groups: DraftStyleGroup[];
  onChange: (update: (groups: DraftStyleGroup[]) => DraftStyleGroup[]) => void;
}) {
  const taken = new Set(groups.map((g) => g.name.trim().toLowerCase()));
  const ideas = stylePresetsFor(modelName).filter((p) => !taken.has(p.name.toLowerCase()));
  const isFull = groups.length >= MAX_STYLE_GROUPS;

  function addGroup(preset?: StylePreset) {
    if (isFull) {
      toast.info(`Maximum ${MAX_STYLE_GROUPS} détails par modèle.`);
      return;
    }
    const options = preset ? preset.options.map((name) => emptyOption(name)) : [emptyOption(), emptyOption()];
    onChange((prev) => [...prev, { slug: newSlug(), name: preset?.name ?? "", options }]);
  }

  function patchGroup(slug: string, patch: (group: DraftStyleGroup) => DraftStyleGroup) {
    onChange((prev) => prev.map((g) => (g.slug === slug ? patch(g) : g)));
  }

  function removeGroup(group: DraftStyleGroup) {
    group.options.forEach(revoke);
    onChange((prev) => prev.filter((g) => g.slug !== group.slug));
  }

  function patchOption(groupSlug: string, slug: string, patch: Partial<DraftStyleOption>) {
    patchGroup(groupSlug, (g) => ({
      ...g,
      options: g.options.map((o) => (o.slug === slug ? { ...o, ...patch } : o)),
    }));
  }

  function pickPhoto(groupSlug: string, option: DraftStyleOption, file: File | undefined) {
    if (!file?.type.startsWith("image/")) return;
    revoke(option);
    patchOption(groupSlug, option.slug, { file, preview: URL.createObjectURL(file) });
  }

  function removeOption(group: DraftStyleGroup, option: DraftStyleOption) {
    revoke(option);
    patchGroup(group.slug, (g) => ({
      ...g,
      options: g.options.filter((o) => o.slug !== option.slug),
    }));
  }

  return (
    <div className="space-y-3 rounded-xl border p-3">
      <div>
        <Label>Style de ce modèle</Label>
        <p className="text-muted-foreground mt-1 text-xs">
          Ajoutez seulement ce que le client peut choisir, avec une vraie photo pour
          chaque choix. Le premier choix est le modèle tel que vous le présentez.
        </p>
      </div>

      {groups.map((group) => (
        <div key={group.slug} className="bg-muted/30 space-y-3 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Input
              value={group.name}
              onChange={(e) => patchGroup(group.slug, (g) => ({ ...g, name: e.target.value }))}
              maxLength={40}
              placeholder="Nom du détail (ex. Poches)"
              aria-label="Nom du détail"
              className="font-semibold"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeGroup(group)}
              aria-label={`Retirer ${group.name || "ce détail"}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {group.options.map((option, i) => {
              const photo = option.preview ?? option.photo;
              return (
                <div key={option.slug} className="min-w-0 space-y-1.5">
                  <div className="bg-background relative aspect-[4/5] overflow-hidden rounded-lg border">
                    <label className="text-muted-foreground flex size-full cursor-pointer flex-col items-center justify-center gap-1 text-xs font-medium">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo} alt={option.name} className="size-full object-cover" />
                      ) : (
                        <>
                          <ImagePlus className="size-6" />
                          Mettre la photo
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="sr-only"
                        onChange={(e) => {
                          pickPhoto(group.slug, option, e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeOption(group, option)}
                      aria-label={`Retirer ${option.name || "ce choix"}`}
                      className="bg-background/85 hover:bg-background absolute top-1 right-1 grid size-6 place-items-center rounded-full shadow-sm"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <Input
                    value={option.name}
                    onChange={(e) =>
                      patchOption(group.slug, option.slug, { name: e.target.value })
                    }
                    maxLength={40}
                    placeholder="Nom du choix"
                    aria-label="Nom du choix"
                  />
                  {i === 0 ? (
                    <p className="text-muted-foreground px-1 text-xs">Prix inclus</p>
                  ) : (
                    <Input
                      value={option.extra}
                      onChange={(e) =>
                        patchOption(group.slug, option.slug, {
                          extra: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      inputMode="numeric"
                      placeholder="En plus (FCFA)"
                      aria-label={`Prix en plus pour ${option.name || "ce choix"}, en FCFA`}
                    />
                  )}
                </div>
              );
            })}

            {group.options.length < MAX_STYLE_OPTIONS && (
              <button
                type="button"
                onClick={() =>
                  patchGroup(group.slug, (g) => ({
                    ...g,
                    options: [...g.options, emptyOption()],
                  }))
                }
                className="text-muted-foreground hover:bg-muted flex aspect-[4/5] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs font-medium"
              >
                <Plus className="size-5" />
                Autre choix
              </button>
            )}
          </div>
        </div>
      ))}

      <div>
        <p className="text-muted-foreground mb-2 text-xs font-medium">
          {groups.length === 0 ? "Touchez pour ajouter un détail :" : "Ajouter un autre détail :"}
        </p>
        <div className="flex flex-wrap gap-2">
          {ideas.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => addGroup(preset)}
              className="hover:bg-muted flex items-center gap-1 rounded-full border px-3 py-2 text-sm font-medium"
            >
              <Plus className="size-3.5" />
              {preset.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => addGroup()}
            className="hover:bg-muted flex items-center gap-1 rounded-full border border-dashed px-3 py-2 text-sm font-medium"
          >
            <Plus className="size-3.5" />
            Autre détail
          </button>
        </div>
      </div>
    </div>
  );
}
