import { Job } from "../models/Job.js";
import { User } from "../models/User.js";

const planOrder = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

async function ensureUserLoaded(req) {
  if (req.user) return req.user;
  if (!req.userId) return null;
  const user = await User.findById(req.userId).lean();
  if (user) {
    req.user = user;
    req.userPlan = user.plan || "free";
  }
  return user;
}

export function requirePlan(minPlan) {
  return async (req, res, next) => {
    const user = await ensureUserLoaded(req);
    if (!user) {
      return res.status(401).json({ message: "Missing authenticated user" });
    }
    const currentPlan = user.plan || "free";
    if (planOrder[currentPlan] === undefined || planOrder[minPlan] === undefined) {
      return res.status(500).json({ message: "Invalid plan configuration" });
    }
    if (planOrder[currentPlan] < planOrder[minPlan]) {
      return res.status(403).json({
        error: "UPGRADE_REQUIRED",
        message: `This feature requires a ${minPlan.charAt(0).toUpperCase() + minPlan.slice(1)} plan`,
        upgradeUrl: "/pricing.html",
      });
    }
    return next();
  };
}

export async function checkJobPostLimit(req, res, next) {
  const user = await ensureUserLoaded(req);
  if (!user) {
    return res.status(401).json({ message: "Missing authenticated user" });
  }

  if (user.role !== "employer") {
    return res.status(403).json({ message: "Only employers can post jobs" });
  }

  const activeJobs = await Job.countDocuments({ employer: user._id, status: "active" });
  if (user.plan === "free" && activeJobs >= 1) {
    return res.status(403).json({
      error: "JOB_LIMIT_REACHED",
      message: "Free plan allows 1 active job. Upgrade to post more.",
      upgradeUrl: "/pricing.html",
    });
  }
  return next();
}
