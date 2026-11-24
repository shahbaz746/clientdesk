import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { CATEGORIES, PRIORITIES } from "../constants";

export default function NewRequest() {
  const navigate = useNavigate();
  const { showToast } = useAuth();
  const [websites, setWebsites] = useState([]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    websiteId: "",
    title: "",
    description: "",
    category: "other",
    priority: "medium",
  });

  useEffect(() => {
    api("/websites")
      .then((res) => setWebsites(res.data.websites.filter((site) => site.isActive)))
      .catch((err) => setError(err.message));
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await api("/requests", { method: "POST", body: form });
      const id = res.data.request._id;
      let attachmentsFailed = false;
      if (files.length) {
        const data = new FormData();
        Array.from(files).forEach((file) => data.append("files", file));
        try {
          await api(`/requests/${id}/attachments`, {
            method: "POST",
            body: data,
            isForm: true,
          });
        } catch (uploadError) {
          attachmentsFailed = true;
        }
      }
      showToast(
        attachmentsFailed
          ? "Request submitted, but screenshots were not uploaded"
          : "Request submitted"
      );
      navigate(`/client/requests/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">New maintenance request</h1>
      <p className="mt-1 text-slate-500">
        Describe the issue clearly. The original description cannot be overwritten later.
      </p>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {websites.length === 0 ? (
        <p className="card mt-6 text-sm text-slate-500">
          No active website is assigned to you yet. Ask the developer to add one.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="card mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Website</label>
            <select
              className="input mt-1"
              required
              value={form.websiteId}
              onChange={(e) => setForm({ ...form, websiteId: e.target.value })}
            >
              <option value="">Select website</option>
              {websites.map((site) => (
                <option key={site._id} value={site._id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              className="input mt-1"
              required
              minLength={5}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="input mt-1 min-h-32"
              required
              minLength={10}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                className="input mt-1"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <select
                className="input mt-1"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {PRIORITIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Screenshots (optional)</label>
            <input
              className="mt-1 block w-full text-sm"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={(e) => setFiles(e.target.files)}
            />
          </div>
          <button className="btn-primary" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit request"}
          </button>
        </form>
      )}
    </div>
  );
}
