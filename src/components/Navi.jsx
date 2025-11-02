// src/components/Navi.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import ActionSheet from "./ActionSheet";
import MobileSelect from "./MobileSelect";
import BottomSheet from "./BottomSheet";
import SegmentedTabs from "./SegmentTabs";
import ShareChips from "./ShareChips";
import SummaryCard from "./SummaryCard";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function Navi({ members }) {
  const people = members ?? [];

  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);

  // ----- Outside click for action sheet -----
  const sheetRef = useRef(null);
  const addBtnRef = useRef(null);
  useEffect(() => {
    function onDocClick(e) {
      if (!isActionsOpen) return;
      const t = e.target;
      const insideSheet = sheetRef.current?.contains(t);
      const onAddBtn = addBtnRef.current?.contains(t);
      if (!insideSheet && !onAddBtn) setIsActionsOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isActionsOpen]);

  // ===================== EXPENSE =====================
  const categoryOptions = [
    { id: "Food & Drinks", name: "Food & Drinks" },
    { id: "Groceries", name: "Groceries" },
    { id: "Transport", name: "Transport" },
    { id: "Bills & Utilities", name: "Bills & Utilities" },
    { id: "Other", name: "Other" },
  ];

  const [expTitle, setExpTitle] = useState("");
  const [expCategory, setExpCategory] = useState("Groceries");

  // choose a valid payer default (first member if exists)
  const [payerId, setPayerId] = useState(people[0]?.id ?? null);

  // Amount = subtotal (pre-tax). Tax = percentage (%).
  const [expAmount, setExpAmount] = useState("");  // subtotal
  const [expTaxPct, setExpTaxPct] = useState("");  // percent number like 6 for 6%
  const [splitMethod, setSplitMethod] = useState("equally"); // equally | percentage | amount

  // shares selection (auto-includes payer and locks them)
  const [selectedIds, setSelectedIds] = useState(new Set(people.map(p => p.id)));
  const [perValues, setPerValues] = useState({}); // per person input (amount or percent) on PRE-TAX
  const [expNotes, setExpNotes] = useState("");

  // keep payerId valid whenever people list changes
  useEffect(() => {
    if (!people.length) {
      setPayerId(null);
      setSelectedIds(new Set());
      return;
    }
    setPayerId((prev) => {
      const exists = people.some((p) => p.id === prev);
      return exists ? prev : people[0].id;
    });
  }, [people]);

  // ALWAYS make sure payer is selected & selectedIds only contains current people
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set(
        [...prev].filter((id) => people.some((p) => p.id === id))
      );
      if (payerId != null) next.add(payerId); // enforce payer lock-in
      return next;
    });
  }, [people, payerId]);

  // participants = people currently selected
  const participants = useMemo(
    () => people.filter((p) => selectedIds.has(p.id)),
    [people, selectedIds]
  );

  // stable dependency keys (string-safe)
  const selectedIdsKey = useMemo(
    () => Array.from(selectedIds).map(String).sort().join(","),
    [selectedIds]
  );
  const peopleKey = useMemo(
    () => people.map((p) => String(p.id)).sort().join(","),
    [people]
  );

  // keep perValues in sync with selected participants
  useEffect(() => {
    setPerValues((prev) => {
      const next = { ...prev };
      // ensure key exists for every selected
      Array.from(selectedIds).forEach((id) => {
        if (next[id] == null) next[id] = 0;
      });
      // remove unselected / unknown
      Object.keys(next).forEach((k) => {
        const stillExists = people.some((p) => String(p.id) === String(k));
        if (!stillExists || !selectedIds.has(k)) delete next[k];
      });
      // avoid useless update
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      const same =
        prevKeys.length === nextKeys.length &&
        nextKeys.every((k) => prev[k] === next[k]);
      return same ? prev : next;
    });
  }, [selectedIdsKey, peopleKey, people, selectedIds]);

  // --- amounts derived ---
  const subtotal = useMemo(() => +(Number(expAmount) || 0).toFixed(2), [expAmount]);
  const taxRate = useMemo(() => (Number(expTaxPct) || 0) / 100, [expTaxPct]);
  const taxAmount = useMemo(() => +(subtotal * taxRate).toFixed(2), [subtotal, taxRate]);
  const grandTotal = useMemo(() => +(subtotal + taxAmount).toFixed(2), [subtotal, taxAmount]);

  const equalSharePreTax = useMemo(() => {
    const n = Math.max(1, participants.length);
    return +(subtotal / n).toFixed(2);
  }, [subtotal, participants.length]);

  // --------- AUTO-LAST LOGIC ---------
  const lastParticipantId = useMemo(
    () => (participants.length ? participants[participants.length - 1].id : null),
    [participants]
  );

  // Amount mode (PRE-TAX input): last gets remainder of SUBTOTAL
  const computedAmountsPreTax = useMemo(() => {
    if (!participants.length) return {};
    const map = {};
    const others = participants
      .filter((p) => p.id !== lastParticipantId)
      .reduce((s, p) => s + (Number(perValues[p.id]) || 0), 0);
    const remainder = Math.max(0, +(subtotal - others).toFixed(2));
    for (const p of participants) {
      if (p.id === lastParticipantId) map[p.id] = remainder;
      else map[p.id] = +((Number(perValues[p.id]) || 0).toFixed(2));
    }
    return map;
  }, [participants, lastParticipantId, perValues, subtotal]);

  // Percentage mode: last gets (100 - sum(others))
  const computedPercents = useMemo(() => {
    if (!participants.length) return {};
    const map = {};
    const others = participants
      .filter((p) => p.id !== lastParticipantId)
      .reduce((s, p) => s + (Number(perValues[p.id]) || 0), 0);
    const remainder = Math.max(0, +(100 - others).toFixed(2));
    for (const p of participants) {
      if (p.id === lastParticipantId) map[p.id] = remainder;
      else map[p.id] = +((Number(perValues[p.id]) || 0).toFixed(2));
    }
    return map;
  }, [participants, lastParticipantId, perValues]);

  // Validation helpers (PRE-TAX)
  const amountRemaining = useMemo(() => {
    if (splitMethod !== "amount") return 0;
    const sum = participants.reduce(
      (s, p) => s + (Number(computedAmountsPreTax[p.id]) || 0),
      0
    );
    return +(subtotal - sum).toFixed(2); // should be 0
  }, [splitMethod, subtotal, participants, computedAmountsPreTax]);

  const pctTotal = useMemo(() => {
    if (splitMethod !== "percentage") return 100;
    return participants.reduce(
      (s, p) => s + (Number(computedPercents[p.id]) || 0),
      0
    ); // should be 100
  }, [splitMethod, participants, computedPercents]);

  // --- PRE-TAX shares map ---
  const sharesPreTax = useMemo(() => {
    if (!participants.length) return {};
    if (splitMethod === "equally") {
      const s = {};
      participants.forEach((p) => (s[p.id] = equalSharePreTax));
      // rounding fix to hit subtotal exactly
      const sum = Object.values(s).reduce((a, b) => a + b, 0);
      const diff = +(subtotal - sum).toFixed(2);
      if (Math.abs(diff) > 0) {
        const last = participants[participants.length - 1].id;
        s[last] = +(s[last] + diff).toFixed(2);
      }
      return s;
    }
    if (splitMethod === "percentage") {
      const s = {};
      participants.forEach((p) => {
        const pct = Number(computedPercents[p.id]) || 0;
        s[p.id] = +((pct / 100) * subtotal).toFixed(2);
      });
      // rounding fix
      const sum = Object.values(s).reduce((a, b) => a + b, 0);
      const diff = +(subtotal - sum).toFixed(2);
      if (Math.abs(diff) > 0) {
        const last = participants[participants.length - 1].id;
        s[last] = +(s[last] + diff).toFixed(2);
      }
      return s;
    }
    if (splitMethod === "amount") {
      const s = {};
      participants.forEach((p) => (s[p.id] = Number(computedAmountsPreTax[p.id]) || 0));
      return s;
    }
    return {};
  }, [participants, splitMethod, equalSharePreTax, subtotal, computedPercents, computedAmountsPreTax]);

  // --- FINAL (WITH-TAX) shares map sent to backend & shown in summary ---
  const sharesFinal = useMemo(() => {
    const s = {};
    const mul = 1 + taxRate;
    participants.forEach((p) => (s[p.id] = +((sharesPreTax[p.id] || 0) * mul).toFixed(2)));
    // rounding guard to match grandTotal
    const sum = Object.values(s).reduce((a, b) => a + b, 0);
    const diff = +(grandTotal - sum).toFixed(2);
    if (participants.length && Math.abs(diff) > 0) {
      const last = participants[participants.length - 1].id;
      s[last] = +(s[last] + diff).toFixed(2);
    }
    return s;
  }, [participants, sharesPreTax, taxRate, grandTotal]);

  // payer net (what others owe to payer)
  const payerShareFinal = sharesFinal[payerId] || 0;
  const payerNet = +(grandTotal - payerShareFinal).toFixed(2);

  // ---------- LOCKING LOGIC (payer always selected) ----------
  function toggleSelectAll(checked) {
    if (checked) {
      const next = new Set(people.map((p) => p.id));
      if (payerId != null) next.add(payerId);
      setSelectedIds(next);
    } else {
      const next = new Set();
      if (payerId != null) next.add(payerId);
      setSelectedIds(next);
    }
  }

  function togglePerson(id) {
    if (id === payerId) return; // prevent unselecting the payer
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      if (payerId != null) n.add(payerId);
      return n;
    });
  }

  function onChangePayer(newVal) {
    setPayerId(String(newVal));
  }

  const isValidExpense = useMemo(() => {
    const baseOk = subtotal > 0 && participants.length > 1 && payerId != null;
    if (!baseOk) return false;
    if (splitMethod === "amount") return amountRemaining === 0;
    if (splitMethod === "percentage") return +pctTotal.toFixed(2) === 100;
    return true; // equally
  }, [subtotal, participants.length, splitMethod, amountRemaining, pctTotal, payerId]);

  async function handleSubmitExpense(e) {
    e.preventDefault();
    if (subtotal <= 0 || !participants.length || payerId == null) return;

    try {
      // 1) Create expense shell (send tax as AMOUNT, not %)
      const res = await fetch(`${API}/api/v1/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: expTitle,
          payerId,
          amount: subtotal,        // pre-tax subtotal
          tax: taxAmount,          // actual tax amount derived from %
          taxRate: Number(expTaxPct) || 0, // optional for audit (ok if backend ignores)
          splitMethod,
          date: new Date().toISOString().slice(0, 10),
          notes: expNotes,
          category: expCategory,
        }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Create expense failed (${res.status}): ${msg}`);
      }
      const expense = await res.json();
      const expenseId = expense?.id;

      // 2) Save splits (FINAL with tax)
      const cleanSplits = participants.map((p) => ({
        memberId: p.id,
        amount: Number((sharesFinal[p.id] || 0).toFixed(2)),
      }));

      const r2 = await fetch(`${API}/api/v1/split/addSplit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseId, splits: cleanSplits }),
      });
      if (!r2.ok) {
        const msg = await r2.text();
        throw new Error(`Save splits failed (${r2.status}): ${msg}`);
      }

      // success → reset
      setIsExpenseOpen(false);
      setExpCategory("Groceries");
      setExpTitle("");
      setPayerId(people[0]?.id ?? null);
      setExpAmount("");
      setExpTaxPct("");
      setSplitMethod("equally");
      setSelectedIds(new Set(people.map((p) => p.id)));
      setPerValues({});
      setExpNotes("");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save expense/splits.");
    }
  }

  return (
    <nav className="fixed bottom-20 inset-x-0 z-100 pb-[env(safe-area-inset-bottom)]" role="navigation" aria-label="Primary">
      <div className="max-w-md mx-auto px-5 py-3 flex items-center justify-end">
        <button
          ref={addBtnRef}
          type="button"
          onClick={() => setIsActionsOpen((o) => !o)}
          onMouseDown={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-amber-400 text-slate-900 ring-1 ring-amber-300 shadow-[0_10px_24px_rgba(0,0,0,0.15)] hover:bg-amber-300 active:scale-95 transition"
          aria-haspopup="menu"
          aria-expanded={isActionsOpen}
          aria-controls="add-actions"
        >
          <span>Menu</span>
          <ChevronDownIcon className={`h-4 w-4 transition ${isActionsOpen ? "rotate-180" : "rotate-0"}`} />
        </button>
      </div>

      {/* ACTION SHEET */}
      <ActionSheet
        sheetRef={sheetRef}
        isActionsOpen={isActionsOpen}
        setIsActionsOpen={setIsActionsOpen}
        setIsExpenseOpen={setIsExpenseOpen}
      />

      {/* ===================== EXPENSE SHEET ===================== */}
      {isExpenseOpen && (
        <BottomSheet title="Add Expense" onClose={() => setIsExpenseOpen(false)}>
          <form className="space-y-4 text-sm" onSubmit={handleSubmitExpense}>
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-slate-600">Title</label>
              <input
                type="text"
                placeholder="Enter expense title"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-slate-600">Category</label>
              <div className="mt-1">
                <MobileSelect value={expCategory} onChange={setExpCategory} options={categoryOptions} />
              </div>
            </div>

            {/* Who Paid */}
            <div>
              <label className="block text-xs font-medium text-slate-600">Who paid?</label>
              <div className="mt-1">
                <MobileSelect value={payerId ?? ""} onChange={onChangePayer} options={people} />
              </div>
            </div>

            {/* Participants */}
            <ShareChips
              people={people}
              selectedIds={selectedIds}
              onToggle={togglePerson}
              onAll={() => toggleSelectAll(true)}
              onNone={() => toggleSelectAll(false)}
              disabledIds={new Set(payerId != null ? [payerId] : [])}
            />

            {/* Subtotal + Tax (%) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600">Amount (RM, pre-tax)</label>
                <input
                  inputMode="decimal"
                  placeholder="0.00"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value.replace(/,/g, "."))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Tax (%)</label>
                <input
                  inputMode="decimal"
                  placeholder="0"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  value={expTaxPct}
                  onChange={(e) => setExpTaxPct(e.target.value.replace(/,/g, "."))}
                />
              </div>
            </div>

            {/* Split method */}
            <SegmentedTabs
              value={splitMethod}
              onChange={setSplitMethod}
              tabs={[
                { key: "equally", label: "Equally" },
                { key: "percentage", label: "Percentage" },
                { key: "amount", label: "Amount" },
              ]}
            />

            {/* Hint */}
            <div className="text-xs text-slate-600">
              {splitMethod === "percentage"
                ? "Enter percents; last person auto-fills to 100%."
                : splitMethod === "amount"
                ? "Enter pre-tax amounts; last person auto-fills to hit the subtotal."
                : "Everyone will pay the same (pre-tax). Tax is applied after the split."}
            </div>

            {/* Per-person inputs (for percentage/amount modes) */}
            {(splitMethod === "percentage" || splitMethod === "amount") && (
              <div className="space-y-2">
                {participants.map((p) => {
                  const isLast = participants.length === 1 || p.id === lastParticipantId;
                  const inputValue =
                    splitMethod === "amount"
                      ? (Number(computedAmountsPreTax[p.id]) || 0).toFixed(2)
                      : (Number(computedPercents[p.id]) || 0).toFixed(2);

                  const shareNow = sharesFinal[p.id] ?? 0; // show FINAL with tax

                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-slate-800">{p.name}</div>
                        <div className="text-[11px] text-slate-500">
                          Final share now: RM {shareNow.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          inputMode="decimal"
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:bg-slate-100"
                          value={inputValue}
                          disabled={isLast}
                          onChange={(e) => {
                            const v = e.target.value;
                            setPerValues((prev) => ({ ...prev, [p.id]: v }));
                          }}
                        />
                        {splitMethod === "percentage" && (
                          <span className="text-xs text-slate-500">%</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Summary (FINAL with tax) */}
            <div className="text-[13px]">
              <SummaryCard
                subtotal={subtotal}
                tax={taxAmount}
                total={grandTotal}
                payerNet={payerNet}
                payerName={people.find((x) => x.id === payerId)?.name || "Payer"}
                rows={participants.map((p) => ({
                  id: p.id,
                  name: p.name,
                  share: sharesFinal[p.id] || 0, // FINAL with tax
                }))}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-600">Notes</label>
              <textarea
                rows={3}
                placeholder="Optional"
                className="mt-1 w-full min-h-14 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-y"
                value={expNotes}
                onChange={(e) => setExpNotes(e.target.value)}
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setIsExpenseOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValidExpense}
                className={`rounded-lg ring-1 ring-amber-300 px-4 py-1.5 text-sm font-semibold text-slate-900 ${
                  isValidExpense ? "bg-amber-400 hover:bg-amber-300" : "bg-amber-200 cursor-not-allowed"
                }`}
              >
                Save Expense
              </button>
            </div>
          </form>
        </BottomSheet>
      )}
    </nav>
  );
}
