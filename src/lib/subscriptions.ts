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
 * Commission prélevée par la plateforme sur le plan **Gratuit**, par métier :
 * 5% sur chaque vente de tissu et 5% sur chaque prestation de couture. Un pro qui
 * exerce les deux métiers cumule donc 10%. Les plans payants sont à 0%.
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
    tagline: "Lancez-vous sans frais, ne payez que sur vos ventes.",
    monthlyPrice: 0,
    scope: "both",
    commission: FREE_COMMISSION_RATE,
    featured: false,
    badge: "Sans abonnement",
    features: [
      "Tailleur, vendeur de tissus, ou les deux",
      "5% de commission par vente de tissu, 5% par prestation de couture",
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
      "Boutique en ligne et fiche publique",
      "Commandes, messagerie et suivi de commande illimités",
      "Encaissement Orange Money, Wave, Free Money & carte",
      "Statistiques détaillées",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Les deux métiers, zéro commission.",
    monthlyPrice: 15000,
    scope: "both",
    commission: 0,
    featured: true,
    badge: "Populaire",
    features: [
      "Les deux métiers en même temps : tailleur et vendeur",
      "0% de commission sur toutes vos ventes",
      "Une seule boutique pour vos tissus et vos créations",
      "Mise en avant dans le catalogue et la recherche",
      "Statistiques avancées",
      "Support prioritaire",
    ],
  },
];

export function getPlan(id: SubscriptionPlanId): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === id);
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
