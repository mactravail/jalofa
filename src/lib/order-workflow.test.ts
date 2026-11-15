// Tests du workflow de commande (cahier des charges §14), horloges fictives.
// Lancer : npm test
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  cancellationStage,
  completionShares,
  cutCompensation,
  cuttingStatus,
  fabricOwnerOf,
  proposeSettlement,
  shippingStatus,
  type WorkflowOrder,
} from "./order-workflow.ts";

const H = 3_600_000;
const T0 = Date.UTC(2026, 10, 13, 8, 0, 0); // paiement confirmé
const iso = (t: number) => new Date(t).toISOString();

function order(over: Partial<WorkflowOrder> = {}): WorkflowOrder {
  return {
    type: "full",
    status: "accepted",
    payment_status: "paid",
    tailor_id: "tailor",
    vendor_id: "vendor",
    delivery_option: "economy",
    paid_at: iso(T0),
    fabric_shipped_at: null,
    fabric_received_at: null,
    cut_started_at: null,
    cut_was_authorized: null,
    fabric_price: 20_000,
    tailoring_price: 30_000,
    fabric_delivery_fee: 2_000,
    delivery_fee: 3_000,
    total_amount: 55_000,
    amount_paid: 55_000,
    cancellation_pending: false,
    ...over,
  };
}

const vendorFabric = { type: "full" as const, tailor_id: "tailor", vendor_id: "vendor" };
const tailorFabric = { type: "full" as const, tailor_id: "tailor", vendor_id: "tailor" };
const clientFabric = { type: "own_fabric" as const, tailor_id: "tailor", vendor_id: null };

describe("propriétaire du tissu", () => {
  it("distingue vendeur, tailleur et client", () => {
    assert.equal(fabricOwnerOf(vendorFabric), "vendor");
    assert.equal(fabricOwnerOf(tailorFabric), "tailor");
    assert.equal(fabricOwnerOf(clientFabric), "client");
    assert.equal(fabricOwnerOf({ type: "fabric_only", tailor_id: null, vendor_id: "vendor" }), "vendor");
  });
});

describe("tableau des conditions de découpe (§9)", () => {
  const received = iso(T0 + 30 * H);

  it("A + vendeur : 24 h après la réception, pas après le paiement", () => {
    const o = order({ ...vendorFabric, fabric_shipped_at: iso(T0 + 25 * H), fabric_received_at: received, status: "fabric_received_by_tailor" });
    assert.equal(cuttingStatus(o, T0 + 50 * H).reason, "waiting");
    assert.equal(cuttingStatus(o, T0 + 54 * H - 1).allowed, false);
    assert.equal(cuttingStatus(o, T0 + 54 * H).allowed, true);
  });

  it("A + vendeur : jamais sans réception", () => {
    const o = order({ ...vendorFabric });
    assert.equal(cuttingStatus(o, T0 + 500 * H).reason, "fabric_not_received");
  });

  it("A + tailleur : 24 h après le paiement, sans autre condition", () => {
    const o = order({ ...tailorFabric });
    assert.equal(cuttingStatus(o, T0 + 23 * H).allowed, false);
    assert.equal(cuttingStatus(o, T0 + 24 * H).allowed, true);
  });

  it("A + client : 24 h après la réception", () => {
    const o = order({ ...clientFabric, fabric_received_at: received });
    assert.equal(cuttingStatus(o, T0 + 53 * H).allowed, false);
    assert.equal(cuttingStatus(o, T0 + 54 * H).allowed, true);
    assert.equal(cuttingStatus(order({ ...clientFabric }), T0 + 500 * H).reason, "fabric_not_received");
  });

  it("B + vendeur : 24 h après le paiement ET tissu reçu", () => {
    const early = order({ ...vendorFabric, delivery_option: "express", fabric_received_at: iso(T0 + 5 * H) });
    assert.equal(cuttingStatus(early, T0 + 10 * H).reason, "waiting");
    assert.equal(cuttingStatus(early, T0 + 24 * H).allowed, true);
    const late = order({ ...vendorFabric, delivery_option: "express" });
    assert.equal(cuttingStatus(late, T0 + 30 * H).reason, "fabric_not_received");
  });

  it("B + tailleur : 24 h après le paiement", () => {
    const o = order({ ...tailorFabric, delivery_option: "express" });
    assert.equal(cuttingStatus(o, T0 + 24 * H).allowed, true);
  });

  it("B + client : 24 h après le paiement ET tissu reçu", () => {
    const o = order({ ...clientFabric, delivery_option: "express", fabric_received_at: iso(T0 + 2 * H) });
    assert.equal(cuttingStatus(o, T0 + 23 * H).allowed, false);
    assert.equal(cuttingStatus(o, T0 + 24 * H).allowed, true);
  });

  it("une demande d'annulation bloque toujours la découpe", () => {
    const o = order({ ...tailorFabric, cancellation_pending: true });
    assert.equal(cuttingStatus(o, T0 + 500 * H).reason, "cancellation_pending");
  });

  it("pas de découpe sans paiement confirmé", () => {
    const o = order({ ...tailorFabric, payment_status: "pending", paid_at: null });
    assert.equal(cuttingStatus(o, T0 + 500 * H).reason, "unpaid");
  });
});

