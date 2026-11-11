/**
 * JALOFA EUROPE — une section de JALOFA, pas un second site.
 *
 * Un pro (tailleur ou vendeur de tissu) est « européen » parce qu'il a déclaré
 * un pays d'Europe (`tailors.country` / `vendors.country`, à l'inscription ou
 * dans son profil). C'est la seule source de vérité : ses créations et ses
 * tissus rejoignent automatiquement /europe, et restent aussi visibles dans les
 * pages Homme, Femme et Tissus, avec une étiquette et le prix en euros.
 *
 * Les paiements restent en FCFA (Wave, Orange Money, PayDunya) : l'euro n'est
 * qu'un affichage. Le FCFA est arrimé à l'euro, le taux est donc fixe et exact.
 */

/** 1 € = 655,957 FCFA (parité fixe du franc CFA). */
export const EUR_TO_XOF = 655.957;

export const EUROPE_LABEL = "JALOFA EUROPE";
export const EUROPE_SLOGAN = "L'élégance européenne, accessible au monde.";
export const EUROPE_PATH = "/europe";

/** Le pays par défaut : tous les pros existants sont au Sénégal. */
export const DEFAULT_COUNTRY = "Sénégal";

export const AFRICA_COUNTRIES = [
  "Sénégal",
  "Côte d'Ivoire",
  "Mali",
  "Gambie",
  "Guinée",
  "Guinée-Bissau",
  "Mauritanie",
  "Burkina Faso",
  "Niger",
  "Bénin",
  "Togo",
  "Cameroun",
  "Maroc",
] as const;

export const EUROPE_COUNTRIES = [
  "Italie",
  "France",
  "Espagne",
  "Portugal",
  "Belgique",
  "Suisse",
  "Allemagne",
  "Autriche",
  "Pays-Bas",
  "Luxembourg",
  "Royaume-Uni",
  "Irlande",
  "Grèce",
  "Pologne",
  "Suède",
  "Danemark",
  "Norvège",
  "Finlande",
  "Roumanie",
  "Croatie",
  "Monaco",
  "Malte",
] as const;

/** Les choix du champ « Pays », groupés : l'Afrique d'abord, puis l'Europe. */
export const COUNTRY_GROUPS: { label: string; countries: readonly string[] }[] = [
  { label: "Afrique", countries: AFRICA_COUNTRIES },
  { label: "Europe", countries: EUROPE_COUNTRIES },
];

const ALL_COUNTRIES: readonly string[] = [...AFRICA_COUNTRIES, ...EUROPE_COUNTRIES];

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

const EUROPE_KEYS = new Set(EUROPE_COUNTRIES.map((c) => normalize(c)));

/** Ce pays est-il en Europe ? Sans pays, non : le pro est au Sénégal. */
export function isEuropeCountry(country: string | null | undefined): boolean {
  return EUROPE_KEYS.has(normalize(country));
}

/** Le pays du formulaire, ramené à la liste (sinon le pays par défaut). */
export function parseCountry(value: unknown): string {
  const key = normalize(typeof value === "string" ? value : "");
  return ALL_COUNTRIES.find((c) => normalize(c) === key) ?? DEFAULT_COUNTRY;
}

// --- Prix ---------------------------------------------------------------------

/** Un montant FCFA en euros, arrondi à l'euro. */
export function xofToEur(amount: number): number {
  return Math.round(amount / EUR_TO_XOF);
}

/** Un montant saisi en euros, en FCFA (la devise de paiement). */
export function eurToXof(amount: number): number {
  return Math.round(amount * EUR_TO_XOF);
}

export function formatEuro(amountXof: number | null | undefined): string {
  const value = typeof amountXof === "number" ? amountXof : 0;
  return `${xofToEur(value).toLocaleString("fr-FR")} €`;
}

// --- Les catégories de lancement -------------------------------------------

export type EuropeType =
  | "robe-mariage"
  | "costume-homme"
  | "costume-femme"
  | "chemise-homme"
  | "chemise-femme"
  | "smoking-homme"
  | "robe"
  | "robe-soiree"
  | "costume-2p-homme"
  | "detente-femme";

/**
 * `category` est la catégorie JALOFA existante (homme / femme) : c'est elle qui
 * fait apparaître le produit dans les pages Homme et Femme, sans rien y changer.
 */
export const EUROPE_TYPES: {
  value: EuropeType;
  /** Titre court posé sur la photo : la photo montre déjà si c'est homme ou femme. */
  tile: string;
  label: string;
  short: string;
  category: "homme" | "femme";
}[] = [
  { value: "robe-mariage", tile: "Robes de mariage", label: "Robes de mariage", short: "Robe de mariage", category: "femme" },
  { value: "robe", tile: "Robes", label: "Robes", short: "Robe", category: "femme" },
  { value: "robe-soiree", tile: "Robes de soirée", label: "Robes de soirée", short: "Robe de soirée", category: "femme" },
  { value: "costume-homme", tile: "Costume 3 pièces", label: "Costumes homme", short: "Costume homme", category: "homme" },
  { value: "smoking-homme", tile: "Smokings", label: "Smokings homme", short: "Smoking homme", category: "homme" },
  { value: "costume-femme", tile: "Ensembles tailleur", label: "Costumes femme", short: "Costume femme", category: "femme" },
  { value: "chemise-homme", tile: "Chemises", label: "Chemises homme", short: "Chemise homme", category: "homme" },
  { value: "chemise-femme", tile: "Chemises", label: "Chemises femme", short: "Chemise femme", category: "femme" },
  { value: "costume-2p-homme", tile: "Costume 2 pièces", label: "Costumes 2 pièces homme", short: "Costume 2 pièces homme", category: "homme" },
  { value: "detente-femme", tile: "Tenues détente", label: "Tenues détente femme", short: "Tenue détente femme", category: "femme" },
];

export function parseEuropeType(value: unknown): EuropeType | null {
  return EUROPE_TYPES.find((t) => t.value === value)?.value ?? null;
}

export function europeTypeInfo(value: string | null | undefined) {
  return EUROPE_TYPES.find((t) => t.value === value) ?? null;
}

// --- Type de confection -------------------------------------------------------

export type MakingType = "sur_mesure" | "pret_a_porter" | "les_deux";

export const MAKING_TYPES: { value: MakingType; label: string }[] = [
  { value: "les_deux", label: "Sur mesure et prêt-à-porter" },
  { value: "sur_mesure", label: "Sur mesure" },
  { value: "pret_a_porter", label: "Prêt-à-porter" },
];

export function parseMakingType(value: unknown): MakingType | null {
  return MAKING_TYPES.find((t) => t.value === value)?.value ?? null;
}

export function makingTypeLabel(value: string | null | undefined): string | null {
  return MAKING_TYPES.find((t) => t.value === value)?.label ?? null;
}

/** Ce produit se fait-il sur mesure ? (filtre « type de confection ») */
export function matchesMaking(
  value: string | null | undefined,
  wanted: "sur_mesure" | "pret_a_porter",
): boolean {
  if (!value) return wanted === "sur_mesure"; // JALOFA : sur mesure par défaut
  return value === "les_deux" || value === wanted;
}

/** Ce qui situe un produit : l'atelier, sa ville, son pays. */
export type ProductOrigin = {
  shop_name: string | null;
  city: string | null;
  country: string | null;
  europe: boolean;
};

export function originLabel(origin: ProductOrigin | null | undefined): string | null {
  if (!origin) return null;
  const place = [origin.city, origin.country].filter(Boolean).join(", ");
  return place || null;
}
