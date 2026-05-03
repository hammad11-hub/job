import express from "express";
import mongoose from "mongoose";
import { body, param } from "express-validator";
import { Job } from "../models/Job.js";
import { Application } from "../models/Application.js";
import { User } from "../models/User.js";
import { PLANS } from "../config/plans.js";
import { validateRequest } from "../utils/validateRequest.js";
import { requireUserId, requireRole } from "../middleware/auth.js";
import { requirePlan, checkJobPostLimit } from "../middleware/planCheck.js";

export function createEmployerRouter() {
  const router = express.Router();
  router.use(requireUserId);
  router.use(requireRole("employer"));

  router.get("/stats", requirePlan("pro"), async (req, res) => {
    try {
      const employerId = req.userId;
      const totalJobs = await Job.countDocuments({ employer: employerId });
      const activeJobs = await Job.countDocuments({ employer: employerId, status: "active" });
      const totalApplicants = await Application.countDocuments({ job: { $in: await Job.find({ employer: employerId }).distinct("_id") } });
      const featuredJobs = await Job.countDocuments({ employer: employerId, featured: true });
      const plan = req.user?.plan || "free";
      return res.json({
        totalJobs,
        activeJobs,
        featuredJobs,
        totalApplicants,
        plan,
        limits: PLANS[plan] || PLANS.free,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  router.get("/jobs", async (req, res) => {
    try {
      const jobs = await Job.find({ employer: req.userId }).sort({ createdAt: -1 });
      return res.json({ jobs });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  router.post(
    "/jobs",
    checkJobPostLimit,
    [
      body("title").trim().notEmpty().withMessage("Job title is required."),
      body("description").trim().notEmpty().withMessage("Job description is required."),
      body("company").trim().notEmpty().withMessage("Company is required."),
      body("location").trim().notEmpty().withMessage("Location is required."),
      body("salary.min").optional().isNumeric().withMessage("Minimum salary must be a number."),
      body("salary.max").optional().isNumeric().withMessage("Maximum salary must be a number."),
      body("type").optional().isIn(["full-time", "part-time", "remote", "contract"]).withMessage("Invalid job type."),
      body("category").optional().trim().isLength({ max: 120 }).withMessage("Category is too long."),
      body("experienceLevel").optional().isIn(["entry", "mid", "senior", "lead"]).withMessage("Invalid experience level."),
    ],
    validateRequest,
    async (req, res) => {
      try {
        const salary = {
          min: Number(req.body.salary?.min || 0),
          max: Number(req.body.salary?.max || 0),
          currency: String(req.body.salary?.currency || "USD"),
        };
        const job = await Job.create({
          title: String(req.body.title).trim(),
          description: String(req.body.description).trim(),
          company: String(req.body.company).trim(),
          location: String(req.body.location).trim(),
          salary,
          type: req.body.type || "full-time",
          category: String(req.body.category || "General").trim(),
          experienceLevel: req.body.experienceLevel || "mid",
          skills: Array.isArray(req.body.skills) ? req.body.skills.map((s) => String(s).trim()).filter(Boolean) : [],
          employer: req.userId,
          status: "active",
        });

        const user = await User.findById(req.userId);
        if (user) {
          const resetAt = user.jobPostsResetAt && new Date(user.jobPostsResetAt) > new Date() ? new Date(user.jobPostsResetAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          if (!user.jobPostsResetAt || new Date(user.jobPostsResetAt) <= new Date()) {
            user.jobPostsThisMonth = 0;
            user.jobPostsResetAt = resetAt;
          }
          user.jobPostsThisMonth = (user.jobPostsThisMonth || 0) + 1;
          await user.save();
        }

        return res.status(201).json({ job });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }
  );

  router.post(
    "/jobs/:id/feature",
    param("id").isMongoId().withMessage("Invalid job id"),
    validateRequest,
    async (req, res) => {
      try {
        const { id } = req.params;
        const job = await Job.findOne({ _id: id, employer: req.userId });
        if (!job) {
          return res.status(404).json({ message: "Job not found" });
        }
        const user = await User.findById(req.userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        if ((user.featuredJobsRemaining || 0) <= 0) {
          return res.status(403).json({
            error: "FEATURE_LIMIT_REACHED",
            message: "You have no featured slots left. Upgrade for more.",
            upgradeUrl: "/pricing.html",
          });
        }
        job.featured = true;
        job.featuredUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        user.featuredJobsRemaining = Math.max(0, (user.featuredJobsRemaining || 0) - 1);
        await Promise.all([job.save(), user.save()]);
        return res.json({ success: true, featuredJobsRemaining: user.featuredJobsRemaining });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }
  );

  router.get(
    "/jobs/:id/applicants",
    param("id").isMongoId().withMessage("Invalid job id"),
    validateRequest,
    async (req, res) => {
      try {
        const { id } = req.params;
        const job = await Job.findOne({ _id: id, employer: req.userId }).lean();
        if (!job) {
          return res.status(404).json({ message: "Job not found" });
        }
        const applicants = await Application.find({ job: job._id })
          .populate("applicant", "name email")
          .sort({ appliedAt: -1 })
          .lean();

        // Filter out AI scores if user is on free plan
        const user = await User.findById(req.userId).lean();
        const finalApplicants = applicants.map((app) => {
          if (user.plan === "free") {
            const { aiMatchScore, ...rest } = app;
            return rest;
          }
          return app;
        });

        return res.json({ applicants: finalApplicants });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }
  );

  router.get(
    "/jobs/:id/applicants/export",
    requirePlan("enterprise"),
    param("id").isMongoId().withMessage("Invalid job id"),
    validateRequest,
    async (req, res) => {
      try {
        const { id } = req.params;
        const job = await Job.findOne({ _id: id, employer: req.userId }).lean();
        if (!job) {
          return res.status(404).json({ message: "Job not found" });
        }
        const applicants = await Application.find({ job: job._id }).populate("applicant", "name email").lean();
        const headers = ["Applicant Name", "Applicant Email", "Status", "AI Match Score", "Applied At"];
        const rows = applicants.map((app) => [
          app.applicant?.name || "",
          app.applicant?.email || "",
          app.status,
          app.aiMatchScore != null ? String(app.aiMatchScore) : "",
          app.appliedAt ? new Date(app.appliedAt).toISOString() : "",
        ]);
        const csv = [headers, ...rows]
          .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
          .join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="job-${job._id}-applicants.csv"`);
        return res.send(csv);
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }
  );

  return router;
}
