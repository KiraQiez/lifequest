import { useMemo } from "react";
import Card from "./Card";

export default function GroupMembersCard({ groupName, groupCode, members }) {
  // Normalize to [{ id, name }]
  const uiMembers = useMemo(() => {
    return members.map((m, idx) => {
      if (m && typeof m === "object") {
        const id = Number(m.id);
        let name = String(m.name);
        name = name
        .toLowerCase()
        .replace(/\b\w/g, (ch) => ch.toUpperCase());
        return { id, name };
      }
      return { id: idx + 1, name: String(m ?? `Member ${idx + 1}`) };
    });
  }, [members]);

  const isScrollable = uiMembers.length > 3;

  return (
    <Card className="mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500">Group</div>
          <div className="text-base font-semibold text-slate-900">
            {groupName || "Unnamed Group"}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[11px] uppercase tracking-wider text-slate-500">Code</span>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-3 py-0.5 text-xs font-semibold text-slate-900 shadow-sm">
            {groupCode || "JXYZ"}
          </span>
        </div>
      </div>

      {/* List */}
      {isScrollable ? (
        <div className="relative">
          <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-1 px-1 py-1">
            {uiMembers.map((m) => (
              <MemberItem
                key={`${m.id}-${m.name}`}
                name={m.name}
                className="min-w-[33.33%] snap-start"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {uiMembers.map((m) => (
            <MemberItem key={`${m.id}-${m.name}`} name={m.name} />
          ))}
        </div>
      )}
    </Card>
  );
}

/* ---------- Internals ---------- */

function MemberItem({ name, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-3 flex flex-col items-center text-center ${className}`}
    >
      <Avatar name={name} />
      <div className="mt-2 text-sm font-medium text-slate-900 truncate max-w-32">
        {name}
      </div>
    </div>
  );
}

function Avatar({ name = "" }) {
  const initials =
    String(name)
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="relative">
      <div className="grid place-items-center size-12 rounded-full bg-slate-100 text-slate-800 text-sm font-bold">
        {initials}
      </div>
      <span className="pointer-events-none absolute -inset-0.5 rounded-full ring-1 ring-amber-400/70" />
    </div>
  );
}
