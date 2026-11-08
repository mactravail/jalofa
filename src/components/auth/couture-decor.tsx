import { cn } from "@/lib/utils";

/** Graduations du mètre ruban : une tous les 8 px, une plus grande tous les 40 px. */
const TAPE_TICKS = {
  backgroundImage:
    "repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px 8px), repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px 40px)",
  backgroundSize: "100% 6px, 100% 12px",
  backgroundRepeat: "no-repeat",
} as const;

/** Le mètre ruban de couturier : purement décoratif, s'efface sur les bords. */
export function TapeMeasure() {
  return (
    <div
      aria-hidden
      className="h-7 overflow-hidden text-white/45 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
      style={TAPE_TICKS}
    >
      <div className="flex pt-3.5">
        {Array.from({ length: 24 }, (_, i) => (
          <span
            key={i}
            className="w-20 shrink-0 pl-1 text-[9px] leading-none tabular-nums"
          >
            {i * 10}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Surpiqûre : le pointillé cousu sur le bord d'une étiquette de vêtement. */
export function Stitching({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-2 rounded-[1.15rem] border border-dashed",
        className,
      )}
    />
  );
}
