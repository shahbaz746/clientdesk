const bcrypt = require("bcryptjs");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const generateToken = require("../utils/generateToken");
const sanitizeUser = require("../utils/sanitizeUser");

function assertPassword(password) {
  if (!password || typeof password !== "string" || password.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }
}

async function register({ name, email, password }) {
  if (!name || !email) {
    throw new AppError("Name and email are required", 400);
  }

  assertPassword(password);

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new AppError("Email is already registered", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: "client",
  });

  return {
    user: sanitizeUser(user),
    token: generateToken(user._id),
  };
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+passwordHash"
  );

  if (!user || !user.isActive) {
    throw new AppError("Invalid email or password", 401);
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw new AppError("Invalid email or password", 401);
  }

  return {
    user: sanitizeUser(user),
    token: generateToken(user._id),
  };
}

module.exports = { register, login };
