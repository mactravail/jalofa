"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteFeedback, setFeedbackStatus } from "@/lib/actions/feedback";
import type { FeedbackStatus } from "@/lib/constants";
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
 * Les actions de triage d'un retour, côté administration : le marquer « traité »
 * (ou le rouvrir) et le supprimer après confirmation. L'action serveur revérifie
 * le rôle admin — ce composant ne fait que déclencher.
 */
export function FeedbackAdminActions({
  id,
  status,
}: {
  id: string;
  status: FeedbackStatus;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleStatus() {
    const next: FeedbackStatus = status === "new" ? "resolved" : "new";
    startTransition(async () => {
      const res = await setFeedbackStatus(id, next);
      if (res.ok) {
        toast.success(
          next === "resolved" ? "Retour marqué comme traité." : "Retour rouvert.",
        );
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      const res = await deleteFeedback(id);
      if (res.ok) {
        toast.success("Retour supprimé.");
        setConfirmOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleStatus}
          disabled={isPending}
          className="gap-1.5"
        >
          {status === "new" ? (
            <>
              <Check className="size-4" /> Traiter
            </>
          ) : (
            <>
              <RotateCcw className="size-4" /> Rouvrir
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Supprimer ce retour"
          onClick={() => setConfirmOpen(true)}
          disabled={isPending}
          className="text-muted-foreground hover:text-destructive size-8"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(o) => !isPending && setConfirmOpen(o)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer ce retour ?</DialogTitle>
            <DialogDescription>
              Le message sera définitivement retiré. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
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
