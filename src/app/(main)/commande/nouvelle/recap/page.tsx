"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import Link from "@/components/i18n/link";
import { useRouter } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { signInInline } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

import { PasswordField } from "@/components/auth/password-field";
import { TermsCheckbox } from "@/components/auth/signup-verification";
import { fabricPairing, useConfigurator } from "@/components/order/configurator-context";
import { StyleInspiration } from "@/components/order/style-inspiration";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MEASUREMENT_FIELDS, formatPrice } from "@/lib/constants";
import { bodyTypeLabel, heightBandLabel } from "@/lib/body-types";
import { styleDetailSummary, wantsCustomEmbroidery } from "@/lib/style-options";
import { EmbroideryRequest } from "@/components/order/embroidery-request";
import { useT } from "@/components/i18n/locale-provider";
import { SavedInfoPrompt } from "@/components/account/saved-info-prompt";
import { refreshSavedProfile, useSavedProfile } from "@/components/account/use-saved-profile";
import { saveMyContact } from "@/lib/actions/saved-profile";
import { hasSavedContact } from "@/lib/saved-profile";
import { BookmarkPlus, Loader2 } from "lucide-react";

export default function ReviewStep() {
  const { data, state, update, model, fabric, tailor, price } = useConfigurator();
  const t = useT();
  const router = useRouter();

  // Client connecté : son adresse et son téléphone enregistrés, proposés ici.
  // Il peut les refuser (déménagement, autre numéro, tenue pour quelqu'un
  // d'autre) : on lui demande alors le nom et le téléphone de la personne.
  const profile = useSavedProfile();
  const offerSaved = hasSavedContact(profile ?? null);
  const contactMode =
    data.contactMode ?? (state.savedAddressChoice === "other" ? "contact" : null);
  const chooseSaved = (choice: "saved" | "other") => {
    if (choice === "saved" && profile) {
      update({
        savedAddressChoice: "saved",
        deliveryAddress: profile.address?.address_line ?? state.deliveryAddress,
        deliveryCity: profile.address?.city ?? state.deliveryCity,
        deliveryCountry: profile.address?.country ?? state.deliveryCountry,
        contactName: profile.full_name ?? "",
        contactPhone: profile.phone ?? "",
      });
    } else {
      update({
        savedAddressChoice: "other",
        deliveryAddress: "",
        deliveryCity: "",
        deliveryCountry: "Sénégal",
        contactName: "",
        contactPhone: "",
      });
    }
  };
  const [savingContact, startSavingContact] = useTransition();
  const saveContact = () =>
    startSavingContact(async () => {
      const res = await saveMyContact({
        // Le nom du compte ne change pas (la tenue peut être pour un proche) ;
        // il n'est rempli que s'il manquait.
        full_name: profile?.full_name ? null : state.contactName || null,
        phone: state.contactPhone || profile?.phone || "",
        address: {
          address_line: state.deliveryAddress,
          city: state.deliveryCity,
          region: null,
          country: state.deliveryCountry,
        },
      });
      if (!res.ok) {
        toast.error(t(res.error));
        return;
      }
      refreshSavedProfile();
      update({ savedAddressChoice: "saved" });
      toast.success(t("Coordonnées enregistrées dans votre compte"));
    });

  // « J'ai déjà un compte » : connexion sur place, sans quitter le récap. Après
  // le rafraîchissement, le layout ne demande plus de compte (brouillon gardé).
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signingIn, startSignIn] = useTransition();
  const login = () => {
    setLoginError(null);
    startSignIn(async () => {
      const res = await signInInline(state.contactEmail, loginPassword);
      if (!res.ok) {
        setLoginError(res.error);
        return;
      }
      setLoginPassword("");
      update({ contactHasAccount: false });
      toast.success(t("Vous êtes connecté"));
      router.refresh();
    });
  };

  const styleName = data.styles.find((s) => s.slug === state.styleSlug)?.name ?? null;
  const isFabricOnly = state.type === "fabric_only";

  const personalisation = isFabricOnly
    ? []
    : [
        ...styleDetailSummary(model, state.styleDetails),
        ...fabricPairing(state.styleDetails, data.fabrics, fabric, model),
      ];

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
    // « Votre corps », pas « Silhouette » : une robe a déjà un choix de style
    // « Silhouette » (Trapèze, Sirène…), deux lignes du même nom prêtaient à confusion.
    { label: t("Votre corps"), value: isFabricOnly ? null : (bodyTypeLabel(state.bodyType) && t(bodyTypeLabel(state.bodyType)!)) },
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
        {rows.map((r, i) => (
          <div key={`${i}-${r.label}`} className="flex items-start justify-between gap-4 border-b px-4 py-3 last:border-b-0">
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

      {state.type === "own_fabric" && (
        <p className="bg-muted/50 rounded-lg p-3 text-sm">
          {t("Vous envoyez votre tissu : vous ne payez que la couture. Le tailleur vous dit combien de mètres il faut ; dès que vous acceptez son devis, l'adresse de son atelier s'affiche dans votre commande.")}
        </p>
      )}

      {/* Broderie « Je choisis » : photo, description et couleur. */}
      {!isFabricOnly && wantsCustomEmbroidery(model, state.styleDetails) && (
        <EmbroideryRequest
          photo={state.embroideryPhoto}
          note={state.embroideryNote}
          color={state.embroideryColor}
          onChange={update}
        />
      )}

      {state.type === "full" && fabric?.vendor_id && tailor && fabric.vendor_id !== tailor.id && (
        <p className="bg-muted/50 rounded-lg p-3 text-sm">
          {t("Ce tissu sera envoyé directement à l'atelier du tailleur. Vous serez prévenu quand il l'aura reçu.")}
        </p>
      )}

      {!isFabricOnly && profile && offerSaved && (
        <SavedInfoPrompt
          title="Utiliser vos informations enregistrées ?"
          summary={[
            [profile.full_name, profile.phone].filter(Boolean).join(" · "),
            profile.address
              ? [profile.address.address_line, profile.address.city, profile.address.country]
                  .filter(Boolean)
                  .join(", ")
              : "",
          ].filter(Boolean)}
          choice={state.savedAddressChoice}
          onChoose={chooseSaved}
          otherLabel="Autre adresse / personne"
        />
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
          {/* Client connecté : garder cette adresse pour les prochaines fois. */}
          {profile &&
            state.savedAddressChoice !== "saved" &&
            state.deliveryAddress.trim() &&
            state.deliveryCity.trim() &&
            (state.contactPhone.trim() || profile.phone) && (
              <button
                type="button"
                onClick={saveContact}
                disabled={savingContact}
                className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm underline underline-offset-4"
              >
                {savingContact ? <Loader2 className="size-4 animate-spin" /> : <BookmarkPlus className="size-4" />}
                {t("Enregistrer ces coordonnées dans mon compte")}
              </button>
            )}
        </section>
      )}

      {/* Le devis se lit dans le compte du client : jusqu'au paiement, le tailleur
          n'a que le code et l'adresse. Sans compte, le client choisit un mot de
          passe : son compte est créé avec la demande. */}
      {!isFabricOnly && contactMode && (
        <section className="space-y-3 rounded-xl border p-4">
          <div>
            <h3 className="text-sm font-semibold">{t("Vos coordonnées")}</h3>
            <p className="text-muted-foreground text-xs">
              {t("Le tailleur ne reçoit votre nom, votre téléphone et votre e-mail que si vous acceptez son devis, pour vous envoyer son moyen de paiement et vous livrer.")}
            </p>
          </div>
          {contactMode === "account" && (
            <div className="grid grid-cols-2 gap-2" role="radiogroup">
              {[
                { value: true, label: t("J'ai déjà un compte") },
                { value: false, label: t("Créer un compte") },
              ].map((o) => {
                const active = state.contactHasAccount === o.value;
                return (
                  <button
                    key={o.label}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setLoginError(null);
                      update({ contactHasAccount: o.value });
                    }}
                    className={cn(
                      "h-11 rounded-lg border px-2 text-sm font-semibold transition-colors",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          )}
          {contactMode === "account" && state.contactHasAccount ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">{t("E-mail")}</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={state.contactEmail}
                  onChange={(e) => update({ contactEmail: e.target.value })}
                  placeholder={t("vous@exemple.com")}
                />
              </div>
              <PasswordField
                value={loginPassword}
                onChange={setLoginPassword}
                name="current-password"
                autoComplete="current-password"
                label={t("Mot de passe")}
                requirements={false}
              />
              {loginError && <p className="text-destructive text-xs">{t(loginError)}</p>}
              <Button
                type="button"
                className="h-11 w-full"
                disabled={signingIn}
                onClick={login}
              >
                {signingIn ? t("Connexion…") : t("Se connecter")}
              </Button>
              <Link
                href="/mot-de-passe-oublie"
                target="_blank"
                className="text-muted-foreground block text-center text-xs underline underline-offset-4"
              >
                {t("Mot de passe oublié ?")}
              </Link>
            </div>
          ) : (
          <>
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
          {contactMode === "account" && (
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
          </>
          )}
        </section>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">
          {isFabricOnly ? t("Note pour JALOFA (facultatif)") : t("Note pour le tailleur (facultatif)")}
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
