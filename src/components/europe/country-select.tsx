"use client";

import { ChevronDown } from "lucide-react";

import { useT } from "@/components/i18n/locale-provider";
import { COUNTRY_GROUPS, DEFAULT_COUNTRY } from "@/lib/europe";
import { cn } from "@/lib/utils";

/**
 * Le pays d'un pro (atelier ou boutique de tissus). Choisir un pays d'Europe
 * range automatiquement ses produits dans JALOFA EUROPE. Liste native : grande,
 * lisible au doigt, sans dépendance au thème.
 */
export function CountrySelect({
  id = "country",
  name = "country",
  defaultValue = DEFAULT_COUNTRY,
  value,
  onChange,
  className,
}: {
  id?: string;
  name?: string;
  defaultValue?: string | null;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}) {
  const t = useT();
  const controlled = value !== undefined;
  return (
    <span className="relative block">
      <select
        id={id}
        name={name}
        {...(controlled
          ? { value, onChange: (e) => onChange?.(e.target.value) }
          : {
              defaultValue: defaultValue || DEFAULT_COUNTRY,
              onChange: (e) => onChange?.(e.target.value),
            })}
        className={cn(
          "border-input bg-background h-10 w-full appearance-none rounded-lg border pr-9 pl-3 text-base md:text-sm",
          className,
        )}
      >
        {COUNTRY_GROUPS.map((group) => (
          <optgroup key={group.label} label={t(group.label)}>
            {group.countries.map((country) => (
              <option key={country} value={country}>
                {t(country)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-70" />
    </span>
  );
}
