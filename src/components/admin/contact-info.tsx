import { Mail, Phone } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Coordonnées d'un compte pour l'administration : e-mail et téléphone, rendus
 * cliquables (mailto / tel) pour savoir exactement qui contacter. Rien ne
 * s'affiche si aucune coordonnée n'est connue.
 */
export function ContactInfo({
  email,
  phone,
  className,
}: {
  email?: string | null;
  phone?: string | null;
  className?: string;
}) {
  if (!email && !phone) return null;

  return (
    <div
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs",
        className,
      )}
    >
      {email && (
        <a
          href={`mailto:${email}`}
          className="hover:text-foreground inline-flex min-w-0 items-center gap-1"
        >
          <Mail className="size-3.5 shrink-0" />
          <span className="truncate">{email}</span>
        </a>
      )}
      {phone && (
        <a
          href={`tel:${phone.replace(/\s+/g, "")}`}
          className="hover:text-foreground inline-flex items-center gap-1"
        >
          <Phone className="size-3.5 shrink-0" />
          <span>{phone}</span>
        </a>
      )}
    </div>
  );
}
