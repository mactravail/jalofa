import Link from "@/components/i18n/link";
import { ArrowRight, Scissors, Shirt, Store } from "lucide-react";

import { Stitching, TapeMeasure } from "@/components/auth/couture-decor";
import { getT } from "@/lib/i18n/server";

/**
 * Premier écran de « Créer un compte » : deux comptes seulement, qui doivent se
 * distinguer d'un coup d'œil (public peu lettré → le picto et le contraste
 * parlent avant le texte). Aucune photo : le décor vient du métier (mètre ruban,
 * surpiqûre).
 *  - **Pro** (en premier) : carte noire — un seul compte pour publier comme
 *    tailleur ET vendre du tissu, deux offres ensuite ;
 *  - **Client** : carte blanche — « je commande ».
 *
 * `data-wide` élargit le conteneur du layout d'auth : les cartes passent côte à
 * côte sur grand écran.
 */
export async function RegisterChoice({ redirect }: { redirect?: string }) {
  const t = await getT();
  const clientHref = redirect
    ? `/inscription?role=client&redirect=${encodeURIComponent(redirect)}`
    : "/inscription?role=client";

  return (
    <div data-wide className="space-y-7">
      <header className="motion-safe:animate-in motion-safe:fade-in space-y-4 text-center motion-safe:duration-500">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.25em] uppercase">
          {t("Créer un compte")}
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {t("Qui êtes-vous ?")}
        </h1>
        <TapeMeasure />
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Pro — noir */}
        <Link
          href="/inscription?role=pro"
          className="group motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 relative flex min-h-80 flex-col rounded-3xl bg-gradient-to-b from-neutral-900 to-neutral-950 p-7 text-white ring-1 ring-white/20 transition-shadow hover:ring-white/60 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none motion-safe:delay-100 motion-safe:duration-500 motion-safe:fill-mode-both"
        >
          <Stitching className="border-white/25" />

          <div className="flex items-start justify-between gap-4">
            <span className="text-xs font-semibold tracking-[0.2em] text-white/70 uppercase">
              {t("Professionnel")}
            </span>
            <Scissors
              aria-hidden
              strokeWidth={0.6}
              className="size-24 shrink-0 transition-transform duration-500 group-hover:-rotate-12"
            />
          </div>

          <h2 className="mt-3 text-3xl font-bold tracking-tight">{t("Je suis pro")}</h2>
          <p className="mt-1.5 text-base text-white/70">
            {t("Je couds et je vends du tissu.")}
          </p>

          <p className="mt-3 text-sm font-semibold text-orange-400">
            {t("Accès PRO offert aux professionnels sélectionnés.")}
          </p>

          <div className="mt-4 mb-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">
              <Scissors aria-hidden className="size-4" /> {t("Tailleur")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">
              <Store aria-hidden className="size-4" /> {t("Vendeur de tissu")}
            </span>
          </div>

          <span className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-base font-semibold text-neutral-950 transition-colors group-hover:bg-neutral-200">
            {t("Candidater à la sélection")}
            <ArrowRight
              aria-hidden
              className="size-5 transition-transform group-hover:translate-x-1"
            />
          </span>
        </Link>

        {/* Client — blanc */}
        <Link
          href={clientHref}
          className="group motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 relative flex min-h-80 flex-col rounded-3xl bg-white p-7 text-neutral-950 ring-offset-2 ring-offset-black transition-shadow hover:ring-2 hover:ring-white/60 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none motion-safe:delay-200 motion-safe:duration-500 motion-safe:fill-mode-both"
        >
          <Stitching className="border-neutral-950/25" />

          <div className="flex items-start justify-between gap-4">
            <span className="text-xs font-semibold tracking-[0.2em] text-neutral-600 uppercase">
              {t("Gratuit")}
            </span>
            <Shirt
              aria-hidden
              strokeWidth={0.6}
              className="size-24 shrink-0 transition-transform duration-500 group-hover:-rotate-6"
            />
          </div>

          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            {t("Je suis client")}
          </h2>
          <p className="mt-1.5 mb-6 text-base text-neutral-600">
            {t("Je commande des tenues sur mesure.")}
          </p>

          <span className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 py-3.5 text-base font-semibold text-white transition-colors group-hover:bg-neutral-800">
            {t("Créer mon compte")}
            <ArrowRight
              aria-hidden
              className="size-5 transition-transform group-hover:translate-x-1"
            />
          </span>
        </Link>
      </div>

      <p className="text-muted-foreground text-center text-sm">
        {t("Déjà inscrit ?")}{" "}
        <Link
          href="/connexion"
          className="text-foreground inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:underline"
        >
          {t("Se connecter")}
        </Link>
      </p>
    </div>
  );
}
