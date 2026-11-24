const AppError = require("../utils/AppError");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.headers.origin;
  if (!origin) return next();

  const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  if (origin !== allowedOrigin) {
    return next(new AppError("Invalid request origin", 403));
  }

  next();
}

module.exports = csrfProtection;