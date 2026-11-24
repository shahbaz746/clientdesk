const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/authService");
const User = require("../models/User");
const sanitizeUser = require("../utils/sanitizeUser");
const { setAuthCookie, clearAuthCookie } = require("../utils/authCookie");

function sendAuthenticatedResponse(res, statusCode, { user, token }) {
  setAuthCookie(res, token);
  res.status(statusCode).json({ success: true, data: { user } });
}

exports.register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  sendAuthenticatedResponse(res, 201, data);
});

exports.login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  sendAuthenticatedResponse(res, 200, data);
});

exports.me = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { user: sanitizeUser(req.user) } });
});

exports.logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await User.updateOne(
      { _id: req.user._id, tokenVersion: req.user.tokenVersion },
      { $inc: { tokenVersion: 1 } }
    );
  }
  clearAuthCookie(res);
  res.status(200).json({ success: true, message: "Logged out" });
});
