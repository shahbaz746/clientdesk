const asyncHandler = require("../utils/asyncHandler");
const requestService = require("../services/requestService");
const commentService = require("../services/commentService");
const { listForRequest } = require("../services/activityService");

exports.create = asyncHandler(async (req, res) => {
  const request = await requestService.createRequest(req.user, req.body);
  res.status(201).json({ success: true, data: { request } });
});

exports.list = asyncHandler(async (req, res) => {
  const requests = await requestService.listRequests(req.user, req.query);
  res.status(200).json({ success: true, data: { requests } });
});

exports.getOne = asyncHandler(async (req, res) => {
  const request = await requestService.getAuthorizedRequest(
    req.user,
    req.params.id
  );
  res.status(200).json({ success: true, data: { request } });
});

exports.update = asyncHandler(async (req, res) => {
  const request = await requestService.updateRequest(
    req.user,
    req.params.id,
    req.body
  );
  res.status(200).json({ success: true, data: { request } });
});

exports.addAttachments = asyncHandler(async (req, res) => {
  const request = await requestService.addAttachments(
    req.user,
    req.params.id,
    req.files || []
  );
  res.status(200).json({ success: true, data: { request } });
});

exports.listComments = asyncHandler(async (req, res) => {
  const comments = await commentService.listComments(req.user, req.params.id);
  res.status(200).json({ success: true, data: { comments } });
});

exports.addComment = asyncHandler(async (req, res) => {
  const comment = await commentService.addComment(
    req.user,
    req.params.id,
    req.body.message
  );
  res.status(201).json({ success: true, data: { comment } });
});

exports.listActivity = asyncHandler(async (req, res) => {
  await requestService.getAuthorizedRequest(req.user, req.params.id);
  const activity = await listForRequest(req.params.id);
  res.status(200).json({ success: true, data: { activity } });
});
