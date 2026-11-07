import Link from "next/link";
import { ArrowRight, Scissors, Shirt } from "lucide-react";

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
 * Premier écran de « Créer un compte » : deux comptes seulement.
 *  - **Client** (gratuit) : commander des tenues.
 *  - **Pro** : un seul compte pour vendre du tissu ET publier comme tailleur,
 *    avec deux offres (Gratuit avec commission, ou Pro payant sans commission)
 *    choisies à l'étape suivante.
 */
export function RegisterChoice({ redirect }: { redirect?: string }) {
  const withRedirect = (href: string) =>
    redirect ? `${href}&redirect=${encodeURIComponent(redirect)}` : href;

  const choices: Choice[] = [
    {
      href: withRedirect("/inscription?role=client"),
      icon: Shirt,
      title: "Compte client",
      desc: "Commander des tenues sur mesure et suivre leur confection.",
      cta: "Créer mon compte client — gratuit",
      featured: true,
    },
    {
      href: "/inscription?role=pro",
      icon: Scissors,
      title: "Compte pro",
      desc: "Tailleur et vendeur de tissu : publiez vos créations et vendez vos tissus avec un seul compte.",
      cta: "Voir les 2 offres pro",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Rejoindre JALOFA</h1>
        <p className="text-muted-foreground text-sm">
          Quel compte voulez-vous créer ?
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
