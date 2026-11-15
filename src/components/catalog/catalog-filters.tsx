"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "@/lib/i18n/navigation";
import { ChevronDown, Loader2, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

type Option = { slug: string; name: string };

export function CategoryChips({
  options,
  paramName = "category",
  label,
}: {
  options: Option[];
  paramName?: string;
  /** Titre de la rangée (filtres empilés du catalogue tissus). */
  label?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const active = searchParams.get(paramName);
  const t = useT();

  const select = useCallback(
    (slug: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) params.set(paramName, slug);
      else params.delete(paramName);
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams, paramName],
  );

  const chips = (
    <div className="flex flex-wrap items-center gap-2">
      <Chip active={!active} onClick={() => select(null)}>
        {t("Tous")}
      </Chip>
      {options.map((o) => (
        <Chip
          key={o.slug}
          active={active === o.slug}
          onClick={() => select(o.slug)}
        >
          {t(o.name)}
        </Chip>
      ))}
      {isPending && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
    </div>
  );
  if (!label) return chips;
  const current = options.find((o) => o.slug === active);
  return (
    <FilterGroup label={t(label)} value={current ? t(current.name) : null}>
      {chips}
    </FilterGroup>
  );
}

/**
 * Une rangée de filtres repliée : seul le titre se voit (avec le choix en
 * cours), on la déplie en la touchant.
 */
function FilterGroup({
  label,
  value,
  children,
}: {
  label: string;
  value: string | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold uppercase tracking-wide">{label}</span>
          {value && <span className="text-muted-foreground block truncate text-xs">{value}</span>}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

/** Pastilles de couleur : une touche filtre le catalogue sur cette couleur. */
export function ColorDots({
  colors,
  label,
  paramName = "color",
}: {
  colors: { name: string; hex: string }[];
  label?: string;
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const active = searchParams.get(paramName);
  const t = useT();

  function select(name: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (name && name !== active) params.set(paramName, name);
    else params.delete(paramName);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  const dots = (
      <div className="flex flex-wrap items-center gap-2">
        {/* « Toutes » : revenir à toutes les couleurs, comme « Tous » des autres rangées. */}
        <Chip active={!active} onClick={() => select(null)}>
          {t("Toutes")}
        </Chip>
        {colors.map((c) => (
          <button
            key={c.name}
            type="button"
            title={t(c.name)}
            aria-label={t(c.name)}
            aria-pressed={active === c.name}
            onClick={() => select(c.name)}
            className={cn(
              "size-8 rounded-full border border-white/20 transition",
              active === c.name && "ring-primary ring-offset-background ring-2 ring-offset-2",
            )}
            style={{ backgroundColor: c.hex }}
          />
        ))}
        {isPending && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
      </div>
  );
  if (!label) return dots;
  return (
    <FilterGroup label={t(label)} value={active ? t(active) : null}>
      {dots}
    </FilterGroup>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

export function SearchInput({ placeholder }: { placeholder?: string }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) params.set("q", value.trim());
    else params.delete("q");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <form onSubmit={submit} className="relative w-full max-w-xs">
      <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? t("Rechercher...")}
        className="pl-9"
      />
    </form>
  );
}
