import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import { createSeed } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3307),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "agritrackture",
};

let pool;

function sqlDate(iso) {
  const d = iso ? new Date(iso) : new Date();
  return d.toISOString().slice(0, 19).replace("T", " ");
}

function iso(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function num(value) {
  return Number(value || 0);
}

function mapUser(row, withPassword = false) {
  if (!row) return null;
  const user = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone,
    farmName: row.farm_name || undefined,
    avatar: row.avatar,
    location: {
      address: row.address,
      city: row.city,
      province: row.province,
      lat: num(row.lat),
      lng: num(row.lng),
    },
    verified: Boolean(row.verified),
    status: row.status,
    createdAt: iso(row.created_at),
  };
  if (withPassword) user.password = row.password;
  return user;
}

function mapProduct(row) {
  return {
    id: row.id,
    farmerId: row.farmer_id,
    name: row.name,
    category: row.category,
    description: row.description || "",
    unit: row.unit,
    price: num(row.price),
    stock: num(row.stock),
    image: row.image,
    harvestDate: row.harvest_date ? new Date(row.harvest_date).toISOString().slice(0, 10) : null,
    organic: Boolean(row.organic),
    status: row.status,
    createdAt: iso(row.created_at),
  };
}

function mapGuide(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    averagePrice: num(row.average_price),
    minPrice: num(row.min_price),
    maxPrice: num(row.max_price),
    notes: row.notes || "",
    updatedAt: iso(row.updated_at),
  };
}

function mapConvo(row) {
  return {
    id: row.id,
    farmerId: row.farmer_id,
    buyerId: row.buyer_id,
    lastMessage: row.last_message || "",
    lastAt: iso(row.last_at),
  };
}

function mapMessage(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    text: row.text,
    createdAt: iso(row.created_at),
  };
}

function mapNote(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    type: row.type,
    read: Boolean(row.is_read),
    createdAt: iso(row.created_at),
  };
}

async function assembleOrders(whereSql = "", params = []) {
  const [orders] = await pool.query(`SELECT * FROM orders ${whereSql} ORDER BY created_at DESC`, params);
  if (!orders.length) return [];
  const ids = orders.map((o) => o.id);
  const [items] = await pool.query(`SELECT * FROM order_items WHERE order_id IN (${ids.map(() => "?").join(",")})`, ids);
  const [history] = await pool.query(
    `SELECT * FROM order_status_history WHERE order_id IN (${ids.map(() => "?").join(",")}) ORDER BY at ASC`,
    ids
  );
  return orders.map((o) => ({
    id: o.id,
    buyerId: o.buyer_id,
    farmerId: o.farmer_id,
    items: items
      .filter((i) => i.order_id === o.id)
      .map((i) => ({
        productId: i.product_id,
        name: i.name,
        qty: num(i.qty),
        unit: i.unit,
        price: num(i.price),
      })),
    total: num(o.total),
    status: o.status,
    queuePosition: num(o.queue_position),
    notes: o.notes || "",
    createdAt: iso(o.created_at),
    updatedAt: iso(o.updated_at),
    statusHistory: history
      .filter((h) => h.order_id === o.id)
      .map((h) => ({ status: h.status, at: iso(h.at), note: h.note || "" })),
  }));
}

