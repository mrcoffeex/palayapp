import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShoppingBasket,
  BadgeDollarSign,
  ClipboardList,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Home,
  Store,
  UserRound,
} from "lucide-react";
import { Logo } from "./ui.jsx";
import { Assistant } from "./Assistant.jsx";
import { useStore } from "../store.jsx";

const links = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/products", label: "Products", icon: ShoppingBasket },
  { to: "/admin/pricing", label: "Guide prices", icon: BadgeDollarSign },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList },
  { to: "/admin/chat", label: "Chat", icon: MessageSquare },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell() {
  const { data, logout } = useStore();
  const navigate = useNavigate();
  const unread = data.notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-forest-50 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="bg-forest-900 text-white">
        <div className="flex items-center justify-between px-5 py-5">
          <Logo light />
        </div>
        <p className="px-5 pb-3 text-[11px] uppercase tracking-wider text-forest-300">Admin console</p>
        <nav className="space-y-1 px-3 pb-6">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium ${
                  isActive ? "bg-white text-forest-900" : "text-forest-100 hover:bg-white/10"
                }`
              }
            >
              <l.icon size={18} />
              {l.label}
              {l.label === "Notifications" && unread > 0 && (
                <span className="ml-auto rounded-full bg-forest-400 px-2 text-[11px] font-bold text-forest-950">{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 pb-6">
          <p className="text-sm font-semibold">{data.me?.name}</p>
          <p className="text-xs text-forest-300">{data.me?.email}</p>
          <button
            className="mt-4 flex items-center gap-2 text-sm text-forest-200 hover:text-white"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="min-h-screen p-4 sm:p-8">
        <Outlet />
      </main>
      <Assistant role="admin" />
    </div>
  );
}

const farmerTabs = [
  { to: "/farmer", label: "Home", end: true, icon: Home },
  { to: "/farmer/products", label: "Products", icon: Store },
  { to: "/farmer/orders", label: "Orders", icon: ClipboardList },
  { to: "/farmer/chat", label: "Chat", icon: MessageSquare },
  { to: "/farmer/profile", label: "Profile", icon: UserRound },
];

const buyerTabs = [
  { to: "/buyer", label: "Market", end: true, icon: Store },
  { to: "/buyer/orders", label: "Orders", icon: ClipboardList },
  { to: "/buyer/chat", label: "Chat", icon: MessageSquare },
  { to: "/buyer/profile", label: "You", icon: UserRound },
];

export function MobileShell({ role }) {
  const tabs = role === "farmer" ? farmerTabs : buyerTabs;
  return (
    <div className="mobile-stage">
      <div className="phone-frame flex flex-col">
        <div className="flex-1 overflow-y-auto bg-forest-50">
          <Outlet />
        </div>
        <nav className={`grid border-t border-forest-100 bg-white px-1 py-2 ${tabs.length === 5 ? "grid-cols-5" : "grid-cols-4"}`}>
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-center text-[11px] font-semibold ${
                  isActive ? "bg-forest-100 text-forest-900" : "text-forest-500"
                }`
              }
            >
              <t.icon size={18} />
              {t.label}
            </NavLink>
          ))}
        </nav>
        <Assistant role={role} />
      </div>
    </div>
  );
}
