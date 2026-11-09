"use client";

import Image from "next/image";
import Link from "next/link";

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

export default function ReviewStep() {
  const { data, state, update, model, fabric, tailor, price } = useConfigurator();

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
        ? `Taille ${state.standardSize}`
        : (() => {
            const filled = MEASUREMENT_FIELDS.filter((f) => state.manual[f.key]?.trim());
            return filled.length
              ? filled.map((f) => `${f.label} ${state.manual[f.key]} cm`).join(" · ")
              : "Mesures détaillées";
          })();

  const rows: { label: string; value: string | null; photo?: string }[] = [
    { label: "Modèle", value: model?.name ?? null },
    { label: "Occasion", value: styleName },
    ...personalisation.map((d) => ({
      label: d.group,
      value: d.option,
      // Un modèle de tailleur : on revoit la vraie photo de chaque choix.
      photo: model?.tailor_id ? d.photo : undefined,
    })),
    { label: "Silhouette", value: isFabricOnly ? null : bodyTypeLabel(state.bodyType) },
    {
      label: "Taille estimée",
      value: isFabricOnly ? null : heightBandLabel(model?.category_slug, state.heightBand),
    },
    {
      label: "Tissu",
      value:
        state.type === "own_fabric"
          ? "Tissu personnel"
          : fabric
            ? `${fabric.name} · ${state.fabricMeters} m`
            : null,
    },
    { label: "Tailleur", value: tailor?.shop_name ?? null },
    { label: "Mesures", value: measurementSummary },
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
            {isFabricOnly ? "Sous-total" : "À partir de"}
          </dt>
          <dd className="text-primary text-right text-base font-bold">
            {formatPrice(price.total)}
          </dd>
        </div>
      </dl>

      {!isFabricOnly && (
        <p className="text-muted-foreground -mt-3 text-xs">
          Prix indicatif : en personnalisant, vous demandez un devis. Le tailleur
          vous répondra avec le prix final.
        </p>
      )}

      {state.type === "full" && fabric?.vendor_id && tailor && fabric.vendor_id !== tailor.id && (
        <p className="bg-muted/50 rounded-lg p-3 text-sm">
          Ce tissu sera envoyé directement à l&apos;atelier du tailleur. Vous serez
          prévenu quand il l&apos;aura reçu.
        </p>
      )}

      {!isFabricOnly && (
        <section className="space-y-3 rounded-xl border p-4">
          <div>
            <h3 className="text-sm font-semibold">Où livrer votre tenue ?</h3>
            <p className="text-muted-foreground text-xs">
              Le tailleur voit cette adresse pour le prix de la livraison, sans votre nom.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="delivery-address">Adresse</Label>
            <Input
              id="delivery-address"
              autoComplete="street-address"
              value={state.deliveryAddress}
              onChange={(e) => update({ deliveryAddress: e.target.value })}
              placeholder="Quartier, rue, repère"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="delivery-city">Ville</Label>
            <Input
              id="delivery-city"
              autoComplete="address-level2"
              value={state.deliveryCity}
              onChange={(e) => update({ deliveryCity: e.target.value })}
              placeholder="Ex. Dakar"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="delivery-country">Pays</Label>
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
            <h3 className="text-sm font-semibold">Vos coordonnées</h3>
            <p className="text-muted-foreground text-xs">
              Le tailleur ne reçoit votre nom, votre téléphone et votre e-mail que si
              vous payez, pour vous livrer.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-name">Nom complet</Label>
            <Input
              id="contact-name"
              autoComplete="name"
              value={state.contactName}
              onChange={(e) => update({ contactName: e.target.value })}
              placeholder="Aminata Diop"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-phone">Téléphone (WhatsApp)</Label>
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
                <Label htmlFor="contact-email">E-mail</Label>
                <Input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  value={state.contactEmail}
                  onChange={(e) => update({ contactEmail: e.target.value })}
                  placeholder="vous@exemple.com"
                />
              </div>
              <PasswordField
                value={state.contactPassword}
                onChange={(v) => update({ contactPassword: v })}
                label="Mot de passe"
              />
              <div className="space-y-1.5">
                <PasswordField
                  value={state.contactPasswordConfirm}
                  onChange={(v) => update({ contactPasswordConfirm: v })}
                  name="password_confirm"
                  label="Répétez le mot de passe"
                  requirements={false}
                />
                {passwordsDiffer && (
                  <p className="text-destructive text-xs">
                    Les deux mots de passe ne sont pas identiques.
                  </p>
                )}
              </div>
              <p className="bg-muted/50 rounded-lg p-3 text-sm font-medium">
                Gardez bien cet e-mail et ce mot de passe : ils vous serviront à vous
                connecter pour voir le devis du tailleur.
              </p>
              <TermsCheckbox
                checked={state.contactAcceptTerms}
                onChange={(v) => update({ contactAcceptTerms: v })}
              >
                <span className="text-xs">
                  J&apos;accepte les{" "}
                  <Link
                    href="/conditions"
                    target="_blank"
                    className="text-foreground underline underline-offset-4"
                  >
                    conditions d&apos;utilisation
                  </Link>{" "}
                  et la{" "}
                  <Link
                    href="/confidentialite"
                    target="_blank"
                    className="text-foreground underline underline-offset-4"
                  >
                    politique de confidentialité
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
          {isFabricOnly ? "Note pour le vendeur (facultatif)" : "Note pour le tailleur (facultatif)"}
        </Label>
        <Textarea
          id="notes"
          value={state.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder={
            isFabricOnly
              ? "Précisions sur la quantité, la découpe, la date souhaitée..."
              : "Précisions sur le style, les finitions, la date souhaitée..."
          }
        />
        <p className="text-muted-foreground text-xs">
          Ne mettez pas votre numéro ni votre e-mail : ils seront masqués.
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
            Ajoutez ce tissu au panier. La livraison et le paiement seront choisis
            à la caisse, pour l&apos;ensemble de votre commande.
          </>
        ) : (
          <>
            Envoyez votre demande de devis : gratuit et sans engagement. Le
            tailleur vous répondra avec le prix final, puis vous accepterez et
            paierez.
          </>
        )}
      </p>
    </div>
  );
}
