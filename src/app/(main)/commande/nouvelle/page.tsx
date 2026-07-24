"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import {
  STEPS_BY_TYPE,
  stepUrl,
  typeNeedsFabric,
  typeNeedsModel,
  useConfigurator,
} from "@/components/order/configurator-context";
import type { OrderType } from "@/lib/constants";

const VALID_TYPES: OrderType[] = ["full", "fabric_only", "own_fabric"];

/**
 * Entry point: seed the draft from the incoming query string
 * (?type=&model=&fabric=&tailor=), then redirect to the first step route.
 *
 * The garment is not negotiable inside the configurator — it must arrive as
 * `?model=`. Arriving without one (a generic "Créer une tenue" link, a stale
 * bookmark) sends you to the catalogue to pick a garment first; the type /
 * fabric / tailor already chosen ride along in the query string so /modeles can
 * hand them back.
 */
export default function ConfiguratorEntry() {
  const router = useRouter();
  const { seed } = useConfigurator();

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const rawType = sp.get("type");
    const type: OrderType = VALID_TYPES.includes(rawType as OrderType)
      ? (rawType as OrderType)
      : "full";
    const modelId = sp.get("model");
    const fabricId = sp.get("fabric");
    const tailorId = sp.get("tailor");

    if (typeNeedsModel(type) && !modelId) {
      const q = new URLSearchParams();
      if (type !== "full") q.set("type", type);
      if (fabricId) q.set("fabric", fabricId);
      if (tailorId) q.set("tailor", tailorId);
      const qs = q.toString();
      router.replace(qs ? `/modeles?${qs}` : "/modeles");
      return;
    }

    // Le tissu se choisit toujours AVANT le configurateur (c'est une page
    // d'achat). Sans lui, on renvoie là où il se choisit : le catalogue de tissus
    // pour un tissu seul, la fiche du modèle (« Le personnaliser ») pour un
    // vêtement — en conservant le type / le tailleur déjà retenus.
    if (typeNeedsFabric(type) && !fabricId) {
      if (type === "fabric_only") {
        router.replace("/tissus");
      } else {
        const q = new URLSearchParams();
        if (type !== "full") q.set("type", type);
        if (tailorId) q.set("tailor", tailorId);
        const qs = q.toString();
        router.replace(modelId ? `/modeles/${modelId}${qs ? `?${qs}` : ""}` : "/modeles");
      }
      return;
    }

    seed({ type, modelId, fabricId, tailorId });
    router.replace(stepUrl(STEPS_BY_TYPE[type][0]));
  }, [router, seed]);

  return (
    <div className="text-muted-foreground flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <Loader2 className="size-6 animate-spin" />
      <p className="text-sm">Préparation de votre configurateur…</p>
    </div>
  );
}
