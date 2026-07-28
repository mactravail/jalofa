/**
 * Politique de mot de passe — partagée par le serveur (autorité) et le
 * formulaire d'inscription (retour en direct). Toute création de compte passe
 * par `signUp` (`src/lib/actions/auth.ts`), qui appelle `passwordIssue()` avant
 * de contacter Supabase : impossible de créer un compte faible en postant le
 * formulaire à la main.
 *
 * ⚠️ Ceci ne protège que le chemin applicatif. La même exigence doit être posée
 * dans Supabase (Authentication → Policies : longueur mini + caractères requis)
 * pour couvrir un appel direct à l'API d'auth.
 */

export const PASSWORD_MIN_LENGTH = 8;

/**
 * Les symboles acceptés comme « caractère spécial ». C'est exactement la liste
 * reconnue par Supabase Auth — un espace ou un tiret typographique n'en font pas
 * partie. Garder les deux politiques identiques évite qu'un mot de passe validé
 * par le formulaire soit ensuite refusé par Supabase (avec un message anglais).
 */
export const PASSWORD_SYMBOLS = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~";

const SYMBOL_RE = /[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/;

export type PasswordRule = {
  id: string;
  /** Libellé affiché dans la liste des exigences (FR). */
  label: string;
  /** Formulation reprise dans « Il manque : … » du message d'erreur. */
  missing: string;
  test: (value: string) => boolean;
};

/**
 * Les cinq exigences, dans l'ordre d'affichage. Les classes Unicode (`\p{Lu}`)
 * acceptent les lettres accentuées — « É » compte bien comme une majuscule.
 */
export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: `Au moins ${PASSWORD_MIN_LENGTH} caractères`,
    missing: `${PASSWORD_MIN_LENGTH} caractères minimum`,
    test: (v) => v.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "uppercase",
    label: "Une lettre majuscule (A-Z)",
    missing: "une lettre majuscule",
    test: (v) => /\p{Lu}/u.test(v),
  },
  {
    id: "lowercase",
    label: "Une lettre minuscule (a-z)",
    missing: "une lettre minuscule",
    test: (v) => /\p{Ll}/u.test(v),
  },
  {
    id: "digit",
    label: "Un chiffre (0-9)",
    missing: "un chiffre",
    test: (v) => /\p{Nd}/u.test(v),
  },
  {
    id: "special",
    label: "Un caractère spécial (! ? @ # $ …)",
    missing: "un caractère spécial",
    test: (v) => SYMBOL_RE.test(v),
  },
];

/**
 * Mots trop devinés pour servir de base à un mot de passe. On compare la racine
 * du mot de passe — lettres seules, sans accents ni chiffres ni symboles — donc
 * « Password1! », « P@ssw0rd » ou « Jalofa2026! » sont tous refusés.
 */
const COMMON_BASES = new Set([
  "password",
  "passwd",
  "motdepasse",
  "azerty",
  "azertyuiop",
  "qwerty",
  "qwertyuiop",
  "jalofa",
  "senegal",
  "dakar",
  "bonjour",
  "welcome",
  "bienvenue",
  "admin",
  "administrateur",
  "tailleur",
  "vendeur",
  "couture",
  "iloveyou",
  "abcdef",
  "abcdefgh",
  "letmein",
  "monkey",
  "dragon",
  "soleil",
]);

/**
 * Racine comparable. On retire d'abord la décoration de début et de fin
 * (« Password1! » → « password »), puis on défait les substitutions habituelles
 * à l'intérieur du mot (« P@ssw0rd » → « password »).
 */
function baseWord(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/^[\d\W_]+/u, "")
    .replace(/[\d\W_]+$/u, "")
    .replace(/[@4]/g, "a")
    .replace(/[$5]/g, "s")
    .replace(/[!1|]/g, "i")
    .replace(/0/g, "o")
    .replace(/3/g, "e")
    .replace(/7/g, "t")
    .replace(/[^a-z]/g, "");
}

/** `true` si le mot de passe n'est qu'un mot courant décoré. */
export function isCommonPassword(value: string): boolean {
  return COMMON_BASES.has(baseWord(value));
}

export type PasswordCheck = {
  valid: boolean;
  /** Exigences non satisfaites, dans l'ordre de `PASSWORD_RULES`. */
  failed: PasswordRule[];
  /** Exigences satisfaites, par identifiant — pour cocher la liste. */
  passed: Record<string, boolean>;
  common: boolean;
};

export function checkPassword(value: string): PasswordCheck {
  const passed: Record<string, boolean> = {};
  const failed: PasswordRule[] = [];
  for (const rule of PASSWORD_RULES) {
    const ok = rule.test(value);
    passed[rule.id] = ok;
    if (!ok) failed.push(rule);
  }
  const common = value.length > 0 && isCommonPassword(value);
  return { valid: failed.length === 0 && !common, failed, passed, common };
}

/**
 * Message d'erreur FR, ou `null` si le mot de passe est conforme. Utilisé par la
 * server action — c'est la seule vérification qui fait foi.
 */
export function passwordIssue(value: string): string | null {
  const { valid, failed, common } = checkPassword(value);
  if (valid) return null;
  if (common) {
    return "Ce mot de passe est trop courant et se devine en quelques secondes. Choisissez-en un autre.";
  }
  const missing = failed.map((r) => r.missing).join(", ");
  return `Mot de passe trop faible. Il manque : ${missing}.`;
}

export type PasswordStrength = {
  /** 0 (vide) à 4 (excellent). */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
};

/**
 * Force indicative affichée sous le champ : on part du nombre d'exigences
 * satisfaites, on récompense la longueur et on plafonne un mot courant.
 */
export function passwordStrength(value: string): PasswordStrength {
  if (!value) return { score: 0, label: "" };
  if (isCommonPassword(value)) return { score: 1, label: "Trop courant" };

  const met = PASSWORD_RULES.filter((r) => r.test(value)).length;
  if (met < PASSWORD_RULES.length) {
    return met <= 2
      ? { score: 1, label: "Faible" }
      : { score: 2, label: "Moyen" };
  }
  return value.length >= 12
    ? { score: 4, label: "Excellent" }
    : { score: 3, label: "Solide" };
}
