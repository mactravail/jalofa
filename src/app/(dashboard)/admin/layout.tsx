import type { Metadata } from "next";

import { AdminDenied } from "@/components/admin/admin-denied";
import { AdminShell } from "@/components/admin/admin-shell";
import { ModerationProvider } from "@/components/admin/moderation-store";
import {
  getPendingCertificationCount,
  getAllFeedback,
  getAllModels,
  getAllOrders,
  getAllTailors,
  getAllVendors,
  hiddenOrderedModels,
} from "@/lib/admin-data";
import { getMyUnreadNotificationCount } from "@/lib/notifications-data";
import { getCurrentProfile, isSupabaseConfigured } from "@/lib/queries";
import { canSell } from "@/lib/sales-approval";

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

  // Pastilles du menu : commandes à accepter, pros en attente de validation, et
  // retours des utilisateurs pas encore traités.
  const [orders, tailors, vendors, feedback, models, unread, certifications] = await Promise.all([
    getAllOrders(),
    getAllTailors(),
    getAllVendors(),
    getAllFeedback(),
    getAllModels(),
    getMyUnreadNotificationCount(),
    getPendingCertificationCount(),
  ]);
  // Modèles masqués par leur tailleur alors que des commandes sont en cours :
  // risque d'arnaque, à vérifier (cf. la page « Modèles »).
  const hiddenWithOngoing = hiddenOrderedModels(models, orders, tailors).filter(
    (h) => h.ongoing > 0,
  ).length;
  const newFeedback = feedback.filter((f) => f.status === "new").length;
  const pending = orders.filter((o) => o.status === "received").length;
  // Les commandes refusées en attente : autant de clients à rappeler pour les
  // orienter vers un autre tailleur. La pastille retombe dès qu'un client relance.
  const rejected = orders.filter((o) => o.status === "rejected").length;
  // Tissus reçus par le tailleur sans envoi déclaré : vendeurs à appeler.
  const shipmentChecks = orders.filter((o) => o.fabric_vendor_check === "pending").length;
  const pendingPros = new Set<string>();
  for (const t of tailors) if (!t.is_activated) pendingPros.add(t.id);
  for (const v of vendors) if (!v.is_activated) pendingPros.add(v.id);
  // Nouveaux pros dont les ventes attendent la validation (anti-arnaque).
  const salesPending = new Set<string>();
  for (const s of [...tailors, ...vendors]) if (!canSell(s)) salesPending.add(s.id);

  return (
    <AdminShell
      fullName={profile?.full_name ?? null}
      badges={{
        orders: pending,
        rejections: rejected,
        shipmentChecks,
        subscriptions: pendingPros.size,
        feedback: newFeedback,
        certifications,
        validations: salesPending.size,
        models: hiddenWithOngoing,
        notifications: unread,
      }}
    >
      <ModerationProvider demo={!isSupabaseConfigured()}>
        {children}
      </ModerationProvider>
    </AdminShell>
  );
}
