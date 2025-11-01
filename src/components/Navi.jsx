// src/components/Navi.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import ActionSheet from "./ActionSheet";
import MobileSelect from "./MobileSelect";
import BottomSheet from "./BottomSheet";
import SegmentedTabs from "./SegmentTabs";
import ShareChips from "./ShareChips";
import SummaryCard from "./SummaryCard";

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

  const [expAmount, setExpAmount] = useState("");
  const [expTax, setExpTax] = useState("");
  const [splitMethod, setSplitMethod] = useState("equally"); // equally | percentage | amount

  // shares selection (auto-includes payer and locks them)
  const [selectedIds, setSelectedIds] = useState(
    new Set(people.map((p) => p.id))
  );

  const [perValues, setPerValues] = useState({}); // { userId: number|string }
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

  // stable dependency keys
  const selectedIdsKey = useMemo(
    () => Array.from(selectedIds).sort((a, b) => a - b).join(","),
    [selectedIds]
  );
  const peopleKey = useMemo(
    () => people.map((p) => p.id).sort((a, b) => a - b).join(","),
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
        const id = Number(k);
        const stillExists = people.some((p) => p.id === id);
        if (!stillExists || !selectedIds.has(id)) delete next[k];
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

  // --- totals & helpers ---
  const expTotal = useMemo(() => {
    const a = Number(expAmount) || 0;
    const t = Number(expTax) || 0;
    return +(a + t).toFixed(2);
  }, [expAmount, expTax]);

  const equalShare = useMemo(() => {
    const n = Math.max(1, participants.length);
    return +(expTotal / n).toFixed(2);
  }, [expTotal, participants.length]);

  const perAmountSum = useMemo(
    () => participants.reduce((s, p) => s + (Number(perValues[p.id]) || 0), 0),
    [participants, perValues]
  );

  const remainingAmt = useMemo(
    () => +(expTotal - perAmountSum).toFixed(2),
    [expTotal, perAmountSum]
  );

  const pctSum = useMemo(
    () => participants.reduce((s, p) => s + (Number(perValues[p.id]) || 0), 0),
    [participants, perValues]
  );

  // --- shares ---
  const expShares = useMemo(() => {
    if (!participants.length) return {};

    if (splitMethod === "equally") {
      const s = {};
      participants.forEach((p) => (s[p.id] = equalShare));
      // rounding fix
      const sum = Object.values(s).reduce((a, b) => a + b, 0);
      const diff = +(expTotal - sum).toFixed(2);
      if (Math.abs(diff) > 0) {
        const last = participants[participants.length - 1].id;
        s[last] = +(s[last] + diff).toFixed(2);
      }
      return s;
    }

    if (splitMethod === "percentage") {
      const s = {};
      const wSum = pctSum;
      participants.forEach((p) => {
        const w = Number(perValues[p.id]) || 0;
        const portion = wSum > 0 ? (w / wSum) * expTotal : 0;
        s[p.id] = +portion.toFixed(2);
      });
      // rounding fix
      const sum = Object.values(s).reduce((a, b) => a + b, 0);
      const diff = +(expTotal - sum).toFixed(2);
      if (Math.abs(diff) > 0) {
        const last = participants[participants.length - 1].id;
        s[last] = +(s[last] + diff).toFixed(2);
      }
      return s;
    }

    if (splitMethod === "amount") {
      const s = {};
      participants.forEach((p) => {
        s[p.id] = +((Number(perValues[p.id]) || 0).toFixed(2));
      });
      return s;
    }

    return {};
  }, [participants, splitMethod, equalShare, expTotal, perValues, pctSum]);

  // payer net (for summary)
  const shareOfPayer = expShares[payerId] || 0;
  const payerNet = +(expTotal - shareOfPayer).toFixed(2);

  // ---------- LOCKING LOGIC (payer always selected) ----------
  function toggleSelectAll(checked) {
    if (checked) {
      const next = new Set(people.map((p) => p.id));
      if (payerId != null) next.add(payerId); // enforce payer
      setSelectedIds(next);
    } else {
      const next = new Set();
      if (payerId != null) next.add(payerId); // keep payer even on "None"
      setSelectedIds(next);
    }
  }

  function togglePerson(id) {
    if (id === payerId) return; // prevent unselecting the payer
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      if (payerId != null) n.add(payerId); // re-enforce payer lock
      return n;
    });
  }

  // When payer is changed in MobileSelect: auto-select them (effect above will enforce)
  function onChangePayer(newVal) {
    setPayerId(Number(newVal));
  }

  const isValidExpense = useMemo(() => {
    const baseOk = Number(expAmount) > 0 && participants.length > 0 && payerId != null;
    if (!baseOk) return false;
    if (splitMethod === "amount") return remainingAmt === 0;
    if (splitMethod === "percentage") return pctSum > 0;
    return true;
  }, [expAmount, participants.length, splitMethod, remainingAmt, pctSum, payerId]);

  async function handleSubmitExpense(e) {
    e.preventDefault();
    const amountNum = Number(expAmount) || 0;
    const taxNum = Number(expTax) || 0;
    if (amountNum <= 0 || !participants.length || payerId == null) return;

    try {
      // 1) Create expense shell
      const res = await fetch(`/api/v1/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: expTitle,
          payerId,
          amount: amountNum,
          tax: taxNum,
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

      // 2) Clean splits (2dp + push rounding residual to last)
      const cleanSplits = participants.map((p) => ({
        memberId: p.id,
        amount: Number((expShares[p.id] || 0).toFixed(2)),
      }));
      const sum = cleanSplits.reduce((a, b) => a + b.amount, 0);
      const residual = +(expTotal - sum).toFixed(2);
      if (Math.abs(residual) > 0 && cleanSplits.length > 0) {
        cleanSplits[cleanSplits.length - 1].amount = +(
          cleanSplits[cleanSplits.length - 1].amount + residual
        ).toFixed(2);
      }

      // 3) Save splits
      const r2 = await fetch(`/api/v1/split/addSplit`, {
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
      setExpTax("");
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
    <nav
      className="fixed bottom-20 inset-x-0 z-100 pb-[env(safe-area-inset-bottom)]"
      role="navigation"
      aria-label="Primary"
    >
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
          <ChevronDownIcon
            className={`h-4 w-4 transition ${isActionsOpen ? "rotate-180" : "rotate-0"}`}
          />
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
                <MobileSelect
                  value={expCategory}
                  onChange={(v) => setExpCategory(v)}
                  options={categoryOptions}
                />
              </div>
            </div>

            {/* Who Paid (auto-locks in shares) */}
            <div>
              <label className="block text-xs font-medium text-slate-600">Who paid?</label>
              <div className="mt-1">
                <MobileSelect
                  value={payerId ?? ""}
                  onChange={onChangePayer}
                  options={people}
                />
              </div>
            </div>

            {/* Participants (payer locked) */}
            <ShareChips
              people={people}
              selectedIds={selectedIds}
              onToggle={togglePerson}
              onAll={() => toggleSelectAll(true)}
              onNone={() => toggleSelectAll(false)}
              // If your ShareChips supports this, it will visually disable/lock the payer chip
              disabledIds={new Set(payerId != null ? [payerId] : [])}
            />

            {/* Amount + Tax */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600">Amount (RM)</label>
                <input
                  inputMode="decimal"
                  placeholder="0.00"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value.replace(/,/g, "."))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Tax / Fee (RM)</label>
                <input
                  inputMode="decimal"
                  placeholder="0.00"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  value={expTax}
                  onChange={(e) => setExpTax(e.target.value.replace(/,/g, "."))}
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
                ? "Enter weights (e.g., 50, 30, 20). We’ll normalize them to total 100%."
                : splitMethod === "amount"
                ? "Enter each person’s amount. Save is enabled when Remaining = 0.00."
                : "Everyone will pay the same share automatically based on the total."}
            </div>

            {/* Per-person inputs (for percentage/amount modes) */}
            {(splitMethod === "percentage" || splitMethod === "amount") && (
              <div className="space-y-2">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-slate-800">{p.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Share now: RM {(expShares[p.id] ?? 0).toFixed(2)}
                      </div>
                    </div>
                    <input
                      inputMode="decimal"
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      value={String(perValues[p.id] ?? 0)}
                      onChange={(e) =>
                        setPerValues((v) => ({ ...v, [p.id]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            <div className="text-[13px]">
              <SummaryCard
                subtotal={Number(expAmount) || 0}
                tax={Number(expTax) || 0}
                total={expTotal}
                payerNet={payerNet}
                payerName={people.find((x) => x.id === payerId)?.name || "Payer"}
                rows={participants.map((p) => ({
                  id: p.id,
                  name: p.name,
                  share: expShares[p.id] || 0,
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
                  isValidExpense
                    ? "bg-amber-400 hover:bg-amber-300"
                    : "bg-amber-200 cursor-not-allowed"
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
