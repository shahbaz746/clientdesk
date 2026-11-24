const asyncHandler = require("../utils/asyncHandler");
const websiteService = require("../services/websiteService");

exports.create = asyncHandler(async (req, res) => {
  const website = await websiteService.createWebsite(req.user, req.body);
  res.status(201).json({ success: true, data: { website } });
});

exports.update = asyncHandler(async (req, res) => {
  const website = await websiteService.updateWebsite(
    req.user,
    req.params.id,
    req.body
  );
  res.status(200).json({ success: true, data: { website } });
});

exports.list = asyncHandler(async (req, res) => {
  const websites = await websiteService.listWebsites(req.user);
  res.status(200).json({ success: true, data: { websites } });
});

exports.getOne = asyncHandler(async (req, res) => {
  const website = await websiteService.getWebsite(req.user, req.params.id);
  res.status(200).json({ success: true, data: { website } });
});
