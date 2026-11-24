const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assertCanCreateRequest,
  assertCanUpdateRequest,
  assertCanRequestClarification,
  assertAttachmentCapacity,
} = require("../src/utils/requestPolicies");
const { assertAllowedImage } = require("../src/utils/imageUpload");
const {
  assertAllowedPayload,
  assertRequestFilters,
  validateCommentMessage,
} = require("../src/utils/inputValidation");

test("allows a client to request work for their active website", () => {
  assert.doesNotThrow(() =>
    assertCanCreateRequest(
      { _id: "client-1", role: "client" },
      { clientId: "client-1", isActive: true }
    )
  );
});

test("rejects requests for inactive websites", () => {
  assert.throws(
    () =>
      assertCanCreateRequest(
        { _id: "client-1", role: "client" },
        { clientId: "client-1", isActive: false }
      ),
    { statusCode: 400, message: "Requests cannot be submitted for inactive websites" }
  );
});

test("rejects requests for another client's website", () => {
  assert.throws(
    () =>
      assertCanCreateRequest(
        { _id: "client-1", role: "client" },
        { clientId: "client-2", isActive: true }
      ),
    { statusCode: 403 }
  );
});

test("rejects developers creating client requests", () => {
  assert.throws(
    () =>
      assertCanCreateRequest(
        { _id: "developer-1", role: "developer" },
        { clientId: "client-1", isActive: true }
      ),
    { statusCode: 403 }
  );
});

test("allows a client to reopen a request awaiting their response", () => {
  assert.doesNotThrow(() =>
    assertCanUpdateRequest(
      { role: "client" },
      { status: "Awaiting Client" },
      { status: "Reopened" }
    )
  );
});

test("prevents clients from changing other request fields", () => {
  assert.throws(
    () =>
      assertCanUpdateRequest(
        { role: "client" },
        { status: "Awaiting Client" },
        { status: "Reopened", priority: "urgent" }
      ),
    { statusCode: 403 }
  );
});

test("requires a non-empty bounded clarification message from the developer", () => {
  assert.doesNotThrow(() =>
    assertCanRequestClarification({ role: "developer" }, "Please share the affected page URL.")
  );
  assert.throws(
    () => assertCanRequestClarification({ role: "developer" }, "  "),
    { statusCode: 400 }
  );
  assert.throws(
    () => assertCanRequestClarification({ role: "client" }, "More details needed"),
    { statusCode: 403 }
  );
});

test("enforces an attachment limit across repeated upload calls", () => {
  assert.doesNotThrow(() => assertAttachmentCapacity(3, 2));
  assert.throws(() => assertAttachmentCapacity(4, 2), { statusCode: 400 });
});

test("rejects unexpected payload fields and Mongo-style query filters", () => {
  assert.throws(
    () => assertAllowedPayload({ role: "developer" }, ["name"], "website"),
    { statusCode: 400 }
  );
  assert.throws(
    () => assertRequestFilters({ status: { $ne: "Closed" } }),
    { statusCode: 400 }
  );
  assert.throws(
    () => assertRequestFilters({ unknown: "value" }),
    { statusCode: 400 }
  );
});

test("requires comments to be bounded strings", () => {
  assert.equal(validateCommentMessage("  Need more details  "), "Need more details");
  assert.throws(() => validateCommentMessage({ $ne: "" }), { statusCode: 400 });
  assert.throws(() => validateCommentMessage("x".repeat(2001)), { statusCode: 400 });
});

test("accepts image files whose content matches their MIME type", () => {
  assert.doesNotThrow(() =>
    assertAllowedImage({
      mimetype: "image/png",
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    })
  );
});

test("rejects files that spoof an allowed image MIME type", () => {
  assert.throws(
    () => assertAllowedImage({ mimetype: "image/png", buffer: Buffer.from("not an image") }),
    { statusCode: 400 }
  );
});