"use client";

import { Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { modelPhotos } from "@/lib/constants";
import type { GarmentModel, ModelCategory } from "@/lib/types";

type Gender = ModelCategory["gender"] | "autre";

// Ordre et intitulés des sections. Toute suggestion dont la catégorie n'a pas de
// genre connu retombe dans « Autres », pour n'en perdre aucune.
const GENDER_SECTIONS: { gender: Gender; label: string }[] = [
  { gender: "homme", label: "Homme" },
  { gender: "femme", label: "Femme" },
  { gender: "enfant", label: "Enfant" },
  { gender: "mixte", label: "Mixte" },
  { gender: "autre", label: "Autres" },
];

/**
 * Première étape de l'ajout d'une création : le tailleur choisit un modèle de
 * notre catalogue (`tailor_id` null) comme point de départ, ou crée le sien de
 * zéro. Choisir une suggestion ne fait que pré-remplir le formulaire — la fiche
 * publiée appartiendra toujours au tailleur. Les propositions sont rangées par
 * genre (Homme, Femme…) pour s'y retrouver.
 */
export function ModelSuggestionPicker({
  open,
  onOpenChange,
  suggestions,
  categories,
  onPick,
  onCreateNew,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: GarmentModel[];
  categories: ModelCategory[];
  onPick: (suggestion: GarmentModel) => void;
  onCreateNew: () => void;
}) {
  const category = (slug: string | null) =>
    categories.find((c) => c.slug === slug) ?? null;

  const genderOf = (s: GarmentModel): Gender =>
    category(s.category_slug)?.gender ?? "autre";

  const sections = GENDER_SECTIONS.map((section) => ({
    ...section,
    items: suggestions.filter((s) => genderOf(s) === section.gender),
  })).filter((section) => section.items.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un modèle</DialogTitle>
          <DialogDescription>
            Partez d&apos;un de nos modèles — vous n&apos;aurez qu&apos;à ajuster
            la fiche — ou créez le vôtre de toutes pièces.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-1 max-h-[60vh] overflow-y-auto px-1">
          <button
            type="button"
            onClick={onCreateNew}
            className="border-primary/40 hover:border-primary hover:bg-primary/5 mb-4 flex w-full items-center gap-3 rounded-xl border border-dashed p-3 text-left transition-colors"
          >
            <span className="bg-primary/10 text-primary grid size-12 shrink-0 place-items-center rounded-lg">
              <Plus className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-medium">Nouveau modèle</span>
              <span className="text-muted-foreground block text-sm">
                Créez une création inédite, à partir d&apos;une page blanche.
              </span>
            </span>
          </button>

          {sections.map((section) => (
            <div key={section.gender} className="mb-4 last:mb-0">
              <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                {section.label}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {section.items.map((s) => {
                  const cover = modelPhotos(s)[0];
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onPick(s)}
                      className="hover:border-primary hover:bg-accent/50 flex items-center gap-3 rounded-xl border p-2 text-left transition-colors"
                    >
                      <span className="bg-muted size-12 shrink-0 overflow-hidden rounded-lg">
                        {cover && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover}
                            alt=""
                            className="size-full object-cover"
                          />
                        )}
                      </span>
                      <span className="block min-w-0 flex-1 truncate font-medium">
                        {s.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
