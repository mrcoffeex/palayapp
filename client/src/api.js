const TOKEN_KEY = "palayapp_token";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  const auth = token ?? localStorage.getItem(TOKEN_KEY);
  if (auth) headers.Authorization = `Bearer ${auth}`;
  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

async function requestForm(path, form, { method = "POST" } = {}) {
  const headers = {};
  const auth = localStorage.getItem(TOKEN_KEY);
  if (auth) headers.Authorization = `Bearer ${auth}`;
  const res = await fetch(path, { method, headers, body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export const api = {
  login: (email, password) => request("/api/auth/login", { method: "POST", body: { email, password } }),
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  bootstrap: () => request("/api/bootstrap"),
  updateMe: (body) => request("/api/me", { method: "PATCH", body }),
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

export function saveToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
