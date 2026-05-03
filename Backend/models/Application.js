import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resumeUrl: { type: String, trim: true, default: "" },
    coverLetter: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["pending", "reviewed", "shortlisted", "rejected"],
      default: "pending",
      index: true,
    },
    aiMatchScore: { type: Number, min: 0, max: 100, default: 0 },
    appliedAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true }
);

export const Application = mongoose.model("Application", applicationSchema);
