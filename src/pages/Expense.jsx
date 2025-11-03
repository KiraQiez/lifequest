// src/pages/Expense.jsx
import { useState, useMemo, useEffect } from "react";
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

function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-5 pt-5 pb-3 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5 py-4">{children}</div>

        {footer && (
          <div className="px-5 py-4 border-t border-slate-200 rounded-b-2xl flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Expense() {
  const [selected, setSelected] = useState(null);
  const [show, setShow] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [expenses, setExpenses] = useState([]);

  const [paying, setPaying] = useState(false);
  const [payErr, setPayErr] = useState("");

  // QR modal state
  const [qrOpen, setQrOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrErr, setQrErr] = useState("");
  const [payerDisplayName, setPayerDisplayName] = useState("");
  const [payerQr, setPayerQr] = useState("");

  // IDs from localStorage
  const memberId = String(localStorage.getItem("memberId"));
  const groupId = String(localStorage.getItem("groupId"));

  // ---------- Fetch feed ----------
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");

        if (show === "personal" && !memberId) {
          setExpenses([]);
          setLoading(false);
          return;
        }
        if (show === "group" && !groupId) {
          setExpenses([]);
          setLoading(false);
          return;
        }

        const path =
          show === "personal"
            ? `${API}/api/v1/split/personal/${memberId}`
            : `${API}/api/v1/split/group/${groupId}`;

        const res = await fetch(path, {
          signal: ctrl.signal,
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `Failed to fetch ${path} (${res.status})`);
        }

        const data = await res.json();

        // Normalize shape & keep any payer ids if present from backend
        const safe = Array.isArray(data)
          ? data.map((e, idx) => ({
              id: e.id ?? idx + 1,
              title: e.title ?? "Expense",
              date: e.date ?? new Date().toISOString().slice(0, 10),
              amount: Number(e.total) || 0,
              status: e.status === true || e.isSettled === true,
              paidBy: e.paidBy ?? "Unknown",
              paidByMemberId: e.paidByMemberId ?? e.payerMemberId ?? e.payerId ?? null, // try different keys
              notes: e.notes ?? "",
              category: e.category ?? "—",
              members: Array.isArray(e.members)
                ? e.members.map((m) => ({
                    name: m.name ?? "Member",
                    paid: !!m.paid,
                    amount: Number(m.amount) || 0,
                    memberId:
                      m.memberId ??
                      m.userId ??
                      m.member_id ??
                      m.user_id ??
                      null,
                    splitId:
                      m.splitId ??
                      m.split_id ??
                      m.s_id ??
                      (typeof m.id === "number" ? m.id : null),
                  }))
                : [],
            }))
          : [];

        // sort by date desc then title
        safe.sort((a, b) => {
          const da = new Date(a.date).getTime();
          const db = new Date(b.date).getTime();
          if (db !== da) return db - da;
          return String(a.title).localeCompare(String(b.title));
        });

        setExpenses(safe);
      } catch (e) {
        if (e.name !== "AbortError")
          setErr(e.message || "Something went wrong while fetching.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [show, memberId, groupId]);

  // Visible list (hide settled; and in personal, hide items already paid by me)
  const visible = useMemo(() => {
    const base = expenses.filter((e) => !e.status);
    if (show !== "personal") return base;
    return base.filter((e) => {
      const mine = e.members?.find((m) => String(m.memberId) === String(memberId));
      if (mine && mine.paid) return false;
      return true;
    });
  }, [expenses, show, memberId]);

  // Group items by date
  const groups = useMemo(() => {
    const map = new Map();
    for (const it of visible) {
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
  }, [visible]);

  // find my split row in selected
  const mySplitInSelected = useMemo(() => {
    if (!selected) return null;
    return selected.members?.find((m) => String(m.memberId) === String(memberId));
  }, [selected, memberId]);

  // ---------- QR fetch helper ----------
  async function fetchPayerQrForSelected(expense) {
    setQrLoading(true);
    setQrErr("");
    setPayerQr("");
    setPayerDisplayName(expense?.paidBy ?? "Payer");

    try {
      // Prefer member-id based lookup if backend provided one:
      const candidateMemberId =
        expense?.paidByMemberId ??
        expense?.payerMemberId ??
        expense?.payerId ??
        null;

      if (candidateMemberId) {
        // Your endpoint:
        // GET /api/v1/users/byMember/{memberId} -> { id, username, fullName, payQr }
        const res = await fetch(`${API}/api/v1/groupMember/byMember/${candidateMemberId}`);
        if (res.ok) {
          const data = await res.json();
          const display =
            data.fullName?.trim() ||
            data.username?.trim() ||
            expense?.paidBy ||
            "Payer";
          setPayerDisplayName(display);
          setPayerQr(data.payQr || "");
          setQrLoading(false);
          return;
        }
      }

      // Fallback: we only have username (paidBy). No reliable way to map → show not set.
      setQrErr("");
      setPayerQr(""); // not set
    } catch (e) {
      setQrErr(e.message || "Failed to fetch payer QR.");
    } finally {
      setQrLoading(false);
    }
  }

  // ---------- Open QR modal from "Pay my share" ----------
  async function openQrThenPay() {
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

    await fetchPayerQrForSelected(selected);
    setQrOpen(true);
  }

  // ---------- Confirm marking paid (after QR viewed) ----------
  async function confirmMarkPaid() {
    const mySplit = mySplitInSelected;
    if (!mySplit || !mySplit.splitId) {
      setPayErr("Split not found for your member in this expense.");
      setQrOpen(false);
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

      // Update main list
      setExpenses((prev) =>
        prev.map((exp) => {
          if (exp.id !== selected.id) return exp;
          const updatedMembers = exp.members.map((m) =>
            String(m.memberId) === String(memberId) ? { ...m, paid: true } : m
          );
          const allPaid = updatedMembers.every((m) => m.paid);
          return { ...exp, members: updatedMembers, status: allPaid ? true : exp.status };
        })
      );

      // Update modal copy
      setSelected((prev) => {
        if (!prev) return prev;
        const updatedMembers = prev.members.map((m) =>
          String(m.memberId) === String(memberId) ? { ...m, paid: true } : m
        );
        const allPaid = updatedMembers.every((m) => m.paid);
        const updated = { ...prev, members: updatedMembers, status: allPaid ? true : prev.status };
        if (allPaid) setTimeout(() => setSelected(null), 150);
        return updated;
      });

      setQrOpen(false);
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
              {show === "personal" ? "Personal view" : "Group view"}
            </div>
          </div>

          {/* Scope filter */}
          <div className="inline-flex items-center rounded-full border border-slate-300 bg-white p-1">
            <button
              type="button"
              onClick={() => setShow("personal")}
              aria-pressed={show === "personal"}
              className={`px-3 py-1 text-xs font-semibold rounded-full text-slate-900 hover:bg-slate-100 transition ${
                show === "personal" ? "bg-slate-100" : ""
              }`}
            >
              Personal
            </button>
            <span className="mx-0.5 h-4 w-px bg-slate-200" aria-hidden />
            <button
              type="button"
              onClick={() => setShow("group")}
              aria-pressed={show === "group"}
              className={`px-3 py-1 text-xs font-semibold rounded-full text-slate-900 hover:bg-slate-100 transition ${
                show === "group" ? "bg-slate-100" : ""
              }`}
            >
              Group
            </button>
          </div>
        </div>

        <div className="h-px bg-slate-200 mt-2 mb-5" />

        {err && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm px-3 py-2">
            {err}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                <div className="h-full w-full animate-pulse bg-slate-100" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Visible grouped by date */}
            <section className="space-y-6">
              {groups.length === 0 ? (
                <div className="text-sm text-slate-500 italic">
                  {show === "personal"
                    ? "No unpaid items for you 🎉"
                    : "No unsettled expenses 🎉"}
                </div>
              ) : (
                groups.map((g) => (
                  <div key={g.dateKey} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {g.label}
                      </div>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    <div className="space-y-3">
                      {g.rows.map((exp) => (
                        <button
                          key={exp.id}
                          onClick={() => setSelected(exp)}
                          className="w-full text-left rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-start justify-between hover:bg-slate-50 transition"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-slate-900 truncate">
                                {exp.title}
                              </h3>
                              <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide border bg-amber-50 text-amber-700 border-amber-200">
                                Unsettled
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {exp.category} • Paid by{" "}
                              <span className="text-slate-700 font-medium">
                                {exp.paidBy}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-3">
                            <div className="text-sm font-bold text-slate-900">
                              {fmtMYR(exp.amount)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </section>
          </>
        )}
      </main>

      {/* Expense detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col"
            style={{ height: "70vh" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Sticky header */}
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

            {/* Scrollable body */}
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
                    <li className="px-4 py-3 text-sm text-slate-500">— all settled —</li>
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
                  {payErr && (
                    <div className="mb-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1.5 rounded">
                      {payErr}
                    </div>
                  )}
                  {mySplitInSelected ? (
                    mySplitInSelected.paid ? (
                      <div className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1.5 rounded inline-flex items-center gap-2">
                        <span className="h-2 w-2 bg-green-500 rounded-full" />
                        Your share is marked paid
                      </div>
                    ) : (
                      <button
                        onClick={openQrThenPay}
                        disabled={paying}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold text-white ${
                          paying ? "bg-slate-400" : "bg-slate-900 hover:bg-slate-800"
                        }`}
                      >
                        {paying ? "Loading…" : "Pay my share"}
                      </button>
                    )
                  ) : (
                    <div className="text-xs text-slate-600">
                      Your member record is not part of this split.
                    </div>
                  )}
                </div>
              </section>

              {/* Notes */}
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

            {/* Sticky footer */}
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

      {/* QR Modal (Confirm to mark paid) */}
      <Modal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        title="Scan to Pay"
        footer={
          <>
            <button
              type="button"
              onClick={() => setQrOpen(false)}
              className="rounded-lg border border-slate-300 bg-white text-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmMarkPaid}
              disabled={paying}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                paying ? "bg-slate-400" : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              {paying ? "Marking…" : "I have paid"}
            </button>
          </>
        }
      >
        {qrLoading ? (
          <div className="h-48 grid place-items-center">
            <div className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
          </div>
        ) : qrErr ? (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded">
            {qrErr}
          </div>
        ) : payerQr ? (
          <div className="flex flex-col items-center gap-3">
            <div className="text-sm text-slate-700">
              Pay to <span className="font-semibold text-slate-900">{payerDisplayName}</span>
            </div>
            <img
              src={payerQr}
              alt="Payer QR"
              className="h-56 w-56 rounded-xl border border-slate-200 object-contain bg-white"
            />
            <div className="text-[11px] text-slate-500 text-center">
              Scan the QR above, complete the transfer, then press{" "}
              <span className="font-semibold">“I have paid”</span>.
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm">
            The payer hasn’t provided a payment QR yet. Please pay via your usual method
            and press <span className="font-semibold">“I have paid”</span> after.
          </div>
        )}
      </Modal>

      <Navigate />
    </div>
  );
}
