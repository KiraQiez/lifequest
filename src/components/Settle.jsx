import Card from "./Card";
import { BellIcon, CheckIcon } from "@heroicons/react/24/outline";

export default function Settle({
  items = [
    { name: "Alice", amount: -46.17 },
    { name: "Bob", amount: -30.0 },
    { name: "Charlie", amount: +24.0 },
    { name: "Diana", amount: +12.5 },
    { name: "Evan", amount: -9.99 },
    { name: "Farah", amount: +7.2 },
  ],
  maxHeightClass = "max-h-53", 
}) {
  return (
    <section className="mt-4">
      <Card className="p-0">
        <div className=" pb-4 text-xs uppercase tracking-wider text-slate-500">
          Settle
        </div>
        

        {/* scroll area */}
        <div
          className={`overflow-y-auto overscroll-contain ${maxHeightClass} no-scrollbar`}
          role="list"
          aria-label="People to remind"
        >
          {items.length ? (
            <ul className="divide-y divide-slate-200">
              {items.map((p) => (
                <li key={p.name}>
                  <Row {...p} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">All settled. 🎉</div>
          )}
        </div>
      </Card>
    </section>
  );
}

/* ---------- internals ---------- */

function Row({ name, amount }) {
  const isPositive = amount > 0; // they owe you
  const sign = isPositive ? "+" : "-"; // en dash looks cleaner than hyphen
  const display = `${sign} RM ${Math.abs(amount).toFixed(2)}`;

  return (
    <div className="relative px-3 py-2.5 flex items-center justify-between">
      {/* left accent stripe */}
      <span
        className= "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-slate-200"
        aria-hidden
      />

      {/* Left: avatar + name */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar name={name} highlight />
        <span className="text-sm font-medium text-slate-900 truncate max-w-46">
          {name}
        </span>
      </div>

      {/* Right: amount + remind (icon-only) */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-xs font-semibold min-w-[92px] text-right ${
            isPositive ? "text-slate-900" : "text-red-500"
          }`}
        >
          {display}
        </span>

        <button
          className="
            inline-grid place-items-center
            h-8 w-8 rounded-full
            border border-slate-200 bg-white
            text-slate-900 hover:bg-amber-50
            active:scale-95 transition
          "
          aria-label={`Remind ${name}`}
          title="Remind"
        >
            {isPositive ? <BellIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
          
        </button>
      </div>
    </div>
  );
}

function Avatar({ name = "", highlight }) {
  const initials = String(name)
    .trim()
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="relative">
      <div
        className={`grid place-items-center size-8 rounded-full text-[11px] font-bold
          ${highlight ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-800"}
        `}
      >
        {initials}
      </div>
      <span
        className={`pointer-events-none absolute -inset-0.5 rounded-full ring-1 ${
          highlight ? "ring-amber-400/70" : "ring-slate-200/70"
        }`}
      />
    </div>
  );
}
