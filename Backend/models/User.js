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
    passwordHash: { type: String, required: true },
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
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
