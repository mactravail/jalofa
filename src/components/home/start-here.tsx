import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

// Bloc « Par où commencer » présenté à la Lanieri (« créez votre look ») : chaque
// parcours forme une colonne « numéro + filet » surmontant un grand visuel, dont
// le libellé s'inscrit sur l'image entre deux filets.
//
// Le numéro fait partie de la colonne (et non d'une frise séparée) pour qu'il
// défile avec sa photo sur le rail mobile, comme dans la référence.
//
// Au survol (pointeur), le visuel s'agrandit légèrement et la catégorie + le
// descriptif se déplient sous le libellé. Dépliage purement CSS (grid-rows
// 0fr → 1fr) : pas de JS, donc composant serveur. Le descriptif n'existe qu'à
// partir de `md` — au tactile il n'y a pas de survol pour le révéler.

// `label` est le seul texte visible au repos ; `title` et `desc` ne se dévoilent
// qu'au survol du visuel.
const FLOWS = [
  {
    label: "Créer ma tenue",
    title: "Vêtement complet",
    desc: "Choisissez un modèle, un tissu et un tailleur. Nous gérons tout, de la commande à la livraison.",
    href: "/modeles",
    src: "/look/1.png",
    alt: "Styliste dessinant une tenue sur tablette devant un mur d'échantillons",
  },
  {
    label: "Acheter du tissu",
    title: "Tissu seul",
    desc: "Parcourez le catalogue, achetez au mètre et recevez votre tissu à la maison.",
    href: "/tissus",
    src: "/look/2.png",
    alt: "Main parcourant le catalogue de tissus sur un téléphone",
  },
  {
    label: "Trouver un tailleur",
    title: "J'ai déjà mon tissu",
    desc: "Envoyez votre propre tissu à un tailleur et faites confectionner votre modèle.",
    href: "/modeles?type=own_fabric",
    src: "/look/3.png",
    alt: "Sélection de profils de tailleurs présentée dans un atelier",
  },
];

const optionLabel = (index: number) => `Option 0${index + 1}`;

export function StartHere() {
  return (
    // Bande pleine largeur (`--accent`, un cran plus soutenu que le fond) pour
    // détacher le bloc du bandeau tissus qui le précède.
    <section className="bg-accent border-y">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-20">
        {/* Sur mobile on ne garde que le surtitre : le titre et le chapô sont
            masqués pour laisser la place aux visuels. */}
        <div className="mb-6 text-center md:mb-10">
          <span className="text-primary text-xs font-semibold tracking-[0.25em] uppercase">
            Par où commencer
          </span>
          <h2 className="mt-3 hidden font-serif text-3xl font-medium tracking-tight text-balance sm:text-4xl md:block">
            Trois façons d&apos;obtenir votre tenue
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 hidden max-w-2xl text-pretty md:block">
            Que vous partiez de zéro ou de votre propre tissu, tout se fait dans
            l&apos;application.
          </p>
        </div>

        {/* Rail défilant sur mobile (gouttière de 16 px conservée aux deux bouts,
            pour que le visuel aille presque au bord de la bande grise),
            grille 3 colonnes au-delà.
            `scroll-px-4` est indispensable : sans lui, `snap-mandatory` cale le
            bord de la carte sur celui du scrollport et annule le `px-4`, la
            première tuile revenant coller au bord de l'écran. */}
        <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
          {FLOWS.map((flow, i) => (
            <div
              key={flow.title}
              // 74vw : on voit franchement le début de l'option suivante (~20 %
              // de sa largeur), donc on comprend qu'il y a un rail à faire
              // défiler.
              className="w-[74vw] max-w-[22rem] shrink-0 snap-start md:w-auto md:max-w-none"
            >
              {/* Numéro d'étape prolongé d'un filet. Sur mobile chaque colonne porte
                le sien (label + filet) ; à partir de md les filets se referment
                entre les numéros pour former une frise continue.
                `pl-4` cale le numéro sur le libellé posé dans l'image (calque
                `p-4`) plutôt que sur le bord du visuel ; à partir de md la frise
                traverse les colonnes, donc pas d'indentation. */}
              <div className="mb-3 flex items-center gap-4 pl-4 md:pl-0" aria-hidden>
                {i > 0 && (
                  <span className="bg-border hidden h-px flex-1 md:block" />
                )}
                <span className="text-muted-foreground text-[11px] font-semibold tracking-[0.25em] whitespace-nowrap uppercase">
                  {optionLabel(i)}
                </span>
                <span
                  className={cn(
                    "bg-border h-px flex-1",
                    i === FLOWS.length - 1 && "md:hidden",
                  )}
                />
              </div>

              <Link
                href={flow.href}
                className="group focus-visible:ring-ring relative block overflow-hidden rounded-2xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {/* Le cadre reprend le ratio exact des sources (1408×768 =
                  11/6) à toutes les tailles : la photo est montrée entière,
                  jamais recadrée. */}
                <div className="bg-muted relative aspect-11/6">
                  <Image
                    src={flow.src}
                    alt={flow.alt}
                    fill
                    sizes="(max-width: 768px) 74vw, (max-width: 1200px) 33vw, 384px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Voile dégradé : lisibilité du texte posé sur l'image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                </div>

                <div className="absolute inset-x-0 bottom-0 p-4 text-white md:p-6">
                  {/* Seul texte affiché au repos */}
                  <span className="block h-px bg-white/40" />
                  <h3 className="my-2.5 flex items-center justify-between gap-3 font-serif text-lg font-medium tracking-tight md:my-3 md:text-2xl">
                    {flow.label}
                    <ArrowRight className="size-5 shrink-0 transition duration-500 group-hover:translate-x-0.5 md:-translate-x-2 md:opacity-0 md:group-focus-visible:translate-x-0 md:group-focus-visible:opacity-100 md:group-hover:translate-x-0 md:group-hover:opacity-100" />
                  </h3>
                  <span className="block h-px bg-white/40" />

                  {/* Descriptif : desktop seulement (rien ne le révélerait au
                    tactile). Dépliage 0fr → 1fr, sans hauteur fixe à deviner.
                    À partir de `lg` seulement : le cadre 11/6 est trop bas en
                    grille 3 colonnes sous 1024 px pour l'accueillir. */}
                  <div className="hidden grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-out group-focus-visible:grid-rows-[1fr] group-hover:grid-rows-[1fr] lg:grid">
                    <div className="overflow-hidden">
                      <span className="block pt-3 text-[11px] font-semibold tracking-[0.25em] text-white/60 uppercase">
                        {flow.title}
                      </span>
                      <p className="mt-1.5 text-sm text-pretty text-white/85">
                        {flow.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
