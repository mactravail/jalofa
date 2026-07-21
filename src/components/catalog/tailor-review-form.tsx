"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { submitTailorReview, type ReviewFormState } from "@/lib/actions/reviews";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function TailorReviewForm({ tailorId }: { tailorId: string }) {
  const [state, formAction, isPending] = useActionState<ReviewFormState, FormData>(
    submitTailorReview,
    null,
  );
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const submitted = state?.ok === true;

  useEffect(() => {
    if (state?.ok) toast.success("Merci ! Votre avis a été publié.");
  }, [state]);

  if (submitted) {
    return (
      <div className="bg-primary/5 border-primary/30 rounded-xl border px-4 py-6 text-center text-sm">
        Merci d&apos;avoir partagé votre expérience !
      </div>
    );
  }

  const active = hover || rating;

  return (
    <form action={formAction} className="bg-card space-y-4 rounded-xl border p-4">
      <div>
        <h3 className="font-semibold">Laisser un avis</h3>
        <p className="text-muted-foreground text-sm">
          Partagez votre expérience avec ce tailleur.
        </p>
      </div>

      {state && !state.ok && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {state.error}
        </p>
      )}

      <input type="hidden" name="tailor_id" value={tailorId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="space-y-2">
        <Label>Votre note</Label>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {Array.from({ length: 5 }, (_, i) => {
            const value = i + 1;
            return (
              <button
                key={value}
                type="button"
                aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                onMouseEnter={() => setHover(value)}
                onClick={() => setRating(value)}
                className="rounded-sm p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "size-7",
                    value <= active
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-comment">Votre commentaire (facultatif)</Label>
        <Textarea
          id="review-comment"
          name="comment"
          rows={3}
          maxLength={1000}
          placeholder="Qualité de la couture, respect des délais, accueil…"
        />
      </div>

      <Button type="submit" disabled={isPending || rating === 0}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Publier mon avis
      </Button>
    </form>
  );
}
