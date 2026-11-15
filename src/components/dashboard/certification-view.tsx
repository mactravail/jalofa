import { BadgeCheck, Clock, XCircle } from "lucide-react";

import { CertificationForm } from "@/components/dashboard/certification-form";
import { T } from "@/components/i18n/t";
import { getMyCertificationRequest } from "@/lib/certification-data";
import { getCurrentTailor, getCurrentVendor } from "@/lib/data";
import { getCurrentProfile } from "@/lib/queries";

/**
 * La page « Être certifié » : selon l'état du pro, le badge obtenu, la demande
 * en cours d'examen, ou le formulaire (avec le motif d'un éventuel refus).
 */
export async function CertificationView({ kind }: { kind: "tailor" | "vendor" }) {
  const [profile, shop, request] = await Promise.all([
    getCurrentProfile(),
    kind === "tailor" ? getCurrentTailor() : getCurrentVendor(),
    getMyCertificationRequest(kind),
  ]);

  if (shop?.is_certified) {
    return (
      <div className="max-w-xl rounded-xl border p-6 text-center">
        <BadgeCheck className="mx-auto size-12 fill-blue-600 text-white" />
        <p className="mt-3 text-lg font-semibold">
          <T>Vous êtes certifié</T>
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          <T>Le badge « Certifié » apparaît sur votre page publique. Les clients vous font plus confiance.</T>
        </p>
      </div>
    );
  }

  if (request?.status === "pending") {
    return (
      <div className="max-w-xl rounded-xl border p-6 text-center">
        <Clock className="mx-auto size-10 text-amber-500" />
        <p className="mt-3 text-lg font-semibold">
          <T>Demande en cours d&apos;examen</T>
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          <T>JALOFA vérifie vos documents. Vous recevrez une notification.</T>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      {request?.status === "rejected" && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
          <XCircle className="mt-0.5 size-5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">
              <T>Votre dernière demande a été refusée</T>
            </p>
            {request.admin_note && <p className="mt-1">{request.admin_note}</p>}
            <p className="mt-1">
              <T>Corrigez et renvoyez votre demande.</T>
            </p>
          </div>
        </div>
      )}
      <CertificationForm
        kind={kind}
        defaults={{
          legal_name: profile?.full_name ?? "",
          phone: profile?.phone ?? "",
          address: shop?.city ?? profile?.city ?? "",
          company_name: request?.company_name ?? shop?.shop_name ?? "",
        }}
      />
    </div>
  );
}
