"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/i18n/navigation";
import { BadgeCheck, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { reviewCertificationRequest } from "@/lib/actions/certification";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/**
 * Accepter ou refuser une demande de certification. Accepter pose le badge
 * « Certifié » ; refuser demande un motif, que le pro lira. L'action serveur
 * revérifie le rôle admin.
 */
export function CertificationAdminActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  function decide(decision: "approved" | "rejected") {
    startTransition(async () => {
      const res = await reviewCertificationRequest(
        id,
        decision,
        decision === "rejected" ? note : null,
      );
      if (res.ok) {
        toast.success(decision === "approved" ? `${name} est certifié.` : "Demande refusée.");
        setRejectOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => decide("approved")}
          disabled={isPending}
          className="gap-1.5"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <BadgeCheck className="size-4" />
          )}
          Certifier
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setRejectOpen(true)}
          disabled={isPending}
          className="gap-1.5"
        >
          <XCircle className="size-4" /> Refuser
        </Button>
      </div>

      <Dialog open={rejectOpen} onOpenChange={(o) => !isPending && setRejectOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Refuser la demande de {name} ?</DialogTitle>
            <DialogDescription>
              Écrivez le motif : le pro le verra et pourra renvoyer une demande corrigée.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex. : la photo de la carte d'identité est illisible."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => decide("rejected")}
              disabled={isPending || note.trim().length < 3}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Refuser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
