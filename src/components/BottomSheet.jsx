// BottomSheet.jsx
import { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function BottomSheet({ title, onClose, children }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose?.(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-60">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-x-0 bottom-0 max-w-md mx-auto rounded-t-2xl bg-white shadow-2xl border-t border-slate-200 overflow-hidden animate-[slideUp_.2s_ease-out]">
        {/* Handle + Header */}
        <div className="px-4 pt-3 pb-2">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300/70" />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <button type="button" onClick={onClose} aria-label="Close" className="p-2 rounded-lg hover:bg-slate-100">
              <XMarkIcon className="h-5 w-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Scrollable body (≈70% viewport) */}
        <div className="px-4 pb-6 max-h-[70vh] overflow-y-auto">
          {children}
          <div className="h-2" />
        </div>
      </div>

      <style>{`@keyframes slideUp{from{transform:translateY(16px);opacity:.98}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}