async function insertUser(u) {
  await pool.query(
    `INSERT INTO users
      (id, name, email, password, role, phone, farm_name, avatar, address, city, province, lat, lng, verified, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      u.id,
      u.name,
      u.email,
      u.password,
      u.role,
      u.phone || "",
      u.farmName || null,
      u.avatar || "",
      u.location?.address || "",
      u.location?.city || "",
      u.location?.province || "",
      u.location?.lat || 0,
      u.location?.lng || 0,
      u.verified ? 1 : 0,
      u.status || "active",
      sqlDate(u.createdAt),
    ]
  );
}

async function seedAll() {
  const seed = createSeed();
  for (const u of seed.users) await insertUser(u);
  for (const p of seed.products) {
    await pool.query(
      `INSERT INTO products
        (id, farmer_id, name, category, description, unit, price, stock, image, harvest_date, organic, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.farmerId,
        p.name,
        p.category,
        p.description,
        p.unit,
        p.price,
        p.stock,
        p.image,
        p.harvestDate,
        p.organic ? 1 : 0,
        p.status,
        sqlDate(p.createdAt),
      ]
    );
  }
  for (const g of seed.guidePrices) {
    await pool.query(
      `INSERT INTO guide_prices
        (id, name, category, unit, average_price, min_price, max_price, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [g.id, g.name, g.category, g.unit, g.averagePrice, g.minPrice, g.maxPrice, g.notes, sqlDate(g.updatedAt)]
    );
  }
  for (const o of seed.orders) {
    await pool.query(
      `INSERT INTO orders
        (id, buyer_id, farmer_id, total, status, queue_position, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [o.id, o.buyerId, o.farmerId, o.total, o.status, o.queuePosition, o.notes || "", sqlDate(o.createdAt), sqlDate(o.updatedAt)]
    );
    for (const item of o.items) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, name, qty, unit, price) VALUES (?, ?, ?, ?, ?, ?)`,
        [o.id, item.productId, item.name, item.qty, item.unit, item.price]
      );
    }
    for (const h of o.statusHistory) {
      await pool.query(`INSERT INTO order_status_history (order_id, status, note, at) VALUES (?, ?, ?, ?)`, [
        o.id,
        h.status,
        h.note || "",
        sqlDate(h.at),
      ]);
    }
  }
  for (const c of seed.conversations) {
    await pool.query(
      `INSERT INTO conversations (id, farmer_id, buyer_id, last_message, last_at) VALUES (?, ?, ?, ?, ?)`,
      [c.id, c.farmerId, c.buyerId, c.lastMessage || "", sqlDate(c.lastAt)]
    );
  }
  for (const m of seed.messages) {
    await pool.query(
      `INSERT INTO messages (id, conversation_id, sender_id, text, created_at) VALUES (?, ?, ?, ?, ?)`,
      [m.id, m.conversationId, m.senderId, m.text, sqlDate(m.createdAt)]
    );
  }
  for (const n of seed.notifications) {
    await pool.query(
      `INSERT INTO notifications (id, user_id, title, body, type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [n.id, n.userId, n.title, n.body, n.type, n.read ? 1 : 0, sqlDate(n.createdAt)]
    );
  }
  await pool.query(`INSERT INTO settings (id, data) VALUES (1, CAST(? AS JSON)) ON DUPLICATE KEY UPDATE data = VALUES(data)`, [
    JSON.stringify(seed.settings),
  ]);
  await pool.query(`INSERT INTO counters (name, value) VALUES ('next', ?) ON DUPLICATE KEY UPDATE value = VALUES(value)`, [
    seed.nextId || 2000,
  ]);
}

export async function initDb() {
  const admin = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: true,
  });
  await admin.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await admin.end();

  pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
  });

  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const setup = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    multipleStatements: true,
  });
  await setup.query(schema);
  await setup.end();

  const [userRows] = await pool.query("SELECT COUNT(*) AS total FROM users");
  const [productRows] = await pool.query("SELECT COUNT(*) AS total FROM products");
  const userCount = Number(userRows[0].total);
  const productCount = Number(productRows[0].total);
  if (userCount === 0) await seedAll();
  else if (productCount === 0) await resetDb();
  await pool.query("INSERT IGNORE INTO counters (name, value) VALUES ('next', 2000)");

  console.log(`MySQL connected at ${config.host}:${config.port}/${config.database}`);
}

export async function nextId(prefix) {
  await pool.query("UPDATE counters SET value = LAST_INSERT_ID(value + 1) WHERE name = 'next'");
  const [[{ id }]] = await pool.query("SELECT LAST_INSERT_ID() AS id");
  return `${prefix}_${id}`;
}

export async function getUserById(id, withPassword = false) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  return mapUser(rows[0], withPassword);
}

export async function getUserByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  return mapUser(rows[0], true);
}

