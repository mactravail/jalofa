import type { Metadata } from "next";

import { AdminDenied } from "@/components/admin/admin-denied";
import { AdminShell } from "@/components/admin/admin-shell";
import { ModerationProvider } from "@/components/admin/moderation-store";
import { getAllOrders } from "@/lib/admin-data";
import { getCurrentProfile, isSupabaseConfigured } from "@/lib/queries";

export const metadata: Metadata = { title: "Administration" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, orders] = await Promise.all([
    getCurrentProfile(),
    getAllOrders(),
  ]);

  // La garde de rôle : seuls les administrateurs entrent. En mode démo (pas de
  // Supabase), `profile` est null et l'espace reste ouvert pour la démonstration.
  if (isSupabaseConfigured() && profile && profile.role !== "admin") {
    return <AdminDenied />;
  }

  // Pastille « Commandes » : celles qui attendent encore d'être acceptées.
  const pending = orders.filter((o) => o.status === "received").length;

  return (
    <AdminShell
      fullName={profile?.full_name ?? null}
      badges={{ orders: pending }}
    >
      <ModerationProvider demo={!isSupabaseConfigured()}>
        {children}
      </ModerationProvider>
    </AdminShell>
  );
}
