import Link from "@/components/i18n/link";
import { EyeOff, Shirt } from "lucide-react";

import { ShopLinkCopy } from "@/components/dashboard/shop-link-copy";
import { DASHBOARD_ROOT, type ProRole } from "@/lib/dashboard-nav";
import { getCurrentTailor } from "@/lib/data";
import { getT } from "@/lib/i18n/server";
import { siteOrigin } from "@/lib/pro-subscription";

// « Mon lien TikTok » : le lien de la boutique à mettre en bio TikTok ou à
// donner pendant un live. Le client y voit les modèles du tailleur et seulement
// ceux-là, et achète tout de suite.
export async function ShopLinkView({ role }: { role: ProRole }) {
  const t = await getT();
  const [tailor, origin] = await Promise.all([getCurrentTailor(), siteOrigin()]);

  const shops = [
    tailor && {
      key: "tailor" as const,
      icon: Shirt,
      label: t("Mes modèles"),
      hint: t("Les clients voient vos modèles et peuvent les personnaliser ou les acheter en prêt-à-porter."),
      url: `${origin}/tailleurs/${tailor.id}`,
      name: tailor.shop_name ?? t("Ma boutique"),
      visible: Boolean(tailor.is_active && tailor.is_activated),
    },
  ]
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    // Le métier de l'espace ouvert d'abord.
    .sort((a, b) => Number(b.key === role) - Number(a.key === role));

  if (shops.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
        {t("Remplissez d'abord votre page publique pour avoir votre lien.")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {shops.map((shop) => (
        <div key={shop.key} className="bg-card rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
              <shop.icon className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold">{shop.label}</h2>
              <p className="text-muted-foreground text-sm">{shop.hint}</p>
            </div>
          </div>
          <div className="mt-4">
            <ShopLinkCopy url={shop.url} title={shop.name} />
          </div>
          {!shop.visible && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-500">
              <EyeOff className="mt-0.5 size-4 shrink-0" />
              <span>
                {t("Cette boutique est cachée : les clients ne la verront pas.")}{" "}
                <Link href={`${DASHBOARD_ROOT[role]}/visibilite`} className="font-medium underline">
                  {t("La montrer")}
                </Link>
              </span>
            </p>
          )}
        </div>
      ))}

      <div className="rounded-xl border p-5">
        <h2 className="font-semibold">{t("Comment l'utiliser sur TikTok")}</h2>
        <ol className="text-muted-foreground mt-3 list-decimal space-y-1.5 pl-5 text-sm">
          <li>{t("Appuyez sur « Copier ».")}</li>
          <li>{t("Sur TikTok, ouvrez « Modifier le profil » et collez le lien dans « Site web » ou dans votre bio.")}</li>
          <li>{t("Pendant vos lives, dites aux clients : « Le lien est dans ma bio ».")}</li>
        </ol>
      </div>
    </div>
  );
}
