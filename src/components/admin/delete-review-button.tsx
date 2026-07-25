"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteReview,
  type ReviewKind,
} from "@/lib/actions/review-moderation";
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
 * Bouton de modération : supprime un avis (tailleur ou vendeur) après
 * confirmation. Réservé à l'espace admin — l'action serveur revérifie le rôle.
 */
export function DeleteReviewButton({
  kind,
  id,
}: {
  kind: ReviewKind;
  id: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const res = await deleteReview(kind, id);
      if (res.ok) {
        toast.success("Avis supprimé.");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Supprimer cet avis"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-destructive size-8 shrink-0"
      >
        <Trash2 className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={(o) => !isPending && setOpen(o)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer cet avis ?</DialogTitle>
            <DialogDescription>
              L&apos;avis et ses photos seront définitivement retirés, et la note
              de la boutique recalculée. Cette action est irréversible.
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
