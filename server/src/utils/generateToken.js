const jwt = require("jsonwebtoken");
const AppError = require("./AppError");

function generateToken(userId, tokenVersion = 0) {
  if (
    !process.env.JWT_SECRET ||
    Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32
  ) {
    throw new AppError("JWT_SECRET must be at least 32 bytes", 500);
  }

  return jwt.sign({ id: userId, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

module.exports = generateToken;
