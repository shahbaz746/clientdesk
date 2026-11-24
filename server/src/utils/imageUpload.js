const AppError = require("./AppError");

function hasExpectedSignature(file) {
  const buffer = file.buffer;
  if (!Buffer.isBuffer(buffer)) return false;

  switch (file.mimetype) {
    case "image/jpeg":
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "image/png":
      return buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      );
    case "image/gif":
      return buffer.subarray(0, 6).toString("ascii") === "GIF87a" ||
        buffer.subarray(0, 6).toString("ascii") === "GIF89a";
    case "image/webp":
      return buffer.length >= 12 &&
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP";
    default:
      return false;
  }
}

function assertAllowedImage(file) {
  if (!hasExpectedSignature(file)) {
    throw new AppError("Uploaded file content must match an allowed image type", 400);
  }
}

module.exports = { assertAllowedImage };