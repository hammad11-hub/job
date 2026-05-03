import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String, trim: true, default: "" },
    website: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    industry: { type: String, trim: true, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Company = mongoose.model("Company", companySchema);
