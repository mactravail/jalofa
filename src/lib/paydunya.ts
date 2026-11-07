import "server-only";

/**
 * PayDunya — passerelle de paiement mobile money (Orange Money, Wave, Free
 * Money, carte…) utilisée pour l'abonnement Pro.
 *
 * Flux « Paiement Avec Redirection » :
 *   1. `createInvoice` → PayDunya renvoie l'URL de la page de paiement + un token ;
 *   2. le pro paie sur PayDunya, qui le renvoie sur `return_url?token=…` et
 *      prévient le serveur sur `callback_url` (IPN) ;
 *   3. `confirmInvoice(token)` interroge PayDunya : c'est CETTE réponse qui fait
 *      foi, jamais les paramètres de l'URL ni le corps de l'IPN.
 *
 * Variables d'environnement (serveur uniquement) :
 *   PAYDUNYA_MASTER_KEY, PAYDUNYA_PRIVATE_KEY, PAYDUNYA_TOKEN,
 *   PAYDUNYA_MODE = "test" (sandbox) | "live".
 */

const BASE_URL: Record<"test" | "live", string> = {
  test: "https://app.paydunya.com/sandbox-api/v1",
  live: "https://app.paydunya.com/api/v1",
};

export function isPaydunyaConfigured(): boolean {
  return Boolean(
    process.env.PAYDUNYA_MASTER_KEY &&
      process.env.PAYDUNYA_PRIVATE_KEY &&
      process.env.PAYDUNYA_TOKEN,
  );
}

function config() {
  const masterKey = process.env.PAYDUNYA_MASTER_KEY;
  const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
  const token = process.env.PAYDUNYA_TOKEN;
  if (!masterKey || !privateKey || !token) {
    throw new Error("PayDunya n'est pas configuré (clés manquantes).");
  }
  const mode = process.env.PAYDUNYA_MODE === "live" ? "live" : "test";
  return {
    baseUrl: BASE_URL[mode],
    headers: {
      "Content-Type": "application/json",
      "PAYDUNYA-MASTER-KEY": masterKey,
      "PAYDUNYA-PRIVATE-KEY": privateKey,
      "PAYDUNYA-TOKEN": token,
    },
  };
}

export type CreateInvoiceInput = {
  amount: number;
  description: string;
  customer?: { name?: string | null; email?: string | null; phone?: string | null };
  customData: Record<string, string | number>;
  returnUrl: string;
  cancelUrl: string;
  callbackUrl: string;
};

export type CreatedInvoice = { checkoutUrl: string; token: string };

export async function createInvoice(
  input: CreateInvoiceInput,
): Promise<CreatedInvoice> {
  const { baseUrl, headers } = config();
  const customer = input.customer
    ? Object.fromEntries(
        Object.entries(input.customer).filter(([, v]) => Boolean(v)),
      )
    : undefined;

  const res = await fetch(`${baseUrl}/checkout-invoice/create`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify({
      invoice: {
        total_amount: input.amount,
        description: input.description,
        ...(customer && Object.keys(customer).length ? { customer } : {}),
      },
      store: {
        name: "JALOFA",
        tagline: "La couture sur mesure au Sénégal",
        website_url: "https://jalofa.com",
      },
      custom_data: input.customData,
      actions: {
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
        callback_url: input.callbackUrl,
      },
    }),
  });

  const data = (await res.json().catch(() => null)) as {
    response_code?: string;
    response_text?: string;
    token?: string;
  } | null;

  if (!res.ok || data?.response_code !== "00" || !data.token || !data.response_text) {
    throw new Error(
      `PayDunya a refusé la facture : ${data?.response_text ?? res.statusText}`,
    );
  }
  return { checkoutUrl: data.response_text, token: data.token };
}

export type InvoiceStatus = "pending" | "completed" | "cancelled" | "failed";

export type ConfirmedInvoice = {
  status: InvoiceStatus;
  amount: number;
  customData: Record<string, unknown>;
};

/** Interroge PayDunya sur l'état réel d'une facture. */
export async function confirmInvoice(token: string): Promise<ConfirmedInvoice> {
  const { baseUrl, headers } = config();
  const res = await fetch(
    `${baseUrl}/checkout-invoice/confirm/${encodeURIComponent(token)}`,
    { headers, cache: "no-store" },
  );
  const data = (await res.json().catch(() => null)) as {
    response_code?: string;
    status?: string;
    invoice?: { total_amount?: number | string };
    custom_data?: Record<string, unknown>;
  } | null;

  if (!res.ok || !data || data.response_code !== "00") {
    return { status: "failed", amount: 0, customData: {} };
  }
  const status: InvoiceStatus =
    data.status === "completed"
      ? "completed"
      : data.status === "cancelled"
        ? "cancelled"
        : data.status === "pending"
          ? "pending"
          : "failed";
  return {
    status,
    amount: Number(data.invoice?.total_amount ?? 0),
    customData: data.custom_data ?? {},
  };
}
