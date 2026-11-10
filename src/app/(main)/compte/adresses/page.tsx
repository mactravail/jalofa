import { MapPin } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/queries";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import type { Address } from "@/lib/types";
import { getT } from "@/lib/i18n/server";

async function getMyAddresses(): Promise<Address[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return [];
  const { data } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return (data as Address[]) ?? [];
}

export default async function AddressesPage() {
  const addresses = await getMyAddresses();
  const t = await getT();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("Mes adresses")}</h1>

      {addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <MapPin className="text-muted-foreground mx-auto size-8" />
          <p className="text-muted-foreground mt-3">
            {t("Aucune adresse enregistrée. Vous pourrez en ajouter une lors d'une commande avec livraison à domicile.")}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <p className="font-medium">{a.recipient_name ?? a.label ?? t("Adresse")}</p>
                <p className="text-muted-foreground text-sm">{a.address_line}</p>
                <p className="text-muted-foreground text-sm">
                  {a.city}
                  {a.region ? `, ${a.region}` : ""}
                </p>
                {a.phone && <p className="text-muted-foreground text-sm">{a.phone}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
