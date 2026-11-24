const Activity = require("../models/Activity");

async function logActivity({
  actorId,
  action,
  entityType,
  entityId,
  requestId,
  changes,
  description = "",
}) {
  return Activity.create({
    actorId,
    action,
    entityType,
    entityId,
    requestId,
    changes,
    description,
  });
}

async function listForEntity(entityType, entityId) {
  return Activity.find({ entityType, entityId })
    .populate("actorId", "name email role")
    .sort({ createdAt: -1 });
}

async function listForRequest(requestId) {
  return Activity.find({
    $or: [{ requestId }, { entityType: "request", entityId: requestId }],
  })
    .populate("actorId", "name email role")
    .sort({ createdAt: -1 });
}

module.exports = {
  logActivity,
  listForEntity,
  listForRequest,
};
