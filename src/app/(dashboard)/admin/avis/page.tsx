import { Scissors, Star, Store } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { DeleteReviewButton } from "@/components/admin/delete-review-button";
import { getAdminReviews, type AdminReviewRow } from "@/lib/admin-data";
import { cn } from "@/lib/utils";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Dakar",
});

export default async function AdminReviewsPage() {
  const reviews = await getAdminReviews();

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <AdminPage
      title="Avis"
      subtitle="Les évaluations laissées par les clients sur les tailleurs et les vendeurs de tissu."
    >
      {reviews.length > 0 && (
        <div className="text-muted-foreground mb-6 flex items-center gap-2 text-sm">
          <Stars rating={Math.round(average)} />
          <span>
            <strong className="text-foreground">{average.toFixed(1)}</strong> de
            moyenne sur {reviews.length} avis
          </span>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">Aucun avis.</p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {reviews.map((review) => (
            <ReviewItem key={`${review.kind}-${review.id}`} review={review} />
          ))}
        </div>
      )}
    </AdminPage>
  );
}

function ReviewItem({ review }: { review: AdminReviewRow }) {
  const isTailor = review.kind === "tailor";
  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Stars rating={review.rating} />
          <KindBadge kind={review.kind} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {DATE_FORMAT.format(new Date(review.created_at))}
          </span>
          <DeleteReviewButton kind={review.kind} id={review.id} />
        </div>
      </div>
      <p className="mt-2 text-sm">
        <span className="font-medium">{review.clientName ?? "Client"}</span>
        <span className="text-muted-foreground"> à propos de </span>
        <span className="font-medium">
          {review.targetName ?? (isTailor ? "un tailleur" : "une boutique")}
        </span>
      </p>
      {review.comment && (
        <p className="text-muted-foreground mt-1 text-sm">{review.comment}</p>
      )}
    </div>
  );
}

function KindBadge({ kind }: { kind: AdminReviewRow["kind"] }) {
  const isTailor = kind === "tailor";
  const Icon = isTailor ? Scissors : Store;
  return (
    <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium">
      <Icon className="size-3" />
      {isTailor ? "Tailleur" : "Vendeur"}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < rating
              ? "fill-primary text-primary"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </span>
  );
}
