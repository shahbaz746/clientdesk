const express = require("express");
const requestController = require("../controllers/requestController");
const { auth, authorize } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const { getAuthorizedRequest } = require("../services/requestService");
const { assertAllowedImage } = require("../utils/imageUpload");
const upload = require("../middleware/upload");

const router = express.Router();

router.use(auth);

router.get("/", requestController.list);
router.post("/", authorize("client"), requestController.create);
router.get("/:id", requestController.getOne);
router.patch("/:id", requestController.update);
router.post(
  "/:id/clarification",
  authorize("developer"),
  requestController.requestClarification
);
router.post(
  "/:id/attachments",
  asyncHandler(async (req, res, next) => {
    await getAuthorizedRequest(req.user, req.params.id);
    next();
  }),
  upload.array("files", 5),
  (req, res, next) => {
    try {
      (req.files || []).forEach(assertAllowedImage);
      next();
    } catch (error) {
      next(error);
    }
  },
  requestController.addAttachments
);
router.get("/:id/comments", requestController.listComments);
router.post("/:id/comments", requestController.addComment);
router.get("/:id/activity", requestController.listActivity);

module.exports = router;
