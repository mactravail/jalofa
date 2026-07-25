import type { Metadata } from "next";

import { AdminDenied } from "@/components/admin/admin-denied";
import { AdminShell } from "@/components/admin/admin-shell";
import { ModerationProvider } from "@/components/admin/moderation-store";
import { getAllOrders, getAllTailors, getAllVendors } from "@/lib/admin-data";
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

  // Pastilles du menu : commandes à accepter, et pros en attente de validation.
  const [orders, tailors, vendors] = await Promise.all([
    getAllOrders(),
    getAllTailors(),
    getAllVendors(),
  ]);
  const pending = orders.filter((o) => o.status === "received").length;
  // Les commandes refusées en attente : autant de clients à rappeler pour les
  // orienter vers un autre tailleur. La pastille retombe dès qu'un client relance.
  const rejected = orders.filter((o) => o.status === "rejected").length;
  const pendingPros = new Set<string>();
  for (const t of tailors) if (!t.is_activated) pendingPros.add(t.id);
  for (const v of vendors) if (!v.is_activated) pendingPros.add(v.id);

  return (
    <AdminShell
      fullName={profile?.full_name ?? null}
      badges={{
        orders: pending,
        rejections: rejected,
        subscriptions: pendingPros.size,
      }}
    >
      <ModerationProvider demo={!isSupabaseConfigured()}>
        {children}
      </ModerationProvider>
    </AdminShell>
  );
}
