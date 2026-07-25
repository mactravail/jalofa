import Image from "next/image";

import { ReviewStars } from "@/components/catalog/review-stars";
import { formatTimeAgo } from "@/lib/constants";

/** Forme minimale d'un avis affichable — satisfaite par les avis tailleur & vendeur. */
export type ReviewListItem = {
  id: string;
  author_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  photos: string[];
};

/** Liste d'avis clients : auteur, note, commentaire et photos jointes. */
export function ReviewList({ reviews }: { reviews: ReviewListItem[] }) {
  return (
    <ul className="mt-4 space-y-4">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">{review.author_name ?? "Client"}</span>
            <time
              className="text-muted-foreground text-xs"
              dateTime={review.created_at}
              suppressHydrationWarning
            >
              {formatTimeAgo(review.created_at)}
            </time>
          </div>
          <ReviewStars value={review.rating} className="mt-1.5" />
          {review.comment && (
            <p className="text-muted-foreground mt-2 text-sm">{review.comment}</p>
          )}
          {review.photos.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {review.photos.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block size-20 overflow-hidden rounded-lg border"
                  >
                    <Image
                      src={url}
                      alt="Photo de l'avis"
                      width={80}
                      height={80}
                      className="size-full object-cover transition-transform hover:scale-105"
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
