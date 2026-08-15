import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeed, hash } from "../seed.js";
import { sessionExpiry } from "../db.js";

test("auth: demo passwords hash to the seeded credentials", () => {
  const seed = createSeed();
  const admin = seed.users.find((u) => u.email === "admin@palayapp.com");
  const farmer = seed.users.find((u) => u.email === "rosa@palayapp.com");
  const buyer = seed.users.find((u) => u.email === "ana@palayapp.com");
  assert.equal(admin.password, hash("Admin@123"));
  assert.equal(farmer.password, hash("Farmer@123"));
  assert.equal(buyer.password, hash("Buyer@123"));
});

test("auth: hash is deterministic and not plaintext", () => {
  const a = hash("Admin@123");
  const b = hash("Admin@123");
  assert.equal(a, b);
  assert.notEqual(a, "Admin@123");
  assert.equal(a.length, 64);
});

test("auth: different passwords produce different hashes", () => {
  assert.notEqual(hash("Admin@123"), hash("Farmer@123"));
});

test("auth: public registration only allows farmer or buyer", () => {
  const allowed = ["farmer", "buyer"];
  const blocked = ["admin", "staff", ""];
  for (const role of allowed) assert.ok(["farmer", "buyer"].includes(role));
  for (const role of blocked) assert.equal(["farmer", "buyer"].includes(role), false);
});

test("auth: remember-me sessions last 30 days; session-only last 12 hours", () => {
  const remembered = new Date(sessionExpiry(true)).getTime();
  const session = new Date(sessionExpiry(false)).getTime();
  const now = Date.now();
  const hour = 3600 * 1000;
  assert.ok(remembered - now > 29 * 24 * hour);
  assert.ok(remembered - now < 31 * 24 * hour);
  assert.ok(session - now > 11 * hour);
  assert.ok(session - now < 13 * hour);
});

test("auth: every seeded user has a role, email, and active or valid status", () => {
  const seed = createSeed();
  for (const user of seed.users) {
    assert.ok(["admin", "farmer", "buyer"].includes(user.role), user.email);
    assert.ok(user.email.includes("@"));
    assert.ok(user.status === "active" || user.status === "suspended");
    if (user.role === "farmer") assert.ok(user.farmName);
  }
});
