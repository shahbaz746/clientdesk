const test = require("node:test");
const assert = require("node:assert/strict");
const { setAuthCookie } = require("../src/utils/authCookie");
const csrfProtection = require("../src/middleware/csrfProtection");
const {
  validateLoginInput,
  validateRegistrationInput,
} = require("../src/utils/authValidation");
const validateEnvironment = require("../src/utils/validateEnvironment");

test("sets the session token in an HttpOnly SameSite cookie", () => {
  let cookie;
  setAuthCookie(
    {
      cookie(name, value, options) {
        cookie = { name, value, options };
      },
    },
    "test-token"
  );

  assert.equal(cookie.name, "clientdesk_token");
  assert.equal(cookie.value, "test-token");
  assert.equal(cookie.options.httpOnly, true);
  assert.equal(cookie.options.sameSite, "lax");
  assert.equal(cookie.options.path, "/");
});

test("rejects unsafe requests from an untrusted browser origin", () => {
  const previousOrigin = process.env.CLIENT_ORIGIN;
  process.env.CLIENT_ORIGIN = "http://localhost:5173";
  let receivedError;

  try {
    csrfProtection(
      { method: "POST", headers: { origin: "https://untrusted.example" } },
      {},
      (error) => {
        receivedError = error;
      }
    );
    assert.equal(receivedError.statusCode, 403);
  } finally {
    if (previousOrigin === undefined) delete process.env.CLIENT_ORIGIN;
    else process.env.CLIENT_ORIGIN = previousOrigin;
  }
});

test("allows safe requests regardless of origin", () => {
  let nextCalled = false;
  csrfProtection(
    { method: "GET", headers: { origin: "https://untrusted.example" } },
    {},
    () => {
      nextCalled = true;
    }
  );
  assert.equal(nextCalled, true);
});

test("normalizes valid registration input and rejects unsafe password length", () => {
  assert.deepEqual(
    validateRegistrationInput({
      name: "  Client One ",
      email: " CLIENT@EXAMPLE.COM ",
      password: "secure-pass-1",
    }),
    {
      name: "Client One",
      email: "client@example.com",
      password: "secure-pass-1",
    }
  );
  assert.throws(
    () => validateRegistrationInput({ name: "Client", email: "client@example.com", password: "é".repeat(37) }),
    { statusCode: 400 }
  );
});

test("rejects malformed login body types before database access", () => {
  assert.throws(() => validateLoginInput(null), { statusCode: 400 });
  assert.throws(
    () => validateLoginInput({ email: { $ne: null }, password: "password" }),
    { statusCode: 400 }
  );
});

test("requires a high-entropy-length JWT secret before server startup", () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "short-secret";
  assert.throws(() => validateEnvironment(), /at least 32 bytes/);

  process.env.JWT_SECRET = "x".repeat(32);
  assert.doesNotThrow(() => validateEnvironment());

  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
});