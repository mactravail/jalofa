"use client";

import { useRouter } from "@/lib/i18n/navigation";
import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, ThumbsUp, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelOrder,
  requestFabricReturn,
  submitSatisfaction,
  type AfterSaleResult,
} from "@/lib/actions/after-sale";
import {
  SATISFACTION_ISSUES,
  isSatisfactionIssue,
  type AlterationReason,
  type SatisfactionIssue,
  type SatisfactionVerdict,
} from "@/lib/after-sale";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

function useAfterSaleAction(done: string) {
  const router = useRouter();
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const run = (action: () => Promise<AfterSaleResult>) =>
    startTransition(async () => {
      const res = await action();
      if (res.ok) {
        toast.success(t(done));
        router.refresh();
      } else {
        toast.error(t(res.error));
      }
    });
  return { run, isPending };
}

/** Annuler dans le délai. Le bouton demande une confirmation : le geste est définitif. */
export function CancelOrderPanel({
  orderId,
  paid,
  deadlineLabel,
  lateSince,
}: {
  orderId: string;
  paid: boolean;
  /** « 12 novembre à 14:30 » ; absent quand aucun délai ne s'applique. */
  deadlineLabel: string | null;
  /** Date promise dépassée de plus d'une semaine : l'annulation est due au retard. */
  lateSince?: string | null;
}) {
  const [confirming, setConfirming] = useState(false);
  const t = useT();
  const { run, isPending } = useAfterSaleAction("Commande annulée.");

  return (
    <div className={cn("rounded-xl border p-4", lateSince && "border-red-500/60")}>
      <p className="font-semibold">
        {lateSince ? t("Plus d'une semaine de retard") : t("Vous avez changé d'avis ?")}
      </p>
      <p className="text-muted-foreground mt-0.5 text-sm">
        {lateSince
          ? t("Votre habit devait être prêt le {date}. Vous pouvez annuler : JALOFA vous rembourse tout.", { date: lateSince })
          : paid
          ? t("Annulez et JALOFA vous rembourse.")
          : t("Vous pouvez annuler cette demande.")}
        {!lateSince && deadlineLabel && ` ${t("Possible jusqu'au {date}.", { date: deadlineLabel })}`}
      </p>
      {confirming ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => run(() => cancelOrder(orderId))}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {t("Oui, annuler")}
          </Button>
          <Button variant="outline" disabled={isPending} onClick={() => setConfirming(false)}>
            {t("Non, garder")}
          </Button>
        </div>
      ) : (
        <Button variant="outline" className="mt-3" onClick={() => setConfirming(true)}>
          {t("Annuler ma commande")}
        </Button>
      )}
    </div>
  );
}

