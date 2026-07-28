"use client";

import { useId, useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULES,
  checkPassword,
  passwordStrength,
} from "@/lib/password";
import { cn } from "@/lib/utils";

/**
 * Champ mot de passe avec exigences affichées en direct : chaque règle se coche
 * à mesure que l'on tape, une jauge résume la force, et l'œil permet de relire
 * ce que l'on a saisi (utile quand la politique est stricte).
 *
 * Le composant est piloté par le parent (`value` / `onChange`) pour qu'il puisse
 * bloquer le bouton d'envoi. La vérité reste côté serveur (`passwordIssue`).
 */
export function PasswordField({
  value,
  onChange,
  name = "password",
  label = "Mot de passe",
  autoComplete = "new-password",
  /**
   * `false` pour un champ de saisie simple (mot de passe actuel) : plus de
   * liste d'exigences ni de jauge, on garde l'œil afficher/masquer.
   */
  requirements = true,
}: {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  label?: string;
  autoComplete?: string;
  requirements?: boolean;
}) {
  const id = useId();
  const listId = `${id}-rules`;
  const [visible, setVisible] = useState(false);
  const [touched, setTouched] = useState(false);

  const { passed, valid, common } = checkPassword(value);
  const strength = passwordStrength(value);
  // On ne montre les exigences qu'une fois la saisie commencée, pour ne pas
  // alourdir le formulaire à l'ouverture.
  const showRules = requirements && (touched || value.length > 0);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={requirements ? PASSWORD_MIN_LENGTH : undefined}
          required
          aria-describedby={showRules ? listId : undefined}
          aria-invalid={
            requirements && value.length > 0 && !valid ? true : undefined
          }
          className="pr-9"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setTouched(true)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={
            visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
          className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-9 items-center justify-center transition-colors"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      {showRules && (
        <div className="space-y-2 pt-0.5">
          {/* Jauge de force : 4 segments remplis selon le score. */}
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {[1, 2, 3, 4].map((step) => (
                <span
                  key={step}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    strength.score >= step
                      ? strength.score === 1
                        ? "bg-destructive"
                        : strength.score === 2
                          ? "bg-muted-foreground"
                          : "bg-primary"
                      : "bg-muted",
                  )}
                />
              ))}
            </div>
            {strength.label && (
              <span
                className={cn(
                  "text-xs font-medium",
                  strength.score === 1
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {strength.label}
              </span>
            )}
          </div>

          <ul id={listId} className="grid gap-1">
            {PASSWORD_RULES.map((rule) => {
              const ok = passed[rule.id];
              return (
                <li
                  key={rule.id}
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    ok ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {ok ? (
                    <Check className="text-primary size-3.5 shrink-0" />
                  ) : (
                    <X className="size-3.5 shrink-0 opacity-50" />
                  )}
                  {rule.label}
                </li>
              );
            })}
          </ul>

          {common && (
            <p className="text-destructive text-xs">
              Ce mot de passe est trop courant : il se devine en quelques
              secondes. Choisissez-en un autre.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
