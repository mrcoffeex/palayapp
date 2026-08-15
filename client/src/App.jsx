import { Navigate, Route, Routes } from "react-router-dom";
import { useStore } from "./store.jsx";
import { AdminShell, MobileShell } from "./components/shells.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Terms from "./pages/Terms.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import RefundPolicy from "./pages/RefundPolicy.jsx";
import Docs from "./pages/Docs.jsx";
import {
  AdminHome,
  AdminUsers,
  AdminProducts,
  AdminPricing,
  AdminOrders,
  AdminChat,
  AdminNotifications,
  AdminSettings,
} from "./pages/admin.jsx";
import { FarmerHome, FarmerProducts, FarmerOrders, FarmerChat, FarmerProfile } from "./pages/farmer.jsx";
import { BuyerHome, BuyerProduct, BuyerOrders, BuyerChat, BuyerProfile } from "./pages/buyer.jsx";

function Guard({ roles, children }) {
  const { data, loading, token, error, refresh } = useStore();
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-forest-50 text-forest-800">
        <p className="font-display text-2xl">PalayUP</p>
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  if (!data.me) {
    return (
      <div className="grid min-h-screen place-items-center bg-forest-50 px-5 text-center text-forest-800">
        <div>
          <p className="font-display text-2xl">PalayUP</p>
          <p className="mt-2 text-sm text-forest-600">{error || "Couldn’t load your session."}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-4 rounded-2xl bg-forest-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
  if (roles && !roles.includes(data.me.role)) return <Navigate to={`/${data.me.role === "admin" ? "admin" : data.me.role}`} replace />;
  return children;
}

export default function App() {
  const { data } = useStore();
  const home = data.me ? (data.me.role === "admin" ? "/admin" : `/${data.me.role}`) : "/login";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={home} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/refund" element={<RefundPolicy />} />
      <Route path="/docs" element={<Docs />} />

      <Route
        path="/admin"
        element={
          <Guard roles={["admin"]}>
            <AdminShell />
          </Guard>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="pricing" element={<AdminPricing />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="chat" element={<AdminChat />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route
        path="/farmer"
        element={
          <Guard roles={["farmer"]}>
            <MobileShell role="farmer" />
          </Guard>
        }
      >
        <Route index element={<FarmerHome />} />
        <Route path="products" element={<FarmerProducts />} />
        <Route path="orders" element={<FarmerOrders />} />
        <Route path="chat" element={<FarmerChat />} />
        <Route path="profile" element={<FarmerProfile />} />
      </Route>

      <Route
        path="/buyer"
        element={
          <Guard roles={["buyer"]}>
            <MobileShell role="buyer" />
          </Guard>
        }
      >
        <Route index element={<BuyerHome />} />
        <Route path="product/:id" element={<BuyerProduct />} />
        <Route path="orders" element={<BuyerOrders />} />
        <Route path="chat" element={<BuyerChat />} />
        <Route path="profile" element={<BuyerProfile />} />
      </Route>

      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}
