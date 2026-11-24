const multer = require("multer");
const AppError = require("../utils/AppError");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      cb(new AppError("Only JPEG, PNG, WEBP, and GIF images are allowed", 400));
      return;
    }
    cb(null, true);
  },
});

module.exports = upload;
