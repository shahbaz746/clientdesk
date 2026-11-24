const ALLOWED_TRANSITIONS = {
  Submitted: ["Needs Clarification", "Accepted", "Closed"],
  "Needs Clarification": ["Accepted", "Closed"],
  Accepted: ["In Progress", "Needs Clarification"],
  "In Progress": ["Awaiting Client", "Closed", "Needs Clarification"],
  "Awaiting Client": ["Reopened", "In Progress", "Closed"],
  Reopened: ["In Progress", "Awaiting Client", "Closed"],
  Closed: ["Reopened"],
};

function getStatusAction(from, to) {
  if (from === "Submitted" && to === "Closed") return "request_rejected";
  if (to === "Needs Clarification") return "clarification_requested";
  if (to === "Accepted") return "request_accepted";
  if (to === "Reopened") return "request_reopened";
  if (to === "Closed") return "request_closed";
  return "status_changed";
}

function assertTransition(from, to) {
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

module.exports = {
  ALLOWED_TRANSITIONS,
  getStatusAction,
  assertTransition,
};
