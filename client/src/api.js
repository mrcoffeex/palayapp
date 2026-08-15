const TOKEN_KEY = "palayapp_token";
const REMEMBER_KEY = "palayapp_remember";

function apiError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  const auth = token ?? getToken();
  if (auth) headers.Authorization = `Bearer ${auth}`;
  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw apiError(data.error || "Request failed.", res.status);
  return data;
}

async function requestForm(path, form, { method = "POST" } = {}) {
  const headers = {};
  const auth = getToken();
  if (auth) headers.Authorization = `Bearer ${auth}`;
  const res = await fetch(path, { method, headers, body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw apiError(data.error || "Request failed.", res.status);
  return data;
}

export const api = {
  login: (email, password, remember) =>
    request("/api/auth/login", { method: "POST", body: { email, password, remember: Boolean(remember) } }),
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  bootstrap: () => request("/api/bootstrap"),
  updateMe: (body) => request("/api/me", { method: "PATCH", body }),
  createUser: (body) => request("/api/users", { method: "POST", body }),
  patchUser: (id, body) => request(`/api/users/${id}`, { method: "PATCH", body }),
  createProduct: (payload) => {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (key === "imageFile" || value === undefined || value === null) return;
      form.append(key, typeof value === "boolean" ? (value ? "true" : "false") : value);
    });
    if (payload.imageFile) form.append("image", payload.imageFile);
    return requestForm("/api/products", form);
  },
  patchProduct: (id, body) => request(`/api/products/${id}`, { method: "PATCH", body }),
  hideProduct: (id) => request(`/api/products/${id}`, { method: "DELETE" }),
  createGuide: (body) => request("/api/guide-prices", { method: "POST", body }),
  patchGuide: (id, body) => request(`/api/guide-prices/${id}`, { method: "PATCH", body }),
  deleteGuide: (id) => request(`/api/guide-prices/${id}`, { method: "DELETE" }),
  syncGuidePrices: (body) => request("/api/guide-prices/sync", { method: "POST", body: body || {} }),
  createOrder: (body) => request("/api/orders", { method: "POST", body }),
  setOrderStatus: (id, body) => request(`/api/orders/${id}/status`, { method: "PATCH", body }),
  moveQueue: (id, direction) => request(`/api/orders/${id}/queue`, { method: "PATCH", body: { direction } }),
  startChat: (body) => request("/api/conversations", { method: "POST", body }),
  sendMessage: (id, text) => request(`/api/conversations/${id}/messages`, { method: "POST", body: { text } }),
  readNotification: (id) => request(`/api/notifications/${id}`, { method: "PATCH", body: { read: true } }),
  readAllNotifications: () => request("/api/notifications/read-all", { method: "PATCH" }),
  patchSettings: (body) => request("/api/settings", { method: "PATCH", body }),
  askAi: (message) => request("/api/ai/chat", { method: "POST", body: { message } }),
  reset: () => request("/api/admin/reset", { method: "POST" }),
};

export function saveToken(token, remember) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    return;
  }
  const persist = remember === undefined ? localStorage.getItem(REMEMBER_KEY) === "1" || Boolean(localStorage.getItem(TOKEN_KEY)) : Boolean(remember);
  if (persist) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(REMEMBER_KEY, "1");
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(REMEMBER_KEY, "0");
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}