export async function getUserByToken(token) {
  const [rows] = await pool.query(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`,
    [token]
  );
  return mapUser(rows[0], true);
}

export async function createSession(token, userId) {
  await pool.query("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)", [token, userId, sqlDate()]);
}

export async function deleteSession(token) {
  await pool.query("DELETE FROM sessions WHERE token = ?", [token]);
}

export async function listUsers(withPassword = false) {
  const [rows] = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
  return rows.map((r) => mapUser(r, withPassword));
}

export async function createUser(user) {
  await insertUser(user);
  return getUserById(user.id, true);
}

export async function updateUser(id, fields) {
  const map = {
    name: "name",
    phone: "phone",
    farmName: "farm_name",
    avatar: "avatar",
    status: "status",
    verified: "verified",
  };
  const sets = [];
  const vals = [];
  for (const [key, col] of Object.entries(map)) {
    if (fields[key] !== undefined) {
      sets.push(`${col} = ?`);
      vals.push(key === "verified" ? (fields[key] ? 1 : 0) : fields[key]);
    }
  }
  if (fields.location) {
    sets.push("address = ?", "city = ?", "province = ?", "lat = ?", "lng = ?");
    vals.push(
      fields.location.address || "",
      fields.location.city || "",
      fields.location.province || "",
      fields.location.lat || 0,
      fields.location.lng || 0
    );
  }
  if (!sets.length) return getUserById(id);
  vals.push(id);
  await pool.query(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, vals);
  return getUserById(id);
}

export async function listProducts() {
  const [rows] = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
  return rows.map(mapProduct);
}

export async function getProduct(id) {
  const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [id]);
  return rows[0] ? mapProduct(rows[0]) : null;
}

export async function createProduct(p) {
  await pool.query(
    `INSERT INTO products
      (id, farmer_id, name, category, description, unit, price, stock, image, harvest_date, organic, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      p.id,
      p.farmerId,
      p.name,
      p.category,
      p.description,
      p.unit,
      p.price,
      p.stock,
      p.image,
      p.harvestDate,
      p.organic ? 1 : 0,
      p.status,
      sqlDate(p.createdAt),
    ]
  );
  return getProduct(p.id);
}

export async function updateProduct(id, fields) {
  const map = {
    name: "name",
    category: "category",
    description: "description",
    unit: "unit",
    price: "price",
    stock: "stock",
    image: "image",
    harvestDate: "harvest_date",
    organic: "organic",
    status: "status",
  };
  const sets = [];
  const vals = [];
  for (const [key, col] of Object.entries(map)) {
    if (fields[key] !== undefined) {
      sets.push(`${col} = ?`);
      vals.push(key === "organic" ? (fields[key] ? 1 : 0) : fields[key]);
    }
  }
  if (!sets.length) return getProduct(id);
  vals.push(id);
  await pool.query(`UPDATE products SET ${sets.join(", ")} WHERE id = ?`, vals);
  return getProduct(id);
}

export async function listGuidePrices() {
  const [rows] = await pool.query("SELECT * FROM guide_prices ORDER BY updated_at DESC");
  return rows.map(mapGuide);
}

export async function getGuide(id) {
  const [rows] = await pool.query("SELECT * FROM guide_prices WHERE id = ?", [id]);
  return rows[0] ? mapGuide(rows[0]) : null;
}

