---
name: web-app-development
description: >-
  Build PalayUP admin web console and public web pages (login, register,
  terms, privacy, refund, docs). Use when adding admin screens, desktop
  layouts, tables, settings, legal pages, routing, or working in
  client/src/pages/admin*.jsx, Login.jsx, Register.jsx, Docs.jsx, App.jsx,
  or AdminShell.
---

# PalayUP web app development

Admin is a **desktop-first console**. Public pages (auth + policies + docs) are full-width web, not the phone frame.

## Surfaces

| Surface | Shell | Routes | Files |
| --- | --- | --- | --- |
| Admin console | `AdminShell` | `/admin/*` | `client/src/pages/admin.jsx`, `admin-home.jsx` |
| Auth | none | `/login`, `/register` | `Login.jsx`, `Register.jsx` |
| Legal / docs | none | `/terms`, `/privacy`, `/refund`, `/docs` | matching page files |

Do **not** wrap admin or public pages in `MobileShell`. Farmer/buyer work belongs in the mobile skill.

## Add an admin page

1. Export a named page from `client/src/pages/admin.jsx` (or a sibling file re-exported there).
2. Register the route in `client/src/App.jsx` under the `/admin` `Guard roles={["admin"]}`.
3. Add a sidebar item in `links` inside `client/src/components/shells.jsx` (`AdminShell`).
4. Call `api.*` then `await refresh()` from `useStore()`. Do not mutate local store as source of truth.

## Layout

- Page root: `space-y-5` (or `space-y-6`).
- Titles: `font-display text-3xl` (page) / `text-xl` (section).
- Content sits in `AdminShell` `<main>` (`max-w-[1400px]`). Do not add another app chrome.
- Tables: `rounded-3xl border border-forest-100 bg-white`, thead `bg-forest-50 text-xs uppercase text-forest-600`.
- Filters: `flex flex-wrap gap-3` with `Input` / `Select` from `ui.jsx`.
- Every data table and collection list must include **search, sorting, and pagination** via `useTableQuery`, `SortTh`, and `TablePager`. Follow `.cursor/skills/table-filters/SKILL.md`.
- Stats: `Stat` / `Card` from `ui.jsx`; charts via `recharts` only on admin home.

## UI building blocks

Reuse `client/src/components/ui.jsx`: `Logo`, `Button`, `Field`, `Input`, `Textarea`, `Select`, `Card`, `Avatar`, `Pill`, `Modal`, `Empty`, `Stat`.

Reuse `client/src/components/commerce.jsx` for orders/chat: `StatusPill`, `Timeline`, `OrderItems`, `ChatThread`.

Buttons: `primary` | `secondary` | `ghost` | `danger` | `outline`. Compact table actions: `className="!py-1 !text-xs"`.

Icons: `lucide-react` only.

## Brand

- App name: **PalayUP** (never PalayApp).
- Colors: `forest-*` (`900` `#0B3D2E`, `400` `#52B788`, `50`/`100` pale).
- Type: `font-display` (Fraunces) for titles; body is Plus Jakarta Sans via `font-sans`.
- Radius: `rounded-2xl` controls, `rounded-3xl` cards.

## Data and API

- Client API lives in `client/src/api.js` (relative `/api/...` via Vite proxy). Add a method there before calling new endpoints.
- After writes: `await refresh()`.
- Money: `peso()` from `format.js`. People/places: `userById`, `locLine`, `when`, `priceTag`.
- Guide prices sync from DA Bantay Presyo (`server/bantayPresyo.js`) every 6 hours and via admin **Sync now**. Farmers must list within min–max. PalayUP **does not process payments**.

## Auth and public pages

- `Guard` sends unauthenticated users to `/login`.
- Register requires agreement to Terms, Privacy, and Refund (`/terms`, `/privacy`, `/refund`).
- Legal pages: Logo, `font-display` H1, “Last updated”, white `rounded-3xl` card, footer cross-links.
- Keep `/docs` in sync when admin features change.

## Do not

- Introduce CSS modules, a new UI kit, or Tailwind colors outside `forest`.
- Add in-app checkout, wallets, or payment processors.
- Put farmer/buyer screens in the admin sidebar.
- Bind Vite to localhost-only; LAN access is required (`server.host: true` in `vite.config.js`).
