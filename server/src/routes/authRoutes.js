const express = require("express");
const { rateLimit } = require("express-rate-limit");
const authController = require("../controllers/authController");
const { auth, optionalAuth } = require("../middleware/auth");

const router = express.Router();
const createAuthLimiter = (limit) =>
	rateLimit({
		windowMs: 15 * 60 * 1000,
		limit,
		standardHeaders: true,
		legacyHeaders: false,
		handler: (req, res) => {
			res.status(429).json({
				success: false,
				message: "Too many authentication attempts. Please try again later.",
			});
		},
	});

router.post("/register", createAuthLimiter(5), authController.register);
router.post("/login", createAuthLimiter(10), authController.login);
router.post("/logout", optionalAuth, authController.logout);
router.get("/me", auth, authController.me);

module.exports = router;
