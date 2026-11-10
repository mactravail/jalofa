"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Layers, Loader2, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FabricFormDialog } from "@/components/dashboard/fabric-form-dialog";
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
import { formatPrice } from "@/lib/constants";
import { deleteFabric, setFabricInStock } from "@/lib/actions/fabrics";
import { isFabricAvailable } from "@/lib/fabric-metrage";
import type { Fabric, FabricCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { T } from "@/components/i18n/t";
import { translateNow } from "@/lib/i18n/translate";

// Selling cloth is the vendor's whole shop, but only a sideline for a tailor —
// who lands here with nothing listed and no reason to guess why the panel is
// there. Same CRUD either way, so only the framing changes.
const COPY: Record<"tailor" | "vendor", { empty: string }> = {
  tailor: {
    empty:
      "Vous ne vendez pas encore de tissu. Si vous en proposez à vos clients, ajoutez-le ici : il rejoint le catalogue et devient commandable comme celui d'un vendeur.",
  },
  vendor: {
    empty:
      "Vous n'avez pas encore de tissu en boutique. Ajoutez votre premier tissu pour commencer à vendre.",
  },
};

export function VendorFabricsPanel({
  fabrics,
  categories,
  role = "vendor",
}: {
  fabrics: Fabric[];
  categories: FabricCategory[];
  role?: "tailor" | "vendor";
}) {
  const copy = COPY[role];
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Fabric | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Fabric | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [stockChangingId, setStockChangingId] = useState<string | null>(null);
  const [, startStockChange] = useTransition();

  function toggleStock(fabric: Fabric) {
    const next = !isFabricAvailable(fabric);
    setStockChangingId(fabric.id);
    startStockChange(async () => {
      try {
        await setFabricInStock(fabric.id, next);
        toast.success(translateNow(next ? "Tissu disponible." : "Tissu marqué épuisé."));
      } catch (e) {
        toast.error(translateNow(e instanceof Error ? e.message : "Erreur, réessayez."));
      } finally {
        setStockChangingId(null);
      }
    });
  }

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  // Arrivé depuis le raccourci « Ajouter un tissu » de l'accueil (`?nouveau=1`) :
  // on ouvre le formulaire tout de suite. Lecture côté client (window) plutôt que
  // `useSearchParams` : pas de frontière Suspense à prévoir sur la page.
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

  function openEdit(fabric: Fabric) {
    setEditing(fabric);
    setFormOpen(true);
  }

  function confirmDelete() {
    const target = deleteTarget;
    if (!target) return;
    startDelete(async () => {
      try {
        await deleteFabric(target.id);
        toast.success(translateNow("Tissu supprimé."));
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
          <T vars={{ n: fabrics.length }}>{fabrics.length > 1 ? "{n} tissus en boutique" : "{n} tissu en boutique"}</T>
        </p>
        <Button
          size="sm"
          onClick={openNew}
          className="gap-1.5 bg-fuchsia-500 text-white hover:bg-fuchsia-600"
        >
          <Plus className="size-4" /> <T>Ajouter un tissu</T>
        </Button>
      </div>

      {fabrics.length > 0 && (
        <p className="text-muted-foreground mb-3 text-sm">
          <T>Un tissu fini ? Touchez « Disponible » pour le marquer « Épuisé ».</T>
        </p>
      )}

      {fabrics.length === 0 ? (
        <button
          type="button"
          onClick={openNew}
          className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-fuchsia-200 bg-fuchsia-50 p-8 text-center transition-transform active:scale-[0.99] dark:border-fuchsia-900/60 dark:bg-fuchsia-950/30"
        >
          <span className="flex size-14 items-center justify-center rounded-2xl bg-fuchsia-500 text-white">
            <Layers className="size-7" />
          </span>
          <span className="mt-4 text-base font-semibold">
            <T>Ajoutez votre premier tissu</T>
          </span>
          <span className="text-muted-foreground mt-1 max-w-md text-sm">
            <T>{copy.empty}</T>
          </span>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-fuchsia-500 px-4 py-2 text-sm font-semibold text-white">
            <Plus className="size-4" /> <T>Ajouter un tissu</T>
          </span>
        </button>
      ) : (
        <div className="divide-y rounded-xl border">
          {fabrics.map((fabric) => {
            const available = isFabricAvailable(fabric);
            return (
              <div key={fabric.id} className="flex items-center gap-4 p-3">
                <div className="bg-muted size-12 shrink-0 overflow-hidden rounded-lg">
                  {fabric.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fabric.image_url}
                      alt=""
                      className="size-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{fabric.name}</p>
                    {!fabric.is_active && (
                      <Badge className="bg-muted text-muted-foreground border-0">
                        <T>Masqué</T>
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground truncate text-sm">
                    {[fabric.material, fabric.color].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                </div>

                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium">
                    {formatPrice(fabric.price_per_meter)}
                  </p>
                  <p className="text-muted-foreground text-xs"><T>le mètre</T></p>
                </div>

                <Button
                  size="sm"
                  onClick={() => toggleStock(fabric)}
                  disabled={stockChangingId === fabric.id}
                  aria-pressed={available}
                  className={cn(
                    "shrink-0 text-white",
                    available
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700",
                  )}
                >
                  {stockChangingId === fabric.id && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  <T>{available ? "Disponible" : "Épuisé"}</T>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" aria-label="Actions" />
                    }
                  >
                    <MoreVertical className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(fabric)}>
                      <Pencil className="size-4" /> <T>Modifier</T>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleteTarget(fabric)}
                    >
                      <Trash2 className="size-4" /> <T>Supprimer</T>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      <FabricFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        fabric={editing}
        categories={categories}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle><T>Supprimer ce tissu ?</T></DialogTitle>
            <DialogDescription>
              {deleteTarget?.name} <T>sera définitivement retiré de votre boutique. Cette action est irréversible.</T>
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
