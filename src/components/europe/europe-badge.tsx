import { EUROPE_LABEL } from "@/lib/europe";
import { cn } from "@/lib/utils";

/**
 * L'étiquette d'un produit fabriqué en Europe, posée sur sa photo (ou à côté
 * de son nom) dans les pages Homme, Femme, Tissus et sur sa fiche. Le pays
 * suit, quand on le connaît : « JALOFA EUROPE · Italie ».
 */
export function EuropeBadge({
  country,
  className,
  overlay = false,
}: {
  country?: string | null;
  className?: string;
  /** Sur une photo : fond noir translucide, lisible sur toutes les images. */
  overlay?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] whitespace-nowrap uppercase",
        overlay
          ? "border-white/30 bg-black/70 text-white backdrop-blur-sm"
          : "border-white/30 text-white",
        className,
      )}
    >
      <span className="truncate">{EUROPE_LABEL}</span>
      {country && (
        <span className="truncate font-normal tracking-[0.08em] opacity-80">· {country}</span>
      )}
    </span>
  );
}
