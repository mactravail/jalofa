import { SUPPORT_CONTACT } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Le contact client de JALOFA : seulement WhatsApp ou e-mail. Deux liens
 * cliquables, réutilisés partout où l'on dit « écrivez-nous ».
 */
export function SupportContact({ className }: { className?: string }) {
  return (
    <span className={cn("flex flex-col gap-1", className)}>
      <a
        href={SUPPORT_CONTACT.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4 hover:no-underline"
      >
        WhatsApp : {SUPPORT_CONTACT.whatsapp}
      </a>
      <a
        href={`mailto:${SUPPORT_CONTACT.email}`}
        className="break-all underline underline-offset-4 hover:no-underline"
      >
        {SUPPORT_CONTACT.email}
      </a>
    </span>
  );
}
