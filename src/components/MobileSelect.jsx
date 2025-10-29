import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";


export default function MobileSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        popRef.current && !popRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const active = options.find((o) => String(o.id) === String(value)) || options[0];

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-11 rounded-xl border border-slate-300 bg-white pr-10 pl-3 text-left text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {active?.name}
        <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
      </button>

      {open && (
        <ul
          ref={popRef}
          role="listbox"
          tabIndex={-1}
          className="absolute z-70 mt-2 w-full max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black/5"
        >
          {options.map((opt) => {
            const selected = String(opt.id) === String(value);
            return (
              <li
                key={opt.id}
                role="option"
                aria-selected={selected}
                className={`px-3.5 py-2.5 text-sm cursor-pointer hover:bg-slate-50 ${selected ? "bg-amber-50 text-slate-900" : "text-slate-700"}`}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
              >
                {opt.name}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}