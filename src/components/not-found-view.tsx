import Link from "@/components/i18n/link";
import { Wordmark } from "@/components/wordmark";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

/**
 * La page « introuvable » de JALOFA : noire, en français (ou en italien), avec
 * deux sorties claires. Remplace la page 404 blanche et en anglais de Next.
 * `withLogo` : hors du layout du site (URL inconnue), il n'y a pas d'en-tête.
 */
export async function NotFoundView({ withLogo = false }: { withLogo?: boolean }) {
  const t = await getT();
  return (
    <div className="bg-background text-foreground flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      {withLogo && (
        <Link href="/" aria-label={t("JALOFA — accueil")} className="mb-12">
          <Wordmark size="lg" />
        </Link>
      )}
      <p className="text-muted-foreground text-xs font-medium tracking-[0.3em] uppercase">404</p>
      <h1 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">
        {t("Cette page n'existe pas")}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
        {t("Le lien est peut-être ancien, ou ce modèle n'est plus proposé.")}
      </p>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
        <Link href="/modeles" className={cn(buttonVariants({ size: "lg" }), "h-12 px-6 text-base")}>
          {t("Voir les modèles")}
        </Link>
        <Link
          href="/"
          className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-12 px-6 text-base")}
        >
          {t("Retour à l'accueil")}
        </Link>
      </div>
    </div>
  );
}
