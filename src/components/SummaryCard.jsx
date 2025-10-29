

export default function SummaryCard({ subtotal, tax, total, payerNet, payerName, rows }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">Subtotal</span>
        <span className="font-medium">RM {subtotal.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between text-sm mt-1">
        <span className="text-slate-600">Tax/Fees</span>
        <span className="font-medium">RM {tax.toFixed(2)}</span>
      </div>
      <div className="h-px bg-slate-200 my-2" />
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-700">Total</span>
        <span className="font-bold">RM {total.toFixed(2)}</span>
      </div>

      <div className="mt-3 grid gap-1 text-sm">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between">
            <span className="text-slate-600 truncate">{r.name}</span>
            <span className="font-semibold">RM {r.share.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className={`mt-3 text-xs rounded-lg px-2 py-1 border ${
        payerNet >= 0 ? "border-green-300 bg-green-50 text-green-700" : "border-amber-300 bg-amber-50 text-amber-700"
      }`}>
        {payerNet >= 0
          ? `${payerName} is owed RM ${payerNet.toFixed(2)}`
          : `${payerName} owes RM ${Math.abs(payerNet).toFixed(2)}`}
      </div>
    </div>
  );
}