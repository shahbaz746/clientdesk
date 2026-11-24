
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    websiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Website",
      required: [true, "Website ID is required"],
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Client ID is required"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Request title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },

    description: {
      type: String,
      required: [true, "Request description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },

    summary: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Summary cannot exceed 500 characters"],
    },

    category: {
      type: String,
      enum: [
        "bug",
        "ui_ux",
        "content",
        "performance",
        "seo",
        "security",
        "feature",
        "other",
      ],
      default: "other",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },

    status: {
      type: String,
      enum: [
        "Submitted",
        "Needs Clarification",
        "Accepted",
        "In Progress",
        "Awaiting Client",
        "Reopened",
        "Closed",
      ],
      default: "Submitted",
      index: true,
    },

    attachments: [
      {
        fileName: {
          type: String,
          trim: true,
        },

        fileUrl: {
          type: String,
          trim: true,
        },

        publicId: {
          type: String,
          trim: true,
        },

        mimeType: {
          type: String,
          trim: true,
        },

        size: {
          type: Number,
          min: 0,
        },
      },
    ],

    aiSuggestions: {
      summary: {
        type: String,
        default: "",
      },

      category: {
        type: String,
        enum: [
          "bug",
          "ui_ux",
          "content",
          "performance",
          "seo",
          "security",
          "feature",
          "other",
        ],
      },

      priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
      },

      clarificationQuestions: {
        type: [String],
        default: [],
      },

      generatedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Request = mongoose.model("Request", requestSchema);

module.exports = Request;
