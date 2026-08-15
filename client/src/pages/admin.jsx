import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useStore } from "../store.jsx";
import { api } from "../api.js";
import { peso, when, userById, locLine, priceTag } from "../format.js";
import { Button, Card, Field, Input, Select, Textarea, Stat, Empty, Pill } from "../components/ui.jsx";
import { ChatThread, StatusPill, Timeline, OrderItems } from "../components/commerce.jsx";

export function AdminHome() {
  const { data } = useStore();
  const farmers = data.users.filter((u) => u.role === "farmer");
  const buyers = data.users.filter((u) => u.role === "buyer");
  const open = data.orders.filter((o) => !["completed", "cancelled"].includes(o.status));
  const chart = useMemo(() => {
    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      const total = data.orders
        .filter((o) => o.createdAt.slice(0, 10) === key)
        .reduce((s, o) => s + o.total, 0);
      return { name: d.toLocaleDateString("en-PH", { weekday: "short" }), total };
    });
    return days;
  }, [data.orders]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-forest-600">Admin console</p>
        <h1 className="font-display text-4xl text-forest-950">Platform overview</h1>
        <p className="mt-1 text-forest-600">Track farmers, buyers, products, prescribed prices, orders, and conversations.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Farmers" value={farmers.length} hint={`${farmers.filter((f) => f.verified).length} verified`} />
        <Stat label="Buyers" value={buyers.length} hint="Active marketplace demand" />
        <Stat label="Open orders" value={open.length} hint={`${peso(open.reduce((s, o) => s + o.total, 0))} in queue`} />
        <Stat label="Listings" value={data.products.filter((p) => p.status === "active").length} hint={`${data.guidePrices.length} guide prices`} />
      </div>
      <Card>
        <p className="text-sm font-semibold text-forest-800">Order value · last 7 days</p>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => peso(v)} />
              <Area type="monotone" dataKey="total" stroke="#14532D" fill="#95D5B2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

export function AdminUsers() {
  const { data, refresh } = useStore();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const list = data.users
    .filter((u) => u.role !== "admin")
    .filter((u) => role === "all" || u.role === role)
    .filter((u) => `${u.name} ${u.email} ${u.farmName || ""}`.toLowerCase().includes(q.toLowerCase()));

  const patch = async (id, body) => {
    await api.patchUser(id, body);
    await refresh();
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl">Users · farmers & buyers</h1>
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search people or farms" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="max-w-[180px]">
          <option value="all">All roles</option>
          <option value="farmer">Farmers</option>
          <option value="buyer">Buyers</option>
        </Select>
      </div>
      <div className="overflow-hidden rounded-3xl border border-forest-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-forest-50 text-xs uppercase text-forest-600">
            <tr>
              <th className="px-4 py-3">Person</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
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
                      onClick={() => patch(u.id, { status: u.status === "active" ? "suspended" : "active" })}
                    >
                      {u.status}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminProducts() {
  const { data, refresh } = useStore();
  const [q, setQ] = useState("");
  const list = data.products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl">Products</h1>
      <Input placeholder="Search listings" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => {
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
    </div>
  );
}

export function AdminPricing() {
  const { data, refresh } = useStore();
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: "", category: "Vegetables", unit: "kg", averagePrice: "", minPrice: "", maxPrice: "", notes: "" });

  const save = async (e) => {
    e.preventDefault();
    if (edit) await api.patchGuide(edit.id, form);
    else await api.createGuide(form);
    setEdit(null);
    setForm({ name: "", category: "Vegetables", unit: "kg", averagePrice: "", minPrice: "", maxPrice: "", notes: "" });
    await refresh();
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
      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="overflow-hidden rounded-3xl border border-forest-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-forest-50 text-xs uppercase text-forest-600">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Average</th>
                <th className="px-4 py-3">Range</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.guidePrices.map((g) => (
                <tr key={g.id} className="border-t border-forest-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{g.name}</p>
                    <p className="text-xs text-forest-600">{g.category} · updated {when(g.updatedAt)}</p>
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
  const order = data.orders.find((o) => o.id === selected);
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl">Orders</h1>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-3xl border border-forest-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-forest-50 text-xs uppercase text-forest-600">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Parties</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((o) => {
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
  const convo = data.conversations.find((c) => c.id === id);
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl">Chat monitor</h1>
      <div className="grid overflow-hidden rounded-3xl border border-forest-100 bg-white lg:grid-cols-[280px_1fr]">
        <div className="border-b border-forest-100 lg:border-b-0 lg:border-r">
          {data.conversations.map((c) => {
            const farmer = userById(data.users, c.farmerId);
            const buyer = userById(data.users, c.buyerId);
            return (
              <button key={c.id} onClick={() => setId(c.id)} className={`block w-full px-4 py-3 text-left hover:bg-forest-50 ${id === c.id ? "bg-forest-50" : ""}`}>
                <p className="text-sm font-semibold">{buyer?.name} ↔ {farmer?.farmName}</p>
                <p className="truncate text-xs text-forest-600">{c.lastMessage}</p>
              </button>
            );
          })}
        </div>
        <ChatThread me={data.me} users={data.users} conversation={convo} messages={data.messages} readOnly />
      </div>
      <p className="text-xs text-forest-600">Admin can review conversations. Messaging remains between farmer and buyer.</p>
    </div>
  );
}

export function AdminNotifications() {
  const { data, refresh } = useStore();
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Notifications</h1>
        <Button variant="secondary" onClick={async () => { await api.readAllNotifications(); await refresh(); }}>Mark all read</Button>
      </div>
      <div className="space-y-3">
        {data.notifications.map((n) => (
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
        {!data.notifications.length && <Empty title="All clear" body="No admin notifications yet." />}
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
