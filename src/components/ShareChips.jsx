

export default function ShareChips({ people, selectedIds, onToggle, onAll, onNone }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-medium text-slate-600">Who shares?</label>
        <div className="flex gap-2">
          <button type="button" className="text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-700 active:scale-95" onClick={onAll}>All</button>
          <button type="button" className="text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-700 active:scale-95" onClick={onNone}>None</button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {people.map((p) => {
          const active = selectedIds.has(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onToggle(p.id)}
              className={`px-3 py-1.5 rounded-full border text-sm shrink-0
                ${active ? "bg-amber-50 border-amber-300 text-slate-900" : "bg-white border-slate-300 text-slate-600"}
              `}
            >
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
