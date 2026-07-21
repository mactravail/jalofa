"use client";

import { useState, useTransition } from "react";
import { Loader2, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
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
import { deleteFabric } from "@/lib/actions/fabrics";
import type { Fabric, FabricCategory } from "@/lib/types";

const LOW_STOCK_THRESHOLD = 20; // metres

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

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

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
        toast.success("Tissu supprimé.");
        setDeleteTarget(null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur de suppression.");
      }
    });
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {fabrics.length} tissu{fabrics.length > 1 ? "s" : ""} en boutique
        </p>
        <Button size="sm" onClick={openNew} className="gap-1.5">
          <Plus className="size-4" /> Ajouter un tissu
        </Button>
      </div>

      {fabrics.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground mx-auto max-w-md text-sm">
            {copy.empty}
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {fabrics.map((fabric) => {
            const low = fabric.stock_meters < LOW_STOCK_THRESHOLD;
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
                        Masqué
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
                  <p className="text-muted-foreground text-xs">le mètre</p>
                </div>

                <div className="w-20 text-right">
                  {low ? (
                    <Badge className="border-0 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {fabric.stock_meters} m
                    </Badge>
                  ) : (
                    <span className="text-sm font-medium">
                      {fabric.stock_meters} m
                    </span>
                  )}
                  <p className="text-muted-foreground text-xs">en stock</p>
                </div>

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
                      <Pencil className="size-4" /> Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleteTarget(fabric)}
                    >
                      <Trash2 className="size-4" /> Supprimer
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
            <DialogTitle>Supprimer ce tissu ?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.name} sera définitivement retiré de votre boutique.
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
