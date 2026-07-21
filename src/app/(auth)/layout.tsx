import Image from "next/image";
import Link from "next/link";

import logo from "@/app/logo.png";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-8 inline-flex items-center">
        <Image
          src={logo}
          alt={APP_NAME}
          priority
          className="h-8 w-auto dark:invert"
        />
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="text-muted-foreground mt-8 max-w-xs text-center text-xs">
        {APP_TAGLINE}
      </p>
    </div>
  );
}
