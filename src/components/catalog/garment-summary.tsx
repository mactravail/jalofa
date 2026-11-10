import type { ReactNode } from "react";
import Link from "@/components/i18n/link";
import { Clock, Plus, Star, Store, User } from "lucide-react";

import { CustomerReviews } from "@/components/catalog/collection-sections";
import {
  RelatedModelsRail,
  type RelatedGarment,
} from "@/components/catalog/related-models-rail";
import { Badge } from "@/components/ui/badge";
import { CANCEL_WINDOW_HOURS } from "@/lib/after-sale";
import { APP_NAME } from "@/lib/constants";
import type { LatestReviews, ModelReviewStats } from "@/lib/data";
import { deliveryPolicy } from "@/lib/delivery";
import { careTipLines } from "@/lib/model-style";
import type { GarmentModel } from "@/lib/types";
import { getT } from "@/lib/i18n/server";
import { getLocale } from "@/lib/i18n/server";
import { intlLocale } from "@/lib/i18n/config";

/**
 * Ce que toutes les fiches vêtement montrent, dans le même ordre : le haut de
 * fiche (titre, auteur, délai, pour qui, nombre d'avis) ; sous le bloc d'achat,
 * les « Voir plus » (description, livraison et remboursement, instructions) ; en
 * bas, les vrais avis du modèle puis les modèles proches.
 */

export function GarmentFooter({
  reviews,
  related,
}: {
  reviews: LatestReviews;
  related: RelatedGarment[];
}) {
  return (
    <>
      <div className="mt-16 border-t pt-12">
        <CustomerReviews
          data={reviews}
          headingClassName="font-serif text-2xl tracking-tight"
          className="max-w-none scroll-mt-24 px-0 pt-0 md:px-0 md:pt-0"
        />
      </div>
      <RelatedModelsRail items={related} />
    </>
  );
}

const DIFFICULTY_LABEL: Record<string, string> = {
  facile: "Facile",
  moyen: "Intermédiaire",
  difficile: "Avancé",
};

const AUDIENCE_LABEL: Record<string, string> = {
  homme: "Pour homme",
  femme: "Pour femme",
  enfant: "Pour enfant",
};

// Sans conseil du tailleur (catalogue JALOFA, ou champ laissé vide) : les gestes
// valables pour tous les tissus, présentés comme tels.
const GENERAL_CARE = [
  "Lavez à la main, à l'eau froide.",
  "N'utilisez pas de javel.",
  "Faites sécher à l'ombre.",
  "Repassez sur l'envers.",
];

type GarmentAuthor = {
  id: string;
  shop_name: string | null;
  city?: string | null;
};

export async function GarmentHeading({
  model,
  author,
  reviews,
  eyebrow,
  badge,
}: {
  model: Pick<GarmentModel, "name" | "avg_days" | "difficulty" | "category_slug">;
  author: GarmentAuthor | null;
  reviews: ModelReviewStats;
  eyebrow?: string;
  /** Remplace le niveau de difficulté (« 3 pièces » sur le grand boubou). */
  badge?: string;
}) {
  const t = await getT();
  const locale = intlLocale(await getLocale());
  const audience = model.category_slug ? AUDIENCE_LABEL[model.category_slug] : null;
  const badgeLabel =
    badge ?? (model.difficulty ? DIFFICULTY_LABEL[model.difficulty] : null);

  return (
    <header>
      {eyebrow && (
        <p className="text-primary text-xs font-medium tracking-wide uppercase">{t(eyebrow)}</p>
      )}
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{model.name}</h1>

      <a
        href="#avis"
        className="text-muted-foreground hover:text-foreground mt-1.5 inline-flex items-center gap-1 text-xs"
      >
        {reviews.count > 0 && (
          <>
            <Star className="size-3 fill-amber-400 text-amber-400" />
            {reviews.average.toLocaleString(locale, { maximumFractionDigits: 1 })} ·{" "}
          </>
        )}
        {t("{n} avis", { n: reviews.count })}
      </a>

      <p className="mt-3 flex items-center gap-1.5 text-sm">
        <Store className="text-muted-foreground size-4 shrink-0" />
        <span className="min-w-0">
          {t("Publié par")}{" "}
          {author ? (
            <Link
              href={`/tailleurs/${author.id}`}
              className="font-medium underline underline-offset-4"
            >
              {author.shop_name ?? t("son tailleur")}
            </Link>
          ) : (
            <span className="font-medium">{APP_NAME}</span>
          )}
          {author?.city ? ` · ${author.city}` : ""}
        </span>
      </p>

      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span className="flex items-center gap-1.5">
          <Clock className="size-4" /> {t("~{n} jours de confection", { n: model.avg_days })}
        </span>
        {audience && (
          <span className="flex items-center gap-1.5">
            <User className="size-4" /> {t(audience)}
          </span>
        )}
        {badgeLabel && <Badge variant="outline">{t(badgeLabel)}</Badge>}
      </div>
    </header>
  );
}

