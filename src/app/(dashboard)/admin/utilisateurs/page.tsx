import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AdminPage } from "@/components/admin/admin-page";
import { ContactInfo } from "@/components/admin/contact-info";
import { RoleBadge } from "@/components/admin/status-badges";
import { getAllUsersWithContact, type ProfileWithContact } from "@/lib/admin-data";
import type { UserRole } from "@/lib/constants";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const ROLE_ORDER: UserRole[] = ["admin", "tailor", "vendor", "client"];

export default async function AdminUsersPage() {
  const users = await getAllUsersWithContact();

  // Les comptes à privilèges d'abord, puis les clients ; du plus récent ensuite.
  const sorted = [...users].sort((a, b) => {
    const byRole = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
    if (byRole !== 0) return byRole;
    return Date.parse(b.created_at) - Date.parse(a.created_at);
  });

  return (
    <AdminPage
      title="Utilisateurs"
      subtitle="Tous les comptes de la plateforme, prestataires et clients."
    >
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">Aucun utilisateur.</p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {sorted.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </div>
      )}
    </AdminPage>
  );
}

function UserRow({ user }: { user: ProfileWithContact }) {
  const initials = (user.full_name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-start gap-3 p-4">
      <Avatar className="size-9 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {user.full_name ?? "Compte sans nom"}
          {user.city && (
            <span className="text-muted-foreground font-normal">
              {" "}· {user.city}
            </span>
          )}
        </p>
        <ContactInfo
          email={user.email}
          phone={user.phone}
          className="mt-1"
        />
      </div>
      <div className="shrink-0 text-right">
        <RoleBadge role={user.role} />
        <p className="text-muted-foreground mt-1 text-xs">
          {DATE_FORMAT.format(new Date(user.created_at))}
        </p>
      </div>
    </div>
  );
}
