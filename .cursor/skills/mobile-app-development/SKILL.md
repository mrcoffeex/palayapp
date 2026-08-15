---
name: mobile-app-development
description: >-
  Build PalayUP farmer and buyer mobile apps (phone-framed React views).
  Use when adding farmer/buyer screens, bottom tabs, product listings,
  order queue, chat, profile, touch UI, safe areas, or testing on a phone
  over the local network. Applies to client/src/pages/farmer.jsx,
  buyer.jsx, MobileShell, phone-frame, and related commerce UI.
---

# PalayUP mobile app development

Farmer and buyer are **one React codebase** rendered as a mobile app: phone frame on desktop, full-bleed on a real phone. There is no separate native project.

## Surfaces

| Role | Shell | Tabs | Files |
| --- | --- | --- | --- |
| Farmer | `MobileShell role="farmer"` | Home, Products, Orders, Chat, Profile | `client/src/pages/farmer.jsx` |
| Buyer | `MobileShell role="buyer"` | Market, Orders, Chat, You | `client/src/pages/buyer.jsx` |

Keep admin work in the web-app skill. Do not use `AdminShell` here.

## Add a mobile screen

1. Export the page from `farmer.jsx` or `buyer.jsx`.
2. Nested route under `/farmer` or `/buyer` in `client/src/App.jsx` (`Guard` with that role).
3. If it is a primary destination, add a tab in `farmerTabs` / `buyerTabs` in `shells.jsx`. Match `grid-cols-4` vs `grid-cols-5` to tab count.
4. Use `api.*` then `await refresh()`.

Deep links (example: buyer product) stay off the tab bar: `/buyer/product/:id`.

## Layout (required)

Page structure:

```jsx
<div className="safe-bottom">
  <Top title="…" subtitle="…" />
  <div className="space-y-4 px-4 py-5">{/* content */}</div>
</div>
```

- Reuse the local `Top` header pattern: `bg-forest-900` header, `font-display text-2xl` title, optional bell.
- `safe-bottom` clears the tab bar + iOS home indicator (`index.css`).
- Content scrolls inside `.phone-frame`; the tab bar is fixed in `MobileShell`.
- Do not add a second bottom nav inside the page.

On viewports ≥960px, `.mobile-stage` centers a 430px phone chrome. Do not fight that CSS; design for **~390–430px width**.

## Touch and density

- Tap targets ≥ 44px (`py-2.5`+ on buttons; tab items already padded).
- Prefer stacked cards over wide tables. Horizontal chips: `flex gap-2 overflow-x-auto`.
- Browseable collections (market, listings, order history) still need search, sort, and pagination — see `.cursor/skills/table-filters/SKILL.md`. Use a sort `Select`, not desktop `<th>` headers.
- Sticky headers only if they still fit under the forest `Top` bar.
- Use `Modal` from `ui.jsx` for create/edit sheets (bottom sheet on small screens).

## UI building blocks

From `ui.jsx`: `Button`, `Card`, `Field`, `Input`, `Textarea`, `Select`, `Modal`, `Empty`, `Pill`, `Avatar`.

From `commerce.jsx`:

- `StatusPill`, `Timeline`, `OrderItems` for the queue.
- `FarmerContact` whenever a buyer needs phone + farm address (always remind: no in-app payment).
- `ChatThread` for farmer/buyer messaging.

Icons: `lucide-react` only. Money: `peso()`. Guide comparison: `priceTag`, `priceWithinGuide`, `listingPriceError`.

## Role rules

**Farmer**

- List produce; prices must stay inside admin guide min–max.
- Live order queue: `queued → confirmed → preparing → ready → completed`. Advance status; reorder with queue APIs.
- Show buyer name/contact for fulfillment, not payment collection in-app.

**Buyer**

- Browse against guide prices; place orders; track status.
- After order, show farmer phone and location. Payment is arranged off-app.
- Never add cart checkout, card fields, or wallets.

## LAN / device testing

Vite and the API listen on `0.0.0.0`. After `npm run dev`:

1. Use the Vite **Network** URL: `http://<lan-ip>:5173`
2. Sign in with a farmer or buyer demo account (see README).
3. Confirm the view is full-screen (no desktop phone bezel on a real phone).
4. Hit `/api` through the Vite proxy only — do not hardcode `localhost:4000` in client code.

If another device cannot connect, check macOS Firewall for Node/Vite.

## Do not

- Introduce React Native, Capacitor, or a second mobile repo unless explicitly requested.
- Use desktop tables or `lg:grid` admin layouts inside farmer/buyer pages.
- Drop `safe-bottom` on tab-root pages (content will sit under the nav).
- Process payments or hide farmer contact after an order.
