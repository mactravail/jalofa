import type { Metadata } from "next";

import { ConfiguratorProvider } from "@/components/order/configurator-context";
import { ConfiguratorShell } from "@/components/order/configurator-shell";
import { getFabrics, getModels, getStyles, getTailors } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient, getAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Créer une tenue" };

/**
 * Personnaliser ne demande pas de s'inscrire avant. Au récap :
 * - pas de compte → nom, téléphone, e-mail, mot de passe : le compte client est
 *   créé avec la demande de devis, pour la suivre ensuite ;
 * - compte sans nom ni téléphone → ces deux champs (JALOFA doit pouvoir joindre
 *   le client ; le tailleur ne les voit pas pendant le devis).
 */
async function contactMode(): Promise<"account" | "contact" | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user || user.is_anonymous) return "account";
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();
  const p = profile as { full_name: string | null; phone: string | null } | null;
  return p?.full_name?.trim() && p?.phone?.trim() ? null : "contact";
}

export default async function ConfiguratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [models, fabrics, tailors, styles, contact] = await Promise.all([
    getModels(),
    getFabrics(),
    getTailors(),
    getStyles(),
    contactMode(),
  ]);

  // Immersive, full-viewport surface — a fixed overlay that always covers the
  // shared site header/footer (MainChrome also strips them after hydration), so
  // there is no page title and the worn preview stays the sole focus.
  return (
    <ConfiguratorProvider
      data={{ models, fabrics, tailors, styles, contactMode: contact }}
    >
      <div className="bg-background fixed inset-0 z-50 overflow-hidden">
        <ConfiguratorShell>{children}</ConfiguratorShell>
      </div>
    </ConfiguratorProvider>
  );
}
