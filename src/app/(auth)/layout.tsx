import Link from "next/link";

import { Wordmark } from "@/components/wordmark";
import { APP_TAGLINE } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <Link
        href="/"
        aria-label="JALOFA — accueil"
        className="mb-8 inline-flex items-center"
      >
        <Wordmark size="lg" />
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="text-muted-foreground mt-8 max-w-xs text-center text-xs">
        {APP_TAGLINE}
      </p>
    </div>
  );
}
