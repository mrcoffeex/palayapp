import * as db from "./db.js";

export const BANTAY_URL = "http://www.bantaypresyo.da.gov.ph";
export const DEFAULT_REGION = "130000000";
const SYNC_MS = 6 * 60 * 60 * 1000;

export const REGIONS = [
  { code: "130000000", label: "NCR (National Capital Region)" },
  { code: "030000000", label: "Region III (Central Luzon)" },
  { code: "040000000", label: "Region IV-A (CALABARZON)" },
  { code: "140000000", label: "CAR (Cordillera)" },
  { code: "010000000", label: "Region I (Ilocos)" },
  { code: "070000000", label: "Region VII (Central Visayas)" },
  { code: "110000000", label: "Region XI (Davao)" },
];

const FEEDS = [
  { commodity: "1", category: "Grains", pricePath: "/tbl_price_get_comm_price_rice.php", datePath: "/tbl_rice.php" },
  { commodity: "2", category: "Grains", pricePath: "/tbl_price_get_comm_price_rice.php", datePath: "/tbl_rice.php" },
  { commodity: "5", category: "Fruits", pricePath: "/tbl_price_get_comm_price_fruits.php", datePath: "/tbl_fruits.php" },
  { commodity: "6", category: "Vegetables", pricePath: "/tbl_price_get_comm_price_veg.php", datePath: "/tbl_veg.php" },
  { commodity: "7", category: "Vegetables", pricePath: "/tbl_price_get_comm_price_veg.php", datePath: "/tbl_veg.php" },
  { commodity: "9", category: "Vegetables", pricePath: "/tbl_price_get_comm_others.php", datePath: "/tbl_others.php" },
];

export const ALIASES = [
  { test: /commercial.*premium|premium.*yellow tagged/i, name: "Premium White Rice", category: "Grains" },
  { test: /^red onion(?!.*imported)/i, name: "Red Onion", category: "Vegetables" },
  { test: /^tomato$/i, name: "Highland Tomato", category: "Vegetables" },
  { test: /^cabbage/i, name: "Crisp Cabbage", category: "Vegetables" },
  { test: /banana\s*\(lakatan\)|^lakatan/i, name: "Lakatan Banana", category: "Fruits" },
  { test: /mango\s*\(carabao\)|carabao/i, name: "Carabao Mango", category: "Fruits" },
  { test: /corn\s*\(yellow\)/i, name: "Yellow Corn", category: "Grains" },
  { test: /^eggplant$/i, name: "Long Eggplant", category: "Vegetables" },
];

let syncing = false;
let timer = null;

