import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";

import Link from "@/components/i18n/link";
import { RememberFabric } from "@/components/order/pending-outfit-reminder";
import { Wordmark } from "@/components/wordmark";
import { formatPrice } from "@/lib/constants";
import { getFabricById, getModels } from "@/lib/data";
import { fabricUnit, fabricUnitPrice } from "@/lib/fabric-specs";
import { AUDIENCE_LABELS, audiencesOf, fabricProfile } from "@/lib/fabric-usage";
import { getT } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = await getT();
  const fabric = await getFabricById(id);
  return {
    title: fabric ? t("Que coudre avec {name} ?", { name: fabric.name }) : t("Tissu introuvable"),
    robots: { index: false },
  };
}

/**
 * Le tissu est déjà choisi : il ne reste qu'à choisir la tenue, puis le
 * tailleur (dans le configurateur). Page plein écran, sans menu ni pied de page
 * du site, pour ne pas se disperser — et le tissu reste affiché en haut, comme
 * un panier, pour qu'on n'oublie jamais lequel on a pris.
 */
export default async function FabricOutfitPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pour?: string }>;
}) {
  const { id } = await params;
  const { pour } = await searchParams;
  const fabric = await getFabricById(id);
  if (!fabric || fabric.is_active === false) notFound();
  const t = await getT();

  const profile = fabricProfile(fabric);
  const audiences = audiencesOf(profile).filter((a) => a === "homme" || a === "femme");
  const tabs = audiences.length ? audiences : (["homme", "femme"] as const);
  const audience = tabs.find((a) => a === pour) ?? tabs[0];
  // Les tenues que les ateliers taillent d'habitude dans ce tissu passent devant.
  const advised = new Set(profile.uses.map((u) => u.slug));

  const models = (await getModels())
    .filter(
      (m) =>
        m.category_slug === audience &&
        // Seulement ce qui se coud sur mesure : le prêt-à-porter a déjà son tissu.
        m.making_type !== "pret_a_porter" &&
        !m.origin?.europe,
    )
    .sort((a, b) => Number(advised.has(b.slug ?? "")) - Number(advised.has(a.slug ?? "")));

  const unit = fabricUnit(fabric);

  return (
    <div className="bg-background fixed inset-0 z-50 overflow-y-auto">
      <RememberFabric fabricId={fabric.id} fabricName={fabric.name} fabricImage={fabric.image_url} />
      {/* Barre du haut : retour au tissu + logo. Rien d'autre pour se disperser. */}
      <header className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link
            href={`/tissus/${fabric.id}`}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="size-4" /> {t("Retour")}
          </Link>
          <Wordmark size="sm" />
          <span className="w-14" aria-hidden />
        </div>

        {/* Le panier : le tissu choisi, toujours sous les yeux */}
        <div className="mx-auto max-w-5xl px-4 pb-3">
          <div className="bg-muted/60 flex items-center gap-3 rounded-xl p-2.5">
            <div className="bg-background relative size-12 shrink-0 overflow-hidden rounded-lg">
              {fabric.image_url && (
                <Image src={fabric.image_url} alt="" fill sizes="48px" className="object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide">
                <Check className="size-3 text-emerald-500" strokeWidth={3} /> {t("Votre tissu")}
              </p>
              <p className="truncate text-sm font-semibold">{fabric.name}</p>
              <p className="text-muted-foreground text-xs whitespace-nowrap">
                {formatPrice(fabricUnitPrice(fabric))} / {t(unit.per)}
              </p>
            </div>
            <Link
              href="/tissus"
              className="text-muted-foreground hover:text-foreground shrink-0 text-xs underline-offset-2 hover:underline"
            >
              {t("Changer")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6 pb-16">
        {/* Les 3 étapes : on sait où on en est */}
        <ol className="flex items-center gap-2 text-xs font-medium">
          {[
            { label: t("Tissu"), state: "done" },
            { label: t("Tenue"), state: "current" },
            { label: t("Tailleur"), state: "next" },
          ].map((s, i) => (
            <li key={s.label} className="flex items-center gap-2">
              {i > 0 && <span className="bg-border h-px w-6" />}
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border text-[11px]",
                  s.state === "done" && "border-emerald-500 bg-emerald-500 text-white",
                  s.state === "current" && "border-foreground bg-foreground text-background",
                  s.state === "next" && "text-muted-foreground",
                )}
              >
                {s.state === "done" ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn(s.state === "next" && "text-muted-foreground")}>{s.label}</span>
            </li>
          ))}
        </ol>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          {t("Quelle tenue voulez-vous coudre ?")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("Touchez une tenue : vous choisirez ensuite votre tailleur.")}
        </p>

        {tabs.length > 1 && (
          <div className="mt-5 flex gap-2">
            {tabs.map((a) => (
              <Link
                key={a}
                href={`/tissus/${fabric.id}/tenue?pour=${a}`}
                replace
                scroll={false}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  a === audience
                    ? "border-foreground bg-foreground text-background"
                    : "hover:bg-muted",
                )}
              >
                {t(AUDIENCE_LABELS[a])}
              </Link>
            ))}
          </div>
        )}

        {models.length === 0 ? (
          <p className="text-muted-foreground mt-10 text-center text-sm">
            {t("Aucune tenue pour le moment.")}
          </p>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {models.map((m) => {
              const photo = m.photos[0] ?? m.image_url;
              return (
                <li key={m.id}>
                  <Link
                    href={`/commande/nouvelle?model=${m.id}&fabric=${fabric.id}`}
                    className="group block overflow-hidden rounded-xl border transition-colors hover:border-foreground"
                  >
                    <div className="bg-muted relative aspect-[3/4]">
                      {photo && (
                        <Image
                          src={photo}
                          alt={m.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      )}
                      {advised.has(m.slug ?? "") && (
                        <span className="absolute top-2 left-2 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                          {t("Conseillé")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 p-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{m.name}</p>
                        {m.price != null && m.price > 0 && (
                          <p className="text-muted-foreground text-xs whitespace-nowrap">
                            {t("Couture dès {price}", { price: formatPrice(m.price) })}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
