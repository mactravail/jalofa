import { PackageCheck, Scissors } from "lucide-react";

import { getT } from "@/lib/i18n/server";

/**
 * « J'envoie mon tissu » côté client : où et quand envoyer son tissu.
 * - Devis pas encore payé : l'adresse viendra après le paiement.
 * - Payé : l'adresse (privée) de l'atelier, à qui envoyer le tissu.
 * - Reçu : le tailleur l'a bien entre les mains.
 */
export async function OwnFabricPanel({
  paid,
  received,
  tailorName,
  atelier,
}: {
  paid: boolean;
  received: boolean;
  tailorName: string | null;
  atelier: { address: string; phone: string } | null;
}) {
  const t = await getT();
  const who = tailorName ?? t("votre tailleur");

  if (received) {
    return (
      <div className="rounded-xl border p-4">
        <p className="flex items-center gap-2 font-semibold">
          <PackageCheck className="text-primary size-4" /> {t("{name} a reçu votre tissu", { name: who })}
        </p>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {t("La couture peut commencer.")}
        </p>
      </div>
    );
  }

  return (
    <div className="border-primary/30 bg-primary/5 rounded-xl border p-4">
      <p className="flex items-center gap-2 font-semibold">
        <Scissors className="text-primary size-4" /> {t("Envoyez votre tissu à {name}", { name: who })}
      </p>
      {!paid ? (
        <p className="text-muted-foreground mt-0.5 text-sm">
          {t("Dès que vous acceptez le devis, l'adresse de l'atelier s'affiche ici.")}
        </p>
      ) : atelier ? (
        <>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {t("Déposez-le ou envoyez-le à cette adresse :")}
          </p>
          <div className="bg-background/60 mt-3 rounded-lg p-3 text-sm">
            <p className="break-words font-medium">{atelier.address}</p>
            <a href={`tel:${atelier.phone}`} className="mt-1 block hover:underline">
              {atelier.phone}
            </a>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground mt-0.5 text-sm">
          {t("JALOFA vous contacte sur WhatsApp pour vous donner l'adresse.")}
        </p>
      )}
    </div>
  );
}
