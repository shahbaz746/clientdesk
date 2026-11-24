const COLORS = {
  Submitted: "bg-sky-50 text-sky-700",
  "Needs Clarification": "bg-amber-50 text-amber-700",
  Accepted: "bg-indigo-50 text-indigo-700",
  "In Progress": "bg-teal-50 text-teal-700",
  "Awaiting Client": "bg-violet-50 text-violet-700",
  Reopened: "bg-orange-50 text-orange-700",
  Closed: "bg-slate-100 text-slate-600",
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700",
  urgent: "bg-red-50 text-red-700",
};

export default function StatusBadge({ value }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        COLORS[value] || "bg-slate-100 text-slate-600"
      }`}
    >
      {value}
    </span>
  );
}
