const test = require("node:test");
const assert = require("node:assert/strict");
const { errorHandler } = require("../src/middleware/errorHandler");
const AppError = require("../src/utils/AppError");

function sendError(error) {
  const response = {
    statusCode: null,
    body: null,
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  errorHandler(error, {}, response, (nextError) => {
    throw nextError;
  });
  return response;
}

test("hides internal server error details in production", () => {
  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  try {
    const response = sendError(new Error("database connection contains private details"));
    assert.equal(response.statusCode, 500);
    assert.equal(response.body.message, "Something went wrong");
  } finally {
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
  }
});

test("preserves safe operational error messages in production", () => {
  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  try {
    const response = sendError(new AppError("You cannot access this request", 403));
    assert.equal(response.statusCode, 403);
    assert.equal(response.body.message, "You cannot access this request");
  } finally {
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
  }
});