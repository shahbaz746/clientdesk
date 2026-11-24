const bcrypt = require("bcryptjs");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const generateToken = require("../utils/generateToken");
const sanitizeUser = require("../utils/sanitizeUser");
const {
  validateLoginInput,
  validateRegistrationInput,
} = require("../utils/authValidation");

async function register(input) {
  const { name, email, password } = validateRegistrationInput(input);

  const existing = await User.findOne({ email });
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
    token: generateToken(user._id, user.tokenVersion),
  };
}

async function login(input) {
  const { email, password } = validateLoginInput(input);

  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user || !user.isActive) {
    throw new AppError("Invalid email or password", 401);
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw new AppError("Invalid email or password", 401);
  }

  return {
    user: sanitizeUser(user),
    token: generateToken(user._id, user.tokenVersion),
  };
}

module.exports = { register, login };
