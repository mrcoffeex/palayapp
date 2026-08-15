import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store.jsx";
import { api } from "../api.js";
import { peso, when, userById, locLine, priceTag } from "../format.js";
import { useTableQuery } from "../useTableQuery.js";
import { Button, Card, Field, Input, Select, Textarea, Empty, Pill, SortTh, TablePager, Modal } from "../components/ui.jsx";
import { ChatThread, StatusPill, Timeline, OrderItems } from "../components/commerce.jsx";

export { AdminHome } from "./admin-home.jsx";

const emptyUserForm = {
  role: "buyer",
  name: "",
  email: "",
  password: "",
  phone: "",
  farmName: "",
  address: "",
  city: "",
  province: "",
  status: "active",
  verified: false,
};

function formFromUser(u) {
  return {
    role: u.role,
    name: u.name,
    email: u.email,
    password: "",
    phone: u.phone || "",
    farmName: u.farmName || "",
    address: u.location?.address || "",
    city: u.location?.city || "",
    province: u.location?.province || "",
    status: u.status || "active",
    verified: Boolean(u.verified),
  };
}

function UserAccountForm({ form, setForm, isEdit, isSelf, error }) {
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <div className="space-y-3">
      <Field label="Role">
        <Select value={form.role} onChange={(e) => set("role", e.target.value)} disabled={isSelf}>
          <option value="buyer">Buyer</option>
          <option value="farmer">Farmer / merchant</option>
          <option value="admin">Admin</option>
        </Select>
      </Field>
      {isSelf && <p className="text-xs text-forest-600">You cannot change your own role.</p>}
      <Field label="Full name">
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
      </Field>
      {form.role === "farmer" && (
        <Field label="Farm name">
          <Input value={form.farmName} onChange={(e) => set("farmName", e.target.value)} required />
        </Field>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
        </Field>
      </div>
      <Field label={isEdit ? "New password" : "Password"}>
        <Input
          type="password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          required={!isEdit}
          placeholder={isEdit ? "Leave blank to keep current" : ""}
        />
      </Field>
      <Field label="Address">
        <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="City">
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
        </Field>
        <Field label="Province">
          <Input value={form.province} onChange={(e) => set("province", e.target.value)} />
        </Field>
      </div>
      {isEdit && (
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set("status", e.target.value)} disabled={isSelf}>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </Select>
        </Field>
      )}
      {form.role === "farmer" && (
        <label className="flex items-center gap-2 text-sm text-forest-800">
          <input type="checkbox" checked={form.verified} onChange={(e) => set("verified", e.target.checked)} />
          Verified farm
        </label>
      )}
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}

export function AdminUsers() {
  const { data, refresh } = useStore();
  const [role, setRole] = useState("all");
  const [mode, setMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyUserForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const scoped = useMemo(
    () => data.users.filter((u) => role === "all" || u.role === role),
    [data.users, role]
  );
  const table = useTableQuery(scoped, {
    searchText: (u) => `${u.name} ${u.email} ${u.farmName || ""} ${locLine(u.location)} ${u.phone} ${u.role}`,
    getValue: (u, key) => (key === "location" ? locLine(u.location) : u[key]),
    defaultSortKey: "name",
  });

  const patch = async (id, body) => {
    await api.patchUser(id, body);
    await refresh();
  };

  const openCreate = () => {
    setMode("create");
    setEditing(null);
    setForm(emptyUserForm);
    setError("");
  };

  const openEdit = (user) => {
    setMode("edit");
    setEditing(user);
    setForm(formFromUser(user));
    setError("");
  };

  const closeForm = () => {
    setMode(null);
    setEditing(null);
    setError("");
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      role: form.role,
      name: form.name,
      email: form.email,
      phone: form.phone,
      farmName: form.role === "farmer" ? form.farmName : "",
      verified: form.role === "farmer" ? form.verified : false,
      status: form.status,
      location: { address: form.address, city: form.city, province: form.province, lat: 0, lng: 0 },
    };
    if (form.password) payload.password = form.password;
    try {
      if (mode === "create") await api.createUser(payload);
      else await api.patchUser(editing.id, payload);
      await refresh();
      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl">Users</h1>
        <Button onClick={openCreate}>Create account</Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search people or farms" value={table.search} onChange={(e) => table.setSearch(e.target.value)} className="max-w-sm" />
        <Select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            table.setPage(1);
          }}
          className="max-w-[180px]"
        >
          <option value="all">All roles</option>
          <option value="admin">Admins</option>
          <option value="farmer">Farmers</option>
          <option value="buyer">Buyers</option>
        </Select>
      </div>
      <div className="overflow-hidden rounded-3xl border border-forest-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-forest-50 text-xs uppercase text-forest-600">
            <tr>
              <SortTh column="name" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort}>Person</SortTh>
              <SortTh column="role" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort}>Role</SortTh>
              <SortTh column="location" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort}>Location</SortTh>
              <SortTh column="phone" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort}>Contact</SortTh>
              <SortTh column="status" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort}>Status</SortTh>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((u) => (
              <tr key={u.id} className="border-t border-forest-50">
                <td className="px-4 py-3">
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-xs text-forest-600">{u.farmName || u.email}</p>
                </td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3 text-xs">{locLine(u.location)}</td>
                <td className="px-4 py-3 text-xs">{u.phone}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {u.role === "farmer" && (
                      <Button variant="secondary" className="!py-1 !text-xs" onClick={() => patch(u.id, { verified: !u.verified })}>
                        {u.verified ? "Verified" : "Verify"}
                      </Button>
                    )}
                    <Button
                      variant={u.status === "active" ? "outline" : "primary"}
                      className="!py-1 !text-xs"
                      disabled={u.id === data.me.id}
                      onClick={() => patch(u.id, { status: u.status === "active" ? "suspended" : "active" })}
                    >
                      {u.status}
                    </Button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" className="!py-1 !text-xs" onClick={() => openEdit(u)}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!table.total && <Empty title="No users match" body="Try another search or role filter." />}
        <TablePager
          page={table.page}
          pageCount={table.pageCount}
          total={table.total}
          from={table.from}
          to={table.to}
          pageSize={table.pageSize}
          onPage={table.setPage}
          onPageSize={table.setPageSize}
        />
      </div>
      {mode && (
        <Modal title={mode === "create" ? "Create account" : "Edit account"} onClose={closeForm}>
          <form className="space-y-4" onSubmit={save}>
            <UserAccountForm
              form={form}
              setForm={setForm}
              isEdit={mode === "edit"}
              isSelf={editing?.id === data.me.id}
              error={error}
            />
            <Button className="w-full" disabled={busy}>
              {busy ? "Saving…" : mode === "create" ? "Create account" : "Save changes"}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function AdminProducts() {
  const { data, refresh } = useStore();
  const table = useTableQuery(data.products, {
    searchText: (p) => `${p.name} ${p.category} ${userById(data.users, p.farmerId)?.farmName || ""} ${p.status}`,
    defaultSortKey: "name",
  });
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl">Products</h1>
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search listings, farms, or category" value={table.search} onChange={(e) => table.setSearch(e.target.value)} className="max-w-sm" />
        <Select
          value={`${table.sortKey}:${table.sortDir}`}
          onChange={(e) => {
            const [key, dir] = e.target.value.split(":");
            table.setSort(key, dir);
          }}
          className="max-w-[200px]"
        >
          <option value="name:asc">Name A–Z</option>
          <option value="name:desc">Name Z–A</option>
          <option value="price:asc">Price low–high</option>
          <option value="price:desc">Price high–low</option>
          <option value="stock:asc">Stock low–high</option>
          <option value="stock:desc">Stock high–low</option>
          <option value="category:asc">Category</option>
        </Select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {table.rows.map((p) => {
          const farmer = userById(data.users, p.farmerId);
          const tag = priceTag(p, data.guidePrices);
          return (
            <Card key={p.id} className="overflow-hidden !p-0">
              <img src={p.image} alt="" className="h-36 w-full object-cover" />
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-forest-600">{farmer?.farmName}</p>
                  </div>
                  <Pill className={p.status === "active" ? "bg-forest-100 text-forest-800" : "bg-stone-100"}>{p.status}</Pill>
                </div>
                <p className="font-display text-2xl">{peso(p.price)}<span className="text-sm text-forest-600">/{p.unit}</span></p>
                <Pill className={tag.tone}>{tag.label}</Pill>
                <p className="text-xs text-forest-600">Stock {p.stock}{p.unit} · {p.category}</p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    await api.patchProduct(p.id, { status: p.status === "active" ? "hidden" : "active" });
                    await refresh();
                  }}
                >
                  {p.status === "active" ? "Hide listing" : "Restore listing"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      {!table.total && <Empty title="No listings match" body="Try another search or sort." />}
      <div className="overflow-hidden rounded-3xl border border-forest-100 bg-white">
        <TablePager
          page={table.page}
          pageCount={table.pageCount}
          total={table.total}
          from={table.from}
          to={table.to}
          pageSize={table.pageSize}
          onPage={table.setPage}
          onPageSize={table.setPageSize}
        />
      </div>
    </div>
  );
}

export function AdminPricing() {
  const { data, refresh } = useStore();
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: "", category: "Vegetables", unit: "kg", averagePrice: "", minPrice: "", maxPrice: "", notes: "" });
  const [region, setRegion] = useState(data.settings?.bantayPresyo?.region || "130000000");
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const table = useTableQuery(data.guidePrices, {
    searchText: (g) => `${g.name} ${g.category} ${g.notes || ""}`,
    defaultSortKey: "name",
  });
  const sync = data.settings?.bantayPresyo || {};

  const save = async (e) => {
    e.preventDefault();
    if (edit) await api.patchGuide(edit.id, form);
    else await api.createGuide(form);
    setEdit(null);
    setForm({ name: "", category: "Vegetables", unit: "kg", averagePrice: "", minPrice: "", maxPrice: "", notes: "" });
    await refresh();
  };

  const runSync = async () => {
    setSyncing(true);
    setSyncError("");
    try {
      await api.syncGuidePrices({ region });
      await refresh();
    } catch (err) {
      setSyncError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Average pricing guide</h1>
          <p className="text-sm text-forest-600">Farmers must price listings within each product’s min–max range. Buyers use the same guide to compare before they contact a farmer.</p>
        </div>
        <Button onClick={() => { setEdit(null); setForm({ name: "", category: "Vegetables", unit: "kg", averagePrice: "", minPrice: "", maxPrice: "", notes: "" }); }}>
          New guide price
        </Button>
      </div>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl">Bantay Presyo sync</h2>
            <p className="mt-1 text-sm text-forest-700">
              Guide prices pull automatically from{" "}
              <a href="http://www.bantaypresyo.da.gov.ph/" target="_blank" rel="noreferrer" className="font-semibold underline">
                DA Bantay Presyo
              </a>{" "}
              every 6 hours. Min–max is the retail range across monitored markets; the average is the mean of those prices.
            </p>
            <p className="mt-2 text-xs text-forest-600">
              {sync.lastSyncAt
                ? `Last sync ${when(sync.lastSyncAt)}${sync.asOf ? ` · DA as of ${sync.asOf}` : ""}${sync.regionLabel ? ` · ${sync.regionLabel}` : ""}${sync.updated != null ? ` · ${sync.updated} updated, ${sync.created || 0} added` : ""}`
                : "Not synced yet — run a sync or wait for the next automatic update."}
            </p>
            {sync.error && <p className="mt-1 text-xs text-rose-600">{sync.error}</p>}
            {syncError && <p className="mt-1 text-xs text-rose-600">{syncError}</p>}
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Region">
              <Select value={region} onChange={(e) => setRegion(e.target.value)} className="min-w-[220px]">
                <option value="130000000">NCR (National Capital Region)</option>
                <option value="030000000">Region III (Central Luzon)</option>
                <option value="040000000">Region IV-A (CALABARZON)</option>
                <option value="140000000">CAR (Cordillera)</option>
                <option value="010000000">Region I (Ilocos)</option>
                <option value="070000000">Region VII (Central Visayas)</option>
                <option value="110000000">Region XI (Davao)</option>
              </Select>
            </Field>
            <Button type="button" disabled={syncing} onClick={runSync}>
              {syncing ? "Syncing…" : "Sync now"}
            </Button>
          </div>
        </div>
      </Card>
      <Input
        placeholder="Search products or categories"
        value={table.search}
        onChange={(e) => table.setSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="overflow-hidden rounded-3xl border border-forest-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-forest-50 text-xs uppercase text-forest-600">
              <tr>
                <SortTh column="name" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort}>Product</SortTh>
                <SortTh column="averagePrice" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort}>Average</SortTh>
                <SortTh column="minPrice" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort}>Range</SortTh>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((g) => (
                <tr key={g.id} className="border-t border-forest-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{g.name}</p>
                    <p className="text-xs text-forest-600">{g.category} · updated {when(g.updatedAt)}</p>
                    {String(g.notes || "").includes("Bantay Presyo") && (
                      <Pill className="mt-1 bg-forest-100 text-forest-800">Bantay Presyo</Pill>
                    )}
                  </td>
                  <td className="px-4 py-3 font-display text-lg">{peso(g.averagePrice)}/{g.unit}</td>
                  <td className="px-4 py-3 text-xs">{peso(g.minPrice)} – {peso(g.maxPrice)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" onClick={() => { setEdit(g); setForm(g); }}>Edit</Button>
                    <Button variant="ghost" onClick={async () => { await api.deleteGuide(g.id); await refresh(); }}>Remove</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!table.total && <Empty title="No guide prices match" body="Try another search or add a new guide." />}
          <TablePager
            page={table.page}
            pageCount={table.pageCount}
            total={table.total}
            from={table.from}
            to={table.to}
            pageSize={table.pageSize}
            onPage={table.setPage}
            onPageSize={table.setPageSize}
          />
        </div>
        <Card>
          <h2 className="font-display text-xl">{edit ? "Update guide" : "Upload guide price"}</h2>
          <form className="mt-4 space-y-3" onSubmit={save}>
            <Field label="Product name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {["Grains", "Vegetables", "Fruits", "Root crops", "Herbs"].map((c) => <option key={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Unit"><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
            </div>
            <Field label="Average price"><Input type="number" value={form.averagePrice} onChange={(e) => setForm({ ...form, averagePrice: e.target.value })} required /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Min"><Input type="number" value={form.minPrice} onChange={(e) => setForm({ ...form, minPrice: e.target.value })} /></Field>
              <Field label="Max"><Input type="number" value={form.maxPrice} onChange={(e) => setForm({ ...form, maxPrice: e.target.value })} /></Field>
            </div>
            <Field label="Notes"><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
            <Button className="w-full">{edit ? "Save changes" : "Publish guide"}</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export function AdminOrders() {
  const { data, refresh } = useStore();
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("all");
  const scoped = useMemo(
    () => data.orders.filter((o) => status === "all" || o.status === status),
    [data.orders, status]
  );
  const table = useTableQuery(scoped, {
    searchText: (o) => {
      const farmer = userById(data.users, o.farmerId);
      const buyer = userById(data.users, o.buyerId);
      return `${o.id} ${o.status} ${buyer?.name || ""} ${farmer?.farmName || ""}`;
    },
    getValue: (o, key) => {
      if (key === "parties") {
        const farmer = userById(data.users, o.farmerId);
        const buyer = userById(data.users, o.buyerId);
        return `${buyer?.name || ""} ${farmer?.farmName || ""}`;
      }
      return o[key];
    },
    defaultSortKey: "id",
  });
  const order = data.orders.find((o) => o.id === selected);
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl">Orders</h1>
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search order, buyer, or farm"
          value={table.search}
          onChange={(e) => table.setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            table.setPage(1);
          }}
          className="max-w-[180px]"
        >
          <option value="all">All statuses</option>
          {["queued", "confirmed", "preparing", "ready", "completed", "cancelled"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-3xl border border-forest-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-forest-50 text-xs uppercase text-forest-600">
              <tr>
                <SortTh column="id" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort}>Order</SortTh>
                <SortTh column="parties" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort}>Parties</SortTh>
                <SortTh column="total" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort}>Total</SortTh>
                <SortTh column="status" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort}>Status</SortTh>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((o) => {
                const farmer = userById(data.users, o.farmerId);
                const buyer = userById(data.users, o.buyerId);
                return (
                  <tr key={o.id} className="cursor-pointer border-t border-forest-50 hover:bg-forest-50" onClick={() => setSelected(o.id)}>
                    <td className="px-4 py-3 font-semibold">{o.id.toUpperCase()}</td>
                    <td className="px-4 py-3 text-xs">{buyer?.name} → {farmer?.farmName}</td>
                    <td className="px-4 py-3">{peso(o.total)}</td>
                    <td className="px-4 py-3"><StatusPill status={o.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!table.total && <Empty title="No orders match" body="Try another search or status filter." />}
          <TablePager
            page={table.page}
            pageCount={table.pageCount}
            total={table.total}
            from={table.from}
            to={table.to}
            pageSize={table.pageSize}
            onPage={table.setPage}
            onPageSize={table.setPageSize}
          />
        </div>
        <Card>
          {!order && <p className="text-sm text-forest-600">Select an order to inspect status history.</p>}
          {order && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl">{order.id.toUpperCase()}</h2>
                <StatusPill status={order.status} />
              </div>
              <OrderItems items={order.items} />
              <Timeline history={order.statusHistory} />
              {!["completed", "cancelled"].includes(order.status) && (
                <Select
                  onChange={async (e) => {
                    if (!e.target.value) return;
                    await api.setOrderStatus(order.id, { status: e.target.value, note: "Updated by admin" });
                    await refresh();
                  }}
                >
                  <option value="">Advance status</option>
                  {["queued", "confirmed", "preparing", "ready", "completed", "cancelled"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export function AdminChat() {
  const { data } = useStore();
  const [id, setId] = useState(data.conversations[0]?.id);
  const table = useTableQuery(data.conversations, {
    searchText: (c) => {
      const farmer = userById(data.users, c.farmerId);
      const buyer = userById(data.users, c.buyerId);
      return `${buyer?.name || ""} ${farmer?.farmName || ""} ${c.lastMessage || ""}`;
    },
    defaultSortKey: "lastAt",
    defaultSortDir: "desc",
  });
  const convo = data.conversations.find((c) => c.id === id);
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl">Chat monitor</h1>
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search buyer, farm, or message"
          value={table.search}
          onChange={(e) => table.setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={`${table.sortKey}:${table.sortDir}`}
          onChange={(e) => {
            const [key, dir] = e.target.value.split(":");
            table.setSort(key, dir);
          }}
          className="max-w-[200px]"
        >
          <option value="lastAt:desc">Newest first</option>
          <option value="lastAt:asc">Oldest first</option>
        </Select>
      </div>
      <div className="grid overflow-hidden rounded-3xl border border-forest-100 bg-white lg:grid-cols-[280px_1fr]">
        <div className="border-b border-forest-100 lg:border-b-0 lg:border-r">
          {table.rows.map((c) => {
            const farmer = userById(data.users, c.farmerId);
            const buyer = userById(data.users, c.buyerId);
            return (
              <button key={c.id} onClick={() => setId(c.id)} className={`block w-full px-4 py-3 text-left hover:bg-forest-50 ${id === c.id ? "bg-forest-50" : ""}`}>
                <p className="text-sm font-semibold">{buyer?.name} ↔ {farmer?.farmName}</p>
                <p className="truncate text-xs text-forest-600">{c.lastMessage}</p>
              </button>
            );
          })}
          {!table.total && <Empty title="No chats match" body="Try another search." />}
          <TablePager
            page={table.page}
            pageCount={table.pageCount}
            total={table.total}
            from={table.from}
            to={table.to}
            pageSize={table.pageSize}
            onPage={table.setPage}
            onPageSize={table.setPageSize}
          />
        </div>
        <ChatThread me={data.me} users={data.users} conversation={convo} messages={data.messages} readOnly />
      </div>
      <p className="text-xs text-forest-600">Admin can review conversations. Messaging remains between farmer and buyer.</p>
    </div>
  );
}

export function AdminNotifications() {
  const { data, refresh } = useStore();
  const table = useTableQuery(data.notifications, {
    searchText: (n) => `${n.title} ${n.body} ${n.type || ""}`,
    defaultSortKey: "createdAt",
    defaultSortDir: "desc",
  });
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Notifications</h1>
        <Button variant="secondary" onClick={async () => { await api.readAllNotifications(); await refresh(); }}>Mark all read</Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search notifications"
          value={table.search}
          onChange={(e) => table.setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={`${table.sortKey}:${table.sortDir}`}
          onChange={(e) => {
            const [key, dir] = e.target.value.split(":");
            table.setSort(key, dir);
          }}
          className="max-w-[200px]"
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="createdAt:asc">Oldest first</option>
          <option value="title:asc">Title A–Z</option>
        </Select>
      </div>
      <div className="space-y-3">
        {table.rows.map((n) => (
          <Card key={n.id} className={n.read ? "opacity-70" : ""}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{n.title}</p>
                <p className="text-sm text-forest-600">{n.body}</p>
                <p className="mt-1 text-xs text-forest-500">{when(n.createdAt)} · {n.type}</p>
              </div>
              {!n.read && (
                <Button variant="ghost" onClick={async () => { await api.readNotification(n.id); await refresh(); }}>Read</Button>
              )}
            </div>
          </Card>
        ))}
        {!table.total && <Empty title="All clear" body="No notifications match this search." />}
      </div>
      <div className="overflow-hidden rounded-3xl border border-forest-100 bg-white">
        <TablePager
          page={table.page}
          pageCount={table.pageCount}
          total={table.total}
          from={table.from}
          to={table.to}
          pageSize={table.pageSize}
          onPage={table.setPage}
          onPageSize={table.setPageSize}
        />
      </div>
    </div>
  );
}

export function AdminSettings() {
  const { data, refresh, logout } = useStore();
  const [form, setForm] = useState(data.settings);
  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="font-display text-3xl">Settings</h1>
      <Card>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            await api.patchSettings(form);
            await refresh();
          }}
        >
          <Field label="App name"><Input value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} /></Field>
          <Field label="Tagline"><Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></Field>
          <Field label="Support email"><Input value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} /></Field>
          <Field label="Support phone"><Input value={form.supportPhone} onChange={(e) => setForm({ ...form, supportPhone: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.allowRegistration} onChange={(e) => setForm({ ...form, allowRegistration: e.target.checked })} />
            Allow farmer and buyer registration
          </label>
          <Field label="Guide price note"><Textarea rows={4} value={form.guidePriceNote} onChange={(e) => setForm({ ...form, guidePriceNote: e.target.value })} /></Field>
          <Field label="No-payment note"><Textarea rows={3} value={form.noPaymentNote} onChange={(e) => setForm({ ...form, noPaymentNote: e.target.value })} /></Field>
          <Button>Save settings</Button>
        </form>
        <p className="mt-4 text-sm">
          <Link to="/docs" className="font-semibold text-forest-800 underline">
            Open documentation
          </Link>
        </p>
      </Card>
      <Card>
        <h2 className="font-semibold">Demo data</h2>
        <p className="mt-1 text-sm text-forest-600">Reset restores the original farmers, buyers, products, and orders.</p>
        <Button
          variant="danger"
          className="mt-4"
          onClick={async () => {
            await api.reset();
            await logout();
          }}
        >
          Reset platform data
        </Button>
      </Card>
    </div>
  );
}
