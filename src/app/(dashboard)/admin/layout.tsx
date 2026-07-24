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
  const configured = isSupabaseConfigured();
  const profile = await getCurrentProfile();

  // La garde de rôle : seuls les administrateurs entrent. On la place AVANT toute
  // lecture globale — l'espace lit désormais avec la clé de service, il ne faut
  // donc jamais l'atteindre sans être admin. En mode démo (pas de Supabase),
  // `profile` est null et l'espace reste ouvert pour la démonstration.
  if (configured && profile?.role !== "admin") {
    return <AdminDenied />;
  }

  // Pastille « Commandes » : celles qui attendent encore d'être acceptées.
  const orders = await getAllOrders();
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
