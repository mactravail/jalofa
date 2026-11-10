import Link from "@/components/i18n/link";

import { Wordmark } from "@/components/wordmark";
import { APP_TAGLINE } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getT();
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <Link
        href="/"
        aria-label={t("JALOFA — accueil")}
        className="mb-8 inline-flex items-center"
      >
        <Wordmark size="lg" />
      </Link>
      <div className="w-full max-w-md has-[[data-wide]]:max-w-3xl">
        {children}
      </div>
      <p className="text-muted-foreground mt-8 max-w-xs text-center text-xs">
        {t(APP_TAGLINE)}
      </p>
      <LanguageSwitcher className="text-muted-foreground mt-4" />
    </div>
  );
}
