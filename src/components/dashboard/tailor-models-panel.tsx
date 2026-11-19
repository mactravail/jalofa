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
import { isReadyToWear } from "@/lib/ready-to-wear";
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
import { unwrap } from "@/lib/action-result";
import type {
  GarmentModel,
  ModelCategory,
  TailorAtelier,
} from "@/lib/types";
import type { TailorBodyFits } from "@/lib/model-body-fit";
import { T } from "@/components/i18n/t";
import { translateNow } from "@/lib/i18n/translate";

const DIFFICULTY_LABEL: Record<string, string> = {
  facile: "Facile",
  moyen: "Intermédiaire",
  difficile: "Avancé",
};

export function TailorModelsPanel({
  models,
  suggestions,
  categories,
  atelier,
  bodyFits = {},
  europe = false,
}: {
  models: GarmentModel[];
  suggestions: GarmentModel[];
  categories: ModelCategory[];
  atelier: TailorAtelier | null;
  /** « Mes métrages » : les mètres de tissu, communs à tous les modèles. */
  bodyFits?: TailorBodyFits;
  /** Atelier installé en Europe : le formulaire montre les champs JALOFA EUROPE. */
  europe?: boolean;
}) {
  const needsSetup = !atelier;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GarmentModel | null>(null);
  const [suggestion, setSuggestion] = useState<GarmentModel | null>(null);
  // Le formulaire est remonté seulement quand sa source change (autre modèle,
  // autre suggestion) ou après un enregistrement : fermé par erreur, il garde
  // tout ce qui a été saisi et on reprend là où on en était.
  const [savedSeq, setSavedSeq] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<GarmentModel | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [, startPublish] = useTransition();

  // Publier demande confirmation (« Êtes-vous sûr ? ») ; retirer du catalogue, non.
  const [publishTarget, setPublishTarget] = useState<GarmentModel | null>(null);
  function askPublish(model: GarmentModel) {
    if (model.is_active) togglePublished(model);
    else setPublishTarget(model);
  }

  function togglePublished(model: GarmentModel) {
    const next = !model.is_active;
    setPublishingId(model.id);
    startPublish(async () => {
      try {
        unwrap(await setModelPublished(model.id, next));
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
      setFormOpen(true);
    }
  }, []);

  // Le « + » de la barre du bas, pressé alors qu'on est déjà sur cette page.
  useEffect(() => {
    const onNew = () => {
      setEditing(null);
      setSuggestion(null);
      setFormOpen(true);
    };
    window.addEventListener(NEW_MODEL_EVENT, onNew);
    return () => window.removeEventListener(NEW_MODEL_EVENT, onNew);
  }, []);

  const categoryName = (slug: string | null) =>
    categories.find((c) => c.slug === slug)?.name ?? null;

  function openForm() {
    setFormOpen(true);
  }

  // « Ajouter un modèle » ouvre directement le formulaire vierge : la liste de
  // suggestions du catalogue (Agbada, Costume…) embrouillait les tailleurs.
  function openNew() {
    setEditing(null);
    setSuggestion(null);
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
        unwrap(await deleteModel(target.id));
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
          <T>{"Indiquez l'adresse de votre atelier : les vendeurs y envoient les tissus de vos clients. Touchez « Modifier » sur un modèle."}</T>
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
            <div key={model.id} className="flex items-start gap-3 p-3 sm:items-center sm:gap-4">
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
                {/* Le nom a sa ligne ; les pastilles passent dessous (sur mobile,
                    elles écrasaient le nom et le bouton « Publier »). */}
                <p className="truncate font-medium">{model.name}</p>
                <p className="text-muted-foreground truncate text-sm">
                  <T>{[categoryName(model.category_slug), model.difficulty && DIFFICULTY_LABEL[model.difficulty]]
                    .filter(Boolean)
                    .join(" · ") || "—"}</T>
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 empty:hidden">
                  {!model.is_active && (
                    <Badge className="bg-muted text-muted-foreground border-0">
                      <T>Brouillon</T>
                    </Badge>
                  )}
                  {isReadyToWear(model) && (
                    <Badge className="border-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <T>Prêt-à-porter</T>
                    </Badge>
                  )}
                  {!model.is_active && (
                    <Button
                      size="sm"
                      onClick={() => askPublish(model)}
                      disabled={publishingId === model.id}
                      className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 sm:hidden"
                    >
                      {publishingId === model.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      <T>Publier</T>
                    </Button>
                  )}
                </div>
              </div>

              <div className="text-muted-foreground hidden items-center gap-1.5 text-sm sm:flex">
                <Clock className="size-4" /> <T vars={{ n: model.avg_days }}>{"~{n} j"}</T>
              </div>

              {!model.is_active && (
                <Button
                  size="sm"
                  onClick={() => askPublish(model)}
                  disabled={publishingId === model.id}
                  className="hidden shrink-0 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 sm:inline-flex"
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
                    onClick={() => askPublish(model)}
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

      <ModelFormDialog
        key={`${editing?.id ?? suggestion?.id ?? "new"}-${savedSeq}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => setSavedSeq((n) => n + 1)}
        onReset={() => setSavedSeq((n) => n + 1)}
        model={editing}
        suggestion={suggestion}
        categories={categories}
        catalog={suggestions}
        atelier={atelier}
        bodyFits={bodyFits}
        europe={europe}
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

      <Dialog
        open={Boolean(publishTarget)}
        onOpenChange={(o) => !o && setPublishTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle><T>Publier ce modèle ?</T></DialogTitle>
            <DialogDescription>
              {publishTarget?.name} <T>sera visible par les clients dans le catalogue.</T>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishTarget(null)}>
              <T>Annuler</T>
            </Button>
            <Button
              onClick={() => {
                const target = publishTarget;
                setPublishTarget(null);
                if (target) togglePublished(target);
              }}
              className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Send className="size-4" />
              <T>Oui, publier</T>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