export async function createGuide(g) {
  await pool.query(
    `INSERT INTO guide_prices (id, name, category, unit, average_price, min_price, max_price, notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [g.id, g.name, g.category, g.unit, g.averagePrice, g.minPrice, g.maxPrice, g.notes, sqlDate(g.updatedAt)]
  );
  return getGuide(g.id);
}

export async function updateGuide(id, fields) {
  const map = {
    name: "name",
    category: "category",
    unit: "unit",
    averagePrice: "average_price",
    minPrice: "min_price",
    maxPrice: "max_price",
    notes: "notes",
  };
  const sets = ["updated_at = ?"];
  const vals = [sqlDate()];
  for (const [key, col] of Object.entries(map)) {
    if (fields[key] !== undefined) {
      sets.push(`${col} = ?`);
      vals.push(fields[key]);
    }
  }
  vals.push(id);
  await pool.query(`UPDATE guide_prices SET ${sets.join(", ")} WHERE id = ?`, vals);
  return getGuide(id);
}

export async function deleteGuide(id) {
  await pool.query("DELETE FROM guide_prices WHERE id = ?", [id]);
}

export async function listOrders(filter = {}) {
  if (filter.farmerId) return assembleOrders("WHERE farmer_id = ?", [filter.farmerId]);
  if (filter.buyerId) return assembleOrders("WHERE buyer_id = ?", [filter.buyerId]);
  return assembleOrders();
}

export async function getOrder(id) {
  const rows = await assembleOrders("WHERE id = ?", [id]);
  return rows[0] || null;
}

export async function nextQueuePosition(farmerId) {
  const [[{ c }]] = await pool.query(
    `SELECT COUNT(*) AS c FROM orders WHERE farmer_id = ? AND status NOT IN ('completed', 'cancelled')`,
    [farmerId]
  );
  return num(c) + 1;
}

export async function createOrder(order) {
  await pool.query(
    `INSERT INTO orders (id, buyer_id, farmer_id, total, status, queue_position, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      order.id,
      order.buyerId,
      order.farmerId,
      order.total,
      order.status,
      order.queuePosition,
      order.notes || "",
      sqlDate(order.createdAt),
      sqlDate(order.updatedAt),
    ]
  );
  for (const item of order.items) {
    await pool.query(`INSERT INTO order_items (order_id, product_id, name, qty, unit, price) VALUES (?, ?, ?, ?, ?, ?)`, [
      order.id,
      item.productId,
      item.name,
      item.qty,
      item.unit,
      item.price,
    ]);
  }
  for (const h of order.statusHistory) {
    await pool.query(`INSERT INTO order_status_history (order_id, status, note, at) VALUES (?, ?, ?, ?)`, [
      order.id,
      h.status,
      h.note || "",
      sqlDate(h.at),
    ]);
  }
  return getOrder(order.id);
}

export async function addOrderHistory(orderId, status, note) {
  await pool.query(`INSERT INTO order_status_history (order_id, status, note, at) VALUES (?, ?, ?, ?)`, [
    orderId,
    status,
    note || "",
    sqlDate(),
  ]);
}

export async function updateOrder(id, fields) {
  const map = { status: "status", queuePosition: "queue_position", notes: "notes" };
  const sets = ["updated_at = ?"];
  const vals = [sqlDate()];
  for (const [key, col] of Object.entries(map)) {
    if (fields[key] !== undefined) {
      sets.push(`${col} = ?`);
      vals.push(fields[key]);
    }
  }
  vals.push(id);
  await pool.query(`UPDATE orders SET ${sets.join(", ")} WHERE id = ?`, vals);
  return getOrder(id);
}

export async function reindexQueue(farmerId) {
  const [rows] = await pool.query(
    `SELECT id FROM orders WHERE farmer_id = ? AND status NOT IN ('completed', 'cancelled') ORDER BY queue_position ASC`,
    [farmerId]
  );
  for (let i = 0; i < rows.length; i += 1) {
    await pool.query("UPDATE orders SET queue_position = ? WHERE id = ?", [i + 1, rows[i].id]);
  }
}

export async function swapQueue(orderA, orderB) {
  await pool.query("UPDATE orders SET queue_position = ? WHERE id = ?", [orderB.queuePosition, orderA.id]);
  await pool.query("UPDATE orders SET queue_position = ? WHERE id = ?", [orderA.queuePosition, orderB.id]);
}

export async function listConversations(filter = {}) {
  let sql = "SELECT * FROM conversations";
  const params = [];
  if (filter.farmerId) {
    sql += " WHERE farmer_id = ?";
    params.push(filter.farmerId);
  } else if (filter.buyerId) {
    sql += " WHERE buyer_id = ?";
    params.push(filter.buyerId);
  }
  sql += " ORDER BY last_at DESC";
  const [rows] = await pool.query(sql, params);
  return rows.map(mapConvo);
}

