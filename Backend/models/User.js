import mongoose from "mongoose";
import { CAREER_FIELDS } from "../lib/careerFieldPacks.js";

/**
 * Core user account. One document per person using the app.
 * Related collections: JobApplication, ReminderLog (both keyed by userId).
 * careerProfile drives field-based job suggestions.
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, default: "" },
    role: {
      type: String,
      enum: ["jobseeker", "employer", "admin"],
      default: "jobseeker",
      required: true,
      index: true,
    },
    avatar: { type: String, default: "", trim: true },
    isVerified: { type: Boolean, default: false },
    googleId: { type: String, default: "", index: true },
    resetPasswordTokenHash: { type: String, default: "" },
    resetPasswordTokenExpires: { type: Date },
    name: { type: String, default: "", trim: true },
    careerProfile: {
      field: { type: String, enum: CAREER_FIELDS, default: "other" },
      targetTitles: [{ type: String, trim: true, maxlength: 100 }],
      location: { type: String, trim: true, maxlength: 120, default: "" },
      remotePreference: {
        type: String,
        enum: ["any", "remote", "onsite", "hybrid"],
        default: "any",
      },
      seniority: {
        type: String,
        enum: ["entry", "mid", "senior", "lead", "any"],
        default: "any",
      },
      skills: [{ type: String, trim: true, maxlength: 50 }],
    },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
      index: true,
    },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    planExpiresAt: { type: Date, default: null },
    featuredJobsRemaining: { type: Number, default: 0 },
    jobPostsThisMonth: { type: Number, default: 0 },
    jobPostsResetAt: { type: Date, default: null },
    paymentStatus: { type: String, default: "active" },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
