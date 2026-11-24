import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/client" replace />;
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/client");
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
        <h1 className="mt-2 text-2xl font-semibold">Create client account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Public registration always creates a client. Developer accounts are seeded from the server.
        </p>
        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
        <label className="mt-6 block text-sm font-medium">Name</label>
        <input
          className="input mt-1"
          required
          minLength={2}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <label className="mt-4 block text-sm font-medium">Email</label>
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
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="btn-primary mt-6 w-full" disabled={submitting}>
          {submitting ? "Creating..." : "Register"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already registered?{" "}
          <Link className="font-medium text-teal-700" to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
