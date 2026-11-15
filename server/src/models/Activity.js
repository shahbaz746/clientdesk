
const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: [true, "Request ID is required"],
      index: true,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Actor ID is required"],
    },

    action: {
      type: String,
      required: [true, "Activity action is required"],
      enum: [
        "request_created",
        "request_accepted",
        "status_changed",
        "priority_changed",
        "category_changed",
        "comment_added",
        "attachment_added",
        "request_reopened",
        "request_closed",
        "request_updated",
      ],
    },

    changes: {
      field: {
        type: String,
        trim: true,
      },

      oldValue: {
        type: mongoose.Schema.Types.Mixed,
      },

      newValue: {
        type: mongoose.Schema.Types.Mixed,
      },
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Activity = mongoose.model("Activity", activitySchema);

module.exports = Activity;
