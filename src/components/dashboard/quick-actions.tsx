"use client";

import Link from "next/link";
import { ArrowRight, Layers, Plus, Shirt, Users, Wallet } from "lucide-react";

import { DASHBOARD_ROOT, type ProRole } from "@/lib/dashboard-nav";
import { TONE, type Tone } from "@/lib/dashboard-tone";
import { cn } from "@/lib/utils";

type Action = {
  href: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
  /** La grande action de départ : tuile pleine, en couleur. */
  primary?: boolean;
};

/**
 * Trois grosses tuiles, faites pour le pouce : ajouter à sa boutique, voir ses
 * clients, voir son argent. La première est pleine et colorée — c'est le geste
 * qu'un nouveau pro doit trouver sans qu'on le lui montre : « mettre ce que je
 * fais en vente ». Elle mène droit au formulaire, déjà ouvert (`?nouveau=1`).
 */
export function QuickActions({ role }: { role: ProRole }) {
  const root = DASHBOARD_ROOT[role];

  const actions: Action[] =
    role === "tailor"
      ? [
          {
            href: `${root}/creations?nouveau=1`,
            label: "Ajouter un modèle",
            hint: "Mettez une création en vente",
            icon: Shirt,
            tone: "rose",
            primary: true,
          },
          {
            href: `${root}/clients`,
            label: "Mes clients",
            hint: "Qui commande chez vous",
            icon: Users,
            tone: "violet",
          },
          {
            href: `${root}/revenus`,
            label: "Mon argent",
            hint: "Ce que vous avez gagné",
            icon: Wallet,
            tone: "emerald",
          },
        ]
      : [
          {
            href: `${root}/tissus?nouveau=1`,
            label: "Ajouter un tissu",
            hint: "Mettez un tissu en vente",
            icon: Layers,
            tone: "fuchsia",
            primary: true,
          },
          {
            href: `${root}/clients`,
            label: "Mes clients",
            hint: "Qui achète chez vous",
            icon: Users,
            tone: "violet",
          },
          {
            href: `${root}/revenus`,
            label: "Mon argent",
            hint: "Ce que vous avez gagné",
            icon: Wallet,
            tone: "emerald",
          },
        ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {actions.map((action) => (
        <ActionTile key={action.href} action={action} />
      ))}
    </div>
  );
}

function ActionTile({ action }: { action: Action }) {
  const tone = TONE[action.tone];
  const { icon: Icon } = action;

  if (action.primary) {
    return (
      <Link
        href={action.href}
        className={cn(
          "group relative flex items-center gap-3 overflow-hidden rounded-2xl p-4 shadow-sm transition-transform active:scale-[0.98]",
          tone.solid,
        )}
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/25">
          <Plus className="size-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-base font-semibold">
            <Icon className="size-4 shrink-0" />
            {action.label}
          </span>
          <span className="block text-sm opacity-90">{action.hint}</span>
        </span>
        <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </Link>
    );
  }

  return (
    <Link
      href={action.href}
      className="group bg-card hover:bg-muted/40 flex items-center gap-3 rounded-2xl border p-4 transition-colors"
    >
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-2xl",
          tone.soft,
        )}
      >
        <Icon className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">{action.label}</span>
        <span className="text-muted-foreground block text-sm">{action.hint}</span>
      </span>
      <ArrowRight className="text-muted-foreground size-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
