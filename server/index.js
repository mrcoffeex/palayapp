import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import multer from "multer";
import { hash } from "./seed.js";
import { answerAssistant } from "./ai.js";
import * as db from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const app = express();
const PORT = process.env.PORT || 4000;
const FLOW = ["queued", "confirmed", "preparing", "ready", "completed"];
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error("Please attach a JPG, PNG, WEBP, or GIF image."));
  },
});

function uploadImage(req, res, next) {
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadDir));
app.use("/api/uploads", express.static(uploadDir));

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const publicUser = (u) => {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
};

const tokenOf = (req) => (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();

function peso(n) {
  return `₱${Number(n).toLocaleString("en-PH")}`;
}

function listingGuide(name, guides) {
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

function listingPriceError(name, price, guides) {
  const guide = listingGuide(name, guides);
  if (!guide) {
    return "Pick a product from the pricing guide, then set a price within its range.";
  }
  const p = Number(price);
  if (!Number.isFinite(p) || p < Number(guide.minPrice) || p > Number(guide.maxPrice)) {
    return `Price must be between ${peso(guide.minPrice)} and ${peso(guide.maxPrice)} per ${guide.unit}.`;
  }
  return "";
}

const auth = wrap(async (req, res, next) => {
  const token = tokenOf(req);
  const user = token ? await db.getUserByToken(token) : null;
  if (!user) return res.status(401).json({ error: "Please sign in again." });
  if (user.status !== "active") return res.status(401).json({ error: "Account unavailable." });
  req.user = user;
  next();
});

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Not allowed for this role." });
    next();
  };
}

app.get("/api/health", wrap(async (_req, res) => {
  res.json({ ok: true, name: "PalayApp API", database: "mysql" });
}));

app.post("/api/auth/login", wrap(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = hash(req.body.password || "");
  const user = await db.getUserByEmail(email);
  if (!user || user.password !== password) return res.status(401).json({ error: "Incorrect email or password." });
  if (user.status !== "active") return res.status(403).json({ error: "This account is suspended." });
  const token = crypto.randomBytes(24).toString("hex");
  await db.createSession(token, user.id);
  res.json({ token, user: publicUser(user) });
}));

app.post("/api/auth/register", wrap(async (req, res) => {
  const settings = await db.getSettings();
  if (!settings.allowRegistration) return res.status(403).json({ error: "Registration is closed." });
  const { name, email, password, role, phone, farmName, location } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password are required." });
  if (!["farmer", "buyer"].includes(role)) return res.status(400).json({ error: "Choose farmer or buyer." });
  if (await db.getUserByEmail(String(email).trim().toLowerCase())) {
    return res.status(409).json({ error: "That email is already registered." });
  }
  const user = {
    id: await db.nextId("usr"),
    name,
    email: String(email).trim().toLowerCase(),
    password: hash(password),
    role,
    phone: phone || "",
    farmName: role === "farmer" ? farmName || `${name}'s Farm` : undefined,
    avatar: name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    location: location || { address: "", city: "", province: "", lat: 0, lng: 0 },
    verified: false,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  await db.createUser(user);
  await db.notify("usr_admin", role === "farmer" ? "New farmer registered" : "New buyer registered", `${name} joined PalayApp.`, "user");
  const token = crypto.randomBytes(24).toString("hex");
  await db.createSession(token, user.id);
  res.json({ token, user: publicUser(user) });
}));

app.post("/api/auth/logout", auth, wrap(async (req, res) => {
  await db.deleteSession(tokenOf(req));
  res.json({ ok: true });
}));

app.get("/api/me", auth, (req, res) => res.json(publicUser(req.user)));

app.patch("/api/me", auth, wrap(async (req, res) => {
  const allowed = ["name", "phone", "farmName", "location", "avatar"];
  const fields = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) fields[key] = req.body[key];
  }
  const user = await db.updateUser(req.user.id, fields);
  res.json(publicUser(user));
}));

