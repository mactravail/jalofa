import Link from "next/link";
import { Heart, MapPin, Package, User } from "lucide-react";

const LINKS = [
  { href: "/compte", label: "Profil", icon: User },
  { href: "/compte/commandes", label: "Mes commandes", icon: Package },
  { href: "/compte/adresses", label: "Adresses", icon: MapPin },
  { href: "/compte/favoris", label: "Favoris", icon: Heart },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
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
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