describe("expédition du tissu par le vendeur", () => {
  it("A : 24 h après le paiement", () => {
    const o = order({ ...vendorFabric });
    assert.equal(shippingStatus(o, T0 + 23 * H).reason, "waiting");
    assert.equal(shippingStatus(o, T0 + 24 * H).allowed, true);
  });
  it("B : tout de suite", () => {
    assert.equal(shippingStatus(order({ ...vendorFabric, delivery_option: "express" }), T0).allowed, true);
  });
  it("bloquée par une demande d'annulation", () => {
    const o = order({ ...vendorFabric, delivery_option: "express", cancellation_pending: true });
    assert.equal(shippingStatus(o, T0).reason, "cancellation_pending");
  });
  it("tissu seul en A : 24 h aussi", () => {
    const o = order({ type: "fabric_only", tailor_id: null, tailoring_price: 0, delivery_fee: 0 });
    assert.equal(shippingStatus(o, T0 + 1 * H).allowed, false);
  });
});

describe("indemnisation (§5)", () => {
  it("35 % de la couture seulement", () => {
    assert.equal(cutCompensation(30_000), 10_500);
    assert.equal(cutCompensation(12_345), 4_321); // 4320,75 → arrondi au franc
  });

  it("le tissu et la livraison ne font pas partie de la base", () => {
    const o = order({ ...vendorFabric, delivery_option: "express", fabric_received_at: iso(T0), cut_started_at: iso(T0 + 25 * H), cut_was_authorized: true, status: "in_production" });
    const p = proposeSettlement(o, { returnFee: 0 });
    const comp = p.lines.find((l) => l.kind === "compensation");
    assert.equal(comp?.amount, 10_500);
    assert.equal(comp?.party, "tailor");
  });

  it("aucune indemnité si la découpe n'était pas autorisée", () => {
    const o = order({ ...tailorFabric, cut_started_at: iso(T0 + 2 * H), cut_was_authorized: false, status: "in_production" });
    const p = proposeSettlement(o, { returnFee: 0 });
    assert.equal(p.stage, "after_unauthorized_cut");
    assert.equal(p.lines.length, 0);
    assert.equal(p.refund, 55_000);
    assert.ok(p.flags.includes("unauthorized_cut"));
  });
});

