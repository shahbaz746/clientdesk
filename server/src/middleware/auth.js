const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const auth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.clientdesk_token;
  if (!token) {
    throw new AppError("Please log in", 401);
  }

  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET is not configured on the server", 500);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (
    !user ||
    !user.isActive ||
    decoded.tokenVersion !== user.tokenVersion
  ) {
    throw new AppError("Account not found or inactive", 401);
  }

  req.user = user;
  next();
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.clientdesk_token;
  if (!token || !process.env.JWT_SECRET) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (
      user &&
      user.isActive &&
      decoded.tokenVersion === user.tokenVersion
    ) {
      req.user = user;
    }
  } catch (error) {
    if (!(error instanceof jwt.JsonWebTokenError)) throw error;
  }

  next();
});

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("You are not allowed to do this", 403));
    }
    next();
  };
}

module.exports = { auth, optionalAuth, authorize };