app.get("/api/bootstrap", auth, wrap(async (req, res) => {
  const role = req.user.role;
  const snap = await db.snapshot();
  const users = snap.users.map(publicUser);
  let { products, guidePrices, settings, orders, conversations, messages } = snap;
  const notifications = await db.listNotifications(req.user.id);

  if (role === "farmer") {
    orders = orders.filter((o) => o.farmerId === req.user.id);
    conversations = conversations.filter((c) => c.farmerId === req.user.id);
    const ids = new Set(conversations.map((c) => c.id));
    messages = messages.filter((m) => ids.has(m.conversationId));
  } else if (role === "buyer") {
    orders = orders.filter((o) => o.buyerId === req.user.id);
    conversations = conversations.filter((c) => c.buyerId === req.user.id);
    const ids = new Set(conversations.map((c) => c.id));
    messages = messages.filter((m) => ids.has(m.conversationId));
  }

  res.json({
    me: publicUser(req.user),
    users:
      role === "admin"
        ? users
        : users.filter(
            (u) =>
              u.role === "farmer" ||
              u.id === req.user.id ||
              orders.some((o) => o.buyerId === u.id || o.farmerId === u.id) ||
              conversations.some((c) => c.buyerId === u.id || c.farmerId === u.id)
          ),
    products:
      role === "farmer"
        ? products.filter((p) => p.farmerId === req.user.id || p.status === "active")
        : products.filter((p) => p.status === "active" || role === "admin"),
    guidePrices,
    orders,
    conversations,
    messages,
    notifications,
    settings,
  });
}));

app.get("/api/users", auth, requireRole("admin"), wrap(async (_req, res) => {
  const users = await db.listUsers();
  res.json(users.map(publicUser));
}));

app.patch("/api/users/:id", auth, requireRole("admin"), wrap(async (req, res) => {
  const user = await db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found." });
  const allowed = ["status", "verified", "name", "phone", "farmName", "location"];
  const fields = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) fields[key] = req.body[key];
  }
  res.json(publicUser(await db.updateUser(user.id, fields)));
}));

app.get("/api/products", auth, wrap(async (req, res) => {
  let list = await db.listProducts();
  if (req.user.role === "farmer") list = list.filter((p) => p.farmerId === req.user.id);
  if (req.user.role === "buyer") list = list.filter((p) => p.status === "active");
  res.json(list);
}));

app.post("/api/products", auth, requireRole("farmer"), uploadImage, wrap(async (req, res) => {
  const { name, category, description, unit, price, stock, harvestDate, organic } = req.body;
  if (!name || price == null || price === "") return res.status(400).json({ error: "Name and price are required." });
  const guides = await db.listGuidePrices();
  const priceError = listingPriceError(name, price, guides);
  if (priceError) return res.status(400).json({ error: priceError });
  const image = req.file ? `/api/uploads/${req.file.filename}` : DEFAULT_IMAGE;
  const product = await db.createProduct({
    id: await db.nextId("prd"),
    farmerId: req.user.id,
    name,
    category: category || "Vegetables",
    description: description || "",
    unit: unit || "kg",
    price: Number(price),
    stock: Number(stock || 0),
    image,
    harvestDate: harvestDate || new Date().toISOString().slice(0, 10),
    organic: organic === true || organic === "true" || organic === "1" || organic === "on",
    status: "active",
    createdAt: new Date().toISOString(),
  });
  await db.notify("usr_admin", "New product listed", `${req.user.farmName} listed ${name}.`, "product");
  res.json(product);
}));

app.patch("/api/products/:id", auth, wrap(async (req, res) => {
  const product = await db.getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found." });
  if (req.user.role === "farmer" && product.farmerId !== req.user.id) return res.status(403).json({ error: "Not your listing." });
  if (req.user.role === "buyer") return res.status(403).json({ error: "Not allowed." });
  const allowed = ["name", "category", "description", "unit", "price", "stock", "image", "harvestDate", "organic", "status"];
  const fields = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) fields[key] = req.body[key];
  }
  if (req.user.role === "farmer" && (fields.price !== undefined || fields.name !== undefined)) {
    const guides = await db.listGuidePrices();
    const priceError = listingPriceError(fields.name ?? product.name, fields.price ?? product.price, guides);
    if (priceError) return res.status(400).json({ error: priceError });
  }
  res.json(await db.updateProduct(product.id, fields));
}));

app.delete("/api/products/:id", auth, requireRole("farmer", "admin"), wrap(async (req, res) => {
  const product = await db.getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found." });
  if (req.user.role === "farmer" && product.farmerId !== req.user.id) return res.status(403).json({ error: "Not your listing." });
  await db.updateProduct(product.id, { status: "hidden" });
  res.json({ ok: true });
}));

app.get("/api/guide-prices", auth, wrap(async (_req, res) => res.json(await db.listGuidePrices())));

app.post("/api/guide-prices", auth, requireRole("admin"), wrap(async (req, res) => {
  const { name, category, unit, averagePrice, minPrice, maxPrice, notes } = req.body;
  if (!name || averagePrice == null) return res.status(400).json({ error: "Name and average price are required." });
  const item = await db.createGuide({
    id: await db.nextId("gp"),
    name,
    category: category || "Vegetables",
    unit: unit || "kg",
    averagePrice: Number(averagePrice),
    minPrice: Number(minPrice || averagePrice),
    maxPrice: Number(maxPrice || averagePrice),
    notes: notes || "",
    updatedAt: new Date().toISOString(),
  });
  const users = await db.listUsers();
  for (const u of users.filter((x) => x.role === "buyer")) {
    await db.notify(u.id, "Guide prices updated", `${name} average is now ₱${item.averagePrice}/${item.unit}.`, "pricing");
  }
  res.json(item);
}));

