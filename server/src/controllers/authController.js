const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/authService");
const sanitizeUser = require("../utils/sanitizeUser");

exports.register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  res.status(201).json({ success: true, data });
});

exports.login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  res.status(200).json({ success: true, data });
});

exports.me = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { user: sanitizeUser(req.user) } });
});
