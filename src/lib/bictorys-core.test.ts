// Tests de l'intégration Bictorys (cahier des charges §12, §14). Lancer : npm test
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";

import { amountMatches, bictorysPhone, readTransaction, verifyWebhookWith } from "./bictorys-core.ts";

const SECRET = "whsec_test_123";
const NOW = Date.UTC(2026, 10, 13, 12, 0, 0);
const body = JSON.stringify({ id: "tx_1", status: "succeeded", amount: 5000, currency: "XOF" });

describe("authentification du webhook", () => {
  it("accepte le bon X-Secret-Key", () => {
    assert.equal(verifyWebhookWith(SECRET, body, new Headers({ "X-Secret-Key": SECRET }), NOW), true);
  });
  it("refuse un mauvais secret, un secret absent, ou pas de secret configuré", () => {
    assert.equal(verifyWebhookWith(SECRET, body, new Headers({ "X-Secret-Key": "faux" }), NOW), false);
    assert.equal(verifyWebhookWith(SECRET, body, new Headers(), NOW), false);
    assert.equal(verifyWebhookWith(undefined, body, new Headers({ "X-Secret-Key": SECRET }), NOW), false);
  });
  it("vérifie la signature HMAC quand elle est envoyée", () => {
    const ts = String(NOW - 1000);
    const sig = createHmac("sha256", SECRET).update(`${ts}.${body}`).digest("hex");
    const ok = new Headers({ "X-Webhook-Signature": sig, "X-Webhook-Timestamp": ts });
    assert.equal(verifyWebhookWith(SECRET, body, ok, NOW), true);
    // Corps modifié : signature fausse, même avec le bon X-Secret-Key.
    const tampered = new Headers({ "X-Webhook-Signature": sig, "X-Webhook-Timestamp": ts, "X-Secret-Key": SECRET });
    assert.equal(verifyWebhookWith(SECRET, body.replace("5000", "100"), tampered, NOW), false);
  });
  it("refuse une signature trop vieille (rejeu)", () => {
    const ts = String(NOW - 6 * 60_000);
    const sig = createHmac("sha256", SECRET).update(`${ts}.${body}`).digest("hex");
    const old = new Headers({ "X-Webhook-Signature": sig, "X-Webhook-Timestamp": ts });
    assert.equal(verifyWebhookWith(SECRET, body, old, NOW), false);
  });
});

describe("contrôle du montant", () => {
  const tx = (amount: number, extra: Record<string, unknown> = {}) =>
    readTransaction({ id: "tx", status: "succeeded", amount, currency: "XOF", ...extra })!;

  it("montant exact", () => assert.equal(amountMatches(5000, tx(5000)), true));
  it("frais payés par le client inclus dans le montant", () =>
    assert.equal(amountMatches(5000, tx(5100, { customerFees: 100 })), true));
  it("montant net des frais du marchand", () =>
    assert.equal(amountMatches(5000, tx(4900, { merchantFees: 100 })), true));
  it("refuse un autre montant ou une autre devise", () => {
    assert.equal(amountMatches(5000, tx(4000)), false);
    assert.equal(amountMatches(5000, readTransaction({ id: "t", amount: 5000, currency: "EUR" })!), false);
  });
});

describe("lecture d'une transaction", () => {
  it("statut en minuscules, frais en nombres", () => {
    const t = readTransaction({ id: "a", status: "SUCCEEDED", amount: "1000", merchantFees: "15", paymentReference: "p" })!;
    assert.equal(t.status, "succeeded");
    assert.equal(t.amount, 1000);
    assert.equal(t.merchantFees, 15);
    assert.equal(t.customerFees, null);
  });
  it("sans id : ignorée", () => assert.equal(readTransaction({ status: "succeeded" }), null));
});

describe("téléphone", () => {
  it("normalise au format +221", () => {
    assert.equal(bictorysPhone("77 123 45 67"), "+221771234567");
    assert.equal(bictorysPhone("00221771234567"), "+221771234567");
    assert.equal(bictorysPhone("+33 6 12 34 56 78"), "+33612345678");
    assert.equal(bictorysPhone(""), undefined);
  });
});
