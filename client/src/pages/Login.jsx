import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={user.role === "developer" ? "/developer" : "/client"} replace />;
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const loggedIn = await login(form.email, form.password);
      navigate(loggedIn.role === "developer" ? "/developer" : "/client");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <p className="text-sm font-semibold text-teal-700">Clientdesk</p>
        <h1 className="mt-2 text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">
          Developer and client accounts use the same login page.
        </p>
        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
        <label className="mt-6 block text-sm font-medium">Email</label>
        <input
          className="input mt-1"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <label className="mt-4 block text-sm font-medium">Password</label>
        <input
          className="input mt-1"
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="btn-primary mt-6 w-full" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-500">
          New client?{" "}
          <Link className="font-medium text-teal-700" to="/register">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
