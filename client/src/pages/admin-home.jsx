import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BadgeDollarSign,
  Bell,
  ClipboardList,
  MapPin,
  MessageSquare,
  RefreshCw,
  ShoppingBasket,
  Sprout,
  Users,
  Wallet,
} from "lucide-react";
import { useStore } from "../store.jsx";
import { guideFor, peso, STATUS_META, userById, when } from "../format.js";
import { Button, Card, Pill, Stat } from "../components/ui.jsx";
import { StatusPill } from "../components/commerce.jsx";

const CAT_COLORS = ["#0B3D2E", "#14532D", "#2F9E66", "#52B788", "#95D5B2"];
const ALIGN_COLORS = { below: "#2F9E66", at: "#0B3D2E", above: "#D97706", none: "#A8A29E" };
const STATUS_COLORS = {
  queued: "#F59E0B",
  confirmed: "#0EA5E9",
  preparing: "#2F9E66",
  ready: "#10B981",
  completed: "#0B3D2E",
  cancelled: "#F43F5E",
};

const tooltipStyle = {
  borderRadius: 16,
  border: "1px solid #C8EDD8",
  boxShadow: "0 8px 24px -12px rgba(11, 61, 46, 0.2)",
};

function hoursAgo(iso) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 36e5));
}

function SectionTitle({ title, hint, to, linkLabel = "View all" }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-xl text-forest-950">{title}</h2>
        {hint && <p className="text-xs text-forest-600">{hint}</p>}
      </div>
      {to && (
        <Link to={to} className="text-xs font-semibold text-forest-700 hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export function AdminHome() {
  const { data, refresh } = useStore();

  const farmers = data.users.filter((u) => u.role === "farmer");
  const buyers = data.users.filter((u) => u.role === "buyer");
  const unverified = farmers.filter((f) => !f.verified);
  const activeListings = data.products.filter((p) => p.status === "active");
  const hiddenListings = data.products.filter((p) => p.status !== "active");
  const open = data.orders.filter((o) => !["completed", "cancelled"].includes(o.status));
  const completed = data.orders.filter((o) => o.status === "completed");
  const cancelled = data.orders.filter((o) => o.status === "cancelled");
  const unread = data.notifications.filter((n) => !n.read);
  const gmv = completed.reduce((s, o) => s + o.total, 0);
  const queueValue = open.reduce((s, o) => s + o.total, 0);
  const closedCount = completed.length + cancelled.length;
  const fillRate = data.orders.length ? Math.round((completed.length / data.orders.length) * 100) : 0;

  const week = useMemo(() => {
    return [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      const dayOrders = data.orders.filter((o) => o.createdAt.slice(0, 10) === key);
      return {
        name: d.toLocaleDateString("en-PH", { weekday: "short" }),
        total: dayOrders.reduce((s, o) => s + o.total, 0),
        count: dayOrders.length,
      };
    });
  }, [data.orders]);

  const statusBars = useMemo(
    () =>
      ["queued", "confirmed", "preparing", "ready", "completed", "cancelled"].map((status) => ({
        name: STATUS_META[status]?.label || status,
        status,
        value: data.orders.filter((o) => o.status === status).length,
      })),
    [data.orders]
  );

  const categoryMix = useMemo(() => {
    const counts = {};
    for (const p of activeListings) counts[p.category] = (counts[p.category] || 0) + 1;
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [activeListings]);

  const priceCompare = useMemo(
    () =>
      activeListings.map((p) => {
        const guide = guideFor(p, data.guidePrices);
        return {
          name: p.name.replace(/Premium |Highland |Crisp |Lakatan |Carabao |Yellow |Long /g, "").slice(0, 14),
          listing: p.price,
          average: guide?.averagePrice ?? 0,
        };
      }),
    [activeListings, data.guidePrices]
  );

  const priceAlign = useMemo(() => {
    let below = 0;
    let at = 0;
    let above = 0;
    let none = 0;
    for (const p of activeListings) {
      const guide = guideFor(p, data.guidePrices);
      if (!guide) none += 1;
      else if (p.price < guide.averagePrice) below += 1;
      else if (p.price > guide.averagePrice) above += 1;
      else at += 1;
    }
    return [
      { name: "Below average", key: "below", value: below },
      { name: "At average", key: "at", value: at },
      { name: "Above average", key: "above", value: above },
      { name: "No guide", key: "none", value: none },
    ].filter((row) => row.value > 0);
  }, [activeListings, data.guidePrices]);

  const provinces = useMemo(() => {
    const counts = {};
    for (const f of farmers) {
      const key = f.location?.province || "Unspecified";
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, farms]) => ({ name, farms }))
      .sort((a, b) => b.farms - a.farms);
  }, [farmers]);

  const topFarms = useMemo(() => {
    const totals = {};
    for (const o of data.orders) {
      if (o.status === "cancelled") continue;
      totals[o.farmerId] = (totals[o.farmerId] || 0) + o.total;
    }
    return Object.entries(totals)
      .map(([id, total]) => ({ farmer: userById(data.users, id), total }))
      .filter((row) => row.farmer)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [data.orders, data.users]);

  const maxFarmTotal = topFarms[0]?.total || 1;
  const lowStock = activeListings.filter((p) => p.stock < 100).sort((a, b) => a.stock - b.stock);
  const staleQueue = open.filter((o) => hoursAgo(o.createdAt) >= 6).sort((a, b) => hoursAgo(b.createdAt) - hoursAgo(a.createdAt));
  const recentOrders = [...data.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  const latestChats = [...data.conversations].sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt)).slice(0, 4);

  const attention = [
    ...unverified.map((f) => ({
      id: f.id,
      tone: "bg-amber-100 text-amber-800",
      title: `${f.farmName} is unverified`,
      body: `${f.name} · ${f.location?.province || "No location"}`,
      to: "/admin/users",
    })),
    ...staleQueue.map((o) => ({
      id: o.id,
      tone: "bg-rose-100 text-rose-800",
      title: `${o.id.toUpperCase()} waiting ${hoursAgo(o.createdAt)}h`,
      body: `${STATUS_META[o.status]?.label || o.status} · ${peso(o.total)}`,
      to: "/admin/orders",
    })),
    ...lowStock.slice(0, 3).map((p) => ({
      id: p.id,
      tone: "bg-amber-100 text-amber-800",
      title: `${p.name} stock is low`,
      body: `${p.stock}${p.unit} remaining`,
      to: "/admin/products",
    })),
    ...unread.slice(0, 3).map((n) => ({
      id: n.id,
      tone: "bg-sky-100 text-sky-800",
      title: n.title,
      body: n.body,
      to: "/admin/notifications",
    })),
  ].slice(0, 7);

  const clock = new Date().toLocaleString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-forest-600">Admin console</p>
          <h1 className="font-display text-4xl text-forest-950">Monitoring</h1>
          <p className="mt-1 max-w-2xl text-forest-600">
            Watch farms, listings, prescribed prices, and the live order pipeline from one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-forest-600">{clock}</p>
          <Button variant="outline" className="!py-2" onClick={refresh}>
            <RefreshCw size={15} /> Refresh
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Link to="/admin/users" className="block h-full">
          <Stat className="h-full" label="Farmers" value={farmers.length} hint={`${farmers.filter((f) => f.verified).length} verified · ${unverified.length} pending`} icon={Sprout} />
        </Link>
        <Link to="/admin/users" className="block h-full">
          <Stat className="h-full" label="Buyers" value={buyers.length} hint="Active marketplace demand" icon={Users} />
        </Link>
        <Link to="/admin/orders" className="block h-full">
          <Stat className="h-full" label="Open pipeline" value={open.length} hint={`${peso(queueValue)} in queue`} icon={ClipboardList} />
        </Link>
        <Link to="/admin/orders" className="block h-full">
          <Stat className="h-full" label="Completed value" value={peso(gmv)} hint={`${fillRate}% of orders completed`} icon={Wallet} />
        </Link>
        <Link to="/admin/products" className="block h-full">
          <Stat className="h-full" label="Active listings" value={activeListings.length} hint={`${hiddenListings.length} hidden · ${data.guidePrices.length} guides`} icon={ShoppingBasket} />
        </Link>
        <Link to="/admin/notifications" className="block h-full">
          <Stat className="h-full" label="Needs attention" value={unverified.length + staleQueue.length + lowStock.length + unread.length} hint={`${unread.length} unread alerts`} icon={AlertTriangle} warn={attention.length > 0} />
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_.9fr]">
        <Card>
          <SectionTitle title="Order activity" hint="Value and order count over the last 7 days" to="/admin/orders" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={week}>
                <CartesianGrid stroke="#C8EDD8" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#166534" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#166534" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fontSize: 11, fill: "#166534" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v, name) => [name === "total" ? peso(v) : v, name === "total" ? "Value" : "Orders"]}
                />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="total" name="Value" stroke="#14532D" fill="#95D5B2" strokeWidth={2} />
                <Bar yAxisId="right" dataKey="count" name="Orders" fill="#0B3D2E" radius={[8, 8, 0, 0]} barSize={18} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <SectionTitle title="Attention" hint="Unverified farms, slow queues, low stock, unread alerts" />
          <div className="space-y-2">
            {attention.map((item) => (
              <Link key={item.id} to={item.to} className="flex items-start gap-3 rounded-2xl bg-forest-50 px-3 py-2.5 hover:bg-forest-100">
                <Pill className={item.tone}>!</Pill>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-forest-950">{item.title}</p>
                  <p className="truncate text-xs text-forest-600">{item.body}</p>
                </div>
              </Link>
            ))}
            {!attention.length && <p className="text-sm text-forest-600">Nothing needs review right now.</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <SectionTitle title="Order pipeline" hint="How work is moving through status" to="/admin/orders" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusBars} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid stroke="#C8EDD8" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#166534" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={108} tick={{ fontSize: 11, fill: "#166534" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" name="Orders" radius={[0, 8, 8, 0]} barSize={14}>
                  {statusBars.map((row) => (
                    <Cell key={row.status} fill={STATUS_COLORS[row.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-forest-50 px-2 py-2">
              <p className="text-[11px] uppercase text-forest-600">Open</p>
              <p className="font-display text-lg">{open.length}</p>
            </div>
            <div className="rounded-2xl bg-forest-50 px-2 py-2">
              <p className="text-[11px] uppercase text-forest-600">Done</p>
              <p className="font-display text-lg">{completed.length}</p>
            </div>
            <div className="rounded-2xl bg-forest-50 px-2 py-2">
              <p className="text-[11px] uppercase text-forest-600">Cancelled</p>
              <p className="font-display text-lg">{cancelled.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Listings by category" hint="Active produce mix" to="/admin/products" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryMix} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3}>
                  {categoryMix.map((row, i) => (
                    <Cell key={row.name} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Price vs guide" hint="Listing price against the published average" to="/admin/pricing" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceCompare} margin={{ left: -12, right: 4 }}>
                <CartesianGrid stroke="#C8EDD8" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#166534" }} interval={0} angle={-24} textAnchor="end" height={48} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#166534" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => peso(v)} />
                <Legend />
                <Bar dataKey="listing" name="Listing" fill="#0B3D2E" radius={[6, 6, 0, 0]} />
                <Bar dataKey="average" name="Guide avg" fill="#52B788" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <SectionTitle title="Guide alignment" hint="How listings sit versus the market average" to="/admin/pricing" />
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priceAlign} dataKey="value" nameKey="name" innerRadius={42} outerRadius={70} paddingAngle={3}>
                  {priceAlign.map((row) => (
                    <Cell key={row.key} fill={ALIGN_COLORS[row.key]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-forest-600">Farmers must stay inside each guide’s min–max range. This chart compares to the average.</p>
        </Card>

        <Card>
          <SectionTitle title="Farms by province" hint="Where listed farmers operate" to="/admin/users" />
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={provinces} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid stroke="#C8EDD8" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#166534" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: "#166534" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="farms" name="Farms" fill="#14532D" radius={[0, 8, 8, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Top farms" hint="Order value excluding cancellations" />
          <div className="space-y-3">
            {topFarms.map((row) => (
              <div key={row.farmer.id}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <p className="font-semibold text-forest-950">{row.farmer.farmName}</p>
                  <p className="font-display">{peso(row.total)}</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-forest-100">
                  <div className="h-full rounded-full bg-forest-700" style={{ width: `${Math.max(8, (row.total / maxFarmTotal) * 100)}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-forest-600">{row.farmer.name} · {row.farmer.location?.province}</p>
              </div>
            ))}
            {!topFarms.length && <p className="text-sm text-forest-600">No farm volume yet.</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr_.8fr]">
        <Card className="overflow-hidden !p-0">
          <div className="px-5 pt-5">
            <SectionTitle title="Live queue" hint="Most recent orders across the platform" to="/admin/orders" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-forest-600">
                <tr>
                  <th className="px-5 py-2 font-semibold">Order</th>
                  <th className="px-3 py-2 font-semibold">Parties</th>
                  <th className="px-3 py-2 font-semibold">Total</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-5 py-2 font-semibold">Age</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => {
                  const farmer = userById(data.users, o.farmerId);
                  const buyer = userById(data.users, o.buyerId);
                  return (
                    <tr key={o.id} className="border-t border-forest-50">
                      <td className="px-5 py-3 font-semibold">{o.id.toUpperCase()}</td>
                      <td className="px-3 py-3 text-xs text-forest-700">{buyer?.name} → {farmer?.farmName}</td>
                      <td className="px-3 py-3">{peso(o.total)}</td>
                      <td className="px-3 py-3"><StatusPill status={o.status} /></td>
                      <td className="px-5 py-3 text-xs text-forest-600">{hoursAgo(o.createdAt)}h · {when(o.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Latest chats" hint="Farmer–buyer threads" to="/admin/chat" />
          <div className="space-y-3">
            {latestChats.map((c) => {
              const farmer = userById(data.users, c.farmerId);
              const buyer = userById(data.users, c.buyerId);
              return (
                <Link key={c.id} to="/admin/chat" className="block rounded-2xl bg-forest-50 px-3 py-2.5 hover:bg-forest-100">
                  <p className="text-sm font-semibold text-forest-950">{buyer?.name} ↔ {farmer?.farmName}</p>
                  <p className="truncate text-xs text-forest-600">{c.lastMessage}</p>
                  <p className="mt-1 text-[11px] text-forest-500">{when(c.lastAt)}</p>
                </Link>
              );
            })}
            {!latestChats.length && <p className="text-sm text-forest-600">No conversations yet.</p>}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Alerts" hint="Admin notifications" to="/admin/notifications" />
          <div className="space-y-3">
            {data.notifications.slice(0, 5).map((n) => (
              <div key={n.id} className={`rounded-2xl px-3 py-2.5 ${n.read ? "bg-forest-50" : "bg-amber-50"}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-forest-950">{n.title}</p>
                  {!n.read && <Bell size={14} className="mt-0.5 text-amber-700" />}
                </div>
                <p className="text-xs text-forest-600">{n.body}</p>
                <p className="mt-1 text-[11px] text-forest-500">{when(n.createdAt)}</p>
              </div>
            ))}
            {!data.notifications.length && <p className="text-sm text-forest-600">No alerts.</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/admin/pricing" className="rounded-3xl border border-forest-100 bg-white p-4 shadow-card hover:border-forest-300">
          <BadgeDollarSign size={18} className="text-forest-700" />
          <p className="mt-2 font-semibold">Guide prices</p>
          <p className="text-xs text-forest-600">{data.guidePrices.length} published ranges farmers must follow</p>
        </Link>
        <Link to="/admin/chat" className="rounded-3xl border border-forest-100 bg-white p-4 shadow-card hover:border-forest-300">
          <MessageSquare size={18} className="text-forest-700" />
          <p className="mt-2 font-semibold">Conversations</p>
          <p className="text-xs text-forest-600">{data.conversations.length} farmer–buyer threads to review</p>
        </Link>
        <Link to="/admin/products" className="rounded-3xl border border-forest-100 bg-white p-4 shadow-card hover:border-forest-300">
          <ShoppingBasket size={18} className="text-forest-700" />
          <p className="mt-2 font-semibold">Low stock watch</p>
          <p className="text-xs text-forest-600">{lowStock.length} listings under 100 units</p>
        </Link>
        <Link to="/admin/users" className="rounded-3xl border border-forest-100 bg-white p-4 shadow-card hover:border-forest-300">
          <MapPin size={18} className="text-forest-700" />
          <p className="mt-2 font-semibold">Coverage</p>
          <p className="text-xs text-forest-600">{provinces.length} provinces · {closedCount} closed orders</p>
        </Link>
      </div>
    </div>
  );
}
