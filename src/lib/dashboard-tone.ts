/**
 * La palette de l'espace pro — et *seulement* de l'espace pro.
 *
 * Le site public est monochrome (cf. globals.css) ; une fois connecté, le
 * tailleur ou le vendeur travaille, et la couleur devient un outil : chaque
 * grande fonction porte sa teinte, toujours la même, pour qu'on la reconnaisse
 * au coup d'œil sans lire — dans le menu, sur les tuiles, dans les tableaux.
 * « Jaune = nouvelles commandes », « vert = argent », partout pareil.
 *
 * Chaque classe est écrite en toutes lettres (jamais `bg-${c}-500`) pour que le
 * moteur Tailwind les repère à l'analyse du source.
 */

export type Tone =
  | "amber"
  | "emerald"
  | "blue"
  | "violet"
  | "rose"
  | "fuchsia"
  | "sky"
  | "indigo"
  | "teal"
  | "slate";

export type ToneClasses = {
  /** Puce d'icône discrète : fond léger, icône teintée. Le repos. */
  soft: string;
  /** Puce pleine : fond saturé, icône claire. L'accent, ce qui presse. */
  solid: string;
  /** Grande surface douce (fond de tuile, carte de bienvenue). */
  tint: string;
  /** Texte teinté seul, pour un chiffre ou un libellé mis en avant. */
  text: string;
  /** Bordure assortie à la teinte. */
  border: string;
  /** Anneau de survol / focus assorti. */
  ring: string;
};

export const TONE: Record<Tone, ToneClasses> = {
  amber: {
    soft: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    solid: "bg-amber-500 text-amber-950",
    tint: "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-900/60",
    ring: "ring-amber-500/30",
  },
  emerald: {
    soft: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    solid: "bg-emerald-500 text-white",
    tint: "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-900/60",
    ring: "ring-emerald-500/30",
  },
  blue: {
    soft: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    solid: "bg-blue-500 text-white",
    tint: "bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-900/60",
    ring: "ring-blue-500/30",
  },
  violet: {
    soft: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    solid: "bg-violet-500 text-white",
    tint: "bg-violet-50 text-violet-900 dark:bg-violet-950/40 dark:text-violet-200",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-200 dark:border-violet-900/60",
    ring: "ring-violet-500/30",
  },
  rose: {
    soft: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    solid: "bg-rose-500 text-white",
    tint: "bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-900/60",
    ring: "ring-rose-500/30",
  },
  fuchsia: {
    soft: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
    solid: "bg-fuchsia-500 text-white",
    tint: "bg-fuchsia-50 text-fuchsia-900 dark:bg-fuchsia-950/40 dark:text-fuchsia-200",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    border: "border-fuchsia-200 dark:border-fuchsia-900/60",
    ring: "ring-fuchsia-500/30",
  },
  sky: {
    soft: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    solid: "bg-sky-500 text-white",
    tint: "bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
    text: "text-sky-600 dark:text-sky-400",
    border: "border-sky-200 dark:border-sky-900/60",
    ring: "ring-sky-500/30",
  },
  indigo: {
    soft: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    solid: "bg-indigo-500 text-white",
    tint: "bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-900/60",
    ring: "ring-indigo-500/30",
  },
  teal: {
    soft: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    solid: "bg-teal-500 text-white",
    tint: "bg-teal-50 text-teal-900 dark:bg-teal-950/40 dark:text-teal-200",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-200 dark:border-teal-900/60",
    ring: "ring-teal-500/30",
  },
  slate: {
    soft: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    solid: "bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900",
    tint: "bg-slate-50 text-slate-900 dark:bg-slate-800/50 dark:text-slate-100",
    text: "text-slate-600 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-800",
    ring: "ring-slate-500/30",
  },
};

/** La teinte de chaque entrée du menu — la même sur la tuile et dans les listes. */
export const NAV_TONE: Record<string, Tone> = {
  overview: "slate",
  profile: "sky",
  revenue: "emerald",
  clients: "violet",
  todo: "amber",
  ongoing: "blue",
  shipping: "teal",
  done: "emerald",
  models: "rose",
  fabrics: "fuchsia",
  sales: "indigo",
};
