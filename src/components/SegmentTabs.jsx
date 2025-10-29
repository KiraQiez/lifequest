export default function SegmentedTabs({ value, onChange, tabs }) {
  return (
    <div className="bg-slate-100 p-1 rounded-xl inline-flex">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`px-3 py-1.5 rounded-lg text-sm transition
            ${value === t.key ? "bg-slate-900 text-white" : "text-slate-700"}
          `}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
