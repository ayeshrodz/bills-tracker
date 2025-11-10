// src/pages/LoginPage.tsx
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  const title = mode === "signin" ? "Sign in" : "Create account";

  const toggleMode = () =>
    setMode((prev) => (prev === "signin" ? "signup" : "signin"));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const fn = mode === "signin" ? signIn : signUp;
    const err = await fn(email, password);

    setSubmitting(false);

    if (err) {
      setError(err);
      return;
    }

    // For sign up with email confirmation, user may need to check email.
    if (mode === "signup") {
      // You can show a message instead of redirect if using email-confirm.
      navigate(from, { replace: true });
    } else {
      navigate(from, { replace: true });
    }
  };

  if (loading || user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Checking session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">
          {title}
        </h1>
        <p className="text-sm text-slate-500 mb-4">
          {mode === "signin"
            ? "Sign in to your bills tracker account."
            : "Create an account to keep your bills private to you."}
        </p>

        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="flex flex-col text-sm">
            <span className="mb-1 font-medium text-slate-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col text-sm">
            <span className="mb-1 font-medium text-slate-700">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting
              ? mode === "signin"
                ? "Signing in…"
                : "Creating account…"
              : title}
          </button>
        </form>

        <button
          type="button"
          onClick={toggleMode}
          className="mt-4 w-full text-xs text-slate-600 hover:text-slate-800"
        >
          {mode === "signin"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
