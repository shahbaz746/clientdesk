const asyncHandler = require("../utils/asyncHandler");
const dashboardService = require("../services/dashboardService");

exports.getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboard(req.user);
  res.status(200).json({ success: true, data });
});

exports.listClients = asyncHandler(async (req, res) => {
  const clients = await dashboardService.listClients();
  res.status(200).json({ success: true, data: { clients } });
});
