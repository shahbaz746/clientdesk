
const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ["request", "website"],
      required: [true, "Entity type is required"],
      default: "request",
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Entity ID is required"],
    },

    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
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
        "request_rejected",
        "status_changed",
        "priority_changed",
        "category_changed",
        "comment_added",
        "attachment_added",
        "clarification_requested",
        "request_reopened",
        "request_closed",
        "request_updated",
        "website_created",
        "website_updated",
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

activitySchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

activitySchema.pre("validate", function setRequestIdForRequestEntities() {
  if (this.entityType === "request" && this.entityId && !this.requestId) {
    this.requestId = this.entityId;
  }
});

const Activity = mongoose.model("Activity", activitySchema);

module.exports = Activity;
