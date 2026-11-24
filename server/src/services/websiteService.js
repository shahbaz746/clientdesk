const mongoose = require("mongoose");
const Website = require("../models/Website");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { logActivity } = require("./activityService");
const { assertAllowedPayload } = require("../utils/inputValidation");

async function assertClient(clientId) {
  const client = await User.findById(clientId);
  if (!client || client.role !== "client") {
    throw new AppError("Website must belong to a valid client account", 400);
  }
  return client;
}

function canViewWebsite(user, website) {
  if (user.role === "developer") return true;
  return String(website.clientId) === String(user._id);
}

async function createWebsite(actor, payload) {
  assertAllowedPayload(
    payload,
    ["name", "url", "description", "clientId", "isActive"],
    "website"
  );
  await assertClient(payload.clientId);

  const website = await Website.create({
    name: payload.name,
    url: payload.url,
    description: payload.description || "",
    clientId: payload.clientId,
    isActive: payload.isActive !== undefined ? payload.isActive : true,
  });

  await logActivity({
    actorId: actor._id,
    action: "website_created",
    entityType: "website",
    entityId: website._id,
    description: `Website "${website.name}" created`,
  });

  return website.populate("clientId", "name email");
}

async function updateWebsite(actor, id, payload) {
  assertAllowedPayload(
    payload,
    ["name", "url", "description", "isActive"],
    "website update"
  );
  const session = await mongoose.startSession();
  let websiteId;

  try {
    await session.withTransaction(async () => {
      const website = await Website.findById(id).session(session);
      if (!website) throw new AppError("Website not found", 404);

      const allowed = ["name", "url", "description", "isActive"];
      const changes = [];

      allowed.forEach((field) => {
        if (payload[field] !== undefined && payload[field] !== website[field]) {
          changes.push({
            field,
            oldValue: website[field],
            newValue: payload[field],
          });
          website[field] = payload[field];
        }
      });

      await website.save({ session });

      for (const change of changes) {
        await logActivity({
          actorId: actor._id,
          action: "website_updated",
          entityType: "website",
          entityId: website._id,
          changes: change,
          description: `Website "${website.name}" updated`,
          session,
        });
      }

      websiteId = website._id;
    });
  } finally {
    await session.endSession();
  }

  const website = await Website.findById(websiteId);
  return website.populate("clientId", "name email");
}

async function listWebsites(user) {
  const filter = user.role === "developer" ? {} : { clientId: user._id };
  return Website.find(filter)
    .populate("clientId", "name email")
    .sort({ createdAt: -1 });
}

async function getWebsite(user, id) {
  const website = await Website.findById(id).populate("clientId", "name email");
  if (!website) throw new AppError("Website not found", 404);
  if (!canViewWebsite(user, website)) {
    throw new AppError("You cannot access this website", 403);
  }
  return website;
}

module.exports = {
  createWebsite,
  updateWebsite,
  listWebsites,
  getWebsite,
  canViewWebsite,
};
