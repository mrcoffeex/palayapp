import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ALIASES,
  BANTAY_URL,
  DEFAULT_REGION,
  categoryFor,
  findExisting,
  mergeRows,
  normalize,
  parseNumber,
  parseRows,
  summarize,
} from "../bantayPresyo.js";

const sampleHtml = `
<tr><td class="text-wrap">Red Onion</td><td>13-15 PCS/KG</td>
<td>80.00</td><td>N/A</td><td>90.00</td><td>0</td></tr>
<tr><td>NFA</td><td>KG</td><td>N/A</td><td>N/A</td></tr>
<tr><td>Cabbage (Scorpio)</td><td>750GM</td><td>70.00</td><td>80.00</td></tr>
`;

test("bantay: official source is DA Bantay Presyo", () => {
  assert.equal(BANTAY_URL, "http://www.bantaypresyo.da.gov.ph");
  assert.equal(DEFAULT_REGION, "130000000");
});

test("bantay: parseRows skips N/A-only commodities and reads market prices", () => {
  const rows = parseRows(sampleHtml);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].name, "Red Onion");
  assert.deepEqual(rows[0].prices, [80, 90]);
  assert.equal(rows[1].name, "Cabbage (Scorpio)");
});

test("bantay: parseNumber rejects N/A and zero", () => {
  assert.equal(parseNumber("50.00"), 50);
  assert.equal(parseNumber("1,200"), 1200);
  assert.equal(parseNumber("N/A"), null);
  assert.equal(parseNumber("0"), null);
});

test("bantay: summarize uses min, max, and rounded mean", () => {
  const stats = summarize([50, 56, 50]);
  assert.equal(stats.minPrice, 50);
  assert.equal(stats.maxPrice, 56);
  assert.equal(stats.averagePrice, 52);
});

test("bantay: single-price rows still get a listing range", () => {
  const stats = summarize([60, 60]);
  assert.equal(stats.averagePrice, 60);
  assert.ok(stats.minPrice < 60);
  assert.ok(stats.maxPrice > 60);
});

test("bantay: aliases map DA names onto PalayUP guide products", () => {
  const names = [
    "COMMERCIAL (IMPORTED) Premium (Yellow tagged)",
    "Red Onion",
    "Tomato",
    "Cabbage (Scorpio)",
    "Banana (Lakatan)",
    "Mango (Carabao)",
    "Corn (Yellow)",
    "Eggplant",
  ];
  const mapped = names.map((name) => ALIASES.find((a) => a.test.test(name))?.name);
  assert.deepEqual(mapped, [
    "Premium White Rice",
    "Red Onion",
    "Highland Tomato",
    "Crisp Cabbage",
    "Lakatan Banana",
    "Carabao Mango",
    "Yellow Corn",
    "Long Eggplant",
  ]);
});

test("bantay: imported red onion is not aliased to local Red Onion", () => {
  const alias = ALIASES.find((a) => a.name === "Red Onion");
  assert.equal(alias.test.test("Red Onion"), true);
  assert.equal(alias.test.test("Red Onion (Imported)"), false);
});

test("bantay: potatoes map to root crops", () => {
  assert.equal(categoryFor("White Potato", "Vegetables"), "Root crops");
  assert.equal(categoryFor("Calamansi", "Fruits"), "Fruits");
});

test("bantay: findExisting matches normalized names only", () => {
  const guides = [{ id: "gp_1", name: "Red Onion" }];
  assert.equal(findExisting(guides, "red  onion")?.id, "gp_1");
  assert.equal(findExisting(guides, "Red Onion (Imported)"), undefined);
});

test("bantay: mergeRows combines cabbage varieties for the PalayUP alias", () => {
  const merged = mergeRows(parseRows(sampleHtml).filter((r) => /cabbage|onion/i.test(r.name)));
  assert.ok(merged.sampleCount >= 2);
  assert.ok(merged.minPrice <= merged.averagePrice);
  assert.ok(merged.averagePrice <= merged.maxPrice);
});

test("bantay: normalize strips punctuation", () => {
  assert.equal(normalize("Banana (Lakatan)"), "banana lakatan");
});
