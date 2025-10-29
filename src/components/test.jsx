function test() {
    const [isExpenseOpen, setIsExpenseOpen] = useState(false);
    
    return(
        <div>
              {/* ====== Expense Modal ====== */}
      {isExpenseOpen && (
        <Modal title="Add Expense" onClose={() => setIsExpenseOpen(false)}>
          <form className="space-y-4" onSubmit={handleSubmitExpense}>
            {/* Who paid */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Who paid?</label>
              <select
                className="w-full rounded-lg border-slate-300 focus:ring-amber-400 focus:border-amber-400"
                value={payerId}
                onChange={(e) => setPayerId(Number(e.target.value))}
              >
                {people.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Participants */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Who shares?</label>
                <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === people.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                  All
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {people.map(p => (
                  <label key={p.id} className={`px-3 py-1.5 rounded-full border text-sm cursor-pointer select-none ${selectedIds.has(p.id) ? "bg-amber-50 border-amber-300 text-slate-900" : "bg-white border-slate-300 text-slate-600"}`}>
                    <input
                      type="checkbox"
                      className="mr-2 align-middle"
                      checked={selectedIds.has(p.id)}
                      onChange={() => togglePerson(p.id)}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Amount & Tax */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (RM)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border-slate-300 focus:ring-amber-400 focus:border-amber-400"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tax / Fee (RM)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border-slate-300 focus:ring-amber-400 focus:border-amber-400"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                />
              </div>
            </div>

            {/* Split method */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Split method</label>
              <div className="flex gap-2">
                {[
                  { key: "equally", label: "Equally" },
                  { key: "percentage", label: "Percentage" },
                  { key: "amount", label: "Amount" },
                ].map(opt => (
                  <button
                    type="button"
                    key={opt.key}
                    onClick={() => setSplitMethod(opt.key)}
                    className={`px-3 py-1.5 rounded-full border text-sm ${splitMethod === opt.key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic inputs for percentage/amount */}
            {(splitMethod === "percentage" || splitMethod === "amount") && (
              <div className="space-y-2">
                <div className="text-xs text-slate-600">
                  {splitMethod === "percentage"
                    ? "Enter a relative weight (e.g., 50, 30, 20). We'll normalise to 100%."
                    : "Enter each person's amount. We'll adjust any cents rounding on the last person."}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {participants.map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="text-sm w-20 truncate">{p.name}</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="flex-1 rounded-lg border-slate-300 focus:ring-amber-400 focus:border-amber-400"
                        value={perValues[p.id] ?? 0}
                        onChange={(e) =>
                          setPerValues(v => ({ ...v, [p.id]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">Total</span>
                <span className="font-bold">RM {total.toFixed(2)}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span className="text-slate-600">{p.name}</span>
                    <span className="font-semibold">RM {(computedShares[p.id] ?? 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full rounded-lg border-slate-300 focus:ring-amber-400 focus:border-amber-400"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  className="w-full rounded-lg border-slate-300 focus:ring-amber-400 focus:border-amber-400"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {["General", "Food", "Transport", "Accommodation", "Shopping", "Bills"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <input
                type="text"
                placeholder="Optional note (e.g., 'Lunch at Nasi Kandar')"
                className="w-full rounded-lg border-slate-300 focus:ring-amber-400 focus:border-amber-400"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                onClick={() => setIsExpenseOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-400 text-slate-900 font-semibold ring-1 ring-amber-300 hover:bg-amber-300"
              >
                Save Expense
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}