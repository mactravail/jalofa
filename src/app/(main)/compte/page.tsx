import Link from "@/components/i18n/link";
import { ChevronRight, LayoutDashboard } from "lucide-react";

import { ClientOrdersBoard, ClientOrdersEmpty } from "@/components/account/client-orders-board";
import { NotificationsBell } from "@/components/account/notifications-bell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DASHBOARD_ROOT, DASHBOARD_TITLE, type ProRole } from "@/lib/dashboard-nav";
import { getMyUnreadNotificationCount } from "@/lib/notifications-data";
import { getMyOrders } from "@/lib/orders-data";
import { getCurrentProfile, isSupabaseConfigured } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

const isPro = (role: string): role is ProRole =>
  role === "tailor" || role === "vendor";

/**
 * L'accueil de l'espace client = ses commandes. C'est là qu'on atterrit après
 * la connexion : on voit d'abord ce qu'il faut faire et où en sont les tenues.
 * Le profil se réduit à un lien « Mon compte » (nom, téléphone, mot de passe).
 */
export default async function AccountPage() {
  const [profile, orders, unread] = await Promise.all([
    getCurrentProfile(),
    getMyOrders(),
    getMyUnreadNotificationCount(),
  ]);
  const t = await getT();

  if (!profile && isSupabaseConfigured()) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            {t("Connectez-vous pour voir vos commandes.")}
          </p>
          <Link href="/connexion" className={cn(buttonVariants(), "mt-4")}>
            {t("Se connecter")}
          </Link>
        </CardContent>
      </Card>
    );
  }

  const pro = profile && isPro(profile.role) ? profile.role : null;
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? null;

  return (
    <div className="space-y-8">
      {/* Pour un pro, c'est LE bouton de la page : gros, en tête, impossible à rater. */}
      {pro && (
        <Link
          href={DASHBOARD_ROOT[pro]}
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-16 w-full justify-between gap-3 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 px-5 text-lg font-semibold text-white hover:opacity-90",
          )}
        >
          <span className="flex items-center gap-3">
            <LayoutDashboard className="size-6" /> {t(DASHBOARD_TITLE[pro])}
          </span>
          <ChevronRight className="size-6" />
        </Link>
      )}

      {/* Du nouveau sur une commande : c'est la première chose qu'on voit. */}
      <NotificationsBell unread={unread} />

      {orders.length === 0 ? (
        <ClientOrdersEmpty
          firstName={firstName}
          message={
            isSupabaseConfigured()
              ? t("Vous n'avez pas encore de commande.")
              : t("Vos commandes s'afficheront ici une fois la base de données connectée.")
          }
        />
      ) : (
        <ClientOrdersBoard orders={orders} firstName={firstName} />
      )}
    </div>
  );
}
