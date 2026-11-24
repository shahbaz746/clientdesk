const { before, after, beforeEach, test } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "integration-test-secret-with-sufficient-length";
process.env.CLIENT_ORIGIN = "http://localhost:5173";
process.env.CLOUDINARY_CLOUD_NAME = "";
process.env.CLOUDINARY_API_KEY = "";
process.env.CLOUDINARY_API_SECRET = "";

const app = require("../src/app");
const User = require("../src/models/User");
const Website = require("../src/models/Website");
const MaintenanceRequest = require("../src/models/Request");
const Comment = require("../src/models/Comment");
const Activity = require("../src/models/Activity");

const PASSWORD = "IntegrationTest123!";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
let mongoReplicaSet;

before(async () => {
  mongoReplicaSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  });
  await mongoose.connect(mongoReplicaSet.getUri("clientdesk_test"));
  await Promise.all([
    User.init(),
    Website.init(),
    MaintenanceRequest.init(),
    Comment.init(),
    Activity.init(),
  ]);
});

after(async () => {
  await mongoose.disconnect();
  await mongoReplicaSet.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Website.deleteMany({}),
    MaintenanceRequest.deleteMany({}),
    Comment.deleteMany({}),
    Activity.deleteMany({}),
  ]);
});

async function createUser({ name, email, role }) {
  return User.create({
    name,
    email,
    role,
    passwordHash: await bcrypt.hash(PASSWORD, 10),
  });
}

async function createWebsite(clientId, isActive = true) {
  return Website.create({
    name: "Example site",
    url: "https://example.com",
    clientId,
    isActive,
  });
}

async function login(email) {
  const agent = request.agent(app);
  await agent
    .post("/api/auth/login")
    .set("Origin", CLIENT_ORIGIN)
    .send({ email, password: PASSWORD })
    .expect(200);
  return agent;
}

test("registers, authenticates, and logs out using an HttpOnly cookie", async () => {
  const agent = request.agent(app);
  const registration = await agent
    .post("/api/auth/register")
    .set("Origin", CLIENT_ORIGIN)
    .send({
      name: "New Client",
      email: "new@example.com",
      password: PASSWORD,
      role: "developer",
    })
    .expect(201);

  assert.equal(registration.body.data.user.role, "client");
  assert.equal(registration.body.data.token, undefined);
  assert.match(registration.headers["set-cookie"][0], /HttpOnly/i);
  await createUser({
    name: "First Developer",
    email: "first-developer@example.com",
    role: "developer",
  });
  await assert.rejects(
    User.create({
      name: "Second Developer",
      email: "second-developer@example.com",
      role: "developer",
      passwordHash: await bcrypt.hash(PASSWORD, 10),
    }),
    { code: 11000 }
  );
  const secondSession = await login("new@example.com");

  await agent
    .get("/api/auth/me")
    .expect(200)
    .expect((response) => assert.equal(response.body.data.user.email, "new@example.com"));

  const logout = await agent
    .post("/api/auth/logout")
    .set("Origin", CLIENT_ORIGIN)
    .expect(200);
  assert.match(logout.headers["set-cookie"][0], /Expires=/i);
  await agent.get("/api/auth/me").expect(401);
  await secondSession.get("/api/auth/me").expect(401);
});

test("restricts website and request access to the owning client", async () => {
  const owner = await createUser({ name: "Owner", email: "owner@example.com", role: "client" });
  const other = await createUser({ name: "Other", email: "other@example.com", role: "client" });
  const ownSite = await createWebsite(owner._id);
  const otherSite = await createWebsite(other._id);
  const agent = await login("owner@example.com");

  const websites = await agent.get("/api/websites").expect(200);
  assert.deepEqual(websites.body.data.websites.map((site) => site._id), [String(ownSite._id)]);

  const requestBody = {
    title: "Fix the contact form",
    description: "The contact form returns an error after submission.",
  };
  const ownRequest = await agent
    .post("/api/requests")
    .set("Origin", CLIENT_ORIGIN)
    .send({ ...requestBody, websiteId: ownSite._id })
    .expect(201);
  const requestId = ownRequest.body.data.request._id;

  const filtered = await agent.get("/api/requests?status=Submitted").expect(200);
  assert.equal(filtered.body.data.requests.length, 1);
  await agent.get("/api/requests?status=NotAStatus").expect(400);
  await agent.get("/api/requests?status%5B%24ne%5D=Closed").expect(400);
  await agent
    .patch(`/api/requests/${requestId}`)
    .set("Origin", CLIENT_ORIGIN)
    .send({ createdBy: other._id })
    .expect(400);

  const otherAgent = await login("other@example.com");
  await otherAgent.get(`/api/requests/${requestId}`).expect(403);
  await otherAgent
    .post(`/api/requests/${requestId}/attachments`)
    .set("Origin", CLIENT_ORIGIN)
    .expect(403);
  await agent
    .post(`/api/requests/${requestId}/attachments`)
    .set("Origin", CLIENT_ORIGIN)
    .expect(503);

  await agent
    .post("/api/requests")
    .set("Origin", CLIENT_ORIGIN)
    .send({ ...requestBody, websiteId: otherSite._id })
    .expect(403);

  await Website.updateOne({ _id: ownSite._id }, { isActive: false });
  await agent
    .post("/api/requests")
    .set("Origin", CLIENT_ORIGIN)
    .send({ ...requestBody, websiteId: ownSite._id })
    .expect(400);
});

