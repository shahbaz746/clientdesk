const AppError = require("./AppError");

function assertCanCreateRequest(user, website) {
  if (user.role !== "client") {
    throw new AppError("Clients submit requests; developers manage them", 403);
  }

  if (String(website.clientId) !== String(user._id)) {
    throw new AppError("You can only submit requests for your own websites", 403);
  }

  if (!website.isActive) {
    throw new AppError("Requests cannot be submitted for inactive websites", 400);
  }
}

function assertCanUpdateRequest(user, request, payload) {
  if (user.role === "developer") return;

  const isClientReopening =
    user.role === "client" &&
    request.status === "Awaiting Client" &&
    payload.status === "Reopened" &&
    Object.keys(payload).every((field) => field === "status");

  if (!isClientReopening) {
    throw new AppError("Clients may only reopen requests awaiting their response", 403);
  }
}

function assertCanRequestClarification(user, message) {
  if (user.role !== "developer") {
    throw new AppError("Only the developer can request clarification", 403);
  }

  if (typeof message !== "string" || !message.trim()) {
    throw new AppError("A clarification message is required", 400);
  }

  if (message.trim().length > 2000) {
    throw new AppError("Clarification message cannot exceed 2000 characters", 400);
  }
}

function assertAttachmentCapacity(currentCount, incomingCount, maximum = 5) {
  if (currentCount + incomingCount > maximum) {
    throw new AppError(`A request can have at most ${maximum} attachments`, 400);
  }
}

module.exports = {
  assertCanCreateRequest,
  assertCanUpdateRequest,
  assertCanRequestClarification,
  assertAttachmentCapacity,
};