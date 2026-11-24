export const CATEGORIES = [
  { value: "bug", label: "Bug Fix" },
  { value: "ui_ux", label: "UI/UX Changes" },
  { value: "content", label: "Content Updates" },
  { value: "performance", label: "Performance" },
  { value: "seo", label: "SEO" },
  { value: "security", label: "Security" },
  { value: "feature", label: "Feature Request" },
  { value: "other", label: "Other" },
];

export const PRIORITIES = ["low", "medium", "high", "urgent"];

export const STATUSES = [
  "Submitted",
  "Needs Clarification",
  "Accepted",
  "In Progress",
  "Awaiting Client",
  "Reopened",
  "Closed",
];

export const TRANSITIONS = {
  Submitted: ["Needs Clarification", "Accepted", "Closed"],
  "Needs Clarification": ["Accepted", "Closed"],
  Accepted: ["In Progress", "Needs Clarification"],
  "In Progress": ["Awaiting Client", "Closed", "Needs Clarification"],
  "Awaiting Client": ["Reopened", "In Progress", "Closed"],
  Reopened: ["In Progress", "Awaiting Client", "Closed"],
  Closed: ["Reopened"],
};

export function categoryLabel(value) {
  return CATEGORIES.find((item) => item.value === value)?.label || value;
}
