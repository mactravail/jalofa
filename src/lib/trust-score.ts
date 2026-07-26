/**
 * Score de confiance d'un pro (tailleur / vendeur) — la brique « confiance » de
 * JALOFA. Un client doit pouvoir juger un atelier d'un coup d'œil, avant même de
 * commander. Le score, sur 100, agrège des signaux publics et vérifiables :
 *
 *   ⭐ Avis clients            — note moyenne pondérée par le nombre d'avis
 *   📦 Commandes réalisées     — livraisons menées à terme
 *   ⏱ Respect des délais       — part des commandes livrées dans le délai annoncé
 *   ✅ Taux d'acceptation       — commandes acceptées vs refusées
 *   🧵 Photos vérifiées         — réalisations validées par l'administration
 *
 * En plus du chiffre, deux distinctions : 🏅 « Membre Fondateur » (les tout
 * premiers pros) et ✅ « Vérifié » (certifié par l'administration).
 *
 * Le calcul est PUR et se nourrit de champs dénormalisés sur la fiche du pro
 * (compteurs tenus à jour par un trigger côté base), donc il reste bon marché à
 * afficher partout — fiche publique comme cartes de l'annuaire — sans requête
 * supplémentaire ni contournement des règles RLS sur les commandes.
 */

import type { Tailor, Vendor } from "@/lib/types";

/** Les seuls champs dont dépend le score — un tailleur comme un vendeur les portent. */
export type TrustPro = Pick<
  Tailor & Vendor,
  | "rating"
  | "rating_count"
  | "is_certified"
  | "is_founding_member"
  | "verified_photos"
  | "completed_orders"
  | "accepted_orders"
  | "rejected_orders"
  | "on_time_orders"
>;

export type TrustComponentKey =
  | "reviews"
  | "orders"
  | "on_time"
  | "acceptance"
  | "photos";

export type TrustComponent = {
  key: TrustComponentKey;
  emoji: string;
  label: string;
  /** Part obtenue sur ce critère (0→1), ou `null` tant qu'il n'y a pas de données. */
  value: number | null;
  /** Formulation lisible (« 4,8/5 », « 12 livrées », « Bientôt »). */
  display: string;
  /** Poids du critère dans le score global. */
  weight: number;
};

export type TrustTier = {
  label: string;
  tone: "new" | "good" | "high" | "elite";
};

export type TrustScore = {
  /** Sur 100, ou `null` pour un pro sans aucun signal encore (« Nouveau »). */
  score: number | null;
  tier: TrustTier;
  components: TrustComponent[];
  badges: { founding: boolean; certified: boolean };
};

// Pondérations des critères — leur somme fait 1. Un critère sans données est
// retiré et le score est renormalisé sur les critères disponibles, pour ne pas
// pénaliser un pro qui débute (ex. aucune commande livrée pour l'instant).
const WEIGHTS: Record<TrustComponentKey, number> = {
  reviews: 0.4,
  orders: 0.2,
  on_time: 0.15,
  acceptance: 0.15,
  photos: 0.1,
};

/** À partir de combien de livraisons / photos le critère est-il « au max ». */
const ORDERS_FULL = 10;
const PHOTOS_FULL = 3;

function tierFor(score: number | null): TrustTier {
  if (score === null) return { label: "Nouveau", tone: "new" };
  if (score >= 85) return { label: "Excellent", tone: "elite" };
  if (score >= 70) return { label: "Très fiable", tone: "high" };
  if (score >= 50) return { label: "Fiable", tone: "good" };
  return { label: "En progression", tone: "good" };
}

export function computeTrustScore(pro: Partial<TrustPro>): TrustScore {
  const rating = pro.rating ?? 0;
  const ratingCount = pro.rating_count ?? 0;
  const completed = pro.completed_orders ?? 0;
  const accepted = pro.accepted_orders ?? 0;
  const rejected = pro.rejected_orders ?? 0;
  const onTime = pro.on_time_orders ?? 0;
  const photos = pro.verified_photos ?? 0;

  const decided = accepted + rejected;

  const components: TrustComponent[] = [
    {
      key: "reviews",
      emoji: "⭐",
      label: "Avis clients",
      weight: WEIGHTS.reviews,
      value: ratingCount > 0 ? rating / 5 : null,
      display:
        ratingCount > 0
          ? `${rating.toFixed(1)}/5 · ${ratingCount} avis`
          : "Pas encore d'avis",
    },
    {
      key: "orders",
      emoji: "📦",
      label: "Commandes réalisées",
      weight: WEIGHTS.orders,
      value: completed > 0 ? Math.min(1, completed / ORDERS_FULL) : null,
      display:
        completed > 0
          ? `${completed} commande${completed > 1 ? "s" : ""} livrée${completed > 1 ? "s" : ""}`
          : "Aucune livraison encore",
    },
    {
      key: "on_time",
      emoji: "⏱",
      label: "Respect des délais",
      weight: WEIGHTS.on_time,
      // `on_time_orders` n'est suivi que pour la confection (tailleurs). À 0, on
      // considère le critère « non renseigné » plutôt que « 0% » : un vendeur ne
      // coud pas, et on ne pénalise pas un pro faute de données.
      value: completed > 0 && onTime > 0 ? Math.min(1, onTime / completed) : null,
      display:
        completed > 0 && onTime > 0
          ? `${Math.round((onTime / completed) * 100)}% dans les délais`
          : "Bientôt",
    },
    {
      key: "acceptance",
      emoji: "✅",
      label: "Taux d'acceptation",
      weight: WEIGHTS.acceptance,
      value: decided > 0 ? accepted / decided : null,
      display:
        decided > 0
          ? `${Math.round((accepted / decided) * 100)}% acceptées`
          : "Bientôt",
    },
    {
      key: "photos",
      emoji: "🧵",
      label: "Photos vérifiées",
      weight: WEIGHTS.photos,
      value: photos > 0 ? Math.min(1, photos / PHOTOS_FULL) : null,
      display:
        photos > 0
          ? `${photos} réalisation${photos > 1 ? "s" : ""} vérifiée${photos > 1 ? "s" : ""}`
          : "Aucune photo vérifiée",
    },
  ];

  const available = components.filter((c) => c.value !== null);
  const totalWeight = available.reduce((sum, c) => sum + c.weight, 0);
  const score =
    totalWeight > 0
      ? Math.round(
          (available.reduce((sum, c) => sum + c.weight * (c.value as number), 0) /
            totalWeight) *
            100,
        )
      : null;

  return {
    score,
    tier: tierFor(score),
    components,
    badges: {
      founding: Boolean(pro.is_founding_member),
      certified: Boolean(pro.is_certified),
    },
  };
}
