"use client";

import { submitTailorReview } from "@/lib/actions/reviews";
import { ReviewForm } from "@/components/catalog/review-form";

export function TailorReviewForm({ tailorId }: { tailorId: string }) {
  return (
    <ReviewForm
      action={submitTailorReview}
      hidden={{ tailor_id: tailorId }}
      description="Partagez votre expérience avec ce tailleur."
      placeholder="Qualité de la couture, respect des délais, accueil…"
    />
  );
}
