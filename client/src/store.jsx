import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, saveToken } from "./api.js";

const Store = createContext(null);

const empty = {
  me: null,
  users: [],
  products: [],
  guidePrices: [],
  orders: [],
  conversations: [],
  messages: [],
  notifications: [],
  settings: { appName: "PalayUP" },
};

export function StoreProvider({ children }) {
  const [token, setToken] = useState(getToken());
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [error, setError] = useState("");

  const refresh = async () => {
    if (!getToken()) {
      setData(empty);
      setLoading(false);
      return;
    }
    try {
      const next = await api.bootstrap();
      setData(next);
      setError("");
    } catch (err) {
      if (err.status === 401) {
        saveToken(null);
        setToken(null);
        setData(empty);
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [token]);

  const login = async (email, password, remember = false) => {
    const res = await api.login(email, password, remember);
    saveToken(res.token, Boolean(remember || res.remember));
    setToken(res.token);
    setLoading(true);
    return res.user;
  };

  const register = async (payload) => {
    const res = await api.register(payload);
    saveToken(res.token, true);
    setToken(res.token);
    setLoading(true);
    return res.user;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    saveToken(null);
    setToken(null);
    setData(empty);
  };

  const value = useMemo(
    () => ({ token, data, loading, error, login, register, logout, refresh, setData }),
    [token, data, loading, error]
  );

  return <Store.Provider value={value}>{children}</Store.Provider>;
}

export function useStore() {
  const ctx = useContext(Store);
  if (!ctx) throw new Error("Store missing");
  return ctx;
}