async function SeeMore({ title, children }: { title: string; children: ReactNode }) {
  const t = await getT();
  return (
    <details className="group border-b">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 font-medium [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">{t(title)}</span>
        <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs font-normal">
          <span className="group-open:hidden">{t("Voir plus")}</span>
          <span className="hidden group-open:inline">{t("Voir moins")}</span>
          <Plus className="size-4 transition-transform group-open:rotate-45" />
        </span>
      </summary>
      <div className="text-muted-foreground space-y-2 pb-4 text-sm">{children}</div>
    </details>
  );
}

export async function GarmentDetails({
  model,
}: {
  model: Pick<
    GarmentModel,
    "description" | "avg_days" | "care_tips" | "delivery_zone" | "tailor_id"
  >;
}) {
  const t = await getT();
  const tips = careTipLines(model.care_tips);
  const description = model.description?.trim() || null;
  // La description d'une création est celle de son tailleur, mot pour mot :
  // JALOFA n'y ajoute rien, et sans texte du pro la rubrique n'apparaît pas.
  const isTailorModel = Boolean(model.tailor_id);

  return (
    <div className="mt-6 border-t">
      {(description || !isTailorModel) && (
        <SeeMore title="Description">
          {description && <p className="whitespace-pre-line">{description}</p>}
          {!isTailorModel && <p>{t("Tailles standard XS → XXXL, ajustées par le tailleur.")}</p>}
        </SeeMore>
      )}

      <SeeMore title="Livraison et remboursement">
        <p>{t(deliveryPolicy(model.delivery_zone))}</p>
        <p>{t("Comptez ~{n} jours de confection, plus le trajet jusqu'à votre ville.", { n: model.avg_days })}</p>
        <p>
          {t("Vous pouvez annuler pendant {h} h après le paiement, tant que le tissu n'est pas parti : {app} vous rembourse.", { h: CANCEL_WINDOW_HOURS, app: APP_NAME })}
        </p>
        <p>{t("Une tenue cousue ne peut pas être rendue, mais votre tailleur peut la retoucher.")}</p>
        <p>
          {t("Défaut, erreur ou tenue jamais reçue : faites une réclamation dans les 3 jours après la livraison pour être remboursé.")}
        </p>
        <Link href="/conditions" className="inline-block underline underline-offset-4">
          {t("Lire les conditions")}
        </Link>
      </SeeMore>

      <SeeMore title="Instructions">
        {tips.length === 0 && (
          <p>{t("Conseils généraux, à adapter selon le tissu :")}</p>
        )}
        <ul className="space-y-1.5">
          {(tips.length > 0 ? tips : GENERAL_CARE).map((line, i) => (
            <li key={`${i}-${line}`} className="flex gap-2">
              <span aria-hidden>•</span>
              <span className="min-w-0">{tips.length > 0 ? line : t(line)}</span>
            </li>
          ))}
        </ul>
      </SeeMore>
    </div>
  );
}
