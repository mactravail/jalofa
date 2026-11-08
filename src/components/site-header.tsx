import { HeaderForRoute } from "@/components/home-header";
import { UserMenu } from "@/components/user-menu";
import { type UserRole } from "@/lib/constants";
import { getCurrentProfile } from "@/lib/queries";

export async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <HeaderForRoute
      isAuthenticated={Boolean(profile)}
      userMenu={
        profile ? (
          <UserMenu fullName={profile.full_name} role={profile.role as UserRole} />
        ) : null
      }
    />
  );
}
