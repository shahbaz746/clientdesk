
const mongoose = require("mongoose");

const websiteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Website name is required"],
      trim: true,
      minlength: [2, "Website name must be at least 2 characters"],
      maxlength: [100, "Website name cannot exceed 100 characters"],
    },

    url: {
      type: String,
      required: [true, "Website URL is required"],
      trim: true,
      match: [
        /^https?:\/\/.+\..+/,
        "Please provide a valid website URL",
      ],
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Client ID is required"],
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Website = mongoose.model("Website", websiteSchema);

module.exports = Website;
