import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, X } from "lucide-react";
import { api } from "../api.js";
import { Button, Input } from "./ui.jsx";

export function Assistant({ role }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text:
        role === "admin"
          ? "I’m your admin assistant. Ask about users, products, orders, chats, notifications, or settings."
          : role === "farmer"
            ? "I’m your farm assistant. I can help with listings, guide prices, and the order queue."
            : "I’m your buying assistant. I can compare prices to the market guide and help you reach farmers.",
    },
  ]);
  const end = useRef(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [...m, { from: "me", text: q }]);
    setBusy(true);
    try {
      const res = await api.askAi(q);
      setMessages((m) => [...m, { from: "ai", text: res.reply, suggestions: res.suggestions }]);
    } catch (err) {
      setMessages((m) => [...m, { from: "ai", text: err.message }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`${role === "admin" ? "fixed" : "absolute"} z-40 flex items-center gap-2 rounded-full bg-forest-900 px-4 py-3 text-sm font-semibold text-white shadow-xl hover:bg-forest-800`}
        style={{ right: 16, bottom: role === "admin" ? 24 : 76 }}
      >
        <Sparkles size={16} />
        Assistant
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest-950/40 p-0 sm:items-center sm:p-6">
          <div className="flex h-[min(720px,92vh)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between bg-forest-900 px-5 py-4 text-white">
              <div>
                <p className="font-display text-lg">AgriTrackture AI</p>
                <p className="text-xs text-forest-200 capitalize">{role} assistant</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-white/10">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto bg-forest-50 p-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed ${
                      m.from === "me" ? "bg-forest-900 text-white" : "bg-white text-forest-950 shadow-soft"
                    }`}
                  >
                    {m.text}
                    {m.suggestions && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {m.suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => send(s)}
                            className="rounded-full bg-forest-100 px-3 py-1 text-xs font-semibold text-forest-800"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {busy && <p className="text-xs text-forest-600">Thinking…</p>}
              <div ref={end} />
            </div>
            <form
              className="flex gap-2 border-t border-forest-100 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything…" />
              <Button type="submit" disabled={busy}>
                <Send size={16} />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
