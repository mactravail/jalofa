import Link from "next/link";
import { Heart, MapPin, Package, Sparkles, User, UserCog } from "lucide-react";

import { FeedbackButton } from "@/components/feedback/feedback-button";

const LINKS = [
  { href: "/compte", label: "Profil", icon: User },
  { href: "/compte/commandes", label: "Mes commandes", icon: Package },
  { href: "/compte/inspiration", label: "Inspiration", icon: Sparkles },
  { href: "/compte/adresses", label: "Adresses", icon: MapPin },
  { href: "/compte/favoris", label: "Favoris", icon: Heart },
  // Nom, téléphone et mot de passe — la même page que dans les espaces pros.
  { href: "/compte/parametres", label: "Mon compte", icon: UserCog },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* `grid-cols-1` explicite : sinon la colonne implicite (`auto`) se cale
          sur le menu défilant ci-dessous, dont les libellés sont en
          `whitespace-nowrap` — et la page entière déborde sur mobile. */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
        <aside className="min-w-0">
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="hover:bg-muted flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap"
              >
                <l.icon className="text-muted-foreground size-4" /> {l.label}
              </Link>
            ))}
          </nav>
          {/* Un retour à tout moment, bien visible sous le menu du compte. */}
          <div className="mt-4 border-t pt-4">
            <FeedbackButton space="client" />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
