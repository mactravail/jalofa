import Link from "next/link";
import { ArrowRight, Scissors, Shirt, Store } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Choice = {
  href: string;
  icon: typeof Shirt;
  title: string;
  desc: string;
  cta: string;
  featured?: boolean;
};

/**
 * Premier écran de « Créer un compte » : on demande d'abord **qui** s'inscrit.
 * Un client qui veut seulement commander ne doit jamais tomber sur les tarifs
 * pros — il part directement vers le formulaire client. Les tailleurs et
 * vendeurs, eux, passent par les offres (c'est là que se décide leur métier et
 * leur abonnement).
 */
export function RegisterChoice({ redirect }: { redirect?: string }) {
  const clientHref = redirect
    ? `/inscription?role=client&redirect=${encodeURIComponent(redirect)}`
    : "/inscription?role=client";

  const choices: Choice[] = [
    {
      href: clientHref,
      icon: Shirt,
      title: "Je suis client",
      desc: "Commander des tenues sur mesure et suivre leur confection.",
      cta: "Créer mon compte client — gratuit",
      featured: true,
    },
    {
      href: "/abonnements?metier=tailor",
      icon: Scissors,
      title: "Je suis tailleur",
      desc: "Confectionner des tenues et recevoir des commandes.",
      cta: "Voir les offres tailleur",
    },
    {
      href: "/abonnements?metier=vendor",
      icon: Store,
      title: "Je suis vendeur de tissu",
      desc: "Vendre vos tissus à toute la communauté JALOFA.",
      cta: "Voir les offres vendeur",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Rejoindre JALOFA</h1>
        <p className="text-muted-foreground text-sm">
          Dites-nous qui vous êtes pour continuer.
        </p>
      </div>

      <div className="space-y-3">
        {choices.map((choice) => (
          <Card
            key={choice.href}
            className={cn(
              "transition-colors",
              choice.featured
                ? "border-primary/40 ring-primary/30 hover:border-primary"
                : "hover:ring-foreground/25",
            )}
          >
            <Link
              href={choice.href}
              className="flex items-center gap-4 px-4 py-1"
            >
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full",
                  choice.featured
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-foreground",
                )}
              >
                <choice.icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-heading font-medium">{choice.title}</p>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {choice.desc}
                </p>
                <span className="text-primary mt-2 inline-flex items-center gap-1 text-sm font-medium">
                  {choice.cta}
                  <ArrowRight className="size-3.5" />
                </span>
              </div>
            </Link>
          </Card>
        ))}
      </div>

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
