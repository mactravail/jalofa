"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteInspirationPost } from "@/lib/actions/inspiration";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Supprime une publication « Inspiration » après confirmation. Utilisé par
 * l'auteur (dans son espace) comme par l'administration (modération) — l'action
 * serveur décide qui a le droit selon le rôle.
 */
export function DeleteInspirationButton({
  id,
  label,
}: {
  id: string;
  /** Présent = bouton texte (espace client) ; absent = icône seule (modération). */
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const res = await deleteInspirationPost(id);
      if (res.ok) {
        toast.success("Publication supprimée.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      {label ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="text-muted-foreground hover:text-destructive gap-1.5"
        >
          <Trash2 className="size-4" /> {label}
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Supprimer cette publication"
          onClick={() => setOpen(true)}
          className="text-muted-foreground hover:text-destructive size-8 shrink-0"
        >
          <Trash2 className="size-4" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={(o) => !isPending && setOpen(o)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer cette publication ?</DialogTitle>
            <DialogDescription>
              La tenue et ses photos seront définitivement retirées de la galerie.
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
