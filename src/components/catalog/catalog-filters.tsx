"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Option = { slug: string; name: string };

export function CategoryChips({
  options,
  paramName = "category",
}: {
  options: Option[];
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const active = searchParams.get(paramName);

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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip active={!active} onClick={() => select(null)}>
        Tous
      </Chip>
      {options.map((o) => (
        <Chip
          key={o.slug}
          active={active === o.slug}
          onClick={() => select(o.slug)}
        >
          {o.name}
        </Chip>
      ))}
      {isPending && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
    </div>
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

export function SearchInput({ placeholder = "Rechercher..." }: { placeholder?: string }) {
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
        placeholder={placeholder}
        className="pl-9"
      />
    </form>
  );
}
