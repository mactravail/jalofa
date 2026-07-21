"use client";

import { Check } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function SelectGrid<T>({
  items,
  selected,
  onSelect,
  getKey,
  render,
  columns = "sm:grid-cols-2",
}: {
  items: T[];
  selected: string | null;
  onSelect: (key: string) => void;
  getKey: (item: T) => string;
  render: (item: T) => React.ReactNode;
  columns?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", columns)}>
      {items.map((item) => {
        const key = getKey(item);
        return (
          <button
            type="button"
            key={key}
            onClick={() => onSelect(key)}
            className={cn(
              "overflow-hidden rounded-xl border text-left transition-colors",
              selected === key ? "border-primary ring-primary/30 ring-2" : "hover:bg-muted",
            )}
          >
            {render(item)}
          </button>
        );
      })}
    </div>
  );
}

export function MediaOption({
  image,
  title,
  subtitle,
}: {
  image: string | null;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={title} className="aspect-square w-full object-cover" />
      )}
      <div className="p-2.5">
        <p className="line-clamp-1 text-sm font-medium">{title}</p>
        {subtitle && <p className="text-muted-foreground line-clamp-1 text-xs">{subtitle}</p>}
      </div>
    </div>
  );
}

export function SelectionChip({ label, swatch }: { label: string; swatch?: string | null }) {
  return (
    <span className="bg-background/80 flex items-center gap-2 rounded-full py-1 pl-1.5 pr-3 text-xs font-medium shadow-sm backdrop-blur">
      {swatch ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={swatch} alt="" className="size-5 rounded-full object-cover" />
      ) : (
        <span className="bg-primary/15 text-primary flex size-5 items-center justify-center rounded-full">
          <Check className="size-3" />
        </span>
      )}
      <span className="max-w-[10rem] truncate">{label}</span>
    </span>
  );
}

export function FilterChip({
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
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

export function OptionCard({
  active,
  onClick,
  icon: Icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
        active ? "border-primary bg-primary/5 ring-primary/30 ring-1" : "hover:bg-muted",
      )}
    >
      <Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        {desc && <span className="text-muted-foreground block text-xs">{desc}</span>}
      </span>
    </button>
  );
}

export function ToggleChip({
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
        "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: React.ComponentProps<typeof Input>["type"];
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
