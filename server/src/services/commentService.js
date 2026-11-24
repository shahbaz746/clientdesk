const Comment = require("../models/Comment");
const AppError = require("../utils/AppError");
const { getAuthorizedRequest } = require("./requestService");
const { logActivity } = require("./activityService");

async function addComment(user, requestId, message) {
  if (!message || !String(message).trim()) {
    throw new AppError("Comment cannot be empty", 400);
  }

  await getAuthorizedRequest(user, requestId);

  const comment = await Comment.create({
    requestId,
    authorId: user._id,
    message: message.trim(),
  });

  await logActivity({
    actorId: user._id,
    action: "comment_added",
    entityType: "request",
    entityId: requestId,
    description: "Comment added",
  });

  return comment.populate("authorId", "name email role");
}

async function listComments(user, requestId) {
  await getAuthorizedRequest(user, requestId);
  return Comment.find({ requestId })
    .populate("authorId", "name email role")
    .sort({ createdAt: 1 });
}

module.exports = { addComment, listComments };
