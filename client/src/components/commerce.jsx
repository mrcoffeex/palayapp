import { useState } from "react";
import { FLOW, STATUS_META, locLine, peso, userById, when } from "../format.js";
import { Avatar, Pill } from "./ui.jsx";
import { MapPin, Phone } from "lucide-react";

export function StatusPill({ status }) {
  const meta = STATUS_META[status] || { label: status, tone: "bg-stone-100 text-stone-700" };
  return <Pill className={meta.tone}>{meta.label}</Pill>;
}

export function Timeline({ history = [] }) {
  return (
    <ol className="space-y-3">
      {FLOW.map((step) => {
        const hit = [...history].reverse().find((h) => h.status === step);
        const done = Boolean(hit) || history.some((h) => FLOW.indexOf(h.status) > FLOW.indexOf(step));
        return (
          <li key={step} className="flex gap-3">
            <span className={`mt-1 h-3 w-3 rounded-full ${done ? "bg-forest-600" : "bg-forest-200"}`} />
            <div>
              <p className="text-sm font-semibold capitalize text-forest-900">{STATUS_META[step]?.label || step}</p>
              <p className="text-xs text-forest-600">{hit ? `${hit.note} · ${when(hit.at)}` : "Waiting"}</p>
            </div>
          </li>
        );
      })}
      {history.some((h) => h.status === "cancelled") && (
        <li className="text-sm font-semibold text-rose-700">Cancelled</li>
      )}
    </ol>
  );
}

export function FarmerContact({ farmer }) {
  if (!farmer) return null;
  return (
    <div className="rounded-3xl bg-forest-900 p-4 text-white">
      <p className="text-xs uppercase tracking-wide text-forest-300">Farmer contact · no in-app payment</p>
      <p className="mt-1 font-display text-xl">{farmer.farmName || farmer.name}</p>
      <p className="text-sm text-forest-100">{farmer.name}</p>
      <div className="mt-3 space-y-2 text-sm">
        <p className="flex items-start gap-2">
          <Phone size={16} className="mt-0.5" /> {farmer.phone}
        </p>
        <p className="flex items-start gap-2">
          <MapPin size={16} className="mt-0.5" /> {locLine(farmer.location)}
        </p>
      </div>
    </div>
  );
}

export function ChatThread({ me, users, conversation, messages, onSend, readOnly }) {
  const [text, setText] = useState("");
  if (!conversation) return <p className="p-6 text-sm text-forest-600">Select a conversation.</p>;
  const otherId = conversation.farmerId === me.id ? conversation.buyerId : conversation.farmerId;
  const other = userById(users, otherId);
  const thread = messages.filter((m) => m.conversationId === conversation.id);

  return (
    <div className="flex h-full min-h-[420px] flex-col">
      <div className="flex items-center gap-3 border-b border-forest-100 px-4 py-3">
        <Avatar name={other?.name} size="sm" />
        <div>
          <p className="text-sm font-semibold">{other?.farmName || other?.name}</p>
          <p className="text-xs text-forest-600">{other?.phone}</p>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto bg-forest-50 p-4">
        {thread.map((m) => (
          <div key={m.id} className={`flex ${m.senderId === me.id ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-3xl px-3.5 py-2 text-sm ${
                m.senderId === me.id ? "bg-forest-900 text-white" : "bg-white shadow-soft"
              }`}
            >
              {m.text}
              <div className={`mt-1 text-[10px] ${m.senderId === me.id ? "text-forest-200" : "text-forest-500"}`}>
                {when(m.createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>
      {readOnly ? (
        <p className="border-t border-forest-100 px-4 py-3 text-xs text-forest-600">Monitoring only — farmers and buyers send messages.</p>
      ) : (
        <form
          className="flex gap-2 border-t border-forest-100 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            onSend(text);
            setText("");
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message…"
            className="flex-1 rounded-2xl border border-forest-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest-400"
          />
          <button className="rounded-2xl bg-forest-900 px-4 text-sm font-semibold text-white">Send</button>
        </form>
      )}
    </div>
  );
}

export function OrderItems({ items }) {
  return (
    <ul className="space-y-1 text-sm">
      {items.map((i, idx) => (
        <li key={idx} className="flex justify-between gap-3">
          <span>
            {i.qty}
            {i.unit} {i.name}
          </span>
          <span className="font-semibold">{peso(i.qty * i.price)}</span>
        </li>
      ))}
    </ul>
  );
}
