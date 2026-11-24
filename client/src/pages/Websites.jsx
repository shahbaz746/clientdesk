import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Websites() {
  const { user, showToast } = useAuth();
  const [websites, setWebsites] = useState([]);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", url: "", description: "" });
  const [form, setForm] = useState({
    name: "",
    url: "",
    description: "",
    clientId: "",
  });

  const load = async () => {
    const res = await api("/websites");
    setWebsites(res.data.websites);
    if (user.role === "developer") {
      const clientsRes = await api("/dashboard/clients");
      setClients(clientsRes.data.clients);
    }
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api("/websites", { method: "POST", body: form });
      setForm({ name: "", url: "", description: "", clientId: "" });
      showToast("Website created");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActive = async (website) => {
    try {
      await api(`/websites/${website._id}`, {
        method: "PATCH",
        body: { isActive: !website.isActive },
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditing = (website) => {
    setEditingId(website._id);
    setEditForm({
      name: website.name,
      url: website.url,
      description: website.description || "",
    });
  };

  const saveWebsite = async (event) => {
    event.preventDefault();
    try {
      await api(`/websites/${editingId}`, { method: "PATCH", body: editForm });
      setEditingId(null);
      showToast("Website updated");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">Websites</h1>
      <p className="mt-1 text-slate-500">
        {user.role === "developer"
          ? "Create and manage client websites."
          : "Websites assigned to your account."}
      </p>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {user.role === "developer" ? (
        <form onSubmit={onSubmit} className="card mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              className="input mt-1"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">URL</label>
            <input
              className="input mt-1"
              required
              placeholder="https://example.com"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Client</label>
            <select
              className="input mt-1"
              required
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            >
              <option value="">Select client</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <input
              className="input mt-1"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <button className="btn-primary">Add website</button>
          </div>
        </form>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {websites.length === 0 ? (
          <p className="text-sm text-slate-500">No websites yet.</p>
        ) : (
          websites.map((website) => (
            <article key={website._id} className="card">
              {editingId === website._id ? (
                <form className="space-y-3" onSubmit={saveWebsite}>
                  <label className="block text-sm font-medium">
                    Name
                    <input
                      className="input mt-1"
                      required
                      value={editForm.name}
                      onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    URL
                    <input
                      className="input mt-1"
                      type="url"
                      required
                      value={editForm.url}
                      onChange={(event) => setEditForm({ ...editForm, url: event.target.value })}
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Description
                    <textarea
                      className="input mt-1"
                      maxLength={500}
                      value={editForm.description}
                      onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                    />
                  </label>
                  <div className="flex gap-2">
                    <button className="btn-primary" type="submit">Save changes</button>
                    <button className="btn-secondary" type="button" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{website.name}</h2>
                      <a
                        className="text-sm text-teal-700"
                        href={website.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {website.url}
                      </a>
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      {website.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {website.description || "No description"}
                  </p>
                  {website.clientId?.name ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Client: {website.clientId.name}
                    </p>
                  ) : null}
                  {user.role === "developer" ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button className="btn-secondary" onClick={() => startEditing(website)}>
                        Edit details
                      </button>
                      <button className="btn-secondary" onClick={() => toggleActive(website)}>
                        {website.isActive ? "Mark inactive" : "Mark active"}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
