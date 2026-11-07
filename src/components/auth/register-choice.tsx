import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Scissors, Shirt, Store } from "lucide-react";

/**
 * Premier écran de « Créer un compte » : deux comptes seulement, qui doivent se
 * distinguer d'un coup d'œil (public peu lettré → l'image et la couleur parlent
 * avant le texte) :
 *  - **Client** : carte claire, photo d'une tenue — « je commande » ;
 *  - **Pro** : carte noire, photo d'atelier — « je travaille » : un seul compte
 *    pour publier comme tailleur ET vendre du tissu, deux offres ensuite.
 */
export function RegisterChoice({ redirect }: { redirect?: string }) {
  const clientHref = redirect
    ? `/inscription?role=client&redirect=${encodeURIComponent(redirect)}`
    : "/inscription?role=client";

  return (
    <div className="space-y-5">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Rejoindre JALOFA</h1>
        <p className="text-muted-foreground text-sm">
          Quel compte voulez-vous créer ?
        </p>
      </div>

      {/* Client — clair */}
      <Link
        href={clientHref}
        className="group bg-card ring-foreground/10 hover:ring-foreground/40 block overflow-hidden rounded-2xl ring-1 transition-shadow hover:shadow-lg"
      >
        <div className="relative h-36 overflow-hidden bg-neutral-100">
          <Image
            src="/collection homme/e.jpg"
            alt="Client portant une tenue sur mesure"
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover object-[center_15%] transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-neutral-900 shadow-sm">
            Gratuit
          </span>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-900">
              <Shirt className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-lg font-bold">Je suis client</p>
              <p className="text-muted-foreground text-sm">
                Je commande des tenues sur mesure.
              </p>
            </div>
          </div>
          <span className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-900 py-3 text-sm font-semibold text-neutral-900 transition-colors group-hover:bg-neutral-900 group-hover:text-white">
            Créer mon compte client
            <ArrowRight className="size-4" />
          </span>
        </div>
      </Link>

      {/* Pro — noir */}
      <Link
        href="/inscription?role=pro"
        className="group block overflow-hidden rounded-2xl bg-neutral-950 text-white ring-1 ring-neutral-950 transition-shadow hover:shadow-xl"
      >
        <div className="relative h-36 overflow-hidden">
          <Image
            src="/look/2.png"
            alt="Tailleur présentant ses tissus"
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover object-[70%_center] opacity-90 transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
          <span className="absolute top-3 left-3 rounded-full bg-neutral-950/85 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/20">
            Professionnel
          </span>
        </div>
        <div className="space-y-3 p-4 pt-1">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-neutral-950">
              <Scissors className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-lg font-bold">Je suis pro</p>
              <p className="text-sm text-white/70">
                Je couds et je vends du tissu.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              <Scissors className="size-3.5" /> Tailleur
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              <Store className="size-3.5" /> Vendeur de tissu
            </span>
          </div>

          <p className="flex items-start gap-1.5 text-xs text-white/70">
            <Check className="mt-px size-3.5 shrink-0 text-white" />
            Un seul compte pour les deux métiers — 2 offres : Gratuit ou Pro.
          </p>

          <span className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-3 text-sm font-semibold text-neutral-950 transition-colors group-hover:bg-neutral-200">
            Voir les offres pro
            <ArrowRight className="size-4" />
          </span>
        </div>
      </Link>

      <p className="text-muted-foreground text-center text-sm">
        Déjà inscrit ?{" "}
        <Link
          href="/connexion"
          className="text-primary font-medium hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
