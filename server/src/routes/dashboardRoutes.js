const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(auth);
router.get("/", dashboardController.getDashboard);
router.get("/clients", authorize("developer"), dashboardController.listClients);

module.exports = router;
