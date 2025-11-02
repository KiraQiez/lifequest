import { useEffect, useRef, useState } from "react";
import Head from "../components/Head";
import GroupCard from "../components/GroupCard";

  const API = import.meta.env.VITE_API_BASE_URL || "";

export default function Group() {
  const [openCreate, setOpenCreate] = useState(false);
  const [openJoin, setOpenJoin] = useState(false);

  // create form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const nameRef = useRef(null);

  // join form
  const [code, setCode] = useState("");
  const codeRef = useRef(null);

  // state
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId")

  // autofocus inputs when modals open
  useEffect(() => {
    if (openCreate && nameRef.current) nameRef.current.focus();
  }, [openCreate]);
  useEffect(() => {
    if (openJoin && codeRef.current) codeRef.current.focus();
  }, [openJoin]);

  // LOAD USER GROUPS
  useEffect(() => {
    
    if (!userId) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/v1/groupMember/by-user/${userId}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`Failed to load groups (${res.status})`);
        const data = await res.json();
        setGroups(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Failed to load groups.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  // CREATE GROUP flow
  async function onCreateSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {


      // 1) create group
      const res = await fetch(`${API}/api/v1/groups/creategroup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error(await res.text());
      const group = await res.json(); 

      // 2) add creator as member
      const res2 = await fetch(`${API}/api/v1/groupMember/addMember`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: group.id, userId }),
      });
      if (!res2.ok) throw new Error(await res2.text());

      // refresh list view (optimistic add)
      setGroups((prev) => [{ ...group, memberCount: 1 }, ...prev]);

      // reset & close
      setOpenCreate(false);
      setName("");
      setDescription("");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  // JOIN GROUP flow
  async function onJoinSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const userId = String(localStorage.getItem("userId"));
      if (!userId) throw new Error("You must be logged in.");

      const cleanCode = String(code).trim().toUpperCase();
      if (!/^[A-Z]{4}$/.test(cleanCode)) throw new Error("Enter a valid 4-letter code.");

      const res = await fetch(`${API}/api/v1/groupMember/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanCode, userId }),
      });
      if (!res.ok) throw new Error(await res.text());

      await reloadGroups();

      setOpenJoin(false);
      setCode("");
    } catch (err) {
      setError(err.message || "Failed to join group.");
    } finally {
      setSubmitting(false);
    }
  }

  async function reloadGroups() {
    const userId = String(localStorage.getItem("userId"));
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/groupMember/by-user/${userId}`);
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch {

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col">
      <Head />
      <main className="flex-1 px-5 pt-20 pb-28 text-slate-800 max-w-md mx-auto w-full">
        {/* Title + segmented actions */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Groups</h1>

          {/* Segmented action pill */}
          <div className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 p-1.5">
            <button
              onClick={() => setOpenCreate(true)}
              className="px-3  text-sm font-semibold rounded-full text-slate-900 hover:bg-amber-200 transition"
            >
              Create
            </button>
            <span className="mx-0.5 h-5 w-px bg-amber-200" aria-hidden />
            <button
              onClick={() => setOpenJoin(true)}
              className="px-3  text-sm font-semibold rounded-full text-slate-900 hover:bg-amber-200 transition"
            >
              Join
            </button>
          </div>
        </div>

        <div className="h-px bg-slate-200 mt-2 mb-5" />

        {/* states */}
        {loading && <div className="text-sm text-slate-500">Loading…</div>}
        {!loading && error && (
          <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>
        )}
        {!loading && !error && groups.length === 0 && (
          <div className="text-sm text-slate-500">You don’t have any groups yet.</div>
        )}

        {/* list */}
        <div className="space-y-4">
          {groups.map((g) => (
            <GroupCard
              key={g.id}
              id={g.id}
              memberId={g.memberId}
              name={g.name}
              description={g.description}
              memberCount={g.memberCount ?? 1}
            />
          ))}
        </div>
      </main>

      {/* CREATE MODAL */}
      {openCreate && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Create group">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className="absolute inset-x-4 top-24 mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="h-1 w-full bg-linear-to-r from-amber-400 via-amber-300 to-amber-500 rounded-md -mt-1 mb-3" />
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Create New Group</h3>
              <button
                type="button"
                onClick={() => setOpenCreate(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                aria-label="Close"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="mt-4 space-y-4" onSubmit={onCreateSubmit}>
              <div>
                <label htmlFor="group-name" className="block text-xs font-medium text-slate-600">
                  Group Name
                </label>
                <input
                  id="group-name"
                  ref={nameRef}
                  type="text"
                  placeholder="e.g., Weekend Trip"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              <div>
                <label htmlFor="group-desc" className="block text-xs font-medium text-slate-600">
                  Description
                </label>
                <textarea
                  id="group-desc"
                  placeholder="What’s this group for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="mt-1 w-full min-h-[90px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              {error && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpenCreate(false)}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-full bg-amber-400 text-slate-900 ring-1 ring-amber-300 px-4 py-2 text-xs font-semibold shadow-sm hover:bg-amber-300 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] transition"
                >
                  {submitting ? "Creating..." : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN MODAL (enter code) */}
      {openJoin && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Join group">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className="absolute inset-x-4 top-28 mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="h-1 w-full bg-linear-to-r from-amber-400 via-amber-300 to-amber-500 rounded-md -mt-1 mb-3" />
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Join Group</h3>
              <button
                type="button"
                onClick={() => setOpenJoin(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                aria-label="Close"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="mt-4 space-y-4" onSubmit={onJoinSubmit}>
              <div>
                <label htmlFor="join-code" className="block text-xs font-medium text-slate-600">
                  Group Code
                </label>
                <input
                  id="join-code"
                  ref={codeRef}
                  type="text"
                  inputMode="text"
                  maxLength={4}
                  placeholder="ABCD"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 tracking-[0.25em] text-center uppercase focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <p className="mt-1 text-[11px] text-slate-500">Ask a member for the 4-letter code.</p>
              </div>

              {error && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpenJoin(false)}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-full bg-amber-400 text-slate-900 ring-1 ring-amber-300 px-4 py-2 text-xs font-semibold shadow-sm hover:bg-amber-300 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] transition"
                >
                  {submitting ? "Joining..." : "Join"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
