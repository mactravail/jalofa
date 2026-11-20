"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Check, Loader2, Plus, Shirt, X } from "lucide-react";
import { toast } from "sonner";

import { useT } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveMySkills } from "@/lib/actions/tailors";
import type { TailorSpecialty } from "@/lib/types";
import { cn } from "@/lib/utils";

export type SkillOption = {
  key: string;
  name: string;
  image: string | null;
  category: string | null;
};

const GROUPS = [
  { slug: "homme", label: "Homme" },
  { slug: "femme", label: "Femme" },
] as const;

const MAX_CUSTOM = 10;

const SPECIALTY_CHOICES: { value: TailorSpecialty; label: string }[] = [
  { value: "homme", label: "Homme" },
  { value: "femme", label: "Femme" },
  { value: "both", label: "Les deux" },
];

/**
 * « Spécialisation » : le tailleur dit s'il coud pour homme, femme ou les deux,
 * puis touche les habits qu'il sait coudre. Une photo par habit, une coche
 * quand il est choisi — rien à écrire.
 */
export function TailorSkillsForm({
  options,
  specialty: initialSpecialty,
  skills: initial,
  customSkills: initialCustom,
}: {
  options: SkillOption[];
  specialty: TailorSpecialty | null;
  skills: string[];
  /** Les habits absents de la liste, dont le tailleur a écrit le nom. */
  customSkills: string[];
}) {
  const t = useT();
  const [specialty, setSpecialty] = useState<TailorSpecialty | null>(initialSpecialty);
  const [selected, setSelected] = useState(() => new Set(initial));
  const [custom, setCustom] = useState<string[]>(initialCustom);
  const [draft, setDraft] = useState("");

  function addCustom() {
    const name = draft.replace(/\s+/g, " ").trim();
    if (!name) return;
    if (custom.some((c) => c.toLowerCase() === name.toLowerCase())) {
      setDraft("");
      return;
    }
    if (custom.length >= MAX_CUSTOM) {
      toast.error(t("{n} habits au maximum.", { n: MAX_CUSTOM }));
      return;
    }
    setCustom((prev) => [...prev, name]);
    setDraft("");
  }
  const [isPending, startTransition] = useTransition();

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const groups = GROUPS.filter((g) => specialty === "both" || specialty === g.slug)
    .map((g) => ({ ...g, items: options.filter((o) => o.category === g.slug) }))
    .filter((g) => g.items.length > 0);

  // Seuls les habits de la spécialisation choisie comptent.
  const visible = new Set(groups.flatMap((g) => g.items.map((o) => o.key)));
  const count = Array.from(selected).filter((k) => visible.has(k)).length + custom.length;

  function save() {
    if (!specialty) return;
    startTransition(async () => {
      const keys = Array.from(selected).filter((k) => visible.has(k));
      // Un nom tapé mais pas encore ajouté compte aussi.
      const pending = draft.trim();
      const names = pending ? [...custom, pending] : custom;
      const result = await saveMySkills(specialty, keys, names);
      if (result.ok && pending) {
        setCustom(names);
        setDraft("");
      }
      if (result.ok) toast.success(t("Enregistré : les clients le voient sur votre page."));
      else toast.error(t(result.error));
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-base font-semibold">{t("Vous cousez pour :")}</h2>
        <div className="grid max-w-xl grid-cols-3 gap-3">
          {SPECIALTY_CHOICES.map((c) => {
            const on = specialty === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setSpecialty(c.value)}
                aria-pressed={on}
                className={cn(
                  "flex h-14 items-center justify-center gap-1.5 rounded-xl border-2 text-base font-semibold transition-colors",
                  on ? "border-rose-500 bg-rose-500 text-white" : "hover:bg-muted",
                )}
              >
                {on && <Check className="size-5" aria-hidden />}
                {t(c.label)}
              </button>
            );
          })}
        </div>
      </section>

      {specialty && groups.length > 0 && (
        <p className="text-muted-foreground text-sm">
          {t("Touchez les habits que vous savez coudre.")}
        </p>
      )}
      {groups.map((group) => (
        <section key={group.label} className="space-y-3">
          <h2 className="text-base font-semibold">{t(group.label)}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {group.items.map((o) => {
              const on = selected.has(o.key);
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => toggle(o.key)}
                  aria-pressed={on}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-xl border-2 text-left transition-colors",
                    on ? "border-rose-500" : "border-transparent",
                  )}
                >
                  <span className="bg-muted relative aspect-4/5 w-full">
                    {o.image ? (
                      <Image
                        src={o.image}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground flex size-full items-center justify-center">
                        <Shirt className="size-10" aria-hidden />
                      </span>
                    )}
                    <span
                      className={cn(
                        "absolute top-2 right-2 flex size-8 items-center justify-center rounded-full border-2",
                        on
                          ? "border-rose-500 bg-rose-500 text-white"
                          : "border-white/80 bg-black/40 text-transparent",
                      )}
                    >
                      <Check className="size-5" aria-hidden />
                    </span>
                  </span>
                  <span className="p-2.5 text-sm font-medium">{t(o.name)}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {specialty && (
        <section className="max-w-xl space-y-3">
          <div>
            <h2 className="text-base font-semibold">{t("Pas dans la liste ?")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("Écrivez le nom de l'habit, puis touchez « Ajouter ».")}
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
              maxLength={40}
              placeholder={t("Ex. Taille basse")}
              aria-label={t("Nom de l'habit")}
              className="h-12 text-base"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addCustom}
              disabled={!draft.trim()}
              className="h-12 shrink-0 px-4 text-base"
            >
              <Plus className="size-4" /> {t("Ajouter")}
            </Button>
          </div>
          {custom.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {custom.map((name) => (
                <span
                  key={name}
                  className="flex items-center gap-1 rounded-full border-2 border-rose-500 py-1.5 pr-1.5 pl-3 text-sm font-medium"
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => setCustom((prev) => prev.filter((c) => c !== name))}
                    aria-label={t("Retirer {name}", { name })}
                    className="hover:bg-muted flex size-7 items-center justify-center rounded-full"
                  >
                    <X className="size-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="max-w-xl">
        <Button
          onClick={save}
          disabled={isPending || !specialty}
          className="h-12 w-full text-base"
        >
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {count > 0 ? t("Enregistrer ({n})", { n: count }) : t("Enregistrer")}
        </Button>
      </div>
    </div>
  );
}
