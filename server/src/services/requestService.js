const mongoose = require("mongoose");
const Request = require("../models/Request");
const Website = require("../models/Website");
const Comment = require("../models/Comment");
const AppError = require("../utils/AppError");
const {
  assertTransition,
  getStatusAction,
} = require("../utils/statusTransitions");
const {
  assertCanCreateRequest,
  assertCanUpdateRequest,
  assertCanRequestClarification,
  assertAttachmentCapacity,
} = require("../utils/requestPolicies");
const { assertAllowedPayload, assertRequestFilters } = require("../utils/inputValidation");
const { logActivity, listForRequest } = require("./activityService");
const { getCloudinary, isConfigured } = require("../config/cloudinary");

function canAccessRequest(user, request, website) {
  if (user.role === "developer") return true;
  const ownerId = website ? website.clientId : request.createdBy;
  return String(ownerId) === String(user._id);
}

async function getAuthorizedRequest(user, id) {
  const request = await Request.findById(id)
    .populate("websiteId", "name url clientId")
    .populate("createdBy", "name email role");

  if (!request) throw new AppError("Request not found", 404);

  const website = request.websiteId;
  if (!canAccessRequest(user, request, website)) {
    throw new AppError("You cannot access this request", 403);
  }

  return request;
}

async function createRequest(user, payload) {
  assertAllowedPayload(
    payload,
    ["websiteId", "title", "description", "category", "priority"],
    "request"
  );
  const website = await Website.findById(payload.websiteId);
  if (!website) throw new AppError("Website not found", 404);

  assertCanCreateRequest(user, website);

  const request = await Request.create({
    websiteId: website._id,
    createdBy: user._id,
    title: payload.title,
    description: payload.description,
    category: payload.category || "other",
    priority: payload.priority || "medium",
  });

  await logActivity({
    actorId: user._id,
    action: "request_created",
    entityType: "request",
    entityId: request._id,
    description: `Request "${request.title}" submitted`,
  });

  return getAuthorizedRequest(user, request._id);
}

async function listRequests(user, query) {
  assertRequestFilters(query);
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.priority) filter.priority = query.priority;

  if (user.role === "client") {
    const websites = await Website.find({ clientId: user._id }).select("_id");
    const ids = websites.map((site) => site._id);
    if (query.websiteId) {
      if (!ids.some((id) => String(id) === String(query.websiteId))) {
        throw new AppError("You cannot access this website", 403);
      }
      filter.websiteId = query.websiteId;
    } else {
      filter.websiteId = { $in: ids };
    }
  } else if (query.websiteId) {
    filter.websiteId = query.websiteId;
  }

  return Request.find(filter)
    .populate("websiteId", "name url clientId")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });
}

async function updateRequest(user, id, payload) {
  assertAllowedPayload(
    payload,
    ["status", "priority", "category", "summary"],
    "request update"
  );
  const session = await mongoose.startSession();
  let requestId;

  try {
    await session.withTransaction(async () => {
      const request = await Request.findById(id).session(session);
      if (!request) throw new AppError("Request not found", 404);

      const website = await Website.findById(request.websiteId).session(session);
      if (!canAccessRequest(user, request, website)) {
        throw new AppError("You cannot access this request", 403);
      }

      assertCanUpdateRequest(user, request, payload);
      const activities = [];

      if (payload.status && payload.status !== request.status) {
        if (!assertTransition(request.status, payload.status)) {
          throw new AppError(
            `Cannot change status from ${request.status} to ${payload.status}`,
            400
          );
        }

        const from = request.status;
        request.status = payload.status;
        activities.push({
          action: getStatusAction(from, payload.status),
          changes: { field: "status", oldValue: from, newValue: payload.status },
          description: `Status changed from ${from} to ${payload.status}`,
        });
      }

      if (payload.priority && payload.priority !== request.priority) {
        const oldValue = request.priority;
        request.priority = payload.priority;
        activities.push({
          action: "priority_changed",
          changes: { field: "priority", oldValue, newValue: payload.priority },
          description: `Priority changed to ${payload.priority}`,
        });
      }

      if (payload.category && payload.category !== request.category) {
        const oldValue = request.category;
        request.category = payload.category;
        activities.push({
          action: "category_changed",
          changes: { field: "category", oldValue, newValue: payload.category },
          description: `Category changed to ${payload.category}`,
        });
      }

      if (payload.summary !== undefined) {
        request.summary = payload.summary;
      }

      await request.save({ session });
      for (const activity of activities) {
        await logActivity({
          actorId: user._id,
          entityType: "request",
          entityId: request._id,
          ...activity,
          session,
        });
      }

      requestId = request._id;
    });
  } finally {
    await session.endSession();
  }

  return getAuthorizedRequest(user, requestId);
}

