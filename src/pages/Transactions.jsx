import { useEffect, useMemo, useState } from "react";
import Head from "../components/Head";
import Navigate from "../components/Navigate";

  const API = import.meta.env.VITE_API_BASE_URL || "";

const fmtMYR = (n) =>
  typeof n === "number" && !Number.isNaN(n) ? `RM ${n.toFixed(2)}` : "—";

function formatDateLabel(iso) {
  const d = iso ? new Date(iso) : new Date();
  const today = new Date();
  const ymd = (x) => x.toISOString().slice(0, 10);
  if (ymd(d) === ymd(today)) return "Today";
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (ymd(d) === ymd(yest)) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Transactions() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payErr, setPayErr] = useState("");

  // Filter: scope only
  const [scope, setScope] = useState("group"); // "personal" | "group"

  const memberId = String(localStorage.getItem("memberId"));
  const groupId = String(localStorage.getItem("groupId"));

  // Fetch when scope changes
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const usePersonal = scope === "personal";
        if (usePersonal && !memberId) {
          setItems([]);
          setLoading(false);
          setErr("Missing memberId for personal view.");
          return;
        }
        if (!usePersonal && !groupId) {
          setItems([]);
          setLoading(false);
          setErr("Missing groupId for group view.");
          return;
        }

        const path = usePersonal
          ? `${API}/api/v1/split/personal/${memberId}`
          : `${API}/api/v1/split/group/${groupId}`;

        const res = await fetch(path, { signal: ctrl.signal });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `Failed to fetch ${path} (${res.status})`);
        }
        const data = await res.json();

        const safe = Array.isArray(data)
          ? data.map((e, idx) => ({
              id: e.id ?? idx + 1,
              title: e.title ?? "Expense",
              date: e.date ?? new Date().toISOString().slice(0, 10),
              amount: Number(e.total) || 0,
              status: !!(e.status ?? e.isSettled), // true = settled
              category: e.category ?? "—",
              paidBy: e.paidBy ?? "Unknown",
              members: Array.isArray(e.members)
                ? e.members.map((m) => ({
                    name: m.name ?? "Member",
                    paid: !!m.paid,
                    amount: Number(m.amount) || 0,
                    memberId:
                      m.memberId ?? m.userId ?? m.member_id ?? m.user_id ?? null,
                    splitId:
                      m.splitId ??
                      m.split_id ??
                      m.s_id ??
                      (typeof m.id === "number" ? m.id : null),
                  }))
                : [],
            }))
          : [];

        // Sort by date desc then title
        safe.sort((a, b) => {
          const da = new Date(a.date).getTime();
          const db = new Date(b.date).getTime();
          if (db !== da) return db - da;
          return String(a.title).localeCompare(String(b.title));
        });

        setItems(safe);
      } catch (e) {
        if (e.name !== "AbortError")
          setErr(e.message || "Failed to load transactions.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [scope, memberId, groupId]);

  // Group by yyyy-mm-dd
  const groups = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      const key = (it.date || "").slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    const arr = Array.from(map.entries()).map(([dateKey, rows]) => ({
      dateKey,
      label: formatDateLabel(dateKey),
      rows,
    }));
    arr.sort((a, b) => new Date(b.dateKey) - new Date(a.dateKey));
    return arr;
  }, [items]);

  // Find my split row inside selected expense
  const mySplitInSelected = useMemo(() => {
    if (!selected) return null;
    return selected.members?.find(
      (m) => String(m.memberId) === String(memberId)
    );
  }, [selected, memberId]);

  // PUT /api/v1/split/markPaid/{splitId}
  async function payMyShare() {
    setPayErr("");
    const mySplit = mySplitInSelected;
    if (!mySplit || !mySplit.splitId) {
      setPayErr("Split not found for your member in this expense.");
      return;
    }
    if (mySplit.paid) {
      setPayErr("Your share is already marked paid.");
      return;
    }

    try {
      setPaying(true);
      const res = await fetch(`${API}/api/v1/split/markPaid/${mySplit.splitId}`, {
        method: "PUT",
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Failed to mark as paid");
      }

      // Update list
      setItems((prev) =>
        prev.map((exp) => {
          if (exp.id !== selected.id) return exp;
          const updatedMembers = exp.members.map((m) =>
            String(m.memberId) === String(memberId) ? { ...m, paid: true } : m
          );
          const allPaid = updatedMembers.every((m) => m.paid);
          return {
            ...exp,
            members: updatedMembers,
            status: allPaid ? true : exp.status,
          };
        })
      );

      // Update modal copy
      setSelected((prev) => {
        if (!prev) return prev;
        const updatedMembers = prev.members.map((m) =>
          String(m.memberId) === String(memberId) ? { ...m, paid: true } : m
        );
        const allPaid = updatedMembers.every((m) => m.paid);
        return { ...prev, members: updatedMembers, status: allPaid ? true : prev.status };
      });
    } catch (e) {
      setPayErr(e.message || "Failed to mark as paid");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col">
      <Head />

      <main className="flex-1 px-5 pt-20 pb-28 text-slate-800 max-w-md mx-auto w-full">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Transactions</h1>
            <div className="mt-1 text-xs text-slate-500">
              {scope === "personal" ? "Personal view" : "Group view"}
            </div>
          </div>

            {/* Scope filter — match Month/All time style */}
            <div className="inline-flex items-center rounded-full border border-slate-300 bg-white p-1">
              <button
                type="button"
                onClick={() => setScope("personal")}
                aria-pressed={scope === "personal"}
                className={`px-3 py-1 text-xs font-semibold rounded-full text-slate-900 hover:bg-slate-100 transition ${
                  scope === "personal" ? "bg-slate-100" : ""
                }`}
              >
                Personal
              </button>
              <span className="mx-0.5 h-4 w-px bg-slate-200" aria-hidden />
              <button
                type="button"
                onClick={() => setScope("group")}
                aria-pressed={scope === "group"}
                className={`px-3 py-1 text-xs font-semibold rounded-full text-slate-900 hover:bg-slate-100 transition ${
                  scope === "group" ? "bg-slate-100" : ""
                }`}
              >
                Group
              </button>
            </div>

        </div>

        <div className="h-px bg-slate-200 mt-3 mb-5" />

        {err && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm px-3 py-2">
            {err}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="h-full w-full animate-pulse bg-slate-100" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-slate-500 italic">No transactions yet.</div>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <section key={g.dateKey} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {g.label}
                  </div>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="space-y-3">
                  {g.rows.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelected(t)}
                      className="w-full text-left rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-start justify-between hover:bg-slate-50 transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 truncate">{t.title}</h3>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide border ${
                              t.status
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {t.status ? "Settled" : "Unsettled"}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {t.category} • Paid by{" "}
                          <span className="text-slate-700 font-medium">{t.paidBy}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-3">
                        <div className="text-sm font-bold text-slate-900">{fmtMYR(t.amount)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-100 flex items-end justify-center bg-slate-900/50"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col"
            style={{ height: "70vh" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Sticky Header */}
            <div className="px-5 pt-5 pb-3 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {selected.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(selected.date).toLocaleDateString()}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 text-[11px] px-2.5 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    Paid by{" "}
                    <span className="font-medium text-slate-900">
                      {selected.paidBy}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="rounded-full p-2 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Paid */}
              <section className="rounded-xl border border-slate-200">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50">
                  <h4 className="text-sm font-semibold text-slate-900">Paid</h4>
                  <span className="text:[11px] text-slate-600">
                    {selected.members.filter((m) => m.paid).length}
                  </span>
                </div>

                <ul className="divide-y divide-slate-200">
                  {selected.members.filter((m) => m.paid).length === 0 ? (
                    <li className="px-4 py-3 text-sm text-slate-500">— none —</li>
                  ) : (
                    selected.members
                      .filter((m) => m.paid)
                      .map((m, i) => (
                        <li
                          key={`paid-${i}`}
                          className="px-4 py-3 flex items-center justify-between"
                        >
                          <span className="text-[15px] text-slate-800">
                            {m.name}
                          </span>
                          <span className="text-[15px] font-semibold text-slate-900 tabular-nums">
                            RM {Number(m.amount).toFixed(2)}
                          </span>
                        </li>
                      ))
                  )}
                </ul>
              </section>

              {/* Unpaid */}
              <section className="rounded-xl border border-slate-200">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50">
                  <h4 className="text-sm font-semibold text-slate-900">Unpaid</h4>
                  <span className="text:[11px] text-slate-600">
                    {selected.members.filter((m) => !m.paid).length}
                  </span>
                </div>

                <ul className="divide-y divide-slate-200">
                  {selected.members.filter((m) => !m.paid).length === 0 ? (
                    <li className="px-4 py-3 text-sm text-slate-500">
                      — all settled —
                    </li>
                  ) : (
                    selected.members
                      .filter((m) => !m.paid)
                      .map((m, i) => (
                        <li
                          key={`unpaid-${i}`}
                          className="px-4 py-3 flex items-center justify-between"
                        >
                          <span className="text-[15px] text-slate-800">
                            {m.name}
                          </span>
                          <span className="text-[15px] font-semibold text-slate-900 tabular-nums">
                            RM {Number(m.amount).toFixed(2)}
                          </span>
                        </li>
                      ))
                  )}
                </ul>

                {/* My share control */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                  {mySplitInSelected ? (
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-600">Your share</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          RM {Number(mySplitInSelected.amount || 0).toFixed(2)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide border ${
                            mySplitInSelected.paid
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {mySplitInSelected.paid ? "Paid" : "Unpaid"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600">
                      Your member record is not part of this split.
                    </div>
                  )}
                </div>


              </section>

              {/* Additional Notes */}
              {selected.notes && (
                <section className="rounded-xl border border-slate-200 bg-slate-50">
                  <div className="px-4 py-2.5 border-b border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Additional Notes
                    </h4>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                      {selected.notes}
                    </p>
                  </div>
                </section>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="px-5 py-4 border-t border-slate-300 bg-white rounded-b-2xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">Total</span>
                <span className="text-base font-semibold text-slate-900 tabular-nums">
                  {fmtMYR(selected.amount)}
                </span>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => setSelected(null)}
                  className="text-sm font-semibold text-slate-800 hover:text-amber-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Navigate />
    </div>
  );
}
