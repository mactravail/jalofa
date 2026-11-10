/**
 * Les abonnements pros de JALOFA. Un tailleur ou un vendeur de tissus choisit un
 * plan pour exercer sur la plateforme :
 *
 *  - **Gratuit** : aucun abonnement mensuel, mais une commission est prélevée sur
 *    chaque vente (5% par vente de tissu, 5% par prestation de couture — donc 10%
 *    pour qui fait les deux). Les deux métiers restent accessibles.
 *  - **Standard** : un seul métier (tailleur OU vendeur), 0% de commission.
 *  - **Premium**  : les deux métiers en même temps, 0% de commission.
 *
 * Labels en français (marché sénégalais) ; les identifiants restent en anglais
 * pour la base de données. Voir aussi `formatPrice` dans `@/lib/constants`.
 */

import type { ProRole } from "@/lib/dashboard-nav";

export type SubscriptionPlanId = "free" | "standard" | "premium";

export type BillingPeriod = "monthly" | "yearly";

/** Remise appliquée au paiement annuel (~2 mois offerts). */
export const YEARLY_DISCOUNT = 0.2;

/**
 * Commission prélevée par la plateforme sur l'offre **Gratuit** (par vente de
 * tissu et par prestation de couture). L'offre **Pro** (payante) n'en prélève
 * aucune.
 */
export const FREE_COMMISSION_RATE = 0.05;

export const BILLING_PERIOD_LABELS: Record<BillingPeriod, string> = {
  monthly: "Mensuel",
  yearly: "Annuel",
};

/** Combien de métiers le plan débloque : un au choix, ou les deux ensemble. */
export type PlanScope = "single" | "both";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  tagline: string;
  /** Prix mensuel de référence, en FCFA (0 pour le plan gratuit). Le tarif annuel applique `YEARLY_DISCOUNT`. */
  monthlyPrice: number;
  scope: PlanScope;
  /**
   * Commission prélevée par vente/prestation, en fraction (0.05 = 5% par métier).
   * `0` = aucune commission (plans payants). Voir `FREE_COMMISSION_RATE`.
   */
  commission: number;
  /** Mis en avant comme offre recommandée sur la page des tarifs. */
  featured: boolean;
  /** Pastille affichée sur la carte (« Populaire », « Sans frais »…). */
  badge: string | null;
  /** Ce que le plan apporte, une ligne = une puce cochée. */
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Gratuit",
    tagline: "Aucun abonnement : une petite commission sur chaque vente.",
    monthlyPrice: 0,
    scope: "both",
    commission: FREE_COMMISSION_RATE,
    featured: false,
    badge: "Sans abonnement",
    features: [
      "Tailleur et vendeur de tissus dans le même compte",
      "0 FCFA par mois — 5% de commission par vente",
      "Boutique en ligne et fiche publique",
      "Commandes, messagerie et suivi de commande illimités",
      "Encaissement Orange Money, Wave, Free Money & carte",
      "Statistiques de base",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    tagline: "Un métier, zéro commission.",
    monthlyPrice: 6000,
    scope: "single",
    commission: 0,
    featured: false,
    badge: null,
    features: [
      "Un métier au choix : tailleur ou vendeur de tissus",
      "0% de commission — vous gardez 100% de vos ventes",
      "Prix sur demande : masquez vos tarifs, donnez vos devis en privé",
      "Boutique en ligne et fiche publique",
      "Commandes, messagerie et suivi de commande illimités",
      "Encaissement Orange Money, Wave, Free Money & carte",
      "Statistiques détaillées",
    ],
  },
  {
    id: "premium",
    name: "Pro",
    tagline: "Un abonnement, zéro commission : vous gardez 100%.",
    // 9 900 et pas 10 000 : sous la barre psychologique, et « 330 FCFA par
    // jour » se lit comme le prix d'un café Touba, pas d'un abonnement.
    monthlyPrice: 9900,
    scope: "both",
    commission: 0,
    featured: true,
    badge: "Recommandé",
    features: [
      "Tailleur et vendeur de tissus dans le même compte",
      "0% de commission — vous gardez 100% de vos ventes",
      "Prix sur demande : masquez vos tarifs, donnez vos devis en privé",
      "Une seule boutique pour vos tissus et vos créations",
      "Mise en avant dans le catalogue et la recherche",
      "Statistiques avancées",
      "Support prioritaire",
    ],
  },
];

/**
 * Les deux offres proposées à l'inscription d'un pro : **Gratuit** (commission)
 * et **Pro** (abonnement mensuel payé via PayDunya). Les deux ouvrent les deux
 * métiers — tailleur et vendeur de tissus. Le plan `standard` n'est plus proposé
 * (conservé pour les comptes existants).
 */
export const PRO_OFFER_IDS = ["free", "premium"] as const;
export type ProOfferId = (typeof PRO_OFFER_IDS)[number];

/** L'abonnement payant (offre « Pro »), facturé `monthlyPrice` par mois. */
export const PAID_PLAN_ID: SubscriptionPlanId = "premium";

/** Le prix d'un mois ramené à la journée (30 jours), arrondi à la dizaine. */
export function dailyPrice(monthlyPrice: number): number {
  return Math.round(monthlyPrice / 30 / 10) * 10;
}

/**
 * Ventes mensuelles à partir desquelles l'offre Pro coûte moins cher que la
 * commission du Gratuit, arrondies au millier supérieur.
 */
export function proBreakEven(monthlyPrice: number): number {
  return Math.ceil(monthlyPrice / FREE_COMMISSION_RATE / 1000) * 1000;
}

