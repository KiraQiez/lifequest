// src/components/Settle.jsx
import { useEffect, useMemo, useState } from "react";
import Card from "./Card";
import { BellIcon, CheckIcon } from "@heroicons/react/24/outline";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function Settle({ title = "Settle", maxHeightClass = "max-h-53" }) {
  const payerId = useMemo(() => (localStorage.getItem("memberId") || "").toString(), []);
  const [items, setItems] = useState([]);        // [{ id, name, amount }]
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Track reminder state per member id
  const [sending, setSending] = useState({});    // { [memberId]: boolean }
  const [sent, setSent] = useState({});          // { [memberId]: boolean }

  useEffect(() => {
    if (!payerId) {
      setLoading(false);
      setErr("Missing memberId");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const url = `${API}/api/v1/split/by-payer/${encodeURIComponent(payerId)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Only totals of people who owe me (positive totals)
        const rows = (data || [])
          .map(r => ({
            id: r.memberId,
            name: r.username ?? "Unknown",
            amount: Number(r.totalOwed || 0),
          }))
          .filter(r => r.amount > 0);

        if (!cancelled) setItems(rows);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [payerId]);

  // Build display list: ensure at least 5 rows (pad with placeholders)
  const displayRows = (() => {
    const base = [...items];
    const need = Math.max(0, 5 - base.length);
    for (let i = 0; i < need; i++) {
      base.push({
        id: `placeholder-${i}`,
        name: "—",
        amount: 0,
        placeholder: true,
      });
    }
    return base;
  })();


  const shouldScroll = items.length > 5;
  const scrollClass = shouldScroll ? maxHeightClass : "max-h-none";

  async function handleRemind(memberId, name, amount) {

    if (!memberId || String(memberId).startsWith("placeholder")) return;
    if (sent[memberId] || sending[memberId]) return;

    try {
      setSending(s => ({ ...s, [memberId]: true }));


      await new Promise(r => setTimeout(r, 600));

      setSent(s => ({ ...s, [memberId]: true }));
    } catch (e) {
      console.error("Remind failed:", e);

    } finally {
      setSending(s => ({ ...s, [memberId]: false }));
    }
  }

  return (
    <section className="mt-4">
      <Card className="p-0">
        <div className="pb-4 text-xs uppercase tracking-wider text-slate-500">
          {title}
        </div>

        {loading ? (
          <Skeleton />
        ) : err ? (
          <div className="p-4 text-sm text-red-600">Error: {err}</div>
        ) : (
          <div
            className={`overflow-y-auto overscroll-contain ${scrollClass} no-scrollbar`}
            role="list"
            aria-label="People who owe me"
          >
            {displayRows.length ? (
              <ul className="divide-y divide-slate-200">
                {displayRows.map(p => (
                  <li key={p.id}>
                    <Row
                      name={p.name}
                      amount={p.amount}
                      placeholder={p.placeholder}
                      status={{
                        sending: !!sending[p.id],
                        sent: !!sent[p.id],
                      }}
                      onRemind={() => handleRemind(p.id, p.name, p.amount)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">All settled. 🎉</div>
            )}
          </div>
        )}
      </Card>
    </section>
  );
}

/* ---------- internals ---------- */

function Row({ name, amount, placeholder, status, onRemind }) {
  const { sending, sent } = status || {};
  const display = `+ RM ${Number(Math.abs(amount)).toFixed(2)}`;
  const muted = placeholder;

  return (
    <div className="relative px-3 py-2.5 flex items-center justify-between">
      {/* left accent stripe */}
      <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-slate-200" aria-hidden />

      {/* Left: avatar + name */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar name={name} highlight={!muted} />
        <span
          className={`text-sm font-medium truncate max-w-46 ${
            muted ? "text-slate-400" : "text-slate-900"
          }`}
        >
          {name}
        </span>
      </div>

      {/* Right: amount + remind */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-xs font-semibold min-w-[92px] text-right ${
            muted ? "text-slate-300" : "text-slate-900"
          }`}
        >
          {display}
        </span>

        <button
          className={`inline-grid place-items-center h-8 w-8 rounded-full border bg-white transition
            ${muted ? "border-slate-100 text-slate-200 cursor-not-allowed" : "border-slate-200 text-slate-900 hover:bg-amber-50 active:scale-95"}
          `}
          aria-label={muted ? "Disabled" : `Remind ${name}`}
          title={muted ? "No member" : sent ? "Reminder sent" : sending ? "Sending…" : "Remind"}
          onClick={muted ? undefined : onRemind}
          disabled={muted || sending || sent}
        >
          {sent ? (
            <CheckIcon className="h-4 w-4" />
          ) : (
            <BellIcon className={`h-4 w-4 ${sending ? "animate-ping" : ""}`} />
          )}
        </button>
      </div>
    </div>
  );
}

function Avatar({ name = "", highlight }) {
  const initials =
    String(name).trim().split(" ").map(n => n?.[0] || "").slice(0, 2).join("").toUpperCase() || "—";

  return (
    <div className="relative">
      <div
        className={`grid place-items-center size-8 rounded-full text-[11px] font-bold
          ${highlight ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-400"}
        `}
      >
        {initials}
      </div>
      <span
        className={`pointer-events-none absolute -inset-0.5 rounded-full ring-1 ${
          highlight ? "ring-amber-400/70" : "ring-slate-200/70"
        }`}
      />
    </div>
  );
}

function Skeleton() {
  return (
    <div className="px-3 pb-3">
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-slate-200" />
              <div className="h-3 w-24 rounded bg-slate-200" />
            </div>
            <div className="h-3 w-20 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
