const Request = require("../models/Request");
const Website = require("../models/Website");
const AppError = require("../utils/AppError");
const {
  assertTransition,
  getStatusAction,
} = require("../utils/statusTransitions");
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
  const website = await Website.findById(payload.websiteId);
  if (!website) throw new AppError("Website not found", 404);

  if (user.role === "client" && String(website.clientId) !== String(user._id)) {
    throw new AppError("You can only submit requests for your own websites", 403);
  }

  if (user.role === "developer") {
    throw new AppError("Clients submit requests; developers manage them", 403);
  }

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
  const request = await Request.findById(id);
  if (!request) throw new AppError("Request not found", 404);

  const website = await Website.findById(request.websiteId);
  if (!canAccessRequest(user, request, website)) {
    throw new AppError("You cannot access this request", 403);
  }

  if (user.role !== "developer") {
    throw new AppError("Only the developer can update request fields", 403);
  }

  if (payload.status && payload.status !== request.status) {
    if (!assertTransition(request.status, payload.status)) {
      throw new AppError(
        `Cannot change status from ${request.status} to ${payload.status}`,
        400
      );
    }

    const from = request.status;
    request.status = payload.status;
    await logActivity({
      actorId: user._id,
      action: getStatusAction(from, payload.status),
      entityType: "request",
      entityId: request._id,
      changes: { field: "status", oldValue: from, newValue: payload.status },
      description: `Status changed from ${from} to ${payload.status}`,
    });
  }

  if (payload.priority && payload.priority !== request.priority) {
    const oldValue = request.priority;
    request.priority = payload.priority;
    await logActivity({
      actorId: user._id,
      action: "priority_changed",
      entityType: "request",
      entityId: request._id,
      changes: { field: "priority", oldValue, newValue: payload.priority },
      description: `Priority changed to ${payload.priority}`,
    });
  }

  if (payload.category && payload.category !== request.category) {
    const oldValue = request.category;
    request.category = payload.category;
    await logActivity({
      actorId: user._id,
      action: "category_changed",
      entityType: "request",
      entityId: request._id,
      changes: { field: "category", oldValue, newValue: payload.category },
      description: `Category changed to ${payload.category}`,
    });
  }

  if (payload.summary !== undefined) {
    request.summary = payload.summary;
  }

  await request.save();
  return getAuthorizedRequest(user, request._id);
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

  const uploaded = [];
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

  request.attachments.push(...uploaded);
  await request.save();

  await logActivity({
    actorId: user._id,
    action: "attachment_added",
    entityType: "request",
    entityId: request._id,
    description: `${uploaded.length} attachment(s) added`,
  });

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
  addAttachments,
  getAuthorizedRequest,
  getRequestWithHistory,
};
