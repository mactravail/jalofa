import Image from "next/image";
import Link from "next/link";

import logo from "@/app/logo.png";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { FOOTER_LEGAL_LINKS, FOOTER_LINKS } from "@/lib/nav";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-1">
          <Link href="/" className="inline-flex items-center">
            <Image
              src={logo}
              alt={APP_NAME}
              className="h-6 w-auto dark:invert"
            />
          </Link>
          <p className="text-muted-foreground mt-3 max-w-xs text-sm">
            {APP_TAGLINE}. Fabriqué en Afrique.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Explorer</h3>
          <ul className="text-muted-foreground space-y-2 text-sm">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Compte</h3>
          <ul className="text-muted-foreground space-y-2 text-sm">
            <li>
              <Link href="/connexion" className="hover:text-foreground">
                Connexion
              </Link>
            </li>
            <li>
              <Link href="/abonnements" className="hover:text-foreground">
                Créer un compte
              </Link>
            </li>
            <li>
              <Link href="/abonnements" className="hover:text-foreground">
                Devenir tailleur
              </Link>
            </li>
            <li>
              <Link href="/abonnements" className="hover:text-foreground">
                Vendre des tissus
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Paiement</h3>
          <ul className="text-muted-foreground space-y-2 text-sm">
            <li>Orange Money</li>
            <li>Wave</li>
            <li>Free Money</li>
            <li>Carte bancaire</li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-xs sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. Tous droits réservés.
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {FOOTER_LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
