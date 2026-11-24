import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import { CATEGORIES, PRIORITIES, STATUSES, categoryLabel } from "../constants";

export default function RequestList() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filters, setFilters] = useState({ status: "", category: "", priority: "" });
  const [error, setError] = useState("");
  const base = user.role === "developer" ? "/developer/requests" : "/client/requests";

  const load = async (next = filters) => {
    const params = new URLSearchParams();
    if (next.status) params.set("status", next.status);
    if (next.category) params.set("category", next.category);
    if (next.priority) params.set("priority", next.priority);
    const query = params.toString();
    const res = await api(`/requests${query ? `?${query}` : ""}`);
    setRequests(res.data.requests);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const changeFilter = (field, value) => {
    const next = { ...filters, [field]: value };
    setFilters(next);
    load(next).catch((err) => setError(err.message));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Requests</h1>
          <p className="mt-1 text-slate-500">Filter and open a request for details.</p>
        </div>
        {user.role === "client" ? (
          <Link className="btn-primary" to="/client/requests/new">
            New request
          </Link>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <select
          className="input"
          value={filters.status}
          onChange={(e) => changeFilter("status", e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <select
          className="input"
          value={filters.category}
          onChange={(e) => changeFilter("category", e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={filters.priority}
          onChange={(e) => changeFilter("priority", e.target.value)}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="card mt-6 overflow-x-auto p-0">
        {requests.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No requests match these filters.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Website</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Category</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request._id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link className="font-medium text-teal-700" to={`${base}/${request._id}`}>
                      {request.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{request.websiteId?.name || "-"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={request.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={request.priority} />
                  </td>
                  <td className="px-4 py-3">{categoryLabel(request.category)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
