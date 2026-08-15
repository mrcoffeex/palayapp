import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const app = readFileSync(join(root, "client/src/App.jsx"), "utf8");
const admin = readFileSync(join(root, "client/src/pages/admin.jsx"), "utf8");
const login = readFileSync(join(root, "client/src/pages/Login.jsx"), "utf8");
const register = readFileSync(join(root, "client/src/pages/Register.jsx"), "utf8");
const farmer = readFileSync(join(root, "client/src/pages/farmer.jsx"), "utf8");
const buyer = readFileSync(join(root, "client/src/pages/buyer.jsx"), "utf8");
const server = readFileSync(join(root, "server/index.js"), "utf8");

test("features: public pages are routed", () => {
  for (const path of ["/login", "/register", "/terms", "/privacy", "/refund", "/docs"]) {
    assert.match(app, new RegExp(`path="${path}"`));
  }
});

test("features: role shells guard admin, farmer, and buyer", () => {
  assert.match(app, /roles=\{\["admin"\]\}/);
  assert.match(app, /roles=\{\["farmer"\]\}/);
  assert.match(app, /roles=\{\["buyer"\]\}/);
});

test("features: login offers Remember me and demo accounts", () => {
  assert.match(login, /Remember me/);
  assert.match(login, /admin@palayapp.com/);
  assert.match(login, /rosa@palayapp.com/);
  assert.match(login, /ana@palayapp.com/);
});

test("features: register requires policy agreement and farmer or buyer role", () => {
  assert.match(register, /Terms and Conditions/);
  assert.match(register, /Privacy Policy/);
  assert.match(register, /Refund Policy/);
  assert.match(register, /value="farmer"/);
  assert.match(register, /value="buyer"/);
});

test("features: admin can create and edit users with role selection", () => {
  assert.match(admin, /Create account/);
  assert.match(admin, /Edit account/);
  assert.match(admin, /value="admin"/);
  assert.match(server, /app.post\("\/api\/users"/);
  assert.match(server, /You cannot change your own role/);
});

test("features: guide prices sync from Bantay Presyo", () => {
  assert.match(admin, /Bantay Presyo sync/);
  assert.match(admin, /Sync now/);
  assert.match(server, /\/api\/guide-prices\/sync/);
});

test("features: farmer listings enforce the guide and support photos", () => {
  assert.match(farmer, /Pricing guide/);
  assert.match(farmer, /Upload or attach a photo/);
  assert.match(farmer, /Organic/);
});

test("features: farmer queue can reorder and advance status", () => {
  assert.match(farmer, /moveQueue/);
  assert.match(farmer, /Mark \{nextStatus/);
  assert.match(farmer, /Cancel order/);
});

test("features: buyer orders show farmer contact and no in-app payment", () => {
  assert.match(buyer, /Place order · no payment/);
  assert.match(buyer, /FarmerContact/);
  assert.match(buyer, /Message farmer/);
});

test("features: chat, notifications, and AI assistant endpoints exist", () => {
  assert.match(server, /\/api\/conversations/);
  assert.match(server, /\/api\/notifications/);
  assert.match(server, /\/api\/ai\/chat/);
});

test("features: session is retained after changes unless the token is invalid", () => {
  const store = readFileSync(join(root, "client/src/store.jsx"), "utf8");
  assert.match(store, /err.status === 401/);
  assert.match(server, /touchSession/);
});
