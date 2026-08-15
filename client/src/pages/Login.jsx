import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo, Button, Field, Input } from "../components/ui.jsx";
import { useStore } from "../store.jsx";

const demos = [
  { role: "Admin web", email: "admin@palayapp.com", password: "Admin@123", blurb: "Track users, prices, orders, chats" },
  { role: "Farmer app", email: "rosa@palayapp.com", password: "Farmer@123", blurb: "Manage listings and the order queue" },
  { role: "Buyer app", email: "ana@palayapp.com", password: "Buyer@123", blurb: "Buy with prescribed market prices" },
];

export default function Login() {
  const { login } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("ana@palayapp.com");
  const [password, setPassword] = useState("Buyer@123");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await login(email, password, remember);
      navigate(user.role === "admin" ? "/admin" : `/${user.role}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-forest-900 text-white lg:flex lg:flex-col lg:justify-between p-12">
        <Logo light />
        <div className="max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-forest-300">Agriculture, tracked fairly</p>
          <h1 className="mt-4 font-display text-5xl leading-tight">Sell from the field. Buy with a clear price guide.</h1>
          <p className="mt-5 text-forest-100/90">
            PalayUP connects farmers and buyers. Admins publish average market prices. Orders are queued and tracked.
            Payment stays off-app — farmers share location and contact details.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-2xl font-display">3</p>
            <p className="text-forest-200">roles, one platform</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-2xl font-display">₱</p>
            <p className="text-forest-200">prescribed price guides</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-2xl font-display">AI</p>
            <p className="text-forest-200">assistant per role</p>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -bottom-24 h-80 w-80 rounded-full bg-forest-400/30 blur-3xl" />
      </section>

      <section className="flex items-center justify-center bg-forest-50 px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="font-display text-3xl text-forest-950">Welcome back</h2>
          <p className="mt-1 text-sm text-forest-600">Sign in to the admin console or the farmer / buyer app.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Password">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            <label className="flex items-center gap-2 text-sm text-forest-800">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-forest-300 text-forest-900"
              />
              Remember me
            </label>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <Button className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-8 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-forest-600">Demo accounts</p>
            {demos.map((d) => (
              <button
                key={d.email}
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.password);
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-forest-100 bg-white px-4 py-3 text-left shadow-soft hover:border-forest-300"
              >
                <span>
                  <span className="block text-sm font-semibold text-forest-950">{d.role}</span>
                  <span className="text-xs text-forest-600">{d.blurb}</span>
                </span>
                <span className="text-[11px] text-forest-500">{d.email}</span>
              </button>
            ))}
          </div>

          <p className="mt-6 text-sm text-forest-700">
            New farmer or buyer?{" "}
            <Link to="/register" className="font-semibold text-forest-900 underline">
              Create an account
            </Link>
          </p>
          <p className="mt-3 text-xs text-forest-600">
            <Link to="/docs" className="underline hover:text-forest-800">
              Documentation
            </Link>
            {" · "}
            <Link to="/terms" className="underline hover:text-forest-800">
              Terms and Conditions
            </Link>
            {" · "}
            <Link to="/privacy" className="underline hover:text-forest-800">
              Privacy Policy
            </Link>
            {" · "}
            <Link to="/refund" className="underline hover:text-forest-800">
              Refund Policy
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
