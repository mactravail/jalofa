import { AccountNavDesktop, AccountNavMobile } from "@/components/account/account-nav";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { getMyUnreadNotificationCount } from "@/lib/notifications-data";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const unread = await getMyUnreadNotificationCount();

  return (
    // Pas de padding haut sur mobile : la barre du compte colle au header.
    <div className="mx-auto max-w-6xl px-4 pb-8 md:py-8">
      {/* Mobile : barre fixe en haut. Placée ici (et non dans la colonne) pour
          rester collée pendant tout le défilement de la page. */}
      <AccountNavMobile unread={unread} />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
        <aside className="hidden min-w-0 md:block">
          <AccountNavDesktop unread={unread} />
          {/* Un retour à tout moment, bien visible sous le menu du compte. */}
          <div className="mt-4 border-t pt-4">
            <FeedbackButton space="client" />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>

      {/* Mobile : le retour reste accessible, en bas de page. */}
      <div className="mt-10 border-t pt-4 md:hidden">
        <FeedbackButton space="client" />
      </div>
    </div>
  );
}
