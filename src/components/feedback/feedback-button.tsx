"use client";

import { useState, useTransition } from "react";
import { Loader2, MessageSquarePlus, Send } from "lucide-react";
import { toast } from "sonner";

import { submitFeedback } from "@/lib/actions/feedback";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABELS,
  type FeedbackCategory,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Invite du message, adaptée à la catégorie choisie. */
const MESSAGE_PLACEHOLDER: Record<FeedbackCategory, string> = {
  amelioration: "Décrivez l'idée : ce qui vous ferait gagner du temps, ce qui manque…",
  probleme: "Que s'est-il passé ? Où, et à quel moment ? Plus c'est précis, mieux c'est.",
  autre: "Dites-nous tout : question, remarque, suggestion…",
};

/**
 * Le bouton « Une idée ? Un problème ? » — présent dans chaque espace (client,
 * tailleur, vendeur). Il ouvre une fenêtre où l'utilisateur choisit une catégorie
 * et écrit un message libre. Le retour arrive à l'administration (`/admin/feedback`).
 *
 * Volontairement autonome (aucune donnée à charger) pour se glisser aussi bien
 * dans le châssis pro que dans la barre latérale de l'espace client.
 */
export function FeedbackButton({
  space,
  className,
}: {
  space: "client" | "tailor" | "vendor";
  /** Ajusté selon l'emplacement (barre latérale pro, aside client…). */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("amelioration");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const res = await submitFeedback(null, formData);
      if (res?.ok) {
        toast.success("Merci ! Votre retour nous est bien parvenu.");
        form.reset();
        setCategory("amelioration");
        setOpen(false);
      } else {
        toast.error(res?.error ?? "Une erreur est survenue. Réessayez.");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn(
          "border-primary/30 text-foreground w-full justify-start gap-2 font-medium",
          className,
        )}
      >
        <MessageSquarePlus className="text-primary size-4 shrink-0" />
        Une idée ? Un problème ?
      </Button>

      <Dialog open={open} onOpenChange={(o) => !isPending && setOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Aidez-nous à améliorer JALOFA</DialogTitle>
              <DialogDescription>
                Une idée, un problème, une remarque ? Dites-nous tout — nous lisons
                chaque message.
              </DialogDescription>
            </DialogHeader>

            {/* Contexte + catégorie passés en champs cachés (contrôle local). */}
            <input type="hidden" name="space" value={space} />
            <input type="hidden" name="category" value={category} />

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>De quoi s&apos;agit-il ?</Label>
                <div className="grid grid-cols-3 gap-2">
                  {FEEDBACK_CATEGORIES.map((c) => {
                    const active = c === category;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        aria-pressed={active}
                        className={cn(
                          "rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                          active
                            ? "border-primary bg-primary/10 text-foreground"
                            : "text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {FEEDBACK_CATEGORY_LABELS[c]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-message">Votre message</Label>
                <Textarea
                  id="feedback-message"
                  name="message"
                  rows={5}
                  required
                  maxLength={2000}
                  autoFocus
                  placeholder={MESSAGE_PLACEHOLDER[category]}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Envoyer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
