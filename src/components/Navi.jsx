import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PlusIcon, UsersIcon, ArrowsRightLeftIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import ActionSheet from "./ActionSheet";
import MobileSelect from "./MobileSelect";
import BottomSheet from "./BottomSheet";
import SegmentedTabs from "./SegmentTabs";
import ShareChips from "./ShareChips";
import SummaryCard from "./SummaryCard";



export default function Navi({ members, onAddPayment, onAddExpense }) {
  const people = members ?? [];

  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
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

  // ===================== PAYMENT =====================
  const [payFromId, setPayFromId] = useState(people[0]?.id ?? 1);
  const [payToId, setPayToId] = useState(people[1]?.id ?? people[0]?.id ?? 1);
  const [payAmount, setPayAmount] = useState("");
  const [notes, setNotes] = useState("");

  function swapParties() {
    setPayFromId((from) => {
      const to = payToId;
      setPayToId(from);
      return to;
    });
  }
  function preset(val) {
    setPayAmount((prev) => (prev ? String(+prev + val) : String(val)));
  }

  const isValidPayment = useMemo(() => {
    const n = Number(payAmount);
    return n > 0 && payFromId !== payToId;
  }, [payAmount, payFromId, payToId]);

  async function handleSubmitPayment(e) {
    e.preventDefault();
    const amountNum = Number(payAmount);
    if (!amountNum || amountNum <= 0) return;
    if (payFromId === payToId) return;

    try {
      const res = await fetch(`/api/v1/payment/addPayment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payerId: payFromId,
          receiverId: payToId,
          amount: amountNum,
          notes,
          date: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Payment failed (${res.status}): ${msg}`);
      }

      onAddPayment?.(); // optional: parent refresh hook
      setIsPaymentOpen(false);
      setPayAmount("");
      setNotes("");
    } catch (err) {
      console.error(err);
      alert(err.message || "Payment failed.");
    }
  }

  // ===================== EXPENSE =====================
  const [payerId, setPayerId] = useState(people[0]?.id ?? 1);
  const [expAmount, setExpAmount] = useState("");
  const [expTax, setExpTax] = useState("");
  const [splitMethod, setSplitMethod] = useState("equally"); // equally | percentage | amount
  const [selectedIds, setSelectedIds] = useState(new Set(people.map((p) => p.id)));
  const [perValues, setPerValues] = useState({}); // { userId: number | string }
  const [expNotes, setExpNotes] = useState("");

  // participants
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

  // keep perValues in sync
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

      // avoid useless state update
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
      const wSum = pctSum; // safe
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

  function toggleSelectAll(checked) {
    setSelectedIds(checked ? new Set(people.map((p) => p.id)) : new Set());
  }
  function togglePerson(id) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const isValidExpense = useMemo(() => {
    const baseOk = Number(expAmount) > 0 && participants.length > 0;
    if (!baseOk) return false;
    if (splitMethod === "amount") return remainingAmt === 0;
    if (splitMethod === "percentage") return pctSum > 0;
    return true;
  }, [expAmount, participants.length, splitMethod, remainingAmt, pctSum]);

  async function handleSubmitExpense(e) {
    e.preventDefault();
    const amountNum = Number(expAmount) || 0;
    const taxNum = Number(expTax) || 0;
    if (amountNum <= 0) return;
    if (!participants.length) return;

    // let parent store local copy if they want
    onAddExpense?.({
      type: "expense",
      payerId,
      participants: participants.map((p) => p.id),
      amount: amountNum,
      tax: taxNum,
      total: amountNum + taxNum,
      splitMethod,
      shares: expShares,
      notes: expNotes,
      date: new Date().toISOString().slice(0, 10),
      category: "General",
    });

    // 1) Create expense shell
    try {
      const res = await fetch(`/api/v1/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payerId,
          amount: amountNum,
          tax: taxNum,
          splitMethod,
          date: new Date().toISOString().slice(0, 10),
          notes: expNotes,
        }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Create expense failed (${res.status}): ${msg}`);
      }
      const expense = await res.json();
      const expenseId = expense?.id;

      // 2) Prepare clean splits (2dp + fix rounding residual on last person)
      const cleanSplits = participants.map((p) => ({
        memberId: p.id,
        amount: Number((expShares[p.id] || 0).toFixed(2)),
      }));
      // recompute sum and push any tiny rounding diff to last
      const sum = cleanSplits.reduce((a, b) => a + b.amount, 0);
      const residual = +(expTotal - sum).toFixed(2);
      if (Math.abs(residual) > 0 && cleanSplits.length > 0) {
        cleanSplits[cleanSplits.length - 1].amount = +(
          cleanSplits[cleanSplits.length - 1].amount + residual
        ).toFixed(2);
      }

      // 3) Replace splits for this expense
      const r2 = await fetch(`/api/v1/splits/replace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseId, splits: cleanSplits }),
      });
      if (!r2.ok) {
        const msg = await r2.text();
        throw new Error(`Save splits failed (${r2.status}): ${msg}`);
      }

      // success → reset UI
      setIsExpenseOpen(false);
      setPayerId(people[0]?.id ?? 1);
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

  // ===================== RENDER =====================
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]" role="navigation" aria-label="Primary">
      <div className="max-w-md mx-auto px-5 py-3 flex items-center justify-between">
        <Link
          to="/group"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-white text-slate-900 ring-1 ring-slate-200 shadow-[0_6px_18px_rgba(0,0,0,0.08)] hover:bg-slate-50 active:scale-95 transition"
          aria-label="Group"
        >
          <UsersIcon className="h-5 w-5" />
          <span>Group</span>
        </Link>

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
          <PlusIcon className="h-5 w-5" />
          <span>Add</span>
          <ChevronDownIcon className={`h-4 w-4 transition ${isActionsOpen ? "rotate-180" : "rotate-0"}`} />
        </button>
      </div>

      {/* ACTION SHEET */}
      <ActionSheet
        sheetRef={sheetRef}
        isActionsOpen={isActionsOpen}
        setIsActionsOpen={setIsActionsOpen}
        setIsExpenseOpen={setIsExpenseOpen}
        setIsPaymentOpen={setIsPaymentOpen}
      />

      <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-slate-300/60" />

      {/* ===================== PAYMENT SHEET ===================== */}
      {isPaymentOpen && (
        <BottomSheet title="Add Payment" onClose={() => setIsPaymentOpen(false)}>
          <form className="space-y-5" onSubmit={handleSubmitPayment}>
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
                <MobileSelect value={payFromId} onChange={(v) => setPayFromId(Number(v))} options={people} />
              </div>
              <button
                type="button"
                onClick={swapParties}
                className="mb-1 h-10 w-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center active:scale-95"
                aria-label="Swap payer and receiver"
              >
                <ArrowsRightLeftIcon className="h-5 w-5 text-slate-600" />
              </button>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
                <MobileSelect value={payToId} onChange={(v) => setPayToId(Number(v))} options={people} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Amount (RM)</label>
              <input
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                placeholder="0.00"
                className="w-full h-12 rounded-xl border border-slate-300 px-3 text-base tracking-wide focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value.replace(/,/g, "."))}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {[5, 10, 20, 50].map((v) => (
                  <button key={v} type="button" onClick={() => preset(v)} className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 text-sm active:scale-95">
                    +{v}
                  </button>
                ))}
                <button type="button" onClick={() => setPayAmount("")} className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-sm active:scale-95">
                  Clear
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea
                rows={3}
                placeholder="Optional"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-y min-h-14"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" className="px-4 h-11 rounded-xl border border-slate-300 text-slate-700 active:scale-95" onClick={() => setIsPaymentOpen(false)}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValidPayment}
                className={`px-4 h-11 rounded-xl font-semibold ring-1 ring-amber-300 text-slate-900 active:scale-95 ${
                  isValidPayment ? "bg-amber-400 hover:bg-amber-300" : "bg-amber-200 cursor-not-allowed"
                }`}
              >
                Save Payment
              </button>
            </div>
          </form>
        </BottomSheet>
      )}

      {/* ===================== EXPENSE SHEET ===================== */}
      {isExpenseOpen && (
        <BottomSheet title="Add Expense" onClose={() => setIsExpenseOpen(false)}>
          <form className="space-y-5" onSubmit={handleSubmitExpense}>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Who paid?</label>
              <MobileSelect value={payerId} onChange={(v) => setPayerId(Number(v))} options={people} />
            </div>

            <ShareChips
              people={people}
              selectedIds={selectedIds}
              onToggle={togglePerson}
              onAll={() => toggleSelectAll(true)}
              onNone={() => toggleSelectAll(false)}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Amount (RM)</label>
                <input
                  inputMode="decimal"
                  placeholder="0.00"
                  className="w-full h-12 rounded-xl border border-slate-300 px-3 text-base focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value.replace(/,/g, "."))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tax / Fee (RM)</label>
                <input
                  inputMode="decimal"
                  placeholder="0.00"
                  className="w-full h-12 rounded-xl border border-slate-300 px-3 text-base focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  value={expTax}
                  onChange={(e) => setExpTax(e.target.value.replace(/,/g, "."))}
                />
              </div>
            </div>

            <SegmentedTabs
              value={splitMethod}
              onChange={setSplitMethod}
              tabs={[
                { key: "equally", label: "Equally" },
                { key: "percentage", label: "Percentage" },
                { key: "amount", label: "Amount" },
              ]}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  {splitMethod === "percentage"
                    ? "Enter weights (e.g., 50, 30, 20). We’ll normalize them to total 100%."
                    : splitMethod === "amount"
                    ? "Enter each person’s amount. Save is enabled when Remaining = 0.00."
                    : "Everyone will pay the same share automatically based on the total."}
                </p>
              </div>

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
                        className="w-28 h-10 rounded-xl border border-slate-300 px-2 text-right focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                        value={String(perValues[p.id] ?? 0)}
                        onChange={(e) => setPerValues((v) => ({ ...v, [p.id]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <SummaryCard
              subtotal={Number(expAmount) || 0}
              tax={Number(expTax) || 0}
              total={expTotal}
              payerNet={payerNet}
              payerName={people.find((x) => x.id === payerId)?.name || "Payer"}
              rows={participants.map((p) => ({ id: p.id, name: p.name, share: expShares[p.id] || 0 }))}
            />

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea
                rows={3}
                placeholder="Optional"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-y min-h-14"
                value={expNotes}
                onChange={(e) => setExpNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                className="px-4 h-11 rounded-xl border border-slate-300 text-slate-700 active:scale-95"
                onClick={() => setIsExpenseOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValidExpense}
                className={`px-4 h-11 rounded-xl font-semibold ring-1 ring-amber-300 text-slate-900 active:scale-95 ${
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
