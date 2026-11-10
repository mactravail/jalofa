"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Clock,
  EyeOff,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Send,
  Shirt,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ModelFormDialog } from "@/components/dashboard/model-form-dialog";
import { ModelSuggestionPicker } from "@/components/dashboard/model-suggestion-picker";
import { NEW_MODEL_EVENT } from "@/components/tailor-bottom-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteModel, setModelPublished } from "@/lib/actions/models";
import type {
  Fabric,
  FabricCategory,
  GarmentModel,
  ModelCategory,
  TailorAtelier,
} from "@/lib/types";
import { T } from "@/components/i18n/t";
import { translateNow } from "@/lib/i18n/translate";

const DIFFICULTY_LABEL: Record<string, string> = {
  facile: "Facile",
  moyen: "Intermédiaire",
  difficile: "Avancé",
};

/** Nom normalisé pour repérer une suggestion déjà reprise par le tailleur. */
function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function TailorModelsPanel({
  models,
  suggestions,
  categories,
  fabrics,
  fabricCategories,
  fabricLinks,
  atelier,
}: {
  models: GarmentModel[];
  suggestions: GarmentModel[];
  categories: ModelCategory[];
  /** Les tissus du tailleur, y compris ceux en brouillon. */
  fabrics: Fabric[];
  fabricCategories: FabricCategory[];
  /** Les tissus cochés pour chaque modèle. */
  fabricLinks: Record<string, string[]>;
  atelier: TailorAtelier | null;
}) {
  const activeFabricIds = new Set(fabrics.filter((f) => f.is_active).map((f) => f.id));
  const lacksFabric = (model: GarmentModel) =>
    !(fabricLinks[model.id] ?? []).some((id) => activeFabricIds.has(id));
  const needsSetup =
    !atelier || models.some((m) => m.is_active && lacksFabric(m));

  const [pickerOpen, setPickerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GarmentModel | null>(null);
  const [suggestion, setSuggestion] = useState<GarmentModel | null>(null);
  // Chaque ouverture du formulaire incrémente cette clé : Base UI ne rejoue pas
  // `onOpenChange` sur une ouverture pilotée par prop, donc on force un remontage
  // pour que les valeurs par défaut repartent bien de la source courante.
  const [formSeq, setFormSeq] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<GarmentModel | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [, startPublish] = useTransition();

  function togglePublished(model: GarmentModel) {
    const next = !model.is_active;
    setPublishingId(model.id);
    startPublish(async () => {
      try {
        await setModelPublished(model.id, next);
        toast.success(
          next
            ? translateNow("Modèle publié dans le catalogue.")
            : translateNow("Modèle retiré du catalogue (brouillon)."),
        );
      } catch (e) {
        toast.error(translateNow(e instanceof Error ? e.message : "Erreur, réessayez."));
      } finally {
        setPublishingId(null);
      }
    });
  }

  // Arrivé depuis le raccourci « Ajouter un modèle » de l'accueil (`?nouveau=1`) :
  // on ouvre le choix tout de suite, pour que le geste s'enchaîne sans clic de plus.
  // Lecture côté client (window) plutôt que `useSearchParams` : pas de bascule de
  // rendu statique ni de frontière Suspense à prévoir sur la page.
  const autoOpened = useRef(false);
  useEffect(() => {
    if (autoOpened.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("nouveau") === "1") {
      autoOpened.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPickerOpen(true);
    }
  }, []);

  // Le « + » de la barre du bas, pressé alors qu'on est déjà sur cette page.
  useEffect(() => {
    const onNew = () => {
      setEditing(null);
      setSuggestion(null);
      setPickerOpen(true);
    };
    window.addEventListener(NEW_MODEL_EVENT, onNew);
    return () => window.removeEventListener(NEW_MODEL_EVENT, onNew);
  }, []);

  const categoryName = (slug: string | null) =>
    categories.find((c) => c.slug === slug)?.name ?? null;

  // Les suggestions déjà reprises (même nom) sortent de la liste : une fois
  // ajoutées, elles vivent dans « Mes créations », plus dans les propositions.
  const owned = new Set(models.map((m) => normalizeName(m.name)));
  const availableSuggestions = suggestions.filter(
    (s) => !owned.has(normalizeName(s.name)),
  );

  function openForm() {
    setFormSeq((n) => n + 1);
    setFormOpen(true);
  }

  function openNew() {
    setEditing(null);
    setSuggestion(null);
    setPickerOpen(true);
  }

  function pickSuggestion(s: GarmentModel) {
    setEditing(null);
    setSuggestion(s);
    setPickerOpen(false);
    openForm();
  }

  function createFromScratch() {
    setEditing(null);
    setSuggestion(null);
    setPickerOpen(false);
    openForm();
  }

  function openEdit(model: GarmentModel) {
    setEditing(model);
    setSuggestion(null);
    openForm();
  }

  function confirmDelete() {
    const target = deleteTarget;
    if (!target) return;
    startDelete(async () => {
      try {
        await deleteModel(target.id);
        toast.success(translateNow("Modèle supprimé."));
        setDeleteTarget(null);
      } catch (e) {
        toast.error(translateNow(e instanceof Error ? e.message : "Erreur de suppression."));
      }
    });
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          <T vars={{ n: models.length }}>{models.length > 1 ? "{n} modèles au catalogue" : "{n} modèle au catalogue"}</T>
        </p>
        <Button
          size="sm"
          onClick={openNew}
          className="gap-1.5 bg-rose-500 text-white hover:bg-rose-600"
        >
          <Plus className="size-4" /> <T>Ajouter un modèle</T>
        </Button>
      </div>

      {models.length > 0 && needsSetup && (
        <p className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <T>{!atelier
            ? "Indiquez l'adresse de votre atelier : les vendeurs y envoient les tissus de vos clients. Touchez « Modifier » sur un modèle."
            : "Certains modèles n'ont pas de tissu. Sans tissu, le client ne peut pas les acheter « Tel quel ». Touchez « Modifier » pour en ajouter."}</T>
        </p>
      )}

      {models.length === 0 ? (
        <button
          type="button"
          onClick={openNew}
          className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50 p-8 text-center transition-transform active:scale-[0.99] dark:border-rose-900/60 dark:bg-rose-950/30"
        >
          <span className="flex size-14 items-center justify-center rounded-2xl bg-rose-500 text-white">
            <Shirt className="size-7" />
          </span>
          <span className="mt-4 text-base font-semibold">
            <T>Ajoutez votre premier modèle</T>
          </span>
          <span className="text-muted-foreground mt-1 max-w-sm text-sm">
            <T>Une photo, un nom, un prix — et les clients qui le choisissent vous sont adressés directement.</T>
          </span>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white">
            <Plus className="size-4" /> <T>Ajouter un modèle</T>
          </span>
        </button>
      ) : (
        <div className="divide-y rounded-xl border">
          {models.map((model) => (
            <div key={model.id} className="flex items-center gap-4 p-3">
              <div className="bg-muted size-12 shrink-0 overflow-hidden rounded-lg">
                {model.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={model.image_url}
                    alt=""
                    className="size-full object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{model.name}</p>
                  {!model.is_active && (
                    <Badge className="bg-muted text-muted-foreground border-0">
                      <T>Brouillon</T>
                    </Badge>
                  )}
                  {lacksFabric(model) && (
                    <Badge className="border-0 bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <T>Sans tissu</T>
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground truncate text-sm">
                  <T>{[categoryName(model.category_slug), model.difficulty && DIFFICULTY_LABEL[model.difficulty]]
                    .filter(Boolean)
                    .join(" · ") || "—"}</T>
                </p>
              </div>

              <div className="text-muted-foreground hidden items-center gap-1.5 text-sm sm:flex">
                <Clock className="size-4" /> <T vars={{ n: model.avg_days }}>{"~{n} j"}</T>
              </div>

              {!model.is_active && (
                <Button
                  size="sm"
                  onClick={() => togglePublished(model)}
                  disabled={publishingId === model.id}
                  className="shrink-0 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {publishingId === model.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  <T>Publier</T>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon-sm" aria-label="Actions" />
                  }
                >
                  <MoreVertical className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(model)}>
                    <Pencil className="size-4" /> <T>Modifier</T>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => togglePublished(model)}
                    disabled={publishingId === model.id}
                  >
                    {model.is_active ? (
                      <>
                        <EyeOff className="size-4" /> <T>Retirer du catalogue</T>
                      </>
                    ) : (
                      <>
                        <Send className="size-4" /> <T>Publier</T>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteTarget(model)}
                  >
                    <Trash2 className="size-4" /> <T>Supprimer</T>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      <ModelSuggestionPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        suggestions={availableSuggestions}
        categories={categories}
        onPick={pickSuggestion}
        onCreateNew={createFromScratch}
      />

      <ModelFormDialog
        key={formSeq}
        open={formOpen}
        onOpenChange={setFormOpen}
        model={editing}
        suggestion={suggestion}
        categories={categories}
        fabrics={fabrics}
        fabricCategories={fabricCategories}
        linkedFabricIds={editing ? (fabricLinks[editing.id] ?? []) : []}
        atelier={atelier}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle><T>Supprimer ce modèle ?</T></DialogTitle>
            <DialogDescription>
              {deleteTarget?.name} <T>sera définitivement retiré du catalogue. Cette action est irréversible.</T>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              <T>Annuler</T>
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              <T>Supprimer</T>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
