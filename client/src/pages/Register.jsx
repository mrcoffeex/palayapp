import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo, Button, Field, Input, Select } from "../components/ui.jsx";
import { useStore } from "../store.jsx";

export default function Register() {
  const { register } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    role: "buyer",
    name: "",
    email: "",
    password: "",
    phone: "",
    farmName: "",
    address: "",
    city: "",
    province: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await register({
        ...form,
        location: { address: form.address, city: form.city, province: form.province, lat: 0, lng: 0 },
      });
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-forest-50 px-5 py-10">
      <div className="mx-auto max-w-lg">
        <Logo />
        <h1 className="mt-8 font-display text-3xl text-forest-950">Join AgriTrackture</h1>
        <p className="mt-1 text-sm text-forest-600">Farmers list produce. Buyers order with a market price guide. No in-app payments.</p>
        <form onSubmit={submit} className="mt-8 space-y-4 rounded-3xl bg-white p-6 shadow-card">
          <Field label="I am a">
            <Select value={form.role} onChange={(e) => set("role", e.target.value)}>
              <option value="buyer">Buyer</option>
              <option value="farmer">Farmer / merchant</option>
            </Select>
          </Field>
          <Field label="Full name">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </Field>
          {form.role === "farmer" && (
            <Field label="Farm name">
              <Input value={form.farmName} onChange={(e) => set("farmName", e.target.value)} required />
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
            </Field>
          </div>
          <Field label="Password">
            <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} required />
            </Field>
            <Field label="Province">
              <Input value={form.province} onChange={(e) => set("province", e.target.value)} required />
            </Field>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button className="w-full" disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="mt-6 text-sm">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-forest-900 underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