app.patch("/api/guide-prices/:id", auth, requireRole("admin"), wrap(async (req, res) => {
  const item = await db.getGuide(req.params.id);
  if (!item) return res.status(404).json({ error: "Guide price not found." });
  const allowed = ["name", "category", "unit", "averagePrice", "minPrice", "maxPrice", "notes"];
  const fields = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) fields[key] = key.includes("Price") ? Number(req.body[key]) : req.body[key];
  }
  res.json(await db.updateGuide(item.id, fields));
}));

app.delete("/api/guide-prices/:id", auth, requireRole("admin"), wrap(async (req, res) => {
  await db.deleteGuide(req.params.id);
  res.json({ ok: true });
}));

app.get("/api/orders", auth, wrap(async (req, res) => {
  const filter = {};
  if (req.user.role === "farmer") filter.farmerId = req.user.id;
  if (req.user.role === "buyer") filter.buyerId = req.user.id;
  res.json(await db.listOrders(filter));
}));

app.post("/api/orders", auth, requireRole("buyer"), wrap(async (req, res) => {
  const { farmerId, items, notes } = req.body;
  if (!farmerId || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "Choose products to order." });
  }
  const farmer = await db.getUserById(farmerId);
  if (!farmer || farmer.role !== "farmer") return res.status(404).json({ error: "Farmer not found." });

  const resolved = [];
  for (const item of items) {
    const product = await db.getProduct(item.productId);
    if (!product || product.farmerId !== farmerId || product.status !== "active") {
      return res.status(400).json({ error: "A product is unavailable." });
    }
    const qty = Number(item.qty);
    if (qty <= 0) return res.status(400).json({ error: "Quantity must be greater than zero." });
    if (qty > product.stock) return res.status(400).json({ error: `${product.name} only has ${product.stock}${product.unit} left.` });
    await db.updateProduct(product.id, { stock: product.stock - qty });
    resolved.push({ productId: product.id, name: product.name, qty, unit: product.unit, price: product.price });
  }

  const total = resolved.reduce((sum, i) => sum + i.qty * i.price, 0);
  const now = new Date().toISOString();
  const order = await db.createOrder({
    id: await db.nextId("ord"),
    buyerId: req.user.id,
    farmerId,
    items: resolved,
    total,
    status: "queued",
    queuePosition: await db.nextQueuePosition(farmerId),
    notes: notes || "",
    createdAt: now,
    updatedAt: now,
    statusHistory: [{ status: "queued", at: now, note: "Order placed by buyer" }],
  });
  await db.notify(farmerId, "New order in queue", `${req.user.name} ordered ${resolved.map((i) => `${i.qty}${i.unit} ${i.name}`).join(", ")}.`, "order");
  await db.notify("usr_admin", "New order", `${req.user.name} → ${farmer.farmName} (${peso(total)}).`, "order");
  res.json(order);
}));