async function requestClarification(user, id, message) {
  const session = await mongoose.startSession();
  let requestId;

  try {
    await session.withTransaction(async () => {
      const request = await Request.findById(id).session(session);
      if (!request) throw new AppError("Request not found", 404);

      const website = await Website.findById(request.websiteId).session(session);
      if (!canAccessRequest(user, request, website)) {
        throw new AppError("You cannot access this request", 403);
      }

      assertCanRequestClarification(user, message);
      if (!assertTransition(request.status, "Needs Clarification")) {
        throw new AppError(
          `Cannot change status from ${request.status} to Needs Clarification`,
          400
        );
      }

      const previousStatus = request.status;
      request.status = "Needs Clarification";
      await request.save({ session });

      const [comment] = await Comment.create(
        [{ requestId: request._id, authorId: user._id, message: message.trim() }],
        { session }
      );

      await logActivity({
        actorId: user._id,
        action: "clarification_requested",
        entityType: "request",
        entityId: request._id,
        changes: {
          field: "status",
          oldValue: previousStatus,
          newValue: request.status,
        },
        description: "Developer requested clarification",
        session,
      });
      await logActivity({
        actorId: user._id,
        action: "comment_added",
        entityType: "request",
        entityId: request._id,
        description: "Clarification message added",
        session,
      });

      requestId = request._id;
      return comment;
    });
  } finally {
    await session.endSession();
  }

  return getAuthorizedRequest(user, requestId);
}

function uploadBuffer(file) {
  const cloudinary = getCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "clientdesk/requests" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });
}

function deleteCloudinaryAsset(publicId) {
  const cloudinary = getCloudinary();
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

async function cleanupUploadedAssets(attachments) {
  await Promise.allSettled(
    attachments.map((attachment) => deleteCloudinaryAsset(attachment.publicId))
  );
}

async function addAttachments(user, id, files) {
  if (!isConfigured()) {
    throw new AppError(
      "File uploads are not configured. Add Cloudinary keys to server/.env",
      503
    );
  }

  if (!files || !files.length) {
    throw new AppError("Please attach at least one image", 400);
  }

  const request = await Request.findById(id);
  if (!request) throw new AppError("Request not found", 404);

  const website = await Website.findById(request.websiteId);
  if (!canAccessRequest(user, request, website)) {
    throw new AppError("You cannot access this request", 403);
  }

  assertAttachmentCapacity(request.attachments.length, files.length);

  const uploaded = [];
  try {
    for (const file of files) {
      const result = await uploadBuffer(file);
      uploaded.push({
        fileName: file.originalname,
        fileUrl: result.secure_url,
        publicId: result.public_id,
        mimeType: file.mimetype,
        size: file.size,
      });
    }
  } catch (error) {
    await cleanupUploadedAssets(uploaded);
    throw error;
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const currentRequest = await Request.findById(id).session(session);
      if (!currentRequest) throw new AppError("Request not found", 404);
      assertAttachmentCapacity(currentRequest.attachments.length, uploaded.length);

      currentRequest.attachments.push(...uploaded);
      await currentRequest.save({ session });

      await logActivity({
        actorId: user._id,
        action: "attachment_added",
        entityType: "request",
        entityId: currentRequest._id,
        description: `${uploaded.length} attachment(s) added`,
        session,
      });
    });
  } catch (error) {
    await cleanupUploadedAssets(uploaded);
    throw error;
  } finally {
    await session.endSession();
  }

  return getAuthorizedRequest(user, request._id);
}

async function getRequestWithHistory(user, id) {
  const request = await getAuthorizedRequest(user, id);
  const activity = await listForRequest(request._id);
  return { request, activity };
}

module.exports = {
  createRequest,
  listRequests,
  updateRequest,
  requestClarification,
  addAttachments,
  getAuthorizedRequest,
  getRequestWithHistory,
};
