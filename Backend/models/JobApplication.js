import mongoose from "mongoose";

/**
 * Job pipeline row for a single user. All queries must filter by userId
 * so each user only sees their own applications.
 */
const jobApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    /** Candidate's current job title (optional); used for position-related suggestions. */
    currentPosition: { type: String, default: "", trim: true, maxlength: 120 },
    status: {
      type: String,
      enum: ["Applied", "Interview", "Rejected", "Offer"],
      default: "Applied",
    },
    /** ISO date string from the date input (application date). */
    appliedDate: { type: String, required: true },
    followUpDate: { type: String, default: "" },
    notes: { type: String, default: "" },
    resumeName: { type: String, default: "" },
    resumeUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

jobApplicationSchema.index({ userId: 1, updatedAt: -1 });

export const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);
