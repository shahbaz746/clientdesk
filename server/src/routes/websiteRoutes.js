const express = require("express");
const websiteController = require("../controllers/websiteController");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.get("/", websiteController.list);
router.get("/:id", websiteController.getOne);
router.post("/", authorize("developer"), websiteController.create);
router.patch("/:id", authorize("developer"), websiteController.update);

module.exports = router;
