import mongoose from "mongoose";

/**
 * Audit trail of follow-up emails sent from the dashboard for a user.
 */
const reminderLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    company: { type: String, default: "" },
    role: { type: String, default: "" },
    toEmail: { type: String, default: "" },
    sentAt: { type: String, default: "" },
    status: { type: String, default: "" },
    previewUrl: { type: String, default: "" },
    errorMessage: { type: String, default: "" },
  },
  { timestamps: true }
);

reminderLogSchema.index({ userId: 1, createdAt: -1 });

export const ReminderLog = mongoose.model("ReminderLog", reminderLogSchema);
