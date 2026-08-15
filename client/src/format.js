export const peso = (n) =>
  `₱${Number(n || 0).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;

export const when = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const FLOW = ["queued", "confirmed", "preparing", "ready", "completed"];

export const STATUS_META = {
  queued: { label: "In queue", tone: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmed", tone: "bg-sky-100 text-sky-800" },
  preparing: { label: "Preparing", tone: "bg-forest-100 text-forest-800" },
  ready: { label: "Ready for pickup", tone: "bg-emerald-100 text-emerald-800" },
  completed: { label: "Completed", tone: "bg-forest-900 text-white" },
  cancelled: { label: "Cancelled", tone: "bg-rose-100 text-rose-800" },
};

export function listingGuide(name, guides) {
  const n = String(name || "").trim().toLowerCase();
  if (!n || !guides?.length) return null;
  const exact = guides.find((g) => g.name.toLowerCase() === n);
  if (exact) return exact;
  if (n.length < 4) return null;
  const matches = guides.filter((g) => {
    const gn = g.name.toLowerCase();
    return n.includes(gn) || gn.includes(n);
  });
  if (!matches.length) return null;
  return matches.sort((a, b) => b.name.length - a.name.length)[0];
}

export function priceWithinGuide(price, guide) {
  if (!guide) return false;
  const p = Number(price);
  return Number.isFinite(p) && p >= Number(guide.minPrice) && p <= Number(guide.maxPrice);
}

export function listingPriceError(name, price, guides) {
  const guide = listingGuide(name, guides);
  if (!guide) {
    return "Pick a product from the pricing guide, then set a price within its range.";
  }
  if (!priceWithinGuide(price, guide)) {
    return `Price must be between ${peso(guide.minPrice)} and ${peso(guide.maxPrice)} per ${guide.unit}.`;
  }
  return "";
}

export function guideFor(product, guides) {
  if (!product) return null;
  return listingGuide(product.name, guides) || guides.find((g) => g.category === product.category) || null;
}

export function priceTag(product, guides) {
  const guide = guideFor(product, guides);
  if (!guide) return { label: "No guide yet", tone: "bg-stone-100 text-stone-600", delta: 0, guide };
  const delta = product.price - guide.averagePrice;
  if (delta < 0) return { label: `${peso(Math.abs(delta))} below guide`, tone: "bg-emerald-100 text-emerald-800", delta, guide };
  if (delta > 0) return { label: `${peso(delta)} above guide`, tone: "bg-amber-100 text-amber-900", delta, guide };
  return { label: "At market guide", tone: "bg-forest-100 text-forest-800", delta, guide };
}

export function userById(users, id) {
  return users.find((u) => u.id === id);
}

export function locLine(loc) {
  if (!loc) return "Location not set";
  return [loc.address, loc.city, loc.province].filter(Boolean).join(", ");
}
