import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bell, Search, SlidersHorizontal } from "lucide-react";
import { useStore } from "../store.jsx";
import { api } from "../api.js";
import { locLine, peso, priceTag, userById, when } from "../format.js";
import { Button, Card, Field, Input, Empty, Pill } from "../components/ui.jsx";
import { ChatThread, FarmerContact, OrderItems, StatusPill, Timeline } from "../components/commerce.jsx";

function Top({ title, subtitle }) {
  const { data } = useStore();
  const unread = data.notifications.filter((n) => !n.read).length;
  return (
    <header className="bg-forest-900 px-5 pb-6 pt-8 text-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-forest-300">{subtitle}</p>
          <h1 className="font-display text-2xl">{title}</h1>
        </div>
        <span className="relative rounded-full bg-white/10 p-2">
          <Bell size={18} />
          {unread > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-forest-300" />}
        </span>
      </div>
    </header>
  );
}

export function BuyerHome() {
  const { data } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const cats = ["All", ...new Set(data.products.map((p) => p.category))];
  const list = data.products.filter((p) => p.status === "active" && (cat === "All" || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()));
  const deals = useMemo(
    () =>
      list
        .map((p) => ({ p, tag: priceTag(p, data.guidePrices) }))
        .filter((x) => x.tag.delta < 0)
        .slice(0, 8),
    [list, data.guidePrices]
  );

  return (
    <div className="safe-bottom">
      <Top title="Fresh from the farm" subtitle={`Hello, ${data.me.name.split(" ")[0]}`} />
      <div className="px-4 py-4 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3.5 text-forest-500" />
          <Input className="pl-9" placeholder="Search rice, tomato, mango…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${cat === c ? "bg-forest-900 text-white" : "bg-white text-forest-700"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <Card className="bg-forest-900 text-white">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-forest-300">
            <SlidersHorizontal size={14} /> Prescribed pricing
          </p>
          <p className="mt-1 text-sm text-forest-50">Admin publishes weekly average prices. Use them as a guide — then contact the farmer. No payment inside the app.</p>
        </Card>
        {!!deals.length && (
          <>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-forest-700">Below market guide</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {deals.map(({ p, tag }) => (
                <button key={p.id} onClick={() => navigate(`/buyer/product/${p.id}`)} className="w-40 shrink-0 overflow-hidden rounded-3xl bg-white text-left shadow-soft">
                  <img src={p.image} alt="" className="h-24 w-full object-cover" />
                  <div className="p-3">
                    <p className="line-clamp-1 text-sm font-semibold">{p.name}</p>
                    <p className="font-display">{peso(p.price)}</p>
                    <p className="text-[10px] font-semibold text-emerald-700">{tag.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
        <h2 className="text-sm font-semibold uppercase tracking-wide text-forest-700">Marketplace</h2>
        {list.map((p) => {
          const farmer = userById(data.users, p.farmerId);
          const tag = priceTag(p, data.guidePrices);
          return (
            <button key={p.id} onClick={() => navigate(`/buyer/product/${p.id}`)} className="flex w-full overflow-hidden rounded-3xl bg-white text-left shadow-soft">
              <img src={p.image} alt="" className="h-28 w-28 object-cover" />
              <div className="flex flex-1 flex-col justify-between p-3">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-forest-600">{farmer?.farmName} · {farmer?.location?.city}</p>
                </div>
                <div className="flex items-end justify-between">
                  <p className="font-display text-lg">{peso(p.price)}<span className="text-xs">/{p.unit}</span></p>
                  <Pill className={tag.tone}>{tag.label}</Pill>
                </div>
              </div>
            </button>
          );
        })}
        {!list.length && <Empty title="Nothing matches" body="Try another crop or category." />}
      </div>
    </div>
  );
}

export function BuyerProduct() {
  const { id } = useParams();
  const { data, refresh } = useStore();
  const navigate = useNavigate();
  const product = data.products.find((p) => p.id === id);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  if (!product) return <Empty title="Missing listing" body="This product is no longer available." />;
  const farmer = userById(data.users, product.farmerId);
  const tag = priceTag(product, data.guidePrices);

  const place = async () => {
    setError("");
    try {
      const order = await api.createOrder({
        farmerId: product.farmerId,
        items: [{ productId: product.id, qty: Number(qty) }],
        notes,
      });
      setDone(order);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  if (done) {
    return (
      <div className="safe-bottom">
        <Top title="Order queued" subtitle={done.id.toUpperCase()} />
        <div className="space-y-4 px-4 py-5">
          <Card className="bg-forest-100">
            <p className="font-display text-2xl">You’re in the farmer’s queue.</p>
            <p className="mt-2 text-sm text-forest-700">Call or visit using the details below. AgriTrackture does not collect payment.</p>
          </Card>
          <FarmerContact farmer={farmer} />
          <Button className="w-full" onClick={() => navigate("/buyer/orders")}>Track order</Button>
          <Button variant="outline" className="w-full" onClick={() => navigate("/buyer")}>Keep browsing</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="safe-bottom">
      <img src={product.image} alt="" className="h-56 w-full object-cover" />
      <div className="space-y-4 px-4 py-5">
        <button className="text-sm font-semibold text-forest-700" onClick={() => navigate("/buyer")}>← Market</button>
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-3xl">{product.name}</h1>
            {product.organic && <Pill className="bg-forest-100 text-forest-800">Organic</Pill>}
          </div>
          <p className="text-sm text-forest-600">{product.category} · harvest {product.harvestDate}</p>
        </div>
        <p className="font-display text-4xl">{peso(product.price)}<span className="text-base text-forest-600">/{product.unit}</span></p>
        <div className="rounded-3xl bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase text-forest-600">Admin guide price</p>
          {tag.guide ? (
            <>
              <p className="font-display text-2xl">{peso(tag.guide.averagePrice)}/{tag.guide.unit}</p>
              <p className="text-xs text-forest-600">Range {peso(tag.guide.minPrice)} – {peso(tag.guide.maxPrice)}</p>
              <Pill className={`mt-2 ${tag.tone}`}>{tag.label}</Pill>
            </>
          ) : (
            <p className="text-sm">No guide uploaded yet.</p>
          )}
        </div>
        <p className="text-sm leading-relaxed text-forest-800">{product.description}</p>
        <FarmerContact farmer={farmer} />
        <Card>
          <Field label={`Quantity (${product.unit})`}>
            <Input type="number" min="1" max={product.stock} value={qty} onChange={(e) => setQty(e.target.value)} />
          </Field>
          <p className="mt-1 text-xs text-forest-600">{product.stock}{product.unit} available</p>
          <Field label="Note to farmer">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Pickup time, ripeness, etc." />
          </Field>
          <p className="mt-3 font-display text-2xl">Total {peso(qty * product.price)}</p>
          {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
          <Button className="mt-3 w-full" onClick={place}>Place order · no payment</Button>
          <Button
            variant="outline"
            className="mt-2 w-full"
            onClick={async () => {
              await api.startChat({ farmerId: product.farmerId });
              await refresh();
              navigate("/buyer/chat");
            }}
          >
            Message farmer
          </Button>
        </Card>
      </div>
    </div>
  );
}

export function BuyerOrders() {
  const { data } = useStore();
  const [id, setId] = useState(data.orders[0]?.id);
  const order = data.orders.find((o) => o.id === id);
  const farmer = order && userById(data.users, order.farmerId);
  return (
    <div className="safe-bottom">
      <Top title="Your orders" subtitle="Track status" />
      <div className="space-y-3 px-4 py-4">
        {data.orders.map((o) => {
          const f = userById(data.users, o.farmerId);
          return (
            <button key={o.id} onClick={() => setId(o.id)} className={`w-full rounded-3xl bg-white p-4 text-left shadow-soft ${id === o.id ? "ring-2 ring-forest-700" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{f?.farmName}</p>
                  <p className="text-xs text-forest-600">{o.id.toUpperCase()} · {peso(o.total)}</p>
                </div>
                <StatusPill status={o.status} />
              </div>
            </button>
          );
        })}
        {!data.orders.length && <Empty title="No orders yet" body="Browse the market and place your first request." />}
        {order && (
          <Card>
            <p className="text-xs text-forest-600">Queue position {order.queuePosition || "—"}</p>
            <OrderItems items={order.items} />
            {order.notes && <p className="mt-2 rounded-2xl bg-forest-50 p-3 text-sm">{order.notes}</p>}
            <div className="mt-4">
              <Timeline history={order.statusHistory} />
            </div>
            <div className="mt-4">
              <FarmerContact farmer={farmer} />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export function BuyerChat() {
  const { data, refresh } = useStore();
  const [id, setId] = useState(data.conversations[0]?.id);
  const convo = data.conversations.find((c) => c.id === id);
  const startWith = async (farmerId) => {
    const c = await api.startChat({ farmerId });
    await refresh();
    setId(c.id);
  };
  return (
    <div className="flex min-h-[70vh] flex-col">
      <Top title="Farmers" subtitle="Chat" />
      <div className="flex-1 bg-white">
        <div className="flex gap-2 overflow-x-auto border-b border-forest-100 px-3 py-2">
          {data.conversations.map((c) => {
            const farmer = userById(data.users, c.farmerId);
            return (
              <button key={c.id} onClick={() => setId(c.id)} className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${id === c.id ? "bg-forest-900 text-white" : "bg-forest-100"}`}>
                {farmer?.farmName}
              </button>
            );
          })}
        </div>
        {!data.conversations.length && (
          <div className="p-4">
            <Empty title="No chats yet" body="Message a farmer from a product page after you place an order, or start one below." />
            <div className="mt-3 space-y-2">
              {data.users.filter((u) => u.role === "farmer").map((f) => (
                <Button key={f.id} variant="outline" className="w-full" onClick={() => startWith(f.id)}>
                  Chat with {f.farmName}
                </Button>
              ))}
            </div>
          </div>
        )}
        {convo && (
          <ChatThread
            me={data.me}
            users={data.users}
            conversation={convo}
            messages={data.messages}
            onSend={async (text) => {
              await api.sendMessage(convo.id, text);
              await refresh();
            }}
          />
        )}
      </div>
    </div>
  );
}

export function BuyerProfile() {
  const { data, refresh, logout } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: data.me.name,
    phone: data.me.phone,
    address: data.me.location?.address || "",
    city: data.me.location?.city || "",
    province: data.me.location?.province || "",
  });
  return (
    <div className="safe-bottom">
      <Top title="Your details" subtitle="Buyer account" />
      <div className="space-y-4 px-4 py-5">
        <Card>
          <p className="text-sm text-forest-600">{locLine(data.me.location)}</p>
          <form
            className="mt-4 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await api.updateMe({
                name: form.name,
                phone: form.phone,
                location: { ...data.me.location, address: form.address, city: form.city, province: form.province },
              });
              await refresh();
            }}
          >
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Address"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <Field label="City"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <Field label="Province"><Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} /></Field>
            <Button className="w-full">Save</Button>
          </form>
        </Card>
        <h2 className="text-sm font-semibold">Notifications</h2>
        {data.notifications.slice(0, 8).map((n) => (
          <Card key={n.id} className="!p-4">
            <p className="text-sm font-semibold">{n.title}</p>
            <p className="text-xs text-forest-600">{n.body} · {when(n.createdAt)}</p>
          </Card>
        ))}
        <Button variant="outline" className="w-full" onClick={async () => { await logout(); navigate("/login"); }}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
