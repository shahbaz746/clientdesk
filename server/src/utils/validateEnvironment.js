function validateEnvironment() {
  if (
    typeof process.env.JWT_SECRET !== "string" ||
    Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32
  ) {
    throw new Error(
      "JWT_SECRET must be at least 32 bytes. Generate one with openssl rand -hex 32."
    );
  }
}

module.exports = validateEnvironment;