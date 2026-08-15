import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../seed.js";

const FLOW = ["queued", "confirmed", "preparing", "ready", "completed"];

test("orders: seeded orders follow the marketplace flow or cancelled", () => {
  const { orders } = createSeed();
  assert.ok(orders.length > 0);
  for (const order of orders) {
    assert.ok(FLOW.includes(order.status) || order.status === "cancelled", order.id);
    assert.ok(order.buyerId.startsWith("usr_"));
    assert.ok(order.farmerId.startsWith("usr_"));
    assert.ok(order.items.length > 0);
    const itemTotal = order.items.reduce((s, i) => s + i.qty * i.price, 0);
    assert.equal(order.total, itemTotal);
    assert.ok(Array.isArray(order.statusHistory));
    assert.equal(order.statusHistory[0].status, "queued");
  }
});

test("orders: queue positions are set on open orders", () => {
  const { orders } = createSeed();
  const open = orders.filter((o) => !["completed", "cancelled"].includes(o.status));
  assert.ok(open.length > 0);
  for (const order of open) {
    assert.equal(typeof order.queuePosition, "number");
    assert.ok(order.queuePosition >= 0);
  }
});

test("orders: advancing status walks queued → completed", () => {
  const next = (status) => FLOW[FLOW.indexOf(status) + 1];
  assert.equal(next("queued"), "confirmed");
  assert.equal(next("confirmed"), "preparing");
  assert.equal(next("preparing"), "ready");
  assert.equal(next("ready"), "completed");
  assert.equal(next("completed"), undefined);
});

test("orders: PalayUP does not collect payment on an order", () => {
  const { settings, orders } = createSeed();
  assert.match(settings.noPaymentNote, /does not process payments/i);
  for (const order of orders) {
    assert.equal(order.paid, undefined);
    assert.equal(order.paymentId, undefined);
  }
});
