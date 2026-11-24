const mongoose = require("mongoose");
const AppError = require("./AppError");

const REQUEST_STATUSES = [
  "Submitted",
  "Needs Clarification",
  "Accepted",
  "In Progress",
  "Awaiting Client",
  "Reopened",
  "Closed",
];
const REQUEST_CATEGORIES = [
  "bug",
  "ui_ux",
  "content",
  "performance",
  "seo",
  "security",
  "feature",
  "other",
];
const REQUEST_PRIORITIES = ["low", "medium", "high", "urgent"];

function assertAllowedPayload(payload, allowedFields, label) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError(`Invalid ${label} payload`, 400);
  }

  const unexpected = Object.keys(payload).find(
    (field) => !allowedFields.includes(field)
  );
  if (unexpected) {
    throw new AppError(`Field "${unexpected}" is not allowed`, 400);
  }
}

function assertRequestFilters(query) {
  assertAllowedPayload(
    query,
    ["status", "category", "priority", "websiteId"],
    "request filter"
  );

  const enumFilters = [
    ["status", REQUEST_STATUSES],
    ["category", REQUEST_CATEGORIES],
    ["priority", REQUEST_PRIORITIES],
  ];
  for (const [field, values] of enumFilters) {
    if (query[field] !== undefined &&
      (typeof query[field] !== "string" || !values.includes(query[field]))) {
      throw new AppError(`Invalid request ${field} filter`, 400);
    }
  }

  if (
    query.websiteId !== undefined &&
    (typeof query.websiteId !== "string" ||
      !mongoose.Types.ObjectId.isValid(query.websiteId))
  ) {
    throw new AppError("Invalid website ID filter", 400);
  }
}

function validateCommentMessage(message) {
  if (typeof message !== "string" || !message.trim()) {
    throw new AppError("Comment must be a non-empty string", 400);
  }
  const normalizedMessage = message.trim();
  if (normalizedMessage.length > 2000) {
    throw new AppError("Comment cannot exceed 2000 characters", 400);
  }
  return normalizedMessage;
}

module.exports = { assertAllowedPayload, assertRequestFilters, validateCommentMessage };