export async function getConversation(id) {
  const [rows] = await pool.query("SELECT * FROM conversations WHERE id = ?", [id]);
  return rows[0] ? mapConvo(rows[0]) : null;
}

export async function findConversation(farmerId, buyerId) {
  const [rows] = await pool.query("SELECT * FROM conversations WHERE farmer_id = ? AND buyer_id = ?", [farmerId, buyerId]);
  return rows[0] ? mapConvo(rows[0]) : null;
}

export async function createConversation(c) {
  await pool.query(
    `INSERT INTO conversations (id, farmer_id, buyer_id, last_message, last_at) VALUES (?, ?, ?, ?, ?)`,
    [c.id, c.farmerId, c.buyerId, c.lastMessage || "", sqlDate(c.lastAt)]
  );
  return getConversation(c.id);
}

export async function updateConversation(id, fields) {
  await pool.query("UPDATE conversations SET last_message = ?, last_at = ? WHERE id = ?", [
    fields.lastMessage,
    sqlDate(fields.lastAt),
    id,
  ]);
  return getConversation(id);
}

export async function listMessages(conversationId) {
  const sql = conversationId
    ? "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC"
    : "SELECT * FROM messages ORDER BY created_at ASC";
  const [rows] = await pool.query(sql, conversationId ? [conversationId] : []);
  return rows.map(mapMessage);
}

export async function createMessage(m) {
  await pool.query(
    `INSERT INTO messages (id, conversation_id, sender_id, text, created_at) VALUES (?, ?, ?, ?, ?)`,
    [m.id, m.conversationId, m.senderId, m.text, sqlDate(m.createdAt)]
  );
  return m;
}

export async function listNotifications(userId) {
  const [rows] = await pool.query("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", [userId]);
  return rows.map(mapNote);
}

export async function getNotification(id, userId) {
  const [rows] = await pool.query("SELECT * FROM notifications WHERE id = ? AND user_id = ?", [id, userId]);
  return rows[0] ? mapNote(rows[0]) : null;
}

export async function notify(userId, title, body, type) {
  const id = await nextId("ntf");
  const createdAt = new Date().toISOString();
  await pool.query(
    `INSERT INTO notifications (id, user_id, title, body, type, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [id, userId, title, body, type, sqlDate(createdAt)]
  );
}

export async function markNotificationRead(id, userId, read = true) {
  await pool.query("UPDATE notifications SET is_read = ? WHERE id = ? AND user_id = ?", [read ? 1 : 0, id, userId]);
  return getNotification(id, userId);
}

export async function markAllNotificationsRead(userId) {
  await pool.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [userId]);
}

export async function getSettings() {
  const [rows] = await pool.query("SELECT data FROM settings WHERE id = 1");
  if (!rows[0]) return {};
  return typeof rows[0].data === "string" ? JSON.parse(rows[0].data) : rows[0].data;
}

export async function updateSettings(partial) {
  const current = await getSettings();
  const next = { ...current, ...partial };
  await pool.query("UPDATE settings SET data = CAST(? AS JSON) WHERE id = 1", [JSON.stringify(next)]);
  return next;
}

export async function snapshot() {
  const [users, products, guidePrices, orders, conversations, messages, settings] = await Promise.all([
    listUsers(true),
    listProducts(),
    listGuidePrices(),
    listOrders(),
    listConversations(),
    listMessages(),
    getSettings(),
  ]);
  return { users, products, guidePrices, orders, conversations, messages, settings };
}

export async function resetDb() {
  await pool.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const table of [
    "messages",
    "conversations",
    "order_status_history",
    "order_items",
    "orders",
    "notifications",
    "sessions",
    "products",
    "guide_prices",
    "settings",
    "users",
    "counters",
  ]) {
    await pool.query(`TRUNCATE TABLE ${table}`);
  }
  await pool.query("SET FOREIGN_KEY_CHECKS = 1");
  await seedAll();
}
