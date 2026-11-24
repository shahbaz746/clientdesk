const AppError = require("./AppError");

function assertObjectInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AppError("Invalid request body", 400);
  }
}

function normalizeEmail(email) {
  if (typeof email !== "string" || !email.trim()) {
    throw new AppError("A valid email address is required", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new AppError("A valid email address is required", 400);
  }
  return normalizedEmail;
}

function validateRegistrationInput(input) {
  assertObjectInput(input);

  if (typeof input.name !== "string" || !input.name.trim()) {
    throw new AppError("Name is required", 400);
  }
  if (input.name.trim().length > 50) {
    throw new AppError("Name cannot exceed 50 characters", 400);
  }
  if (typeof input.password !== "string" || input.password.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }
  if (Buffer.byteLength(input.password, "utf8") > 72) {
    throw new AppError("Password cannot exceed 72 UTF-8 bytes", 400);
  }

  return {
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    password: input.password,
  };
}

function validateLoginInput(input) {
  assertObjectInput(input);

  if (typeof input.password !== "string" || !input.password) {
    throw new AppError("Email and password are required", 400);
  }

  return {
    email: normalizeEmail(input.email),
    password: input.password,
  };
}

module.exports = { validateLoginInput, validateRegistrationInput };