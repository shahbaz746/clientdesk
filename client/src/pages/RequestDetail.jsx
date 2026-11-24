import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import {
  CATEGORIES,
  PRIORITIES,
  TRANSITIONS,
  categoryLabel,
} from "../constants";

export default function RequestDetail() {
  const { id } = useParams();
  const { user, showToast } = useAuth();
  const [request, setRequest] = useState(null);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const [reqRes, commentRes, activityRes] = await Promise.all([
      api(`/requests/${id}`),
      api(`/requests/${id}/comments`),
      api(`/requests/${id}/activity`),
    ]);
    setRequest(reqRes.data.request);
    setComments(commentRes.data.comments);
    setActivity(activityRes.data.activity);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [id]);

  const patch = async (body) => {
    try {
      await api(`/requests/${id}`, { method: "PATCH", body });
      showToast("Request updated");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    try {
      await api(`/requests/${id}/comments`, {
        method: "POST",
        body: { message },
      });
      setMessage("");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const uploadFiles = async (event) => {
    const files = event.target.files;
    if (!files?.length) return;
    const data = new FormData();
    Array.from(files).forEach((file) => data.append("files", file));
    try {
      await api(`/requests/${id}/attachments`, {
        method: "POST",
        body: data,
        isForm: true,
      });
      showToast("Attachments uploaded");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (error && !request) return <p className="text-red-600">{error}</p>;
  if (!request) return <p className="text-slate-500">Loading request...</p>;

  const nextStatuses = TRANSITIONS[request.status] || [];

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
      <div>
        <p className="text-sm text-slate-500">{request.websiteId?.name}</p>
        <h1 className="mt-1 text-2xl font-semibold">{request.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge value={request.status} />
          <StatusBadge value={request.priority} />
          <span className="text-sm text-slate-500">{categoryLabel(request.category)}</span>
        </div>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <section className="card mt-6">
          <h2 className="font-semibold">Original description</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {request.description}
          </p>
        </section>

        {request.attachments?.length ? (
          <section className="card mt-6">
            <h2 className="font-semibold">Screenshots</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {request.attachments.map((file) => (
                <a key={file.publicId || file.fileUrl} href={file.fileUrl} target="_blank" rel="noreferrer">
                  <img
                    src={file.fileUrl}
                    alt={file.fileName}
                    className="h-40 w-full rounded-lg object-cover"
                  />
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <section className="card mt-6">
          <h2 className="font-semibold">Comments</h2>
          <div className="mt-4 space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-slate-500">No comments yet.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    {comment.authorId?.name} · {comment.authorId?.role} ·{" "}
                    {new Date(comment.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm">{comment.message}</p>
                </div>
              ))
            )}
          </div>
          <form onSubmit={submitComment} className="mt-4 space-y-3">
            <textarea
              className="input min-h-24"
              required
              placeholder="Write a reply. Clients use this for clarification."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button className="btn-primary">Add comment</button>
          </form>
        </section>
      </div>

      <aside className="space-y-6">
        {user.role === "developer" ? (
          <section className="card space-y-4">
            <h2 className="font-semibold">Developer actions</h2>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                className="input mt-1"
                value=""
                onChange={(e) => {
                  if (e.target.value) patch({ status: e.target.value });
                }}
              >
                <option value="">Change to...</option>
                {nextStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                    {request.status === "Submitted" && status === "Closed"
                      ? " (reject)"
                      : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <select
                className="input mt-1"
                value={request.priority}
                onChange={(e) => patch({ priority: e.target.value })}
              >
                {PRIORITIES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                className="input mt-1"
                value={request.category}
                onChange={(e) => patch({ category: e.target.value })}
              >
                {CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </section>
        ) : (
          <section className="card text-sm text-slate-600">
            Status is managed by the developer. Use comments if more information is needed.
          </section>
        )}

        <section className="card">
          <h2 className="font-semibold">Add screenshots</h2>
          <input
            className="mt-3 block w-full text-sm"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={uploadFiles}
          />
        </section>

        <section className="card">
          <h2 className="font-semibold">Activity</h2>
          <div className="mt-4 space-y-3">
            {activity.length === 0 ? (
              <p className="text-sm text-slate-500">No activity yet.</p>
            ) : (
              activity.map((item) => (
                <div key={item._id} className="border-l-2 border-teal-200 pl-3">
                  <p className="text-sm font-medium">{item.action.replaceAll("_", " ")}</p>
                  <p className="text-xs text-slate-500">
                    {item.actorId?.name} · {new Date(item.createdAt).toLocaleString()}
                  </p>
                  {item.description ? (
                    <p className="mt-1 text-xs text-slate-600">{item.description}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
