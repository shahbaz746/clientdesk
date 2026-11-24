const express = require("express");
const requestController = require("../controllers/requestController");
const { auth, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.use(auth);

router.get("/", requestController.list);
router.post("/", authorize("client"), requestController.create);
router.get("/:id", requestController.getOne);
router.patch("/:id", authorize("developer"), requestController.update);
router.post(
  "/:id/attachments",
  upload.array("files", 5),
  requestController.addAttachments
);
router.get("/:id/comments", requestController.listComments);
router.post("/:id/comments", requestController.addComment);
router.get("/:id/activity", requestController.listActivity);

module.exports = router;
