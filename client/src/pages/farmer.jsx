import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, ChevronUp, ImagePlus, Plus, Sparkles } from "lucide-react";
import { useStore } from "../store.jsx";
import { api } from "../api.js";
import { FLOW, listingGuide, listingPriceError, peso, priceTag, priceWithinGuide, userById, when } from "../format.js";
import { Button, Card, Field, Input, Select, Textarea, Modal, Empty, Pill } from "../components/ui.jsx";
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

export function FarmerHome() {
  const { data } = useStore();
  const navigate = useNavigate();
  const orders = data.orders.filter((o) => !["completed", "cancelled"].includes(o.status));
  const revenue = data.orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.total, 0);
  return (
    <div className="safe-bottom">
      <Top title={`Hi, ${data.me.name.split(" ")[0]}`} subtitle={data.me.farmName} />
      <div className="space-y-4 px-4 py-5">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-xs text-forest-600">Queue</p>
            <p className="font-display text-3xl">{orders.length}</p>
          </Card>
          <Card>
            <p className="text-xs text-forest-600">Completed value</p>
            <p className="font-display text-3xl">{peso(revenue)}</p>
          </Card>
        </div>
        <Card className="bg-forest-900 text-white">
          <p className="text-sm text-forest-200">Today’s focus</p>
          <p className="mt-1 font-display text-xl">Work the queue in order. Advance status as soon as a batch is packed.</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate("/farmer/orders")}>
            Manage orders
          </Button>
        </Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-forest-700">Latest orders</h2>
        {orders.slice(0, 3).map((o) => {
          const buyer = userById(data.users, o.buyerId);
          return (
            <Card key={o.id} className="!p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{buyer?.name}</p>
                  <p className="text-xs text-forest-600">Queue #{o.queuePosition} · {peso(o.total)}</p>
                </div>
                <StatusPill status={o.status} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function FarmerProducts() {
  const { data, refresh } = useStore();
  const mine = data.products.filter((p) => p.farmerId === data.me.id && p.status === "active");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: "Vegetables",
    description: "",
    unit: "kg",
    price: "",
    stock: "",
    harvestDate: new Date().toISOString().slice(0, 10),
    organic: false,
  });

  const resetForm = () => {
    setForm({
      name: "",
      category: "Vegetables",
      description: "",
      unit: "kg",
      price: "",
      stock: "",
      harvestDate: new Date().toISOString().slice(0, 10),
      organic: false,
    });
    setImageFile(null);
    setPreview("");
    setError("");
  };

  const guide = listingGuide(form.name, data.guidePrices);
  const priceHint = listingPriceError(form.name, form.price, data.guidePrices);

  const applyGuide = (g) => {
    setForm((current) => ({
      ...current,
      name: g.name,
      category: g.category,
      unit: g.unit,
      price: priceWithinGuide(current.price, g) ? current.price : String(g.averagePrice),
    }));
    setError("");
  };

  const onPickImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please attach a photo file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be 5MB or smaller.");
      return;
    }
    setError("");
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="safe-bottom">
      <Top title="Your products" subtitle="Listings" />
      <div className="space-y-4 px-4 py-5">
        <Button className="w-full" onClick={() => { resetForm(); setOpen(true); }}>
          <Plus size={16} /> Add listing
        </Button>
        {mine.map((p) => {
          const tag = priceTag(p, data.guidePrices);
          return (
            <Card key={p.id} className="overflow-hidden !p-0">
              <img src={p.image} alt="" className="h-32 w-full object-cover" />
              <div className="space-y-2 p-4">
                <div className="flex justify-between gap-2">
                  <p className="font-semibold">{p.name}</p>
                  <p className="font-display text-lg">{peso(p.price)}/{p.unit}</p>
                </div>
                <Pill className={tag.tone}>{tag.label}</Pill>
                <p className="text-xs text-forest-600">Stock {p.stock}{p.unit} · harvested {p.harvestDate}</p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    await api.hideProduct(p.id);
                    await refresh();
                  }}
                >
                  Hide listing
                </Button>
              </div>
            </Card>
          );
        })}
        {!mine.length && <Empty title="No listings" body="Add your first harvest so buyers can find you." />}
      </div>
      {open && (
        <Modal title="New product" onClose={() => setOpen(false)}>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const rangeError = listingPriceError(form.name, form.price, data.guidePrices);
              if (rangeError) {
                setError(rangeError);
                return;
              }
              setBusy(true);
              setError("");
              try {
                await api.createProduct({ ...form, imageFile });
                await refresh();
                setOpen(false);
              } catch (err) {
                setError(err.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <div className="rounded-2xl bg-forest-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-forest-700">Pricing guide</p>
              {guide ? (
                <>
                  <p className="mt-1 font-display text-xl">{peso(guide.averagePrice)}/{guide.unit}</p>
                  <p className="text-sm text-forest-800">
                    Allowed range {peso(guide.minPrice)} – {peso(guide.maxPrice)} per {guide.unit}
                  </p>
                  {guide.notes && <p className="mt-1 text-xs text-forest-600">{guide.notes}</p>}
                </>
              ) : (
                <p className="mt-1 text-sm text-forest-700">
                  Choose a product from the guide below. Your selling price must stay inside its min–max range.
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.guidePrices.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => applyGuide(g)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      guide?.id === g.id ? "bg-forest-900 text-white" : "bg-white text-forest-800"
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {["Grains", "Vegetables", "Fruits", "Root crops", "Herbs"].map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Description"><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Price">
                <Input
                  type="number"
                  min={guide?.minPrice}
                  max={guide?.maxPrice}
                  step="1"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </Field>
              <Field label="Unit"><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
              <Field label="Stock"><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></Field>
            </div>
            {form.price !== "" && priceHint && <p className="text-sm text-rose-600">{priceHint}</p>}
            {guide && priceWithinGuide(form.price, guide) && (
              <p className="text-xs text-forest-600">
                {form.price === String(guide.averagePrice) || Number(form.price) === Number(guide.averagePrice)
                  ? "Price matches the market average."
                  : Number(form.price) < Number(guide.averagePrice)
                    ? `${peso(guide.averagePrice - Number(form.price))} below the average, still inside the guide range.`
                    : `${peso(Number(form.price) - guide.averagePrice)} above the average, still inside the guide range.`}
              </p>
            )}
            <Field label="Harvest date"><Input type="date" value={form.harvestDate} onChange={(e) => setForm({ ...form, harvestDate: e.target.value })} /></Field>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-forest-700">Product photo</span>
              <label className="flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-forest-300 bg-forest-50 text-center transition hover:border-forest-500 hover:bg-forest-100">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => onPickImage(e.target.files?.[0])}
                />
                {preview ? (
                  <img src={preview} alt="Selected product" className="h-40 w-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-2 px-4 py-8 text-forest-700">
                    <ImagePlus size={28} />
                    <span className="text-sm font-semibold">Upload or attach a photo</span>
                    <span className="text-xs text-forest-600">JPG, PNG, WEBP, or GIF · up to 5MB</span>
                  </span>
                )}
              </label>
            </div>
            {preview && (
              <button
                type="button"
                className="text-xs font-semibold text-forest-700 underline"
                onClick={() => {
                  setImageFile(null);
                  setPreview("");
                }}
              >
                Remove photo
              </button>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.organic} onChange={(e) => setForm({ ...form, organic: e.target.checked })} />
              Organic
            </label>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <Button className="w-full" disabled={busy || Boolean(priceHint)}>
              {busy ? "Publishing…" : "Publish listing"}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function FarmerOrders() {
  const { data, refresh } = useStore();
  const [tab, setTab] = useState("queue");
  const [openId, setOpenId] = useState(null);
  const queue = data.orders
    .filter((o) => !["completed", "cancelled"].includes(o.status))
    .sort((a, b) => a.queuePosition - b.queuePosition);
  const closed = data.orders.filter((o) => ["completed", "cancelled"].includes(o.status));
  const list = tab === "queue" ? queue : closed;
  const selected = data.orders.find((o) => o.id === openId);

  const nextStatus = (status) => FLOW[FLOW.indexOf(status) + 1];

  return (
    <div className="safe-bottom">
      <Top title="Manage orders" subtitle="Queue and status" />
      <div className="px-4 py-4">
        <div className="mb-4 grid grid-cols-2 rounded-2xl bg-white p-1 shadow-soft">
          {["queue", "history"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl py-2 text-sm font-semibold capitalize ${tab === t ? "bg-forest-900 text-white" : "text-forest-600"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {list.map((o) => {
            const buyer = userById(data.users, o.buyerId);
            return (
              <Card key={o.id} className="!p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {tab === "queue" && <p className="text-xs font-bold uppercase tracking-wide text-forest-500">Queue #{o.queuePosition}</p>}
                    <p className="font-semibold">{buyer?.name}</p>
                    <p className="text-xs text-forest-600">{buyer?.phone}</p>
                  </div>
                  <StatusPill status={o.status} />
                </div>
                <div className="mt-3">
                  <OrderItems items={o.items} />
                </div>
                <p className="mt-2 text-right font-display text-xl">{peso(o.total)}</p>
                {tab === "queue" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" className="!px-3" onClick={async () => { await api.moveQueue(o.id, "up"); await refresh(); }}>
                      <ChevronUp size={16} />
                    </Button>
                    <Button variant="outline" className="!px-3" onClick={async () => { await api.moveQueue(o.id, "down"); await refresh(); }}>
                      <ChevronDown size={16} />
                    </Button>
                    {nextStatus(o.status) && (
                      <Button
                        className="flex-1"
                        onClick={async () => {
                          await api.setOrderStatus(o.id, { status: nextStatus(o.status) });
                          await refresh();
                        }}
                      >
                        Mark {nextStatus(o.status)}
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => setOpenId(o.id)}>Details</Button>
                  </div>
                )}
                {tab === "history" && (
                  <Button variant="ghost" className="mt-2 w-full" onClick={() => setOpenId(o.id)}>View timeline</Button>
                )}
              </Card>
            );
          })}
          {!list.length && <Empty title={tab === "queue" ? "Queue is clear" : "No history"} body="New buyer orders will land here automatically." />}
        </div>
      </div>
      {selected && (
        <Modal title={selected.id.toUpperCase()} onClose={() => setOpenId(null)}>
          <div className="space-y-4">
            <StatusPill status={selected.status} />
            <OrderItems items={selected.items} />
            {selected.notes && <p className="rounded-2xl bg-forest-50 p-3 text-sm">{selected.notes}</p>}
            <Timeline history={selected.statusHistory} />
            {tab === "queue" && (
              <Button
                variant="danger"
                className="w-full"
                onClick={async () => {
                  await api.setOrderStatus(selected.id, { status: "cancelled", note: "Cancelled by farmer" });
                  await refresh();
                  setOpenId(null);
                }}
              >
                Cancel order
              </Button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export function FarmerChat() {
  const { data, refresh } = useStore();
  const [id, setId] = useState(data.conversations[0]?.id);
  const convo = data.conversations.find((c) => c.id === id);
  return (
    <div className="flex min-h-[70vh] flex-col">
      <Top title="Buyer chat" subtitle="Messages" />
      <div className="flex flex-1 flex-col bg-white">
        <div className="flex gap-2 overflow-x-auto border-b border-forest-100 px-3 py-2">
          {data.conversations.map((c) => {
            const buyer = userById(data.users, c.buyerId);
            return (
              <button
                key={c.id}
                onClick={() => setId(c.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${id === c.id ? "bg-forest-900 text-white" : "bg-forest-100 text-forest-800"}`}
              >
                {buyer?.name}
              </button>
            );
          })}
        </div>
        <div className="flex-1">
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
        </div>
      </div>
    </div>
  );
}

export function FarmerProfile() {
  const { data, refresh, logout } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: data.me.name,
    farmName: data.me.farmName || "",
    phone: data.me.phone,
    address: data.me.location?.address || "",
    city: data.me.location?.city || "",
    province: data.me.location?.province || "",
  });
  return (
    <div className="safe-bottom">
      <Top title="Farm profile" subtitle="Contact details buyers will see" />
      <div className="space-y-4 px-4 py-5">
        <FarmerContact farmer={{ ...data.me, location: { address: form.address, city: form.city, province: form.province } }} />
        <Card>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await api.updateMe({
                name: form.name,
                farmName: form.farmName,
                phone: form.phone,
                location: { ...data.me.location, address: form.address, city: form.city, province: form.province },
              });
              await refresh();
            }}
          >
            <Field label="Your name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Farm name"><Input value={form.farmName} onChange={(e) => setForm({ ...form, farmName: e.target.value })} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Address"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <Field label="City"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <Field label="Province"><Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} /></Field>
            <Button className="w-full">Save profile</Button>
          </form>
        </Card>
        <h2 className="text-sm font-semibold">Notifications</h2>
        {data.notifications.slice(0, 6).map((n) => (
          <Card key={n.id} className="!p-4">
            <p className="text-sm font-semibold">{n.title}</p>
            <p className="text-xs text-forest-600">{n.body}</p>
            <p className="mt-1 text-[11px] text-forest-500">{when(n.createdAt)}</p>
          </Card>
        ))}
        <Link to="/docs" className="block text-center text-sm font-semibold text-forest-800 underline">
          Documentation
        </Link>
        <Button
          variant="outline"
          className="w-full"
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
        >
          Sign out
        </Button>
        <p className="flex items-center justify-center gap-1 pb-4 text-xs text-forest-500">
          <Sparkles size={12} /> AI assistant is the green button
        </p>
      </div>
    </div>
  );
}
