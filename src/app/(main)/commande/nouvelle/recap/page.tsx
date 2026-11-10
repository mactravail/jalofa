"use client";

import Image from "next/image";
import Link from "@/components/i18n/link";

import { PasswordField } from "@/components/auth/password-field";
import { TermsCheckbox } from "@/components/auth/signup-verification";
import { useConfigurator } from "@/components/order/configurator-context";
import { StyleInspiration } from "@/components/order/style-inspiration";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MEASUREMENT_FIELDS, formatPrice } from "@/lib/constants";
import { bodyTypeLabel, heightBandLabel } from "@/lib/body-types";
import { styleDetailSummary } from "@/lib/style-options";
import { useT } from "@/components/i18n/locale-provider";

export default function ReviewStep() {
  const { data, state, update, model, fabric, tailor, price } = useConfigurator();
  const t = useT();

  const styleName = data.styles.find((s) => s.slug === state.styleSlug)?.name ?? null;
  const isFabricOnly = state.type === "fabric_only";

  const personalisation =
    isFabricOnly ? [] : styleDetailSummary(model, state.styleDetails);

  // On attend que la saisie soit commencée pour ne pas afficher l'erreur trop tôt.
  const passwordsDiffer =
    state.contactPasswordConfirm.length > 0 &&
    state.contactPassword !== state.contactPasswordConfirm;

  const measurementSummary =
    isFabricOnly
      ? null
      : state.measurementMode === "standard"
        ? t("Taille {size}", { size: state.standardSize ?? "" })
        : (() => {
            const filled = MEASUREMENT_FIELDS.filter((f) => state.manual[f.key]?.trim());
            return filled.length
              ? filled.map((f) => `${t(f.label)} ${state.manual[f.key]} cm`).join(" · ")
              : t("Mesures détaillées");
          })();

  const rows: { label: string; value: string | null; photo?: string }[] = [
    { label: t("Modèle"), value: model?.name ?? null },
    { label: t("Occasion"), value: styleName ? t(styleName) : null },
    ...personalisation.map((d) => ({
      label: t(d.group),
      value: t(d.option),
      // Un modèle de tailleur : on revoit la vraie photo de chaque choix.
      photo: model?.tailor_id ? d.photo : undefined,
    })),
    { label: t("Silhouette"), value: isFabricOnly ? null : (bodyTypeLabel(state.bodyType) && t(bodyTypeLabel(state.bodyType)!)) },
    {
      label: t("Taille estimée"),
      value: isFabricOnly ? null : (heightBandLabel(model?.category_slug, state.heightBand) && t(heightBandLabel(model?.category_slug, state.heightBand)!)),
    },
    {
      label: t("Tissu"),
      value:
        state.type === "own_fabric"
          ? t("Tissu personnel")
          : fabric
            ? `${fabric.name} · ${state.fabricMeters} m`
            : null,
    },
    { label: t("Tailleur"), value: tailor?.shop_name ?? null },
    { label: t("Mesures"), value: measurementSummary },
  ].filter((r) => r.value !== null);

  return (
    <div className="space-y-6">
      <dl className="divide-border overflow-hidden rounded-xl border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 border-b px-4 py-3 last:border-b-0">
            <dt className="text-muted-foreground text-sm">{r.label}</dt>
            <dd className="flex items-center justify-end gap-2 text-right text-sm font-medium">
              {r.value}
              {r.photo && (
                <span className="bg-muted relative size-10 shrink-0 overflow-hidden rounded-md">
                  <Image src={r.photo} alt="" fill sizes="40px" className="object-cover" />
                </span>
              )}
            </dd>
          </div>
        ))}
        <div className="bg-muted/40 flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-sm font-semibold">
            {isFabricOnly ? t("Sous-total") : t("À partir de")}
          </dt>
          <dd className="text-primary text-right text-base font-bold">
            {formatPrice(price.total)}
          </dd>
        </div>
      </dl>

      {!isFabricOnly && (
        <p className="text-muted-foreground -mt-3 text-xs">
          {t("Prix indicatif : en personnalisant, vous demandez un devis. Le tailleur vous répondra avec le prix final.")}
        </p>
      )}

      {state.type === "full" && fabric?.vendor_id && tailor && fabric.vendor_id !== tailor.id && (
        <p className="bg-muted/50 rounded-lg p-3 text-sm">
          {t("Ce tissu sera envoyé directement à l'atelier du tailleur. Vous serez prévenu quand il l'aura reçu.")}
        </p>
      )}

      {!isFabricOnly && (
        <section className="space-y-3 rounded-xl border p-4">
          <div>
            <h3 className="text-sm font-semibold">{t("Où livrer votre tenue ?")}</h3>
            <p className="text-muted-foreground text-xs">
              {t("Le tailleur voit cette adresse pour le prix de la livraison, sans votre nom.")}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="delivery-address">{t("Adresse")}</Label>
            <Input
              id="delivery-address"
              autoComplete="street-address"
              value={state.deliveryAddress}
              onChange={(e) => update({ deliveryAddress: e.target.value })}
              placeholder={t("Quartier, rue, repère")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="delivery-city">{t("Ville")}</Label>
            <Input
              id="delivery-city"
              autoComplete="address-level2"
              value={state.deliveryCity}
              onChange={(e) => update({ deliveryCity: e.target.value })}
              placeholder={t("Ex. Dakar")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="delivery-country">{t("Pays")}</Label>
            <Input
              id="delivery-country"
              autoComplete="country-name"
              value={state.deliveryCountry}
              onChange={(e) => update({ deliveryCountry: e.target.value })}
            />
          </div>
        </section>
      )}

      {/* Le devis se lit dans le compte du client : jusqu'au paiement, le tailleur
          n'a que le code et l'adresse. Sans compte, le client choisit un mot de
          passe : son compte est créé avec la demande. */}
      {!isFabricOnly && data.contactMode && (
        <section className="space-y-3 rounded-xl border p-4">
          <div>
            <h3 className="text-sm font-semibold">{t("Vos coordonnées")}</h3>
            <p className="text-muted-foreground text-xs">
              {t("Le tailleur ne reçoit votre nom, votre téléphone et votre e-mail que si vous payez, pour vous livrer.")}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-name">{t("Nom complet")}</Label>
            <Input
              id="contact-name"
              autoComplete="name"
              value={state.contactName}
              onChange={(e) => update({ contactName: e.target.value })}
              placeholder="Aminata Diop"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-phone">{t("Téléphone (WhatsApp)")}</Label>
            <Input
              id="contact-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={state.contactPhone}
              onChange={(e) => update({ contactPhone: e.target.value })}
              placeholder="77 123 45 67"
            />
          </div>
          {data.contactMode === "account" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="contact-email">{t("E-mail")}</Label>
                <Input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  value={state.contactEmail}
                  onChange={(e) => update({ contactEmail: e.target.value })}
                  placeholder={t("vous@exemple.com")}
                />
              </div>
              <PasswordField
                value={state.contactPassword}
                onChange={(v) => update({ contactPassword: v })}
                label={t("Mot de passe")}
              />
              <div className="space-y-1.5">
                <PasswordField
                  value={state.contactPasswordConfirm}
                  onChange={(v) => update({ contactPasswordConfirm: v })}
                  name="password_confirm"
                  label={t("Répétez le mot de passe")}
                  requirements={false}
                />
                {passwordsDiffer && (
                  <p className="text-destructive text-xs">
                    {t("Les deux mots de passe ne sont pas identiques.")}
                  </p>
                )}
              </div>
              <p className="bg-muted/50 rounded-lg p-3 text-sm font-medium">
                {t("Gardez bien cet e-mail et ce mot de passe : ils vous serviront à vous connecter pour voir le devis du tailleur.")}
              </p>
              <TermsCheckbox
                checked={state.contactAcceptTerms}
                onChange={(v) => update({ contactAcceptTerms: v })}
              >
                <span className="text-xs">
                  {t("J'accepte les")}{" "}
                  <Link
                    href="/conditions"
                    target="_blank"
                    className="text-foreground underline underline-offset-4"
                  >
                    {t("conditions d'utilisation")}
                  </Link>{" "}
                  {t("et la")}{" "}
                  <Link
                    href="/confidentialite"
                    target="_blank"
                    className="text-foreground underline underline-offset-4"
                  >
                    {t("politique de confidentialité")}
                  </Link>
                  .
                </span>
              </TermsCheckbox>
            </>
          )}
        </section>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">
          {isFabricOnly ? t("Note pour le vendeur (facultatif)") : t("Note pour le tailleur (facultatif)")}
        </Label>
        <Textarea
          id="notes"
          value={state.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder={
            isFabricOnly
              ? t("Précisions sur la quantité, la découpe, la date souhaitée...")
              : t("Précisions sur le style, les finitions, la date souhaitée...")
          }
        />
        <p className="text-muted-foreground text-xs">
          {t("Ne mettez pas votre numéro ni votre e-mail : ils seront masqués.")}
        </p>
      </div>

      {/* Références libres — ce que les détails illustrés ne savent pas dire. */}
      {!isFabricOnly && (
        <StyleInspiration
          refs={state.styleRefs}
          onChange={(styleRefs) => update({ styleRefs })}
        />
      )}

      <p className="text-muted-foreground text-sm">
        {isFabricOnly ? (
          <>
            {t("Ajoutez ce tissu au panier. La livraison et le paiement seront choisis à la caisse, pour l'ensemble de votre commande.")}
          </>
        ) : (
          <>
            {t("Envoyez votre demande de devis : gratuit et sans engagement. Le tailleur vous répondra avec le prix final, puis vous accepterez et paierez.")}
          </>
        )}
      </p>
    </div>
  );
}