export function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function parseNumber(value) {
  const n = Number(String(value || "").replace(/,/g, "").trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseRows(html) {
  const rows = [];
  const trs = String(html || "").match(/<tr[\s\S]*?<\/tr>/gi) || [];
  for (const tr of trs) {
    const cells = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      m[1].replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
    );
    if (cells.length < 3) continue;
    const name = cells[0];
    const spec = cells[1];
    const prices = cells.slice(2).map(parseNumber).filter((n) => n != null);
    if (!name || !prices.length) continue;
    rows.push({ name, spec, prices });
  }
  return rows;
}

export function summarize(prices) {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const average = Math.round(prices.reduce((s, n) => s + n, 0) / prices.length);
  if (min === max) {
    const pad = Math.max(2, Math.round(average * 0.08));
    return { averagePrice: average, minPrice: Math.max(1, average - pad), maxPrice: average + pad };
  }
  return { averagePrice: average, minPrice: Math.round(min), maxPrice: Math.round(max) };
}

export function mergeRows(rows) {
  const prices = rows.flatMap((r) => r.prices);
  const spec = rows.map((r) => r.spec).filter(Boolean).slice(0, 2).join("; ");
  return { ...summarize(prices), spec, sampleCount: prices.length };
}

function displayName(raw) {
  return String(raw || "").replace(/\s+/g, " ").trim();
}

export function categoryFor(name, fallback) {
  if (/potato|carrot|gabi|ube|kamote|cassava/i.test(name)) return "Root crops";
  if (/ginger|garlic|chili|sili|onion/i.test(name) && /herb/i.test(fallback)) return "Vegetables";
  return fallback;
}

async function postForm(path, fields) {
  const body = new URLSearchParams(fields);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(`${BANTAY_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "PalayUP/1.0 (guide-price sync; +http://www.bantaypresyo.da.gov.ph/)",
      },
      body,
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`Bantay Presyo returned ${res.status} for ${path}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

export async function fetchBantayPrices(region = DEFAULT_REGION) {
  let asOf = "";
  const items = [];
  for (const feed of FEEDS) {
    if (!asOf) {
      const dateHtml = await postForm(feed.datePath, {
        action: "get_latest_date",
        region,
        commodity: feed.commodity,
      });
      asOf = String(dateHtml || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
    const html = await postForm(feed.pricePath, { commodity: feed.commodity, region });
    for (const row of parseRows(html)) {
      items.push({
        ...row,
        category: categoryFor(row.name, feed.category),
      });
    }
  }
  return { asOf: asOf || "latest available", items };
}

export function findExisting(guides, name) {
  const n = normalize(name);
  return guides.find((g) => normalize(g.name) === n);
}

export async function syncGuidePrices({ region = DEFAULT_REGION, reason = "manual" } = {}) {
  if (syncing) return { ok: false, busy: true, error: "A sync is already running." };
  syncing = true;
  const started = new Date().toISOString();
  try {
    const { asOf, items } = await fetchBantayPrices(region);
    if (!items.length) throw new Error("Bantay Presyo returned no priced commodities.");

    const guides = await db.listGuidePrices();
    let updated = 0;
    let created = 0;
    const touched = new Set();
    const regionLabel = REGIONS.find((r) => r.code === region)?.label || region;

    const write = async (name, category, stats) => {
      const notes = `Bantay Presyo ${regionLabel} · as of ${asOf}${stats.spec ? ` · ${stats.spec}` : ""}`;
      const payload = {
        name,
        category,
        unit: "kg",
        averagePrice: stats.averagePrice,
        minPrice: stats.minPrice,
        maxPrice: stats.maxPrice,
        notes,
      };
      const existing = findExisting(guides, name);
      if (existing && !touched.has(existing.id)) {
        await db.updateGuide(existing.id, payload);
        existing.name = name;
        touched.add(existing.id);
        updated += 1;
      } else if (!existing) {
        const item = await db.createGuide({
          id: await db.nextId("gp"),
          ...payload,
          updatedAt: new Date().toISOString(),
        });
        guides.push(item);
        touched.add(item.id);
        created += 1;
      }
    };

    for (const alias of ALIASES) {
      const matches = items.filter((row) => alias.test.test(row.name));
      if (!matches.length) continue;
      await write(alias.name, alias.category, mergeRows(matches));
    }

    for (const row of items) {
      if (ALIASES.some((alias) => alias.test.test(row.name))) continue;
      await write(displayName(row.name), row.category, mergeRows([row]));
    }

    const result = {
      ok: true,
      reason,
      region,
      regionLabel,
      asOf,
      fetched: items.length,
      updated,
      created,
      lastSyncAt: started,
      source: BANTAY_URL,
      error: "",
    };
    await db.updateSettings({ bantayPresyo: result });
    await db.notify(
      "usr_admin",
      "Bantay Presyo sync",
      `${updated} updated, ${created} added · ${asOf} · ${regionLabel}.`,
      "pricing"
    );
    return result;
  } catch (err) {
    const fail = {
      ok: false,
      reason,
      region,
      lastSyncAt: started,
      source: BANTAY_URL,
      error: err.message || "Bantay Presyo sync failed.",
    };
    const current = await db.getSettings();
    await db.updateSettings({ bantayPresyo: { ...(current.bantayPresyo || {}), ...fail } });
    throw err;
  } finally {
    syncing = false;
  }
}

export function startBantayScheduler() {
  if (timer) return;
  const run = (reason) =>
    syncGuidePrices({ reason }).then(
      (r) => console.log(`Bantay Presyo ${reason}: ${r.updated} updated, ${r.created} added (${r.asOf})`),
      (err) => console.error(`Bantay Presyo ${reason} failed:`, err.message)
    );
  setTimeout(() => run("startup"), 5000);
  timer = setInterval(() => run("schedule"), SYNC_MS);
}