/**
 * Une offre racontée par la douleur qu'elle enlève : `title` = la solution en
 * gros, `text` = le problème du pro qu'elle règle.
 */
export type OfferPoint = { title: string; text: string };

/** Les deux offres d'un compte pro, telles qu'on les vend (inscription, /tailleurs). */
export const OFFER_PITCH: Record<ProOfferId, { lead: string; points: OfferPoint[] }> = {
  free: {
    lead: "Pour démarrer sans rien payer.",
    points: [
      {
        title: "0 FCFA par mois",
        text: `Vous payez seulement quand vous vendez : ${Math.round(FREE_COMMISSION_RATE * 100)}% de la vente.`,
      },
      {
        title: "Vos modèles en ligne",
        text: "Publiez vos créations, les clients commandent sur JALOFA.",
      },
      {
        title: "Votre tableau de bord",
        text: "Devis, commandes et clients, sur votre téléphone.",
      },
      {
        title: "Le client paie avant",
        text: "Plus de tenue cousue pour un client qui disparaît.",
      },
    ],
  },
  premium: {
    lead: "Faites de votre atelier une marque, ici et à l'étranger.",
    points: [
      {
        title: "Des clients jusqu'à Paris et New York",
        text: "La diaspora et d'autres pays commandent vos habits et paient en ligne.",
      },
      {
        title: "Vu partout : catalogue, pubs, événements",
        text: "Votre atelier passe en tête, et dans nos publicités et nos événements.",
      },
      {
        title: "Gardez 100% de vos ventes",
        text: "0% de commission. Chaque franc payé par le client est pour vous.",
      },
      {
        title: "Vendez vos propres créations",
        text: "Publiez vos modèles et vos habits : votre vitrine, ouverte jour et nuit.",
      },
      {
        title: "Tout votre atelier dans la poche",
        text: "Devis, commandes, suivi de chaque client : un seul tableau de bord.",
      },
      {
        title: "Fini les clients qui marchandent",
        text: "Masquez vos prix et donnez vos devis en privé.",
      },
      {
        title: "Sans engagement, aucun oubli",
        text: "Après le 1er mois : retenu sur vos ventes ou payé en mobile money. Arrêtez quand vous voulez.",
      },
    ],
  },
};

/**
 * Le plan qui s'applique réellement : un abonnement payant dont la période est
 * échue retombe sur l'offre Gratuit.
 */
export function effectivePlan(
  plan: SubscriptionPlanId | null | undefined,
  expiresAt: string | null | undefined,
): SubscriptionPlanId {
  if (!plan || plan === "free") return "free";
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return "free";
  return plan;
}

export function getPlan(id: SubscriptionPlanId): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === id);
}

/**
 * Le tailleur peut-il masquer ses prix et traiter ses devis en privé ?
 * Réservé aux forfaits payants — un compte Gratuit doit afficher ses prix
 * (cf. `Tailor.quote_only`). C'est la règle unique qui gate le réglage côté
 * espace pro comme sa prise en compte à l'enregistrement du profil.
 */
export function planCanQuote(plan: SubscriptionPlanId): boolean {
  return planMonthlyPrice(plan) > 0;
}

/**
 * La commission que JALOFA prélève sur chaque vente d'un pro, selon son plan :
 * `FREE_COMMISSION_RATE` (5%) par métier sur le plan Gratuit, `0` sur les plans
 * payants. C'est la règle unique dont dépend le calcul des reversements
 * (`@/lib/payouts`) et de la part propre de la plateforme.
 */
export function planCommission(plan: SubscriptionPlanId): number {
  return getPlan(plan)?.commission ?? FREE_COMMISSION_RATE;
}

/** L'abonnement mensuel du plan, en FCFA (0 pour le Gratuit) — revenu 100% JALOFA. */
export function planMonthlyPrice(plan: SubscriptionPlanId): number {
  return getPlan(plan)?.monthlyPrice ?? 0;
}

/**
 * Les métiers qu'un plan débloque — la règle unique dont dépendent le menu du
 * dashboard, le sélecteur d'espace et les gardes de routes. **Standard** n'en
 * ouvre qu'un, choisi au moment de l'inscription (`chosen`) ; **Gratuit** et
 * **Premium** ouvrent les deux ensemble. Un tableau vide = un Standard qui n'a
 * pas encore choisi son métier.
 */
export function planRoles(
  plan: SubscriptionPlanId,
  chosen?: ProRole,
): ProRole[] {
  if (getPlan(plan)?.scope === "both") return ["tailor", "vendor"];
  return chosen ? [chosen] : [];
}

/** Montant facturé une fois par an, remise annuelle incluse. */
export function yearlyPrice(monthlyPrice: number): number {
  return Math.round(monthlyPrice * 12 * (1 - YEARLY_DISCOUNT));
}

/**
 * Le prix « par mois » à afficher selon la période choisie : le tarif annuel est
 * mensualisé pour comparer les plans à la même échelle.
 */
export function displayedMonthly(
  plan: SubscriptionPlan,
  period: BillingPeriod,
): number {
  return period === "yearly"
    ? Math.round(yearlyPrice(plan.monthlyPrice) / 12)
    : plan.monthlyPrice;
}

/** Montant réellement prélevé sur la période (mensuel ou annuel). */
export function periodTotal(
  plan: SubscriptionPlan,
  period: BillingPeriod,
): number {
  return period === "yearly" ? yearlyPrice(plan.monthlyPrice) : plan.monthlyPrice;
}
