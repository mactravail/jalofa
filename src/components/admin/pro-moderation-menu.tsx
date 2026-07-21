"use client";

import { useState, useTransition } from "react";
import {
  BadgeCheck,
  BadgeX,
  Ban,
  Loader2,
  MoreVertical,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import {
  useModeration,
  type ModerationState,
} from "@/components/admin/moderation-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  SUSPENSION_REASON_LABELS,
  type SuspensionReason,
} from "@/lib/constants";
import type { ProKind } from "@/lib/actions/moderation";

/**
 * Le menu d'actions de modération d'un prestataire (⋯), côté admin. Suspendre
 * ouvre une boîte de dialogue qui exige un motif ; réactiver et
 * (dé)certifier sont des gestes directs. L'état effectif (`state`) est calculé
 * en amont par la ligne, surcharges de démo comprises.
 */
export function ProModerationMenu({
  kind,
  id,
  name,
  state,
}: {
  kind: ProKind;
  id: string;
  name: string;
  state: ModerationState;
}) {
  const { setSuspension, setCertification } = useModeration();
  const [isPending, startTransition] = useTransition();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reason, setReason] = useState<SuspensionReason>("unpaid");

  const run = (action: () => Promise<void>, success: string) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(success);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur de modération");
      }
    });
  };

  const confirmSuspend = () => {
    run(
      () =>
        setSuspension(kind, id, {
          ...state,
          is_suspended: true,
          suspension_reason: reason,
        }),
      `${name} suspendu · ${SUSPENSION_REASON_LABELS[reason]}`,
    );
    setSuspendOpen(false);
  };

  const reactivate = () =>
    run(
      () =>
        setSuspension(kind, id, {
          ...state,
          is_suspended: false,
          suspension_reason: null,
        }),
      `${name} réactivé`,
    );

  const toggleCertify = () => {
    const next = !state.is_certified;
    run(
      () => setCertification(kind, id, { ...state, is_certified: next }),
      next ? `${name} certifié` : `Certification de ${name} retirée`,
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Actions de modération"
            />
          }
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MoreVertical className="size-4" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={toggleCertify} disabled={isPending}>
            {state.is_certified ? (
              <>
                <BadgeX /> Retirer la certification
              </>
            ) : (
              <>
                <BadgeCheck /> Certifier
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {state.is_suspended ? (
            <DropdownMenuItem onClick={reactivate} disabled={isPending}>
              <RotateCcw /> Réactiver
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setSuspendOpen(true)}
              disabled={isPending}
            >
              <Ban /> Suspendre…
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspendre {name}</DialogTitle>
            <DialogDescription>
              Le prestataire disparaît du catalogue et ne peut plus recevoir de
              commande jusqu&apos;à sa réactivation. Choisissez le motif.
            </DialogDescription>
          </DialogHeader>

          <RadioGroup
            value={reason}
            onValueChange={(v) => setReason(v as SuspensionReason)}
          >
            {(Object.keys(SUSPENSION_REASON_LABELS) as SuspensionReason[]).map(
              (r) => (
                <label
                  key={r}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 text-sm has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5"
                >
                  <RadioGroupItem value={r} />
                  {SUSPENSION_REASON_LABELS[r]}
                </label>
              ),
            )}
          </RadioGroup>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Annuler</DialogClose>
            <Button variant="destructive" onClick={confirmSuspend}>
              <Ban /> Suspendre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
