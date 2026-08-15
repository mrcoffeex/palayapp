import { useMemo, useState } from "react";

export const PAGE_SIZES = [10, 25, 50];

function getByPath(row, path) {
  if (!path) return row;
  return String(path)
    .split(".")
    .reduce((acc, key) => acc?.[key], row);
}

function compareValues(a, b, dir) {
  const empty = (v) => v == null || v === "";
  if (empty(a) && empty(b)) return 0;
  if (empty(a)) return 1;
  if (empty(b)) return -1;

  const as = typeof a === "string" ? a : String(a);
  const bs = typeof b === "string" ? b : String(b);
  const ad = Date.parse(as);
  const bd = Date.parse(bs);
  const bothDates = !Number.isNaN(ad) && !Number.isNaN(bd) && as.length >= 8 && bs.length >= 8;
  const an = Number(a);
  const bn = Number(b);
  const bothNums = Number.isFinite(an) && Number.isFinite(bn) && as.trim() !== "" && bs.trim() !== "";

  let cmp = 0;
  if (bothDates) cmp = ad - bd;
  else if (bothNums) cmp = an - bn;
  else cmp = as.localeCompare(bs, "en", { numeric: true, sensitivity: "base" });
  return dir === "desc" ? -cmp : cmp;
}

export function applyTableQuery(rows, {
  search = "",
  searchKeys = [],
  searchText,
  getValue,
  sortKey,
  sortDir = "asc",
  page = 1,
  pageSize = 10,
} = {}) {
  const valueOf = (row, key) => (getValue ? getValue(row, key) : getByPath(row, key));
  const q = search.trim().toLowerCase();
  let next = Array.isArray(rows) ? [...rows] : [];

  if (q) {
    next = next.filter((row) => {
      const hay = searchText
        ? String(searchText(row) || "")
        : searchKeys.map((key) => valueOf(row, key) ?? "").join(" ");
      return hay.toLowerCase().includes(q);
    });
  }

  next.sort((a, b) => compareValues(valueOf(a, sortKey), valueOf(b, sortKey), sortDir));

  const total = next.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;

  return {
    rows: next.slice(start, start + pageSize),
    total,
    page: safePage,
    pageCount,
    from: total ? start + 1 : 0,
    to: Math.min(start + pageSize, total),
  };
}

export function useTableQuery(rows, options = {}) {
  const {
    searchKeys = [],
    searchText,
    getValue,
    defaultSortKey,
    defaultSortDir = "asc",
    defaultPageSize = 10,
  } = options;

  const [search, setSearchState] = useState("");
  const [sortKey, setSortKey] = useState(defaultSortKey || searchKeys[0] || "id");
  const [sortDir, setSortDir] = useState(defaultSortDir);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);

  const setSearch = (value) => {
    setSearchState(value);
    setPage(1);
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const setSort = (key, dir = "asc") => {
    setSortKey(key);
    setSortDir(dir);
    setPage(1);
  };

  const setPageSize = (size) => {
    setPageSizeState(Number(size) || 10);
    setPage(1);
  };

  const result = useMemo(
    () =>
      applyTableQuery(rows, {
        search,
        searchKeys,
        searchText,
        getValue,
        sortKey,
        sortDir,
        page,
        pageSize,
      }),
    [rows, search, searchKeys, searchText, sortKey, sortDir, page, pageSize, getValue]
  );

  return {
    ...result,
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    setSort,
    pageSize,
    setPageSize,
    setPage,
  };
}
