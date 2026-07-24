import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Le logo JALOFA — un logotype typographique, jamais une image.
 *
 * Capitales en Cormorant Garamond (serif de style Garamond, contraste marqué),
 * très espacées : la signature visuelle d'une maison de couture. Il hérite de
 * `currentColor`, donc il s'adapte seul au fond (clair, sombre, footer noir).
 *
 * L'interlettrage ajoute un blanc après la dernière lettre ; le `-mr` de même
 * valeur le rattrape pour que le bloc reste optiquement aligné à droite.
 *
 * En mode `spread`, l'interlettrage laisse place à un `justify-between` : chaque
 * lettre devient une colonne et le mot occupe toute la largeur disponible.
 */
const SIZES = {
  xs: "text-[0.6875rem] tracking-[0.34em] -mr-[0.34em]",
  sm: "text-base tracking-[0.3em] -mr-[0.3em]",
  md: "text-xl tracking-[0.28em] -mr-[0.28em]",
  lg: "text-3xl tracking-[0.24em] -mr-[0.24em]",
} as const;

export function Wordmark({
  size = "md",
  spread = false,
  className,
}: {
  size?: keyof typeof SIZES;
  /** Logotype pleine largeur : les lettres sont réparties d'un bord à l'autre. */
  spread?: boolean;
  className?: string;
}) {
  if (spread) {
    return (
      <span
        className={cn(
          "font-wordmark flex w-full justify-between text-[14vw] leading-none font-medium uppercase",
          className,
        )}
      >
        <span className="sr-only">{APP_NAME}</span>
        {[...APP_NAME].map((letter, index) => (
          <span key={`${letter}-${index}`} aria-hidden="true">
            {letter}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "font-wordmark leading-none font-medium uppercase",
        SIZES[size],
        className,
      )}
    >
      {APP_NAME}
    </span>
  );
}
