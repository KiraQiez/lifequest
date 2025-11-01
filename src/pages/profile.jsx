// src/pages/Profile.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Head from "../components/Head";
import Navigate from "../components/Navigate";


function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose?.(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-100 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 border border-slate-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-slate-100"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function initials(name = "") {
  return name.trim().split(/\s+/).map(w => w[0]).slice(0,2).join("").toUpperCase() || "U";
}

export default function Profile() {
  const nav = useNavigate();

  // Load basics from storage to show instantly
  const storedId = Number(localStorage.getItem("userId"));
  const storedName = localStorage.getItem("username") || "User";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [user, setUser] = useState({
    id: storedId || null,
    username: storedName,
    fullName: "",
    email: "",
    phone: "",
    joinedAt: "",
  });

  // Demo stats (replace with real API later)
  const [stats, setStats] = useState({
    groups: 2,
    totalSpent: 65.5,
    unsettledCount: 1,
  });

  const welcomeName = useMemo(() => user.fullName || user.username || "User", [user]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        if (!storedId) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/v1/users/getUser/${storedId}`);
        if (!res.ok) throw new Error(`Failed to fetch profile (${res.status})`);
        const data = await res.json();


        if (!ignore) setUser(data);
      } catch (e) {
        if (!ignore) setErr(e.message || "Failed to load profile.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    localStorage.clear();
    nav("/login", { replace: true });
  }

  // Edit profile modal state
  const [openEdit, setOpenEdit] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", email: "", phone: "" });

  // Change password modal state
  const [openPwd, setOpenPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });

  function openEditModal() {
    setEditForm({
      id: user.id,
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
    });
    setOpenEdit(true);
  }

async function saveEdit(e) {
  e.preventDefault();
  try {
    const res = await fetch(`/api/v1/users/update/account`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (!res.ok) throw new Error(`Update failed (${res.status})`);
    const updated = await res.json();
    setUser(updated);
    setOpenEdit(false);
  } catch (e2) {
    alert(e2.message || "Could not update profile.");
  }
}


  async function savePassword(e) {
    e.preventDefault();
    if (pwdForm.next !== pwdForm.confirm) {
      alert("New password and confirm do not match.");
      return;
    }
    try {
      // TODO: POST change password
      // await fetch(`${API_BASE}/api/v1/users/${user.id}/change-password`, {...})
      setOpenPwd(false);
      setPwdForm({ current: "", next: "", confirm: "" });
      alert("Password changed.");
    } catch (e2) {
      alert(e2.message || "Could not change password.");
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col">
      <Head />

      <main className="flex-1 px-5 pt-20 pb-28 text-slate-800 max-w-md mx-auto w-full">
        {/* Top greeting band */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-amber-400 ring-1 ring-amber-300 grid place-items-center text-slate-900 font-extrabold">
              {initials(welcomeName)}
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wide text-slate-500">Welcome</div>
              <div className="text-base font-semibold text-slate-900">{welcomeName}</div>
              {user.username && (
                <div className="text-[11px] text-slate-500">@{user.username}</div>
              )}
            </div>

          </div>
        </div>

        {/* Error / Loading */}
        {err && (
          <div className="mt-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {err}
          </div>
        )}
        {loading && (
          <div className="mt-3 text-sm text-slate-500">Loading…</div>
        )}



        {/* Info list */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between ">
            <h2 className="text-sm font-semibold text-slate-900">Account</h2>
            <button
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              onClick={openEditModal}
            >
              Edit
            </button>
          </div>
          <ul className="px-4 py-2 text-sm">
            <li className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-slate-600">Full name</span>
              <span className="text-slate-900 font-medium">{user.fullName || "—"}</span>
            </li>
            <li className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-slate-600">Email</span>
              <span className="text-slate-900 font-medium">{user.email || "—"}</span>
            </li>
            <li className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-slate-600">Phone</span>
              <span className="text-slate-900 font-medium">{user.phone || "—"}</span>
            </li>
            <li className="flex items-center justify-between py-3">
              <span className="text-slate-600">Member ID</span>
              <span className="text-slate-900 font-medium">{user.id ?? "—"}</span>
            </li>
          </ul>
        </section>

        {/* Security & actions */}
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Security</h2>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900">Change password</div>
              <div className="text-xs text-slate-500">Update your account password</div>
            </div>
            <button
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setOpenPwd(true)}
            >
              Change
            </button>
          </div>
        </section>

        <div className="mt-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-xl bg-slate-900 text-white px-4 py-3 text-sm font-semibold hover:bg-slate-800 active:scale-[0.99]"
          >
            Log out
          </button>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Edit profile">
        <form className="space-y-3 " onSubmit={saveEdit}>
          <div>
            <label className="block text-xs font-medium text-slate-600">Full name</label>
            <input
              type="text"
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Phone</label>
            <input
              type="text"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="012-xxxxxxx"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpenEdit(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-amber-400 text-slate-900 ring-1 ring-amber-300 px-4 py-1.5 text-sm font-semibold hover:bg-amber-300"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal open={openPwd} onClose={() => setOpenPwd(false)} title="Change password">
        <form className="space-y-3" onSubmit={savePassword}>
          <div>
            <label className="block text-xs font-medium text-slate-600">Current password</label>
            <input
              type="password"
              value={pwdForm.current}
              onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">New password</label>
            <input
              type="password"
              value={pwdForm.next}
              onChange={(e) => setPwdForm({ ...pwdForm, next: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Confirm new password</label>
            <input
              type="password"
              value={pwdForm.confirm}
              onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpenPwd(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-amber-400 text-slate-900 ring-1 ring-amber-300 px-4 py-1.5 text-sm font-semibold hover:bg-amber-300"
            >
              Update
            </button>
          </div>
        </form>
      </Modal>

      <Navigate />
    </div>
  );
}
