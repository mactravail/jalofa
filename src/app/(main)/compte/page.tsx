import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

import { NotificationsCard } from "@/components/account/notifications-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROLE_LABELS, type UserRole } from "@/lib/constants";
import { DASHBOARD_ROOT, DASHBOARD_TITLE, type ProRole } from "@/lib/dashboard-nav";
import { getMyNotifications } from "@/lib/notifications-data";
import { getCurrentProfile } from "@/lib/queries";
import { cn } from "@/lib/utils";

const isPro = (role: string): role is ProRole =>
  role === "tailor" || role === "vendor";

export default async function AccountPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Connectez-vous pour accéder à votre profil.
          </p>
          <Link href="/connexion" className={cn(buttonVariants(), "mt-4")}>
            Se connecter
          </Link>
        </CardContent>
      </Card>
    );
  }

  const initials = (profile.full_name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const pro = isPro(profile.role) ? profile.role : null;
  const notifications = await getMyNotifications();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mon profil</h1>

      <NotificationsCard notifications={notifications} />

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <span className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-full text-xl font-semibold">
            {initials}
          </span>
          <div>
            <p className="text-lg font-semibold">{profile.full_name ?? "—"}</p>
            <p className="text-muted-foreground text-sm">{ROLE_LABELS[profile.role as UserRole]}</p>
            {profile.phone && (
              <p className="text-muted-foreground text-sm">{profile.phone}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {pro && (
        <Link
          href={DASHBOARD_ROOT[pro]}
          className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
        >
          <LayoutDashboard className="size-4" /> {DASHBOARD_TITLE[pro]}
        </Link>
      )}
    </div>
  );
}