/** Rendre un tissu reçu, ou suivre le retour déjà demandé. */
export function FabricReturnPanel({
  orderId,
  status,
  deadlineLabel,
  returnAddress,
}: {
  orderId: string;
  status: "requested" | "received" | null;
  deadlineLabel: string | null;
  returnAddress: { address: string; phone: string } | null;
}) {
  const { run, isPending } = useAfterSaleAction("Retour enregistré.");
  const t = useT();

  if (status === "received") {
    return (
      <div className="rounded-xl border p-4">
        <p className="font-semibold">{t("Le vendeur a reçu votre tissu")}</p>
        <p className="text-muted-foreground mt-0.5 text-sm">{t("JALOFA va vous rembourser.")}</p>
      </div>
    );
  }

  if (status === "requested") {
    return (
      <div className="rounded-xl border p-4">
        <p className="font-semibold">{t("Renvoyez le tissu au vendeur")}</p>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {t("L'envoi est à votre charge. Vous êtes remboursé quand le vendeur l'a reçu.")}
        </p>
        {returnAddress ? (
          <div className="bg-muted/50 mt-3 rounded-lg p-3 text-sm">
            <p className="break-words font-medium">{returnAddress.address}</p>
            <a href={`tel:${returnAddress.phone}`} className="mt-1 block hover:underline">
              {returnAddress.phone}
            </a>
          </div>
        ) : (
          <p className="bg-muted/50 mt-3 rounded-lg p-3 text-sm">
            {t("JALOFA vous contacte sur WhatsApp pour vous donner l'adresse.")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4">
      <p className="font-semibold">{t("Ce tissu ne vous convient pas ?")}</p>
      <p className="text-muted-foreground mt-0.5 text-sm">
        {deadlineLabel
          ? t("Vous pouvez le rendre jusqu'au {date}.", { date: deadlineLabel })
          : t("Vous pouvez le rendre.")}{" "}
        {t("L'envoi est à votre charge, et vous êtes remboursé quand le vendeur l'a reçu.")}
      </p>
      <Button
        variant="outline"
        className="mt-3"
        disabled={isPending}
        onClick={() => run(() => requestFabricReturn(orderId))}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
        {t("Rendre ce tissu")}
      </Button>
    </div>
  );
}

const ISSUES = Object.keys(SATISFACTION_ISSUES) as SatisfactionIssue[];

/**
 * « La tenue vous va ? », après « Reçue » : Parfaite (mot facultatif) ou Un
 * problème (suggestions et/ou mot libre). La réponse part au tailleur — et au
 * vendeur si le tissu est en cause — et à JALOFA, qui évalue les prestataires.
 */
export function SatisfactionPanel({
  orderId,
  answer,
  alterations,
}: {
  orderId: string;
  /** Déjà répondu : on affiche la réponse. */
  answer: { verdict: SatisfactionVerdict; issues: string[]; comment: string | null } | null;
  alterations: { id: string; reason: AlterationReason; status: "requested" | "done" }[];
}) {
  const [verdict, setVerdict] = useState<SatisfactionVerdict | null>(null);
  const t = useT();
  const [issues, setIssues] = useState<SatisfactionIssue[]>([]);
  const [comment, setComment] = useState("");
  const { run, isPending } = useAfterSaleAction("Merci ! Votre réponse est envoyée.");

  const toggle = (i: SatisfactionIssue) =>
    setIssues((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  if (answer) {
    return (
      <div className="rounded-xl border p-4">
        <p className="flex items-center gap-2 font-semibold">
          {answer.verdict === "perfect" ? (
            <>
              <ThumbsUp className="size-4 text-emerald-400" /> {t("Vous trouvez la tenue parfaite")}
            </>
          ) : (
            <>
              <AlertTriangle className="size-4 text-amber-400" /> {t("Vous avez signalé un problème")}
            </>
          )}
        </p>
        {answer.issues.length > 0 && (
          <p className="text-muted-foreground mt-1 text-sm">
            {answer.issues
              .filter(isSatisfactionIssue)
              .map((i) => t(SATISFACTION_ISSUES[i].label))
              .join(", ")}
          </p>
        )}
        {answer.comment && <p className="mt-1 text-sm break-words">« {answer.comment} »</p>}
        {alterations.map((a) => (
          <p key={a.id} className="bg-muted/50 mt-3 rounded-lg p-3 text-sm">
            {t("Retouche :")}{" "}
            <span className="font-medium">
              {a.status === "done" ? t("faite par le tailleur") : t("demande envoyée au tailleur")}
            </span>
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4">
      <p className="font-semibold">{t("La tenue vous va ?")}</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setVerdict("perfect")}
          aria-pressed={verdict === "perfect"}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-semibold transition-colors",
            verdict === "perfect"
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
              : "hover:bg-muted",
          )}
        >
          <ThumbsUp className="size-6" /> {t("Parfaite")}
        </button>
        <button
          type="button"
          onClick={() => setVerdict("problem")}
          aria-pressed={verdict === "problem"}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-semibold transition-colors",
            verdict === "problem"
              ? "border-amber-500 bg-amber-500/10 text-amber-400"
              : "hover:bg-muted",
          )}
        >
          <AlertTriangle className="size-6" /> {t("Un problème")}
        </button>
      </div>

      {verdict === "problem" && (
        <>
          <p className="text-muted-foreground mt-4 text-sm">
            {t("Qu'est-ce qui ne va pas ? (plusieurs choix possibles)")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ISSUES.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                aria-pressed={issues.includes(i)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  issues.includes(i)
                    ? "border-amber-500 bg-amber-500/10 font-medium text-amber-400"
                    : "hover:bg-muted",
                )}
              >
                {t(SATISFACTION_ISSUES[i].label)}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            {t("Une tenue cousue ne se rend pas, mais votre tailleur peut la retoucher.")}
          </p>
        </>
      )}

      {verdict && (
        <>
          <Textarea
            className="mt-3"
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            placeholder={
              verdict === "perfect"
                ? t("Un mot pour le tailleur ? (facultatif)")
                : t("Expliquez en quelques mots (facultatif)")
            }
          />
          <Button
            className="mt-3 h-11 w-full"
            disabled={isPending || (verdict === "problem" && issues.length === 0 && !comment.trim())}
            onClick={() => run(() => submitSatisfaction(orderId, verdict, issues, comment))}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {t("Envoyer")}
          </Button>
        </>
      )}
    </div>
  );
}
