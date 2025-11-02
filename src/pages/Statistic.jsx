// src/pages/Statistic.jsx
import { useEffect, useMemo, useState } from "react";
import Head from "../components/Head";
import Navigate from "../components/Navigate";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Wallet, AlertTriangle, PieChart as PieIcon, TrendingUp } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL || "";

// Tailwind palette hexes only
const TAILWIND_COLORS = [
  "#f59e0b", // amber-500
  "#60a5fa", // sky-400
  "#34d399", // emerald-400
  "#f472b6", // pink-400
  "#a78bfa", // violet-400
  "#fb7185", // rose-400
  "#22c55e", // green-500
  "#eab308", // yellow-500
  "#38bdf8", // cyan-400
];

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="h-3 w-24 bg-slate-200/70 rounded" />
      <div className="mt-3 h-7 w-40 bg-slate-200/80 rounded" />
    </div>
  );
}

export default function Statistic() {
  const [range, setRange] = useState("month");
  const groupId = localStorage.getItem("groupId");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!groupId) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API}/api/v1/stats?groupId=${groupId}&range=${range}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setData(json);
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || "Failed to load stats.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [groupId, range]);

  const catData = data?.categoryBreakdown ?? [];
  const series = data?.series ?? [];

  const totalExpense = Number(data?.totalExpense ?? 0);
  const totalUnpaid = Number(data?.totalUnpaid ?? 0);

  const fmtRM = (v) =>
    `RM ${Number(v || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const hasPie = catData.length > 0 && catData.some((d) => Number(d.total) > 0);
  const hasSeries = series.length > 0 && series.some((d) => Number(d.total) > 0);

  // Keep a deterministic color mapping per category
  const colorForCat = (cat, idx) => TAILWIND_COLORS[idx % TAILWIND_COLORS.length];

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col">
      <Head />

      <main className="flex-1 px-5 pt-20 pb-28 text-slate-800 max-w-md mx-auto w-full">
        {/* Header + Range */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Statistics</h1>
            <div className="mt-1 text-xs text-slate-500">
              {range === "month" ? "This month" : "All time"}
            </div>
          </div>

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

        {err && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        )}

        {/* KPI Cards (title only) */}
        <div className="grid grid-cols-2 gap-3">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wide text-slate-600">Total Expense</div>
                  <span className="grid place-items-center h-8 w-8 rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-200">
                    <Wallet size={18} />
                  </span>
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{fmtRM(totalExpense)}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wide text-slate-600">Total Unpaid</div>
                  <span className="grid place-items-center h-8 w-8 rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-200">
                    <AlertTriangle size={18} />
                  </span>
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{fmtRM(totalUnpaid)}</div>
              </div>
            </>
          )}
        </div>

        {/* By Category — Pie on top, list below */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <span className="grid place-items-center h-7 w-7 rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-200">
                <PieIcon size={16} />
              </span>
              <div className="text-sm font-semibold text-slate-900">By Category</div>
            </div>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="h-[220px] grid place-items-center text-slate-400 text-sm">Loading…</div>
            ) : hasPie ? (
              <>
                {/* Pie */}
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip formatter={(v) => fmtRM(v)} />
                      <Pie
                        data={catData}
                        dataKey="total"
                        nameKey="category"
                        outerRadius={84}
                        innerRadius={44}
                        paddingAngle={2}
                      >
                        {catData.map((entry, idx) => (
                          <Cell key={entry.category ?? idx} fill={colorForCat(entry.category, idx)} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* List header */}
                <div className="mt-3 text-xs font-semibold text-slate-600">Category</div>

                {/* Orb list */}
                <div className="mt-2 space-y-1.5">
                  {catData
                    .slice()
                    .sort((a, b) => Number(b.total) - Number(a.total))
                    .map((c, idx) => (
                      <div key={c.category ?? idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: colorForCat(c.category, idx) }}
                            aria-hidden
                          />
                          <span className="text-[13px] text-slate-700 truncate">
                            {c.category || "Uncategorized"}
                          </span>
                        </div>
                        <span className="text-[13px] font-medium text-slate-900">
                          {fmtRM(c.total)}
                        </span>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No category data
              </div>
            )}
          </div>
        </section>

        {/* Expense Trend — Amber theme */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <span className="grid place-items-center h-7 w-7 rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-200">
                <TrendingUp size={16} />
              </span>
              <div className="text-sm font-semibold text-slate-900">Expense Trend</div>
            </div>
          </div>

          <div className="mt-3 h-[230px]">
            {loading ? (
              <div className="h-full grid place-items-center text-slate-400 text-sm">Loading…</div>
            ) : hasSeries ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    {/* amber-500 to transparent */}
                    <linearGradient id="fillAmber" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.06} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `RM ${Math.round(Number(v) || 0)}`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmtRM(v)} labelFormatter={(l) => `Date: ${l}`} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#f59e0b"           // amber-500
                    fill="url(#fillAmber)"     // gradient
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No trend data
              </div>
            )}
          </div>
        </section>

        <div className="h-4" />
      </main>

      <Navigate />
    </div>
  );
}
