import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../seed.js";

test("seed: platform has admin, farmer, and buyer roles", () => {
  const { users } = createSeed();
  assert.ok(users.some((u) => u.role === "admin"));
  assert.ok(users.some((u) => u.role === "farmer"));
  assert.ok(users.some((u) => u.role === "buyer"));
});

test("seed: farmers have contact details buyers can use off-app", () => {
  const { users } = createSeed();
  for (const farmer of users.filter((u) => u.role === "farmer")) {
    assert.ok(farmer.phone);
    assert.ok(farmer.location?.city);
    assert.ok(farmer.farmName);
  }
});

test("seed: products belong to farmers and stay inside a guide range when matched", () => {
  const { products, guidePrices } = createSeed();
  assert.ok(products.length > 0);
  for (const product of products) {
    assert.ok(product.farmerId);
    assert.ok(product.price > 0);
    const guide = guidePrices.find((g) => g.name.toLowerCase() === product.name.toLowerCase());
    if (guide) {
      assert.ok(product.price >= guide.minPrice);
      assert.ok(product.price <= guide.maxPrice);
    }
  }
});

test("seed: guide prices have a valid min ≤ average ≤ max", () => {
  const { guidePrices } = createSeed();
  assert.ok(guidePrices.length >= 8);
  for (const g of guidePrices) {
    assert.ok(g.minPrice <= g.averagePrice);
    assert.ok(g.averagePrice <= g.maxPrice);
    assert.ok(g.unit);
  }
});

test("seed: settings keep registration and support contacts", () => {
  const { settings } = createSeed();
  assert.equal(settings.appName, "PalayUP");
  assert.equal(settings.allowRegistration, true);
  assert.ok(settings.supportEmail);
  assert.ok(settings.supportPhone);
  assert.deepEqual(settings.orderFlow, ["queued", "confirmed", "preparing", "ready", "completed"]);
});

test("seed: conversations are farmer–buyer threads", () => {
  const { conversations, users } = createSeed();
  const ids = new Set(users.map((u) => u.id));
  for (const c of conversations) {
    assert.ok(ids.has(c.farmerId));
    assert.ok(ids.has(c.buyerId));
    assert.ok(c.lastMessage);
  }
});
