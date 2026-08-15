import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FLOW,
  listingGuide,
  listingPriceError,
  locLine,
  peso,
  priceTag,
  priceWithinGuide,
  userById,
} from "./format.js";

const guides = [
  { name: "Premium White Rice", category: "Grains", unit: "kg", averagePrice: 50, minPrice: 45, maxPrice: 58 },
  { name: "Red Onion", category: "Vegetables", unit: "kg", averagePrice: 85, minPrice: 70, maxPrice: 110 },
];

test("format: peso uses Philippine currency", () => {
  assert.match(peso(1300), /₱/);
  assert.match(peso(1300), /1,300/);
  assert.equal(peso(null), "₱0");
});

test("format: order flow is queued through completed", () => {
  assert.deepEqual(FLOW, ["queued", "confirmed", "preparing", "ready", "completed"]);
});

test("listings: exact and fuzzy guide matching", () => {
  assert.equal(listingGuide("Premium White Rice", guides).averagePrice, 50);
  assert.equal(listingGuide("white rice", guides).name, "Premium White Rice");
  assert.equal(listingGuide("xyz", guides), null);
  assert.equal(listingGuide("ab", guides), null);
});

test("listings: farmers cannot price outside the guide range", () => {
  const guide = guides[0];
  assert.equal(priceWithinGuide(50, guide), true);
  assert.equal(priceWithinGuide(45, guide), true);
  assert.equal(priceWithinGuide(58, guide), true);
  assert.equal(priceWithinGuide(44, guide), false);
  assert.equal(priceWithinGuide(59, guide), false);
  assert.match(listingPriceError("Unknown Crop", 10, guides), /pricing guide/);
  assert.match(listingPriceError("Premium White Rice", 20, guides), /between/);
  assert.equal(listingPriceError("Premium White Rice", 50, guides), "");
});

test("listings: priceTag compares a listing to the market average", () => {
  const below = priceTag({ name: "Premium White Rice", price: 47, category: "Grains" }, guides);
  const above = priceTag({ name: "Premium White Rice", price: 55, category: "Grains" }, guides);
  const at = priceTag({ name: "Premium White Rice", price: 50, category: "Grains" }, guides);
  assert.match(below.label, /below guide/);
  assert.ok(below.delta < 0);
  assert.match(above.label, /above guide/);
  assert.equal(at.label, "At market guide");
});

test("users: locLine and userById", () => {
  assert.equal(locLine(null), "Location not set");
  assert.equal(locLine({ address: "8 Harvest", city: "Cabanatuan", province: "Nueva Ecija" }), "8 Harvest, Cabanatuan, Nueva Ecija");
  const users = [{ id: "usr_1", name: "Rosa" }];
  assert.equal(userById(users, "usr_1").name, "Rosa");
  assert.equal(userById(users, "missing"), undefined);
});
