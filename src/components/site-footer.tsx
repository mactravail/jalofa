import Link from "next/link";

import { Wordmark } from "@/components/wordmark";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { FOOTER_LEGAL_LINKS, FOOTER_LINKS } from "@/lib/nav";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-neutral-950 text-neutral-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-1">
          <Link
            href="/"
            aria-label="JALOFA — accueil"
            className="flex w-full items-center sm:inline-flex sm:w-auto"
          >
            <Wordmark spread className="sm:hidden" />
            <Wordmark className="hidden sm:inline-block" />
          </Link>
          <p className="mt-4 max-w-xs text-sm text-neutral-400 sm:mt-3">
            {APP_TAGLINE}. Fabriqué en Afrique.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Explorer</h3>
          <ul className="space-y-2 text-sm text-neutral-400">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Compte</h3>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li>
              <Link href="/connexion" className="hover:text-white">
                Connexion
              </Link>
            </li>
            <li>
              <Link href="/inscription" className="hover:text-white">
                Créer un compte
              </Link>
            </li>
            <li>
              <Link href="/abonnements?metier=tailor" className="hover:text-white">
                Devenir tailleur
              </Link>
            </li>
            <li>
              <Link href="/abonnements?metier=vendor" className="hover:text-white">
                Vendre des tissus
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Paiement</h3>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li>Orange Money</li>
            <li>Wave</li>
            <li>Free Money</li>
            <li>Carte bancaire</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-xs text-neutral-400 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. Tous droits réservés.
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {FOOTER_LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
