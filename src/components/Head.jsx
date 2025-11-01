import {DocumentTextIcon, UserIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

export default function Head() {
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      {/* Soft amber gradient header background */}
      <div className="pointer-events-none absolute inset-0 h-[100px] bg-linear-to-b from-amber-100 via-amber-50 to-transparent" />

      {/* App bar */}
      <nav
        className="
          relative
          mx-auto max-w-md px-4 pt-3 pb-2
          flex items-center justify-between
        "
        role="navigation"
        aria-label="Top"
      >
       

        {/* Center: Title */}
        <div className="flex items-center gap-3">
             <button
            className="
              inline-flex items-center justify-center
              h-9 w-9 rounded-full
              bg-amber-400 text-slate-900
              ring-1 ring-amber-300 shadow-[0_8px_20px_rgba(0,0,0,0.12)]
              active:scale-95 transition
            "
            aria-label="Profile"
          >
            <UserIcon className="h-5 w-5" />
          </button>
                  <div className="text-sm text-gray-700">
          Welcome back! <br />
          <span className="">User</span>
        </div>
        </div>


        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Link
            to="/transactions"
            className="
              inline-flex items-center justify-center
              h-9 w-9 rounded-full
              bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/70
              border border-slate-200 shadow-sm
              active:scale-95 transition
            "
            aria-label="Transactions"
          >
            <DocumentTextIcon className="h-5 w-5 text-slate-800" />
          </Link>
         
        </div>
      </nav>
    </header>
  );
}
