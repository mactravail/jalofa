import { Skeleton } from "@/components/ui/skeleton";

/**
 * Ce qui s'affiche à l'instant du clic, pendant que le serveur prépare la page :
 * la personne voit tout de suite que son geste a marché. Un titre et une grille,
 * la forme de la plupart de nos pages. Aucun texte : rien à lire pendant l'attente.
 */
export function PageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Chargement"
      className="mx-auto w-full max-w-6xl px-4 py-8"
    >
      <Skeleton className="h-8 w-48 max-w-full" />
      <Skeleton className="mt-3 h-4 w-72 max-w-full" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="aspect-4/5 w-full" />
        ))}
      </div>
    </div>
  );
}
