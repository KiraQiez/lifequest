import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";



export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Login failed (${res.status})`);
      }

      // Expecting something like { id, username }
      const user = await res.json();
      if (!user?.id) throw new Error("Login response missing user id.");

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userId", String(user.id));
      localStorage.setItem("username", user.username || username);

      navigate("/group", { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="pointer-events-none h-40 bg-linear-to-b from-amber-100 via-amber-50 to-transparent" />
      <main className="flex-1 -mt-20 px-5 pb-10">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl bg-amber-400 ring-1 ring-amber-300 grid place-items-center text-slate-900 font-extrabold">M</div>
            <div className="text-lg font-semibold text-slate-900">MateSplit</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <h1 className="text-base font-semibold text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-1">Log in to continue</p>

            <form className="mt-5 space-y-4" onSubmit={onSubmit}>
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-slate-600">Username</label>
                <input id="name" type="text" autoComplete="username" placeholder="John"
                  value={username} onChange={(e) => setUsername(e.target.value)} required
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-slate-600">Password</label>
                <input id="password" type="password" autoComplete="current-password" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>

              {error && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="w-full inline-flex items-center justify-center rounded-lg bg-amber-400 text-slate-900 ring-1 ring-amber-300 px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-amber-300 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] transition">
                {submitting ? "Logging in..." : "Log in"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-slate-600">
              Don’t have an account?{" "}
              <Link to="/register" className="font-semibold text-slate-900 hover:text-amber-700">Create one</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