describe("règlement d'une annulation", () => {
  it("avant expédition : tout est remboursé, aucun trajet non effectué facturé", () => {
    const p = proposeSettlement(order({ ...vendorFabric }), { returnFee: null });
    assert.equal(p.stage, "before_shipment");
    assert.equal(p.refund, 55_000);
    assert.deepEqual(p.lines, []);
  });

  it("A, tissu parti : le vendeur supporte l'aller, le client paie le retour", () => {
    const o = order({ ...vendorFabric, fabric_shipped_at: iso(T0 + 25 * H) });
    const p = proposeSettlement(o, { returnFee: 2_500 });
    assert.equal(p.stage, "fabric_travelled");
    assert.equal(p.lines.some((l) => l.kind === "delivery_out"), false);
    assert.equal(p.refund, 55_000 - 2_500);
  });

  it("B, tissu parti : l'aller payé revient au vendeur, le vêtement non livré est remboursé", () => {
    const o = order({ ...vendorFabric, delivery_option: "express", fabric_shipped_at: iso(T0 + 1 * H) });
    const p = proposeSettlement(o, { returnFee: 2_500 });
    assert.equal(p.refund, 55_000 - 2_000 - 2_500);
    assert.equal(p.lines.find((l) => l.kind === "delivery_out")?.partyId, "vendor");
  });

  it("retour pas encore chiffré : examen humain demandé", () => {
    const o = order({ ...vendorFabric, fabric_shipped_at: iso(T0 + 25 * H) });
    assert.ok(proposeSettlement(o, { returnFee: null }).flags.includes("return_fee_missing"));
  });

  it("découpe autorisée, tissu du vendeur : tissu dû + 35 % couture", () => {
    const o = order({ ...vendorFabric, fabric_shipped_at: iso(T0 + 25 * H), fabric_received_at: iso(T0 + 30 * H), cut_started_at: iso(T0 + 55 * H), cut_was_authorized: true, status: "in_production" });
    const p = proposeSettlement(o, { returnFee: 0 });
    assert.equal(p.refund, 55_000 - 20_000 - 10_500);
    assert.ok(p.flags.includes("fabric_ownership_legal"));
  });

  it("découpe autorisée, tissu du client : seulement l'indemnité", () => {
    const o = order({ ...clientFabric, fabric_price: 0, total_amount: 33_000, amount_paid: 33_000, fabric_delivery_fee: 0, fabric_received_at: iso(T0), cut_started_at: iso(T0 + 25 * H), cut_was_authorized: true, status: "in_production" });
    const p = proposeSettlement(o, { returnFee: 1_000 });
    assert.equal(p.refund, 33_000 - 10_500 - 1_000);
  });

  it("jamais de remboursement négatif", () => {
    const o = order({ ...vendorFabric, amount_paid: 1_000, fabric_shipped_at: iso(T0 + 25 * H) });
    const p = proposeSettlement(o, { returnFee: 5_000 });
    assert.equal(p.refund, 0);
    assert.ok(p.flags.includes("deductions_exceed_payment"));
  });

  it("vêtement déjà parti : ce n'est plus une annulation", () => {
    assert.equal(cancellationStage(order({ status: "shipped" })), "garment_shipped");
  });
});

describe("parts quand la commande aboutit", () => {
  it("vendeur = tailleur : tissu et couture restent sur deux lignes", () => {
    const lines = completionShares(order({ ...tailorFabric, fabric_delivery_fee: 0 }));
    assert.deepEqual(
      lines.map((l) => [l.party, l.partyId, l.kind, l.amount]),
      [
        ["tailor", "tailor", "fabric", 20_000],
        ["tailor", "tailor", "tailoring", 30_000],
        ["tailor", "tailor", "delivery_garment", 3_000],
      ],
    );
  });

  it("le vendeur récupère l'aller annoncé au client", () => {
    const lines = completionShares(order({ ...vendorFabric }));
    assert.equal(lines.find((l) => l.kind === "delivery_out")?.amount, 2_000);
    const total = lines.reduce((s, l) => s + l.amount, 0);
    assert.equal(total, 55_000); // aucun franc d'une autre commande
  });
});
