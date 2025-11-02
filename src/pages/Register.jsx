import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";




export default function Register() {
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
      const res = await fetch(`/api/v1/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }), 
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Register failed (${res.status})`);
      }


      navigate("/login", { replace: true });
      
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

          {/* Brand / title */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl bg-amber-400 ring-1 ring-amber-300 grid place-items-center text-slate-900 font-extrabold">
              M
            </div>
            <div className="text-lg font-semibold text-slate-900">MateSplit</div>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <h1 className="text-base font-semibold text-slate-900">Create account</h1>
            <p className="text-sm text-slate-500 mt-1">Start splitting with friends</p>

            <form className="mt-5 space-y-4" onSubmit={onSubmit}>

              {/* Username */}
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-slate-600">
                  Username
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="username"
                  placeholder="John"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-slate-600">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              {error && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center rounded-lg bg-amber-400 text-slate-900 ring-1 ring-amber-300 px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-amber-300 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] transition"
              >
                {submitting ? "Creating..." : "Create account"}
              </button>
            </form>

            {/* Link to Login */}
            <p className="mt-5 text-center text-xs text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-slate-900 hover:text-amber-700">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
