import Link from "next/link";
import { ArrowRight, Ruler, Scissors, Sparkles, Truck } from "lucide-react";

import { cn } from "@/lib/utils";

// Bloc « Comment ça marche » (les 4 étapes du parcours de commande).
// Partagé entre l'accueil (desktop) et la page tailleurs (mobile) : sur petit
// écran l'accueil est déjà long, le déroulé est donc affiché là où l'on choisit
// son artisan. Voir les `className` passés par chaque page.
const STEPS = [
  { icon: Sparkles, title: "Choisissez", desc: "Modèle, style et tissu parmi des centaines d'options." },
  { icon: Ruler, title: "Vos mesures", desc: "Saisie manuelle détaillée ou taille standard XS → XXXL." },
  { icon: Scissors, title: "Confection", desc: "Un tailleur qualifié réalise votre pièce sur mesure." },
  { icon: Truck, title: "Livraison", desc: "Suivez chaque étape et recevez votre tenue à domicile." },
];

export function HowItWorks({ className }: { className?: string }) {
  return (
    <section className={cn("mx-auto max-w-6xl px-4 py-16 md:py-20", className)}>
      <div className="mb-10 text-center">
        <span className="text-primary text-xs font-semibold tracking-[0.25em] uppercase">
          Le déroulé
        </span>
        <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-balance sm:text-4xl">
          Comment ça marche
        </h2>
        <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-pretty">
          De l&apos;idée à la livraison, en quatre étapes.
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <div key={step.title} className="relative">
            {i < STEPS.length - 1 && (
              <span className="border-border absolute top-6 left-14 hidden w-[calc(100%-2rem)] border-t border-dashed lg:block" />
            )}
            <div className="bg-card relative flex size-12 items-center justify-center rounded-2xl border shadow-sm">
              <step.icon className="text-primary size-6" />
            </div>
            <div className="text-primary mt-4 text-xs font-semibold tracking-[0.2em] uppercase">
              Étape {i + 1}
            </div>
            <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/comment-ca-marche"
          className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Voir le déroulé complet <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
