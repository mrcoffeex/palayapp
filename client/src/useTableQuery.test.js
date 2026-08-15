import { test } from "node:test";
import assert from "node:assert/strict";
import { applyTableQuery, PAGE_SIZES } from "./useTableQuery.js";

const rows = [
  { id: "3", name: "Carlo Lim", role: "buyer", city: "Manila" },
  { id: "1", name: "Rosa Santos", role: "farmer", city: "Cabanatuan" },
  { id: "2", name: "Ana Reyes", role: "buyer", city: "Quezon City" },
  { id: "4", name: "Elena Cruz", role: "admin", city: "Manila" },
];

test("tables: default page sizes are 10, 25, 50", () => {
  assert.deepEqual(PAGE_SIZES, [10, 25, 50]);
});

test("tables: search filters before sort and pagination", () => {
  const result = applyTableQuery(rows, {
    search: "buyer",
    searchKeys: ["name", "role", "city"],
    sortKey: "name",
    pageSize: 10,
  });
  assert.equal(result.total, 2);
  assert.deepEqual(result.rows.map((r) => r.name), ["Ana Reyes", "Carlo Lim"]);
});

test("tables: custom searchText matches farm and email fields", () => {
  const result = applyTableQuery(rows, {
    search: "cabanatuan",
    searchText: (r) => `${r.name} ${r.city}`,
    sortKey: "name",
  });
  assert.equal(result.total, 1);
  assert.equal(result.rows[0].name, "Rosa Santos");
});

test("tables: sort descending by name", () => {
  const result = applyTableQuery(rows, { sortKey: "name", sortDir: "desc" });
  assert.equal(result.rows[0].name, "Rosa Santos");
  assert.equal(result.rows.at(-1).name, "Ana Reyes");
});

test("tables: pagination slices the sorted result and reports the range", () => {
  const page1 = applyTableQuery(rows, { sortKey: "id", page: 1, pageSize: 2 });
  const page2 = applyTableQuery(rows, { sortKey: "id", page: 2, pageSize: 2 });
  assert.equal(page1.pageCount, 2);
  assert.equal(page1.from, 1);
  assert.equal(page1.to, 2);
  assert.equal(page1.rows.length, 2);
  assert.equal(page2.from, 3);
  assert.equal(page2.to, 4);
  assert.equal(page2.rows[0].id, "3");
});

test("tables: page is clamped when filters shrink the set", () => {
  const result = applyTableQuery(rows, {
    search: "elena",
    searchKeys: ["name"],
    sortKey: "name",
    page: 9,
    pageSize: 10,
  });
  assert.equal(result.page, 1);
  assert.equal(result.total, 1);
  assert.equal(result.from, 1);
  assert.equal(result.to, 1);
});

test("tables: empty search over empty rows still has one page", () => {
  const result = applyTableQuery([], { sortKey: "name" });
  assert.equal(result.total, 0);
  assert.equal(result.pageCount, 1);
  assert.equal(result.from, 0);
  assert.equal(result.to, 0);
});
