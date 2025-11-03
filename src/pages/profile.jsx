// src/pages/Profile.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Head from "../components/Head";
import Navigate from "../components/Navigate";

const API = import.meta.env.VITE_API_BASE_URL || "";

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

  // Load basics fast
  const storedId = String(localStorage.getItem("userId"));
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
    payQr: "" // base64 data URL or URL
  });

  const welcomeName = useMemo(
    () => user.fullName || user.username || "User",
    [user]
  );

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        if (!storedId) { setLoading(false); return; }

        const res = await fetch(`${API}/api/v1/users/getUser/${storedId}`);
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
  }, [storedId]);

  function handleLogout() {
    localStorage.clear();
    nav("/login", { replace: true });
  }

  // ---------- Edit profile modal ----------
  const [openEdit, setOpenEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    fullName: "",
    email: "",
    phone: "",
    payQr: "",
  });

  function openEditModal() {
    setEditForm({
      id: user.id,
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      payQr: user.payQr || ""
    });
    setOpenEdit(true);
  }

  // file -> base64 data URL
  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function onPickQrFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const dataUrl = await fileToDataUrl(f);
      setEditForm(prev => ({ ...prev, payQr: String(dataUrl) }));
    } catch {
      alert("Failed to read image file.");
    }
  }

  function clearQr() {
    setEditForm(prev => ({ ...prev, payQr: "" }));
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      // keep id in payload
      const payload = {
        id: editForm.id,
        fullName: editForm.fullName,
        email: editForm.email,
        phone: editForm.phone,
        payQr: editForm.payQr,
      };

      const res = await fetch(`${API}/api/v1/users/update/account`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `Update failed (${res.status})`);

      const updated = JSON.parse(text);
      setUser(updated);
      setOpenEdit(false);
    } catch (e2) {
      alert(e2.message || "Could not update profile.");
    }
  }

  // ---------- Change password modal ----------
  const [openPwd, setOpenPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });

  async function savePassword(e) {
    e.preventDefault();
    if (pwdForm.next !== pwdForm.confirm) {
      alert("New password and confirm do not match.");
      return;
    }
    if (!user?.id) {
      alert("Missing user id.");
      return;
    }

    try {
      const res = await fetch(`${API}/api/v1/users/update/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          currentPassword: pwdForm.current,
          newPassword: pwdForm.next,
        }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `Failed (${res.status})`);

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

        {/* Account */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
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
              <span className="text-slate-600">User ID</span>
              <span className="text-slate-900 font-medium">{user.id ?? "—"}</span>
            </li>
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
              <span className="text-slate-600">Payment QR</span>
              <span className="flex items-center gap-2">
                {user.payQr
                  ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 text-[11px] px-2 py-0.5 border border-green-200">
                      Set
                    </span>
                  )
                  : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 border border-slate-200">
                      Not set
                    </span>
                  )
                }
              </span>
            </li>
          </ul>
        </section>

        {/* Security */}
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
        <form className="space-y-3" onSubmit={saveEdit}>
          {/* ID (read-only so it’s kept in payload) */}
          <div>
            <label className="block text-xs font-medium text-slate-600">User ID</label>
            <input
              type="text"
              value={editForm.id}
              readOnly
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900"
            />
          </div>

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

          {/* Payment QR */}
          <div className="pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-600">Payment QR</label>
              {editForm.payQr ? (
                <button
                  type="button"
                  onClick={clearQr}
                  className="text-xs text-rose-700 hover:underline"
                >
                  Remove
                </button>
              ) : null}
            </div>

            {/* URL or data URL */}
            <input
              type="text"
              value={editForm.payQr}
              onChange={(e) => setEditForm({ ...editForm, payQr: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="Paste image URL or data:image/png;base64,…"
            />

            {/* OR file upload */}
            <div className="mt-2">
              <label className="block text-[11px] text-slate-500 mb-1">Or upload image (PNG/JPG)</label>
              <input
                type="file"
                accept="image/*"
                onChange={onPickQrFile}
                className="block w-full text-xs text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-amber-400 file:px-3 file:py-1.5 file:text-slate-900 file:font-semibold file:ring-1 file:ring-amber-300 hover:file:bg-amber-300"
              />
            </div>

            {/* Preview (square) */}
            {editForm.payQr && (
              <div className="mt-3">
                <img
                  src={editForm.payQr}
                  alt="QR preview"
                  className="h-48 w-48 object-contain rounded-lg border border-slate-200 bg-white"
                />
                <div className="mt-1 text-[11px] text-slate-500">
                  This image will be shown to others when they tap “Pay my share”.
                </div>
              </div>
            )}
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