test("supports role-specific dashboards and developer website management", async () => {
  const developer = await createUser({
    name: "Developer",
    email: "developer@example.com",
    role: "developer",
  });
  const client = await createUser({ name: "Client", email: "client@example.com", role: "client" });
  const otherClient = await createUser({ name: "Other", email: "other@example.com", role: "client" });
  await createWebsite(client._id);
  await createWebsite(otherClient._id);

  const clientAgent = await login("client@example.com");
  const clientDashboard = await clientAgent.get("/api/dashboard").expect(200);
  assert.equal(clientDashboard.body.data.role, "client");
  assert.equal(clientDashboard.body.data.stats.websites, 1);
  await clientAgent.get("/api/dashboard/clients").expect(403);

  const developerAgent = await login("developer@example.com");
  const developerDashboard = await developerAgent.get("/api/dashboard").expect(200);
  assert.equal(developerDashboard.body.data.stats.clients, 2);
  assert.equal(developerDashboard.body.data.stats.websites, 2);
  const clients = await developerAgent.get("/api/dashboard/clients").expect(200);
  assert.equal(clients.body.data.clients.length, 2);

  const created = await developerAgent
    .post("/api/websites")
    .set("Origin", CLIENT_ORIGIN)
    .send({
      name: "New client site",
      url: "https://new-site.example",
      clientId: client._id,
    })
    .expect(201);
  const websiteId = created.body.data.website._id;

  await developerAgent
    .patch(`/api/websites/${websiteId}`)
    .set("Origin", CLIENT_ORIGIN)
    .send({
      name: "Updated client site",
      url: "https://updated.example",
      description: "Updated description",
      isActive: false,
    })
    .expect(200);
  const websiteAudit = await Activity.find({
    entityType: "website",
    entityId: websiteId,
    action: "website_updated",
  });
  assert.deepEqual(
    websiteAudit.map((entry) => entry.changes.field).sort(),
    ["description", "isActive", "name", "url"]
  );
  await clientAgent
    .patch(`/api/websites/${websiteId}`)
    .set("Origin", CLIENT_ORIGIN)
    .send({ name: "Unauthorized edit" })
    .expect(403);
});

test("supports clarification, comments, transitions, and client reopening", async () => {
  const developer = await createUser({
    name: "Developer",
    email: "developer@example.com",
    role: "developer",
  });
  const client = await createUser({ name: "Client", email: "client@example.com", role: "client" });
  const website = await createWebsite(client._id);
  const clientAgent = await login("client@example.com");
  const developerAgent = await login("developer@example.com");

  const created = await clientAgent
    .post("/api/requests")
    .set("Origin", CLIENT_ORIGIN)
    .send({
      websiteId: website._id,
      title: "Update the pricing page",
      description: "Please update the annual plan price on the pricing page.",
    })
    .expect(201);
  const requestId = created.body.data.request._id;

  await developerAgent
    .patch(`/api/requests/${requestId}`)
    .set("Origin", CLIENT_ORIGIN)
    .send({ status: "In Progress" })
    .expect(400);

  await developerAgent
    .post(`/api/requests/${requestId}/clarification`)
    .set("Origin", CLIENT_ORIGIN)
    .send({ message: "Which annual plan price should be displayed?" })
    .expect(200)
    .expect((response) => assert.equal(response.body.data.request.status, "Needs Clarification"));

  const comments = await clientAgent.get(`/api/requests/${requestId}/comments`).expect(200);
  assert.equal(comments.body.data.comments[0].message, "Which annual plan price should be displayed?");
  await clientAgent
    .post(`/api/requests/${requestId}/comments`)
    .set("Origin", CLIENT_ORIGIN)
    .send({ message: "The new annual price is 120 dollars." })
    .expect(201);

  const otherClient = await createUser({
    name: "Other Client",
    email: "other-client@example.com",
    role: "client",
  });
  const otherClientAgent = await login("other-client@example.com");
  await otherClientAgent.get(`/api/requests/${requestId}/comments`).expect(403);

  await developerAgent
    .patch(`/api/requests/${requestId}`)
    .set("Origin", CLIENT_ORIGIN)
    .send({ status: "Accepted" })
    .expect(200);
  await developerAgent
    .patch(`/api/requests/${requestId}`)
    .set("Origin", CLIENT_ORIGIN)
    .send({ status: "In Progress", priority: "urgent", category: "security" })
    .expect(200);
  await developerAgent
    .patch(`/api/requests/${requestId}`)
    .set("Origin", CLIENT_ORIGIN)
    .send({ status: "Awaiting Client" })
    .expect(200);

  await clientAgent
    .patch(`/api/requests/${requestId}`)
    .set("Origin", CLIENT_ORIGIN)
    .send({ status: "Reopened" })
    .expect(200)
    .expect((response) => assert.equal(response.body.data.request.status, "Reopened"));

  await clientAgent
    .patch(`/api/requests/${requestId}`)
    .set("Origin", CLIENT_ORIGIN)
    .send({ priority: "urgent" })
    .expect(403);

  await developerAgent
    .patch(`/api/requests/${requestId}`)
    .set("Origin", CLIENT_ORIGIN)
    .send({ status: "In Progress" })
    .expect(200);
  await developerAgent
    .patch(`/api/requests/${requestId}`)
    .set("Origin", CLIENT_ORIGIN)
    .send({ status: "Closed" })
    .expect(200)
    .expect((response) => assert.equal(response.body.data.request.status, "Closed"));

  const activities = await Activity.find({ entityId: requestId });
  assert.ok(activities.some((activity) => activity.action === "clarification_requested"));
  assert.ok(activities.some((activity) => activity.action === "priority_changed"));
  assert.ok(activities.some((activity) => activity.action === "category_changed"));
  assert.equal(await Comment.countDocuments({ requestId }), 2);
  assert.ok(await User.findById(developer._id));
  assert.ok(await User.findById(otherClient._id));
});