import {
  BanknotesIcon,
  ReceiptRefundIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

export default function ActionSheet({
  sheetRef,
  isActionsOpen,
  setIsActionsOpen,
  setIsExpenseOpen,
}) {
  return (
    <div className="relative max-w-md mx-auto">
      {isActionsOpen && (
        <div
          ref={sheetRef}
          id="add-actions"
          role="menu"
          aria-label="Add actions"
          className="absolute bottom-15 right-4 w-[18rem] z-60"
        >


          <div
            className="rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 overflow-hidden
                       origin-bottom-right transition transform duration-150 ease-out scale-100 opacity-100"
            data-state="open"
          >
            {/* Header */}
            <div className="px-4 pt-3 pb-2">
              <p className="text-[13px] font-semibold text-slate-700">
                Quick actions
              </p>
            </div>

            {/* Add Expense */}
            <button
              role="menuitem"
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 active:scale-[.99]"
              onClick={() => {
                setIsActionsOpen(false);
                setIsExpenseOpen(true);
              }}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
                <ReceiptRefundIcon className="h-5 w-5 text-white" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-900">
                  Add Expense
                </span>
                <span className="block text-xs text-slate-500">
                  Split a cost among members
                </span>
              </span>
            </button>


            <div className="h-px bg-slate-200" />

            {/* Change Group */}
            <Link
             to="/group"
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 active:scale-[.99]"
              aria-label="Group"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 ring-1 ring-amber-200">
                <UserGroupIcon className="h-5 w-5 text-amber-700" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-900">
                  Change Group
                </span>
                <span className="block text-xs text-slate-500">
                  Switch between your active groups
                </span>
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
