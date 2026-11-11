"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

/**
 * Case à cocher accessible pour l'acceptation des conditions. Le libellé peut
 * contenir un lien (« conditions générales »), c'est pourquoi seule la case est
 * un bouton — le texte reste un `<span>` cliquable à côté.
 */
export function TermsCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
}) {
  const t = useT();
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={t("J'accepte les conditions")}
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40 hover:border-muted-foreground",
        )}
      >
        {checked && <Check className="size-3.5" />}
      </button>
      <span className="text-muted-foreground leading-snug">{children}</span>
    </div>
  );
}

/** Nom du champ caché qui trahit un robot (relu par `signUp`). */
export const ROBOT_TRAP_FIELD = "robot_check";

/**
 * Piège à robots (« honeypot »). La case « Je ne suis pas un robot » est bien
 * dans la page, mais INVISIBLE pour un humain : hors de l'écran, ignorée par les
 * lecteurs d'écran (`aria-hidden`) et sautée par la touche Tab. Personne n'a
 * donc à la cocher pour s'inscrire. Un robot qui remplit et clique tout ce qu'il
 * trouve la coche : le champ caché passe à « 1 » et le serveur refuse l'accès.
 */
export function RobotTrap() {
  const [tripped, setTripped] = useState(false);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0"
    >
      <input type="hidden" name={ROBOT_TRAP_FIELD} value={tripped ? "1" : ""} />
      <label>
        <input
          type="checkbox"
          name="not_a_robot"
          tabIndex={-1}
          autoComplete="off"
          checked={tripped}
          onChange={() => setTripped(true)}
        />
        Je ne suis pas un robot
      </label>
      <button type="button" tabIndex={-1} onClick={() => setTripped(true)}>
        Je ne suis pas un robot
      </button>
    </div>
  );
}
