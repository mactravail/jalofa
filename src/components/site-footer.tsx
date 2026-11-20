import Link from "@/components/i18n/link";

import { PaymentLogos } from "@/components/payment-logos";
import { SupportContact } from "@/components/support-contact";
import { Wordmark } from "@/components/wordmark";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { FOOTER_LEGAL_LINKS, FOOTER_LINKS } from "@/lib/nav";
import { getT } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

const TIKTOK_URL = "https://www.tiktok.com/@jalofa_afrique";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
    </svg>
  );
}

export async function SiteFooter() {
  const t = await getT();
  return (
    <footer className="mt-auto border-t border-white/10 bg-neutral-950 text-neutral-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <div className="sm:col-span-2 md:col-span-3 lg:col-span-1">
          <Link
            href="/"
            aria-label={t("JALOFA — accueil")}
            className="flex w-full items-center sm:inline-flex sm:w-auto"
          >
            <Wordmark spread className="sm:hidden" />
            <Wordmark className="hidden sm:inline-block" />
          </Link>
          <p className="mt-4 max-w-xs text-sm text-neutral-400 sm:mt-3">
            {t(APP_TAGLINE)}. {t("Fabriqué en Afrique.")}
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">{t("Explorer")}</h3>
          <ul className="space-y-2 text-sm text-neutral-400">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {t(link.label)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">{t("Compte")}</h3>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li>
              <Link href="/connexion" className="hover:text-white">
                {t("Connexion")}
              </Link>
            </li>
            <li>
              <Link href="/inscription" className="hover:text-white">
                {t("Créer un compte")}
              </Link>
            </li>
            <li>
              <Link href="/inscription?role=pro" className="hover:text-white">
                {t("Devenir tailleur")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">{t("Paiement direct au pro")}</h3>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li>Orange Money</li>
            <li>Wave</li>
            <li>Free Money</li>
            <li>{t("Aucun frais JALOFA")}</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">{t("Contact")}</h3>
          <SupportContact className="gap-2 text-sm text-neutral-400 [&_a]:no-underline [&_a:hover]:text-white" />
          <a
            href={TIKTOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-sm text-neutral-100 hover:border-white/40 hover:text-white"
          >
            <TikTokIcon className="size-4" />
            {t("Suivez-nous sur TikTok")}
          </a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-xs text-neutral-400 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. {t("Tous droits réservés.")}
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {FOOTER_LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white">
                {t(link.label)}
              </Link>
            ))}
            <LanguageSwitcher />
          </nav>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-6">
          <PaymentLogos />
        </div>
      </div>
    </footer>
  );
}
