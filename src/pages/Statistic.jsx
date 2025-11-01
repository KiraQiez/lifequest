// src/pages/Statistic.jsx
import { useState } from "react";
import Head from "../components/Head";
import Navigate from "../components/Navigate";

export default function Statistic() {
  const [range, setRange] = useState("month"); // "month" | "all"

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col">
      <Head />

      <main className="flex-1 px-5 pt-20 pb-28 text-slate-800 max-w-md mx-auto w-full">
        {/* Title + Range Filter */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Statistics</h1>
            <div className="mt-1 text-xs text-slate-500">
              {range === "month" ? "This month" : "All time"}
            </div>
          </div>

          {/* Range pill */}
          <div className="inline-flex items-center rounded-full border border-slate-300 bg-white p-1">
            <button
              onClick={() => setRange("month")}
              className={`px-3 py-1 text-xs font-semibold rounded-full text-slate-900 hover:bg-slate-100 transition ${
                range === "month" ? "bg-slate-100" : ""
              }`}
            >
              This month
            </button>
            <span className="mx-0.5 h-4 w-px bg-slate-200" aria-hidden />
            <button
              onClick={() => setRange("all")}
              className={`px-3 py-1 text-xs font-semibold rounded-full text-slate-900 hover:bg-slate-100 transition ${
                range === "all" ? "bg-slate-100" : ""
              }`}
            >
              All time
            </button>
          </div>
        </div>

        <div className="h-px bg-slate-200 mt-3 mb-5" />

        {/* Placeholder */}
        <div className="mt-6">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <div className="text-sm text-slate-400 select-none">
              &lt;Under Development&gt;
            </div>
          </div>
        </div>
      </main>

      <Navigate />
    </div>
  );
}
