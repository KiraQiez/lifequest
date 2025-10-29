import { BanknotesIcon, ReceiptRefundIcon } from "@heroicons/react/24/outline";

export default function ActionSheet({
  sheetRef,
  isActionsOpen,
  setIsActionsOpen,
  setIsExpenseOpen,
  setIsPaymentOpen,
}) {
  return (
    <div className="relative max-w-md mx-auto">
      {isActionsOpen && (
        <div
            ref={sheetRef}
            id="add-actions"
            role="menu"
            aria-label="Add actions"
            className="absolute bottom-18 right-4 w-[18rem] z-55"
          >
            {/* caret / nub */}
            <div className="absolute -bottom-2 right-6 h-4 w-4 rotate-45 bg-white border-r border-b border-slate-200" />
        
            <div
              className="rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 overflow-hidden
                         origin-bottom-right transition transform duration-150 ease-out scale-100 opacity-100"
              data-state="open"
            >
              <div className="px-4 pt-3 pb-2">
                <p className="text-[13px] font-semibold text-slate-700">Quick actions</p>
              </div>
        
              <button
                role="menuitem"
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 active:scale-[.99]"
                onClick={() => {
                  setIsActionsOpen(false);
                  setIsExpenseOpen(true);         // open your expense UI (wire your modal here)
                }}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
                  <ReceiptRefundIcon className="h-5 w-5 text-white" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-slate-900">Add Expense</span>
                  <span className="block text-xs text-slate-500">Split a cost among members</span>
                </span>
              </button>
              
              <div className="h-px bg-slate-200" />
              
              <button
                role="menuitem"
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 active:scale-[.99]"
                onClick={() => {
                  setIsActionsOpen(false);
                  setIsPaymentOpen(true);
                }}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-300">
                  <BanknotesIcon className="h-5 w-5 text-slate-900" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-slate-900">Add Payment</span>
                  <span className="block text-xs text-slate-500">Record a transfer between members</span>
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
}