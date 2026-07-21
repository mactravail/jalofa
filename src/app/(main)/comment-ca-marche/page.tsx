import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, Ruler, Scissors, Sparkles, Truck } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Comment ça marche" };

const STEPS = [
  {
    icon: Sparkles,
    title: "1. Choisissez",
    desc: "Sélectionnez un modèle, un style et un tissu parmi des centaines d'options — ou utilisez votre propre tissu.",
  },
  {
    icon: Scissors,
    title: "2. Choisissez un tailleur",
    desc: "Comparez les tailleurs, leurs prix, délais et avis, puis sélectionnez celui qui vous convient.",
  },
  {
    icon: Ruler,
    title: "3. Vos mesures",
    desc: "Renseignez vos mesures détaillées ou choisissez une taille standard (XS à XXXL).",
  },
  {
    icon: CreditCard,
    title: "4. Payez en toute sécurité",
    desc: `Réglez avec ${Object.values(PAYMENT_METHOD_LABELS).join(", ")}.`,
  },
  {
    icon: Truck,
    title: "5. Suivez et recevez",
    desc: "Suivez chaque étape de la confection et recevez votre tenue à domicile ou en boutique.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Comment ça marche</h1>
      <p className="text-muted-foreground mt-2">
        De l&apos;idée à la livraison, JALOFA gère tout le processus.
      </p>

      <div className="mt-10 space-y-6">
        {STEPS.map((s) => (
          <div key={s.title} className="flex gap-4">
            <span className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl">
              <s.icon className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">{s.title}</h2>
              <p className="text-muted-foreground mt-1">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <Link href="/modeles" className={cn(buttonVariants({ size: "lg" }), "h-11 text-base")}>
          <Scissors className="size-4" /> Créer ma tenue
        </Link>
      </div>
    </div>
  );
}
