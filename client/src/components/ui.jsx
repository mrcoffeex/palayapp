export function Logo({ light = false, compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`grid h-10 w-10 place-items-center rounded-2xl ${
          light ? "bg-white/15 text-white" : "bg-forest-900 text-forest-200"
        }`}
      >
        <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none">
          <path d="M7 23c8-1 12-8 13-16 4 3 6 8 6 13-6 1-12 3-19 3Z" fill="currentColor" opacity=".35" />
          <path d="M8 22c7-9 9-16 9-16s4 8 3 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="10" cy="24" r="2.2" fill="currentColor" />
          <path d="M12 24h13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className={`block font-display text-[17px] font-semibold tracking-tight ${light ? "text-white" : "text-forest-950"}`}>
            AgriTrackture
          </span>
          <span className={`block text-[11px] font-medium ${light ? "text-forest-200" : "text-forest-600"}`}>
            Farm to buyer, fairly
          </span>
        </span>
      )}
    </div>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-forest-900 text-white hover:bg-forest-800 shadow-soft",
    secondary: "bg-forest-100 text-forest-900 hover:bg-forest-200",
    ghost: "bg-transparent text-forest-800 hover:bg-forest-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    outline: "border border-forest-200 bg-white text-forest-900 hover:bg-forest-50",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-forest-700">{label}</span>
      {children}
    </label>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-2xl border border-forest-200 bg-white px-3.5 py-2.5 text-sm outline-none ring-forest-400 transition focus:border-forest-500 focus:ring-2 ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full rounded-2xl border border-forest-200 bg-white px-3.5 py-2.5 text-sm outline-none ring-forest-400 transition focus:border-forest-500 focus:ring-2 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full rounded-2xl border border-forest-200 bg-white px-3.5 py-2.5 text-sm outline-none ring-forest-400 transition focus:border-forest-500 focus:ring-2 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Card({ className = "", children }) {
  return <div className={`rounded-3xl border border-forest-100 bg-white p-5 shadow-card ${className}`}>{children}</div>;
}

export function Avatar({ name = "?", size = "md" }) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-11 w-11 text-sm", lg: "h-14 w-14 text-base" };
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className={`inline-grid shrink-0 place-items-center rounded-full bg-forest-900 font-bold text-forest-100 ${sizes[size]}`}>
      {initials}
    </span>
  );
}

export function Pill({ children, className = "" }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${className}`}>{children}</span>;
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-forest-950/40 p-0 sm:place-items-center sm:p-6" onClick={onClose}>
      <div
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-display text-xl text-forest-950">{title}</h3>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-sm text-forest-600 hover:bg-forest-50">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ title, body }) {
  return (
    <div className="rounded-3xl border border-dashed border-forest-200 bg-forest-50 px-6 py-12 text-center">
      <p className="font-display text-lg text-forest-900">{title}</p>
      <p className="mt-1 text-sm text-forest-600">{body}</p>
    </div>
  );
}

export function Stat({ label, value, hint, icon: Icon, warn = false, className = "" }) {
  return (
    <Card className={`${warn ? "border-amber-200 bg-amber-50" : ""} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-forest-600">{label}</p>
        {Icon && (
          <span className={`grid h-9 w-9 place-items-center rounded-2xl ${warn ? "bg-amber-100 text-amber-800" : "bg-forest-100 text-forest-800"}`}>
            <Icon size={18} />
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-3xl tracking-tight text-forest-950">{value}</p>
      {hint && <p className="mt-1 text-xs text-forest-600">{hint}</p>}
    </Card>
  );
}