app.patch("/api/orders/:id/status", auth, requireRole("farmer", "admin"), wrap(async (req, res) => {
  const order = await db.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found." });
  if (req.user.role === "farmer" && order.farmerId !== req.user.id) return res.status(403).json({ error: "Not your order." });
  const status = req.body.status;
  const allowed = [...FLOW, "cancelled"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Unknown status." });
  const fields = { status };
  if (["completed", "cancelled"].includes(status)) fields.queuePosition = 0;
  await db.updateOrder(order.id, fields);
  await db.addOrderHistory(order.id, status, req.body.note || `Marked ${status}`);
  if (["completed", "cancelled"].includes(status)) await db.reindexQueue(order.farmerId);
  const farmer = await db.getUserById(order.farmerId);
  await db.notify(order.buyerId, `Order ${status}`, `${farmer?.farmName || "Farmer"} updated ${order.id.toUpperCase()} to ${status}.`, "order");
  if (req.user.role === "farmer") {
    await db.notify("usr_admin", "Order status updated", `${farmer?.farmName}: ${order.id.toUpperCase()} is now ${status}.`, "order");
  }
  res.json(await db.getOrder(order.id));
}));

app.patch("/api/orders/:id/queue", auth, requireRole("farmer"), wrap(async (req, res) => {
  const order = await db.getOrder(req.params.id);
  if (!order || order.farmerId !== req.user.id) return res.status(404).json({ error: "Order not found." });
  if (["completed", "cancelled"].includes(order.status)) return res.status(400).json({ error: "Closed orders leave the queue." });
  const dir = req.body.direction === "up" ? -1 : 1;
  const active = (await db.listOrders({ farmerId: req.user.id }))
    .filter((o) => !["completed", "cancelled"].includes(o.status))
    .sort((a, b) => a.queuePosition - b.queuePosition);
  const index = active.findIndex((o) => o.id === order.id);
  const swapWith = active[index + dir];
  if (!swapWith) return res.json(order);
  await db.swapQueue(order, swapWith);
  res.json(await db.listOrders({ farmerId: req.user.id }));
}));

app.get("/api/conversations", auth, wrap(async (req, res) => {
  const filter = {};
  if (req.user.role === "farmer") filter.farmerId = req.user.id;
  if (req.user.role === "buyer") filter.buyerId = req.user.id;
  res.json(await db.listConversations(filter));
}));

app.post("/api/conversations", auth, requireRole("farmer", "buyer"), wrap(async (req, res) => {
  const farmerId = req.user.role === "farmer" ? req.user.id : req.body.farmerId;
  const buyerId = req.user.role === "buyer" ? req.user.id : req.body.buyerId;
  if (!farmerId || !buyerId) return res.status(400).json({ error: "Farmer and buyer are required." });
  let convo = await db.findConversation(farmerId, buyerId);
  if (!convo) {
    convo = await db.createConversation({
      id: await db.nextId("con"),
      farmerId,
      buyerId,
      lastMessage: "",
      lastAt: new Date().toISOString(),
    });
  }
  res.json(convo);
}));

app.get("/api/conversations/:id/messages", auth, wrap(async (req, res) => {
  const convo = await db.getConversation(req.params.id);
  if (!convo) return res.status(404).json({ error: "Chat not found." });
  if (req.user.role !== "admin" && req.user.id !== convo.farmerId && req.user.id !== convo.buyerId) {
    return res.status(403).json({ error: "Not your chat." });
  }
  res.json(await db.listMessages(convo.id));
}));

app.post("/api/conversations/:id/messages", auth, requireRole("farmer", "buyer"), wrap(async (req, res) => {
  const convo = await db.getConversation(req.params.id);
  if (!convo) return res.status(404).json({ error: "Chat not found." });
  if (req.user.id !== convo.farmerId && req.user.id !== convo.buyerId) return res.status(403).json({ error: "Not your chat." });
  const text = String(req.body.text || "").trim();
  if (!text) return res.status(400).json({ error: "Message cannot be empty." });
  const message = {
    id: await db.nextId("msg"),
    conversationId: convo.id,
    senderId: req.user.id,
    text,
    createdAt: new Date().toISOString(),
  };
  await db.createMessage(message);
  await db.updateConversation(convo.id, { lastMessage: text, lastAt: message.createdAt });
  const otherId = req.user.id === convo.farmerId ? convo.buyerId : convo.farmerId;
  await db.notify(otherId, "New message", `${req.user.name}: ${text.slice(0, 80)}`, "chat");
  res.json(message);
}));

app.get("/api/notifications", auth, wrap(async (req, res) => {
  res.json(await db.listNotifications(req.user.id));
}));

app.patch("/api/notifications/read-all", auth, wrap(async (req, res) => {
  await db.markAllNotificationsRead(req.user.id);
  res.json({ ok: true });
}));

app.patch("/api/notifications/:id", auth, wrap(async (req, res) => {
  const note = await db.getNotification(req.params.id, req.user.id);
  if (!note) return res.status(404).json({ error: "Notification not found." });
  res.json(await db.markNotificationRead(note.id, req.user.id, req.body.read !== false));
}));

app.get("/api/settings", auth, wrap(async (_req, res) => res.json(await db.getSettings())));

app.patch("/api/settings", auth, requireRole("admin"), wrap(async (req, res) => {
  res.json(await db.updateSettings(req.body));
}));

app.post("/api/ai/chat", auth, wrap(async (req, res) => {
  const snap = await db.snapshot();
  snap.notifications = await db.listNotifications(req.user.id);
  res.json(answerAssistant({ role: req.user.role, user: req.user, message: req.body.message, db: snap }));
}));

app.post("/api/admin/reset", auth, requireRole("admin"), wrap(async (_req, res) => {
  await db.resetDb();
  res.json({ ok: true });
}));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Server error" });
});

await db.initDb();
app.listen(PORT, () => {
  console.log(`PalayApp API on http://localhost:${PORT} (MySQL :${process.env.MYSQL_PORT || 3307})`);
});
