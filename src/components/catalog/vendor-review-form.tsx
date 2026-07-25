"use client";

import { submitVendorReview } from "@/lib/actions/reviews";
import { ReviewForm } from "@/components/catalog/review-form";

export function VendorReviewForm({ vendorId }: { vendorId: string }) {
  return (
    <ReviewForm
      action={submitVendorReview}
      hidden={{ vendor_id: vendorId }}
      description="Partagez votre expérience avec cette boutique de tissu."
      placeholder="Qualité du tissu, conformité à la photo, métrage, livraison…"
    />
  );
}
