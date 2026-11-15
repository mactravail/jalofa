import { NotFoundView } from "@/components/not-found-view";

// URL inconnue : rendue dans le layout racine seul, sans l'en-tête du site.
export default function NotFound() {
  return (
    <main className="bg-background min-h-svh">
      <NotFoundView withLogo />
    </main>
  );
}
