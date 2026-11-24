import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/dashboard/clients")
      .then((res) => setClients(res.data.clients))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Clients</h1>
      <p className="mt-1 text-slate-500">Registered client accounts.</p>
      <div className="card mt-6 overflow-x-auto p-0">
        {clients.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No clients yet. They register themselves.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client._id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{client.name}</td>
                  <td className="px-4 py-3">{client.email}</td>
                  <td className="px-4 py-3">{client.isActive ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
