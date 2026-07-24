import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

// Témoignages mis en avant — repris des avis de démonstration (`REVIEWS` dans
// fixtures.ts), donc cohérents avec les fiches tailleurs publiques.
export const TESTIMONIALS = [
  {
    quote: "Boubou impeccable, finitions soignées et livraison à l'heure. Merci !",
    name: "Bineta Gueye",
    context: "Grand boubou · Atelier Fatou Couture",
  },
  {
    quote: "La broderie est magnifique, exactement ce que je voulais.",
    name: "Ousmane Ba",
    context: "Broderie fine · Awa Design & Broderie",
  },
  {
    quote: "Deuxième commande, toujours aussi satisfaite. Je recommande vivement.",
    name: "Ndeye Fall",
    context: "Cliente fidèle · Dakar",
  },
];

export const AVATAR_TONES = [
  "bg-primary/15 text-primary",
  "bg-accent text-accent-foreground",
  "bg-secondary text-secondary-foreground",
];

type Testimonial = (typeof TESTIMONIALS)[number];

function TestimonialCard({
  testimonial,
  tone,
}: {
  testimonial: Testimonial;
  tone: string;
}) {
  return (
    <figure className="bg-card flex w-[19rem] shrink-0 flex-col rounded-2xl border p-6 shadow-sm sm:w-[22rem]">
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
        ))}
      </span>
      <blockquote className="mt-4 flex-1 font-serif text-lg leading-relaxed text-pretty">
        « {testimonial.quote} »
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            tone,
          )}
        >
          {testimonial.name
            .split(" ")
            .map((part) => part[0])
            .join("")}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{testimonial.name}</span>
          <span className="text-muted-foreground block text-xs">{testimonial.context}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Bandeau d'avis défilant — même mécanique sans JS que <FabricMarquee /> :
 * deux pistes identiques translatées en boucle via `animate-marquee`, mais
 * jouée en `reverse` pour que les cartes glissent de gauche à droite. Chaque
 * piste répète les témoignages pour rester plus large que l'écran (sinon un
 * trou apparaîtrait dans la boucle sur grand écran). Figé si
 * `prefers-reduced-motion`, en pause au survol.
 */
export function TestimonialMarquee() {
  const track = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <div
      className="group relative flex overflow-hidden py-2 [--marquee:48s]"
      style={{
        maskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
      }}
    >
      {[0, 1].map((lane) => (
        <div
          key={lane}
          aria-hidden={lane === 1}
          className="animate-marquee flex shrink-0 items-stretch gap-6 pr-6 [animation-direction:reverse] group-hover:[animation-play-state:paused]"
        >
          {track.map((testimonial, i) => (
            <TestimonialCard
              key={`${lane}-${testimonial.name}-${i}`}
              testimonial={testimonial}
              tone={AVATAR_TONES[i % AVATAR_TONES.length]}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
