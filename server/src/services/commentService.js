const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const AppError = require("../utils/AppError");
const { getAuthorizedRequest } = require("./requestService");
const { logActivity } = require("./activityService");
const { validateCommentMessage } = require("../utils/inputValidation");

async function addComment(user, requestId, message) {
  const normalizedMessage = validateCommentMessage(message);

  await getAuthorizedRequest(user, requestId);
  const session = await mongoose.startSession();
  let commentId;

  try {
    await session.withTransaction(async () => {
      const [comment] = await Comment.create(
        [{ requestId, authorId: user._id, message: normalizedMessage }],
        { session }
      );

      await logActivity({
        actorId: user._id,
        action: "comment_added",
        entityType: "request",
        entityId: requestId,
        description: "Comment added",
        session,
      });

      commentId = comment._id;
    });
  } finally {
    await session.endSession();
  }

  return Comment.findById(commentId).populate("authorId", "name email role");
}

async function listComments(user, requestId) {
  await getAuthorizedRequest(user, requestId);
  return Comment.find({ requestId })
    .populate("authorId", "name email role")
    .sort({ createdAt: 1 });
}

module.exports = { addComment, listComments };
