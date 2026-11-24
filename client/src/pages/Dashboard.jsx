import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/dashboard")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-slate-500">Loading dashboard...</p>;

  const cards =
    user.role === "developer"
      ? [
          ["Clients", data.stats.clients],
          ["Websites", data.stats.websites],
          ["Requests", data.stats.requests],
        ]
      : [
          ["My websites", data.stats.websites],
          ["My requests", data.stats.requests],
        ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
      <p className="mt-1 text-slate-500">Overview of current maintenance work.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="card">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="card mt-6">
        <h2 className="font-semibold">Requests by status</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.keys(data.stats.byStatus || {}).length === 0 ? (
            <p className="text-sm text-slate-500">No requests yet.</p>
          ) : (
            Object.entries(data.stats.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2">
                <StatusBadge value={status} />
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
