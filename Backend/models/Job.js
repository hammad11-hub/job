import mongoose from "mongoose";

const salarySchema = new mongoose.Schema(
  {
    min: { type: Number, default: 0, min: 0 },
    max: { type: Number, default: 0, min: 0 },
    currency: { type: String, trim: true, default: "USD" },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    salary: { type: salarySchema, default: () => ({}) },
    type: {
      type: String,
      enum: ["full-time", "part-time", "remote", "contract"],
      default: "full-time",
    },
    category: { type: String, trim: true, default: "General" },
    experienceLevel: {
      type: String,
      enum: ["entry", "mid", "senior", "lead"],
      default: "mid",
    },
    skills: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
      index: true,
    },
    employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Application" }],
    featured: { type: Boolean, default: false, index: true },
    featuredUntil: { type: Date, default: null },
    views: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

jobSchema.index({ title: "text", description: "text" });

export const Job = mongoose.model("Job", jobSchema);
