/**
 * Score de confiance d'un pro (tailleur / vendeur) — la brique « confiance » de
 * JALOFA. Un client doit pouvoir juger un atelier d'un coup d'œil, avant même de
 * commander. Le score, sur 100 :
 *
 *   🛡 Certifié par JALOFA     — 60 points : JALOFA le juge fiable
 *   ⭐ Avis clients            — jusqu'à ±40 points selon la note et le nombre d'avis
 *
 * Commandes livrées, délais, acceptation et photos vérifiées sont affichés à
 * titre d'information, sans compter dans le score. En plus du chiffre, deux
 * distinctions : 🏅 « Membre Fondateur » et ✅ « Certifié ».
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
  | "certified"
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
  /**
   * `true` = le critère fait le score (certification, avis). `false` = simple
   * information sur l'activité du pro, affichée sans compter.
   */
  scored: boolean;
};

export type TrustTier = {
  label: string;
  tone: "new" | "good" | "high" | "elite";
};

export type TrustScore = {
  /** Sur 100, ou `null` pour un pro ni certifié ni noté (« Nouveau »). */
  score: number | null;
  tier: TrustTier;
  components: TrustComponent[];
  badges: { founding: boolean; certified: boolean };
};

// La fiabilité selon JALOFA (2026-11-14) : CERTIFIER un tailleur, c'est dire
// « nous le jugeons fiable » — la certification pèse donc l'essentiel du score.
// Les AVIS clients ajoutent (ou retirent) de la fiabilité par-dessus.
/** Points donnés par la certification JALOFA. */
const CERTIFIED_POINTS = 60;
/** Ce que les avis peuvent ajouter au maximum (et retirer, s'ils sont mauvais). */
const REVIEWS_POINTS = 40;
/** À partir de combien d'avis les avis comptent pleinement. */
const REVIEWS_FULL = 10;
/** Note neutre : au-dessus les avis ajoutent, en dessous ils retirent. */
const NEUTRAL_RATING = 2.5;

function tierFor(score: number | null): TrustTier {
  if (score === null) return { label: "Nouveau", tone: "new" };
  if (score >= 85) return { label: "Excellent", tone: "elite" };
  if (score >= 70) return { label: "Très fiable", tone: "high" };
  if (score >= 50) return { label: "Fiable", tone: "good" };
  return { label: "En progression", tone: "good" };
}

export function computeTrustScore(pro: Partial<TrustPro>): TrustScore {
  const certified = Boolean(pro.is_certified);
  const rating = pro.rating ?? 0;
  const ratingCount = pro.rating_count ?? 0;
  const completed = pro.completed_orders ?? 0;
  const accepted = pro.accepted_orders ?? 0;
  const rejected = pro.rejected_orders ?? 0;
  const onTime = pro.on_time_orders ?? 0;
  const photos = pro.verified_photos ?? 0;

  const decided = accepted + rejected;

  // Avis : leur poids grandit avec leur nombre (1 avis ne vaut pas 10), leur
  // sens suit la note (5/5 ajoute tout, 1/5 retire).
  const confidence = Math.min(1, ratingCount / REVIEWS_FULL);
  const quality = Math.max(
    -1,
    Math.min(1, (rating - NEUTRAL_RATING) / (5 - NEUTRAL_RATING)),
  );
  const reviewPoints = ratingCount > 0 ? REVIEWS_POINTS * confidence * quality : 0;

  const score =
    !certified && ratingCount === 0
      ? null
      : Math.round(
          Math.max(0, Math.min(100, (certified ? CERTIFIED_POINTS : 0) + reviewPoints)),
        );

  const components: TrustComponent[] = [
    {
      key: "certified",
      emoji: "🛡️",
      label: "Certifié par JALOFA",
      scored: true,
      value: certified ? 1 : 0,
      display: certified ? "Oui, jugé fiable par JALOFA" : "Pas encore certifié",
    },
    {
      key: "reviews",
      emoji: "⭐",
      label: "Avis clients",
      scored: true,
      value: ratingCount > 0 ? Math.max(0, reviewPoints) / REVIEWS_POINTS : null,
      display:
        ratingCount > 0
          ? `${rating.toFixed(1)}/5 · ${ratingCount} avis`
          : "Pas encore d'avis",
    },
    {
      key: "orders",
      emoji: "📦",
      label: "Commandes réalisées",
      scored: false,
      value: null,
      display:
        completed > 0
          ? `${completed} commande${completed > 1 ? "s" : ""} livrée${completed > 1 ? "s" : ""}`
          : "Aucune livraison encore",
    },
    {
      key: "on_time",
      emoji: "⏱",
      label: "Respect des délais",
      scored: false,
      value: null,
      display:
        completed > 0 && onTime > 0
          ? `${Math.round((onTime / completed) * 100)}% dans les délais`
          : "Bientôt",
    },
    {
      key: "acceptance",
      emoji: "✅",
      label: "Taux d'acceptation",
      scored: false,
      value: null,
      display:
        decided > 0 ? `${Math.round((accepted / decided) * 100)}% acceptées` : "Bientôt",
    },
    {
      key: "photos",
      emoji: "🧵",
      label: "Photos vérifiées",
      scored: false,
      value: null,
      display:
        photos > 0
          ? `${photos} réalisation${photos > 1 ? "s" : ""} vérifiée${photos > 1 ? "s" : ""}`
          : "Aucune photo vérifiée",
    },
  ];

  return {
    score,
    tier: tierFor(score),
    components,
    badges: {
      founding: Boolean(pro.is_founding_member),
      certified,
    },
  };
}
