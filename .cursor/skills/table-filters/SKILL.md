---
name: table-filters
description: >-
  Always add search, sortable columns, and pagination to data tables and
  collection lists. Use when creating or editing tables, admin lists, data
  grids, <table> markup, product/order/user lists, or any browseable
  collection in PalayUP.
---

# Table search, sort, and pagination

Every data table and browseable collection **must** include all three: search, sorting, and pagination. Do not ship a table with only one or two.

## Required pipeline

Apply in this order on the **client** (store data is already loaded):

1. Extra filters (role, status, category) if the page has them
2. **Search** — case-insensitive match across relevant fields
3. **Sort** — one active column + direction
4. **Paginate** — slice the sorted result

Reset to page 1 when search, sort, extra filters, or page size change.

Use `useTableQuery` from `client/src/useTableQuery.js` plus `SortTh` and `TablePager` from `client/src/components/ui.jsx`. Do not invent a second paging API.

## UI (required)

Toolbar above the table, `flex flex-wrap gap-3`:

- `Input` search (placeholder names the fields, e.g. “Search people or farms”)
- Optional `Select` extra filters
- Optional `Select` sort when the view is **cards**, not a `<table>`

Table:

- Shell: `rounded-3xl border border-forest-100 bg-white`
- Thead: `bg-forest-50 text-xs uppercase text-forest-600`
- Sortable headers use `SortTh` (skip action-only columns)
- Empty matches: `Empty` inside the same card, not a blank `<tbody>`

Footer: `TablePager` under the rows (or under a card grid).

Default page size **10**. Offer 10 / 25 / 50.

## Checklist

Before finishing any table or collection view:

- [ ] Search input is wired and filters visible fields
- [ ] At least one column/control sorts; default sort is declared
- [ ] Pager shows range + total (`1–10 of 24`) and previous/next
- [ ] Page resets on search/sort/filter change
- [ ] Empty state when the filtered set is empty
- [ ] Mobile card lists that browse a collection get the same three controls (sort via `Select`, not wide `<th>`)

## Exceptions (only these)

- Static copy tables (e.g. demo accounts on `/docs`)
- Dashboard **previews** that show a fixed slice and link to the full list (“View all”)
- Forms, settings, and single-record detail panes

If you are unsure, add all three.

## Do not

- Render `data.*.map` straight into a `<table>` or card grid
- Paginate first, then search the current page
- Add a new table library (TanStack Table, AG Grid, etc.) unless the user asks
- Drop these controls on farmer/buyer screens that are collection views (search + sort + page still apply; use cards, not desktop tables)
