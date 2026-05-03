import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { body, param } from "express-validator";
import { User } from "./models/User.js";
import { JobApplication } from "./models/JobApplication.js";
import { Application } from "./models/Application.js";
import { Job } from "./models/Job.js";
import { ReminderLog } from "./models/ReminderLog.js";
import { Company } from "./models/Company.js";
import { sendPasswordResetEmail } from "./services/emailService.js";
import { CAREER_FIELDS, FIELD_PACKS } from "./lib/careerFieldPacks.js";
import { getSuggestionsBundle, getSuggestionsForPosition } from "./lib/suggestionEngine.js";
import { validateRequest } from "./utils/validateRequest.js";
import { createPaymentsRouter } from "./routes/payments.js";
import { createEmployerRouter } from "./routes/employer.js";
import { requireUserId, requireRole, getJwtSecret } from "./middleware/auth.js";
import { requirePlan, checkJobPostLimit } from "./middleware/planCheck.js";
import { errorHandler } from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
const oauthCallbackPath = "/api/auth/google/callback";

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeBase = path
      .basename(file.originalname || "resume", ext)
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 60);
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  },
});
const allowedResumeExtensions = new Set([".pdf", ".doc", ".docx"]);
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!allowedResumeExtensions.has(ext)) {
      return cb(new Error("Only .pdf, .doc, and .docx files are allowed"));
    }
    cb(null, true);
  },
});

let transporter;
const mailerTimeouts = {
  connectionTimeout: process.env.EMAIL_CONNECTION_TIMEOUT_MS
    ? Number(process.env.EMAIL_CONNECTION_TIMEOUT_MS)
    : 10000,
  greetingTimeout: process.env.EMAIL_GREETING_TIMEOUT_MS
    ? Number(process.env.EMAIL_GREETING_TIMEOUT_MS)
    : 10000,
  socketTimeout: process.env.EMAIL_SOCKET_TIMEOUT_MS ? Number(process.env.EMAIL_SOCKET_TIMEOUT_MS) : 15000,
};

async function initMailer() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
      secure: false,
      ...mailerTimeouts,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      ...mailerTimeouts,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("Ethereal email account created:", testAccount.user);
  }
}

initMailer().catch((err) => console.error("Mailer init error:", err));

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 30 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth attempts. Please wait and retry." },
});
const reminderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: isProduction ? 25 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many reminder requests. Please try later." },
});

app.use(express.static(path.join(__dirname, "../Frontend")));
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payments/webhook") {
    return next();
  }
  express.json()(req, res, next);
});
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use("/uploads", express.static(uploadDir));
app.use("/api", apiLimiter);
app.use("/api/payments", createPaymentsRouter(transporter));
app.use("/api/employer", createEmployerRouter());
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});


function signAuthToken(userDoc) {
  return jwt.sign(
    {
      sub: String(userDoc._id),
      email: userDoc.email,
      role: userDoc.role || "jobseeker",
    },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

function setAuthCookie(res, token) {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function clearAuthCookie(res) {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(String(token), "utf8").digest("hex");
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "placeholder_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder_secret",
      callbackURL: `${backendUrl}${oauthCallbackPath}`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase?.().trim();
        if (!email) {
          return done(new Error("Google profile did not provide an email"));
        }

        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.findOne({ email });
        }

        if (user) {
          user.googleId = profile.id;
          user.isVerified = true;
          if (!user.name && profile.displayName) {
            user.name = profile.displayName;
          }
          await user.save();
          return done(null, user);
        }

        const newUser = await User.create({
          email,
          googleId: profile.id,
          isVerified: true,
          name: profile.displayName || "",
          passwordHash: "",
        });
        return done(null, newUser);
      } catch (err) {
        return done(err);
      }
    }
  )
);

function defaultCareerProfile() {
  return {
    field: "other",
    targetTitles: [],
    location: "",
    remotePreference: "any",
    seniority: "any",
    skills: [],
  };
}

function parseListInput(v, max, maxItemLen) {
  let arr = [];
  if (Array.isArray(v)) arr = v.map((x) => String(x).trim()).filter(Boolean);
  else if (typeof v === "string") arr = v.split(/[,;\n\r]+/).map((x) => x.trim()).filter(Boolean);
  return arr.slice(0, max).map((s) => s.slice(0, maxItemLen));
}

function careerProfileToJSON(cp) {
  const d = defaultCareerProfile();
  if (!cp) return { ...d };
  return {
    field: CAREER_FIELDS.includes(cp.field) ? cp.field : d.field,
    targetTitles: Array.isArray(cp.targetTitles) ? cp.targetTitles : [],
    location: typeof cp.location === "string" ? cp.location : "",
    remotePreference: ["any", "remote", "onsite", "hybrid"].includes(cp.remotePreference)
      ? cp.remotePreference
      : d.remotePreference,
    seniority: ["entry", "mid", "senior", "lead", "any"].includes(cp.seniority) ? cp.seniority : d.seniority,
    skills: Array.isArray(cp.skills) ? cp.skills : [],
  };
}

function normalizeCareerProfile(body, existing = {}) {
  const base = { ...defaultCareerProfile(), ...careerProfileToJSON(existing) };
  if (!body || typeof body !== "object") return base;
  const field = CAREER_FIELDS.includes(body.field) ? body.field : base.field;
  return {
    field,
    targetTitles: body.targetTitles !== undefined ? parseListInput(body.targetTitles, 8, 100) : base.targetTitles,
    location: body.location !== undefined ? String(body.location).trim().slice(0, 120) : base.location,
    remotePreference: ["any", "remote", "onsite", "hybrid"].includes(body.remotePreference)
      ? body.remotePreference
      : base.remotePreference,
    seniority: ["entry", "mid", "senior", "lead", "any"].includes(body.seniority) ? body.seniority : base.seniority,
    skills: body.skills !== undefined ? parseListInput(body.skills, 20, 50) : base.skills,
  };
}

function userToClient(userDoc) {
  const u = userDoc.toObject ? userDoc.toObject() : userDoc;
  return {
    id: String(u._id),
    email: u.email,
    name: u.name || "",
    role: u.role || "jobseeker",
    avatar: u.avatar || "",
    isVerified: Boolean(u.isVerified),
    careerProfile: careerProfileToJSON(u.careerProfile),
    plan: u.plan || "free",
    stripeCustomerId: u.stripeCustomerId || null,
    stripeSubscriptionId: u.stripeSubscriptionId || null,
    planExpiresAt: u.planExpiresAt || null,
    featuredJobsRemaining: u.featuredJobsRemaining || 0,
    jobPostsThisMonth: u.jobPostsThisMonth || 0,
    jobPostsResetAt: u.jobPostsResetAt || null,
    paymentStatus: u.paymentStatus || "active",
  };
}

app.post("/upload-resume", requireUserId, upload.single("resume"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No resume uploaded" });
  }
  return res.status(201).json({ fileName: req.file.filename, url: `/uploads/${req.file.filename}` });
});

app.post(
  "/send-reminder",
  requireUserId,
  reminderLimiter,
  [
    body("email").isEmail().withMessage("A valid email address is required."),
    body("company").trim().notEmpty().withMessage("Company is required."),
    body("role").trim().notEmpty().withMessage("Role is required."),
  ],
  validateRequest,
  async (req, res) => {
    const { email, company, role, followUpDate, notes } = req.body;

  if (!transporter) {
    return res.status(500).json({ message: "Email transporter is not ready yet." });
  }

  let status = "Failed";
  let previewUrl = "";
  let errorMessage = "";

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Job Tracker" <${process.env.EMAIL_USER || "no-reply@jobtracker.local"}>`,
      to: email,
      subject: `Follow-up reminder: ${company}`,
      text: `Hi there,

This is a reminder to follow up with ${company} for the ${role} role${followUpDate ? ` on ${followUpDate}` : ""}.

Notes:
${notes || "No notes provided."}

Best of luck!`,
    });

    status = "Sent";
    previewUrl = nodemailer.getTestMessageUrl(info) || "";
    const data = { message: "Reminder sent", previewUrl };

    if (req.userId) {
      try {
        await ReminderLog.create({
          userId: req.userId,
          company,
          role,
          toEmail: email,
          sentAt: new Date().toISOString(),
          status,
          previewUrl,
          errorMessage: "",
        });
      } catch (logErr) {
        console.error("ReminderLog save error:", logErr);
      }
    }

    return res.status(200).json(data);
  } catch (err) {
    errorMessage = err.message || "Send failed";
    if (req.userId) {
      await ReminderLog.create({
        userId: req.userId,
        company,
        role,
        toEmail: email,
        sentAt: new Date().toISOString(),
        status: "Failed",
        previewUrl: "",
        errorMessage,
      }).catch((e) => console.error("ReminderLog save error:", e));
    }
    return res.status(500).json({ error: errorMessage });
  }
});

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/jobtracker";
mongoose
  .connect(mongoUri)
  .then(() => console.log("MongoDB connected:", mongoUri))
  .catch((err) => console.error("MongoDB error:", err));

async function expireFeaturedJobs() {
  try {
    const result = await Job.updateMany(
      {
        featured: true,
        featuredUntil: { $lte: new Date() },
      },
      { $set: { featured: false, featuredUntil: null } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Expired ${result.modifiedCount} featured job listings`);
    }
  } catch (err) {
    console.error("Featured expiration job failed:", err);
  }
}

cron.schedule("0 0 * * *", () => {
  expireFeaturedJobs();
});

expireFeaturedJobs().catch(() => {});

app.post(
  "/register",
  authLimiter,
  [
    body("email").isEmail().withMessage("A valid email address is required."),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
    body("name").optional().trim().isLength({ min: 1 }).withMessage("Name cannot be empty."),
    body("role").optional().isIn(["jobseeker", "employer"]).withMessage("Invalid role."),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { email, password, name, role } = req.body;

      const existingUser = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email: String(email).toLowerCase().trim(),
      passwordHash,
      name: typeof name === "string" ? name.trim() : "",
      role: role || "jobseeker",
    });
    const token = signAuthToken(newUser);
    setAuthCookie(res, token);

    return res.status(201).json({
      message: "Registered successfully",
      user: userToClient(newUser),
      token,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().withMessage("A valid email address is required."),
    body("password").exists().withMessage("Password is required."),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = signAuthToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({
      message: "Login successful",
      user: userToClient(user),
      token,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/logout", (req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({ message: "Logged out" });
});

app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${clientUrl}/login.html?oauth=failed`,
  }),
  (req, res) => {
    const token = signAuthToken(req.user);
    const redirectUrl = new URL(`${clientUrl}/login.html`);
    redirectUrl.searchParams.set("token", token);
    return res.redirect(redirectUrl.toString());
  }
);

app.get("/api/me", requireUserId, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ user: userToClient(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post(
  "/api/password-reset-request",
  authLimiter,
  [body("email").isEmail().withMessage("A valid email address is required.")],
  validateRequest,
  async (req, res) => {
    try {
      const email = String(req.body.email).toLowerCase().trim();
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(200).json({ message: "If that email exists, a reset link has been sent." });
      }

      const token = crypto.randomBytes(24).toString("hex");
      user.resetPasswordTokenHash = hashResetToken(token);
      user.resetPasswordTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      if (!transporter) {
        return res.status(500).json({ message: "Email transporter is not ready yet." });
      }

      await sendPasswordResetEmail(transporter, user, token);
      return res.status(200).json({ message: "If that email exists, a reset link has been sent." });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

app.post(
  "/api/password-reset",
  authLimiter,
  [
    body("email").isEmail().withMessage("A valid email address is required."),
    body("token").trim().notEmpty().withMessage("Reset token is required."),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const email = String(req.body.email).toLowerCase().trim();
      const token = String(req.body.token).trim();
      const password = String(req.body.password);

      const user = await User.findOne({ email });
      if (
        !user ||
        !user.resetPasswordTokenHash ||
        !user.resetPasswordTokenExpires ||
        user.resetPasswordTokenExpires < new Date() ||
        hashResetToken(token) !== user.resetPasswordTokenHash
      ) {
        return res.status(400).json({ message: "Invalid or expired password reset token." });
      }

      user.passwordHash = await bcrypt.hash(password, 10);
      user.resetPasswordTokenHash = "";
      user.resetPasswordTokenExpires = undefined;
      await user.save();

      return res.status(200).json({ message: "Password has been reset successfully." });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

app.get("/api/admin/users", requireUserId, requireRole("admin"), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    return res.json({ users: users.map((user) => userToClient(user)) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.patch(
  "/api/admin/users/:id/role",
  requireUserId,
  requireRole("admin"),
  [
    param("id").isMongoId().withMessage("Invalid user id"),
    body("role").isIn(["jobseeker", "employer", "admin"]).withMessage("Invalid role"),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const role = req.body.role;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user id" });
      }

      const updated = await User.findByIdAndUpdate(
        id,
        { role },
        { new: true, runValidators: true }
      ).lean();
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json({ user: userToClient(updated) });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

app.get("/api/companies", async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 }).lean();
    return res.json({
      companies: companies.map((company) => ({
        id: String(company._id),
        name: company.name,
        website: company.website,
        description: company.description,
        industry: company.industry,
        logo: company.logo,
        verified: Boolean(company.verified),
        owner: String(company.owner),
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post(
  "/api/companies",
  requireUserId,
  requireRole("employer"),
  [
    body("name").trim().notEmpty().withMessage("Company name is required."),
    body("website").optional().trim().isURL({ require_protocol: true }).withMessage("Company website must be a valid URL."),
    body("industry").optional().trim().isLength({ max: 120 }).withMessage("Industry is too long."),
    body("description").optional().trim().isLength({ max: 1000 }).withMessage("Description is too long."),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name, website, description, industry, logo } = req.body;
      const company = await Company.create({
        owner: req.userId,
        name: String(name).trim(),
        website: website ? String(website).trim() : "",
        description: description ? String(description).trim() : "",
        industry: industry ? String(industry).trim() : "",
        logo: logo ? String(logo).trim() : "",
      });
      return res.status(201).json({
        company: {
          id: String(company._id),
          name: company.name,
          website: company.website,
          description: company.description,
          industry: company.industry,
          logo: company.logo,
          verified: Boolean(company.verified),
          owner: String(company.owner),
        },
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

function jobToClient(doc) {
  const j = doc.toObject ? doc.toObject() : doc;
  return {
    _id: String(j._id),
    company: j.company,
    role: j.role,
    status: j.status,
    date: j.appliedDate,
    followUpDate: j.followUpDate || "",
    notes: j.notes || "",
    resumeName: j.resumeName || "",
    resumeUrl: j.resumeUrl || "",
    currentPosition: j.currentPosition || "",
  };
}

function jobListingToClient(doc) {
  const j = doc.toObject ? doc.toObject() : doc;
  return {
    _id: String(j._id),
    title: j.title,
    description: j.description,
    company: j.company,
    location: j.location,
    salary: j.salary || { min: 0, max: 0, currency: "USD" },
    type: j.type,
    category: j.category,
    experienceLevel: j.experienceLevel,
    skills: Array.isArray(j.skills) ? j.skills : [],
    status: j.status,
    employer: String(j.employer),
    featured: Boolean(j.featured),
    featuredUntil: j.featuredUntil || null,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
  };
}

function parseBoolean(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  const normalized = String(value).toLowerCase().trim();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function parseNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

app.get("/api/jobs", async (req, res) => {
  try {
    const {
      keyword,
      location,
      type,
      category,
      salaryMin,
      salaryMax,
      experience,
      remote,
      featured,
      page = "1",
      limit = "10",
      sort = "newest",
    } = req.query;

    const filter = { status: "active" };
    if (keyword) {
      filter.$text = { $search: String(keyword).trim() };
    }
    if (location) {
      filter.location = { $regex: String(location).trim(), $options: "i" };
    }
    if (type) {
      const types = String(type)
        .split(/[,;\|]+/)
        .map((t) => t.trim())
        .filter(Boolean);
      if (types.length > 0) filter.type = { $in: types };
    }
    if (category) {
      filter.category = String(category).trim();
    }
    if (experience) {
      filter.experienceLevel = String(experience).trim();
    }
    const minSalary = parseNumber(salaryMin, null);
    const maxSalary = parseNumber(salaryMax, null);
    if (minSalary !== null || maxSalary !== null) {
      if (minSalary !== null) filter["salary.min"] = { ...(filter["salary.min"] || {}), $gte: minSalary };
      if (maxSalary !== null) filter["salary.max"] = { ...(filter["salary.max"] || {}), $lte: maxSalary };
    }
    const remoteOnly = parseBoolean(remote);
    if (remoteOnly) {
      if (filter.type && filter.type.$in) {
        filter.type.$in = filter.type.$in.filter((t) => t === "remote");
        if (filter.type.$in.length === 0) {
          filter.type = "remote";
        }
      } else {
        filter.type = "remote";
      }
    }
    const featuredOnly = parseBoolean(featured);
    if (featuredOnly) {
      filter.featured = true;
    }

    const pageNumber = Math.max(1, parseNumber(page, 1));
    const pageLimit = Math.min(50, Math.max(1, parseNumber(limit, 10)));
    const skip = (pageNumber - 1) * pageLimit;

    let secondarySort = { createdAt: -1 };
    switch (String(sort).toLowerCase()) {
      case "salary_high":
        secondarySort = { "salary.max": -1 };
        break;
      case "salary_low":
        secondarySort = { "salary.min": 1 };
        break;
      case "most_applied":
        secondarySort = { applicantCount: -1 };
        break;
      default:
        secondarySort = { createdAt: -1 };
        break;
    }

    const total = await Job.countDocuments(filter);
    const aggregatePipeline = [{ $match: filter }];
    aggregatePipeline.push({
      $addFields: {
        applicantCount: { $size: { $ifNull: ["$applicants", []] } },
      },
    });
    aggregatePipeline.push({ $sort: { featured: -1, ...secondarySort } });
    aggregatePipeline.push({ $skip: skip });
    aggregatePipeline.push({ $limit: pageLimit });
    aggregatePipeline.push({
      $project: {
        applicants: 0,
      },
    });
    const jobs = await Job.aggregate(aggregatePipeline);

    return res.json({
      jobs,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / pageLimit),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/jobs/categories", async (req, res) => {
  try {
    const categories = await Job.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { _id: 0, category: "$_id", count: 1 } },
      { $sort: { count: -1, category: 1 } },
    ]);
    return res.json({ categories });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/jobs/:id/similar", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job id" });
    }
    const job = await Job.findById(id).lean();
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    const similar = await Job.find({
      _id: { $ne: job._id },
      category: job.category,
      status: "active",
    })
      .sort({ featured: -1, createdAt: -1 })
      .limit(4)
      .lean();
    return res.json({ jobs: similar });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job id" });
    }
    const job = await Job.findById(id).lean();
    if (!job || job.status !== "active") {
      return res.status(404).json({ message: "Job not found" });
    }
    return res.json({ job });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/jobs/:id/apply", requireUserId, async (req, res) => {
  try {
    const { id } = req.params;
    const { resumeUrl, coverLetter } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job id" });
    }
    const job = await Job.findById(id);
    if (!job || job.status !== "active") {
      return res.status(404).json({ message: "Job not found" });
    }

    const existingApplication = await Application.findOne({
      job: id,
      applicant: req.userId,
    });
    if (existingApplication) {
      return res.status(400).json({ message: "You have already applied for this job." });
    }

    const application = await Application.create({
      job: id,
      applicant: req.userId,
      resumeUrl: resumeUrl || "",
      coverLetter: coverLetter || "",
      appliedAt: new Date(),
    });

    // Update job with applicant reference
    job.applicants = job.applicants || [];
    job.applicants.push(req.userId);
    await job.save();

    return res.status(201).json({ message: "Applied successfully", application });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/applications", requireUserId, async (req, res) => {
  try {
    const list = await JobApplication.find({ userId: req.userId }).sort({ updatedAt: -1 }).lean();
    return res.json({ jobs: list.map((j) => jobToClient(j)) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/my-portal-applications", requireUserId, async (req, res) => {
  try {
    const apps = await Application.find({ applicant: req.userId })
      .populate("job", "title company location type")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({
      applications: apps.map((app) => ({
        id: String(app._id),
        jobId: String(app.job?._id),
        title: app.job?.title || "Unknown Position",
        company: app.job?.company || "Unknown Company",
        location: app.job?.location || "Unknown Location",
        type: app.job?.type || "full-time",
        status: app.status,
        appliedAt: app.appliedAt,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post(
  "/api/applications",
  requireUserId,
  [
    body("company").trim().notEmpty().withMessage("Company is required."),
    body("role").trim().notEmpty().withMessage("Role is required."),
    body("date").trim().notEmpty().withMessage("Application date is required."),
    body("status").optional().trim().isIn(["Applied", "Interview", "Rejected", "Offer"]).withMessage("Invalid status."),
    body("currentPosition").optional().trim().isLength({ max: 120 }).withMessage("Current position is too long."),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { company, role, status, date, followUpDate, notes, resumeName, resumeUrl, currentPosition } = req.body;
      const created = await JobApplication.create({
        userId: req.userId,
        company: String(company).trim(),
        role: String(role).trim(),
        status: status || "Applied",
        appliedDate: date,
        followUpDate: followUpDate || "",
        notes: notes || "",
        resumeName: resumeName || "",
        resumeUrl: resumeUrl || "",
        currentPosition: currentPosition != null ? String(currentPosition).trim().slice(0, 120) : "",
      });
      return res.status(201).json({ job: jobToClient(created) });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

app.put(
  "/api/applications/:id",
  requireUserId,
  [
    param("id").isMongoId().withMessage("Invalid job id"),
    body("company").optional().trim().notEmpty().withMessage("Company cannot be empty."),
    body("role").optional().trim().notEmpty().withMessage("Role cannot be empty."),
    body("status").optional().trim().isIn(["Applied", "Interview", "Rejected", "Offer"]).withMessage("Invalid status."),
    body("currentPosition").optional().trim().isLength({ max: 120 }).withMessage("Current position is too long."),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid job id" });
      }
      const { company, role, status, date, followUpDate, notes, resumeName, resumeUrl, currentPosition } = req.body;
      const patch = {};
      if (company !== undefined) patch.company = String(company).trim();
      if (role !== undefined) patch.role = String(role).trim();
      if (status !== undefined) patch.status = status;
      if (date !== undefined) patch.appliedDate = date;
      if (followUpDate !== undefined) patch.followUpDate = followUpDate;
      if (notes !== undefined) patch.notes = notes;
      if (resumeName !== undefined) patch.resumeName = resumeName;
      if (resumeUrl !== undefined) patch.resumeUrl = resumeUrl;
      if (currentPosition !== undefined) patch.currentPosition = String(currentPosition).trim().slice(0, 120);
      const updated = await JobApplication.findOneAndUpdate(
        { _id: id, userId: req.userId },
        { $set: patch },
        { new: true, runValidators: true }
      );
      if (!updated) {
        return res.status(404).json({ message: "Job not found" });
      }
      return res.json({ job: jobToClient(updated) });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

app.delete("/api/applications/:id", requireUserId, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job id" });
    }
    const result = await JobApplication.deleteOne({ _id: id, userId: req.userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Job not found" });
    }
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/reminders", requireUserId, async (req, res) => {
  try {
    const list = await ReminderLog.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(100).lean();
    const reminders = list.map((r) => ({
      company: r.company,
      role: r.role,
      email: r.toEmail,
      sentAt: r.sentAt,
      status: r.status,
      previewUrl: r.previewUrl || "",
      error: r.errorMessage || "",
    }));
    return res.json({ reminders });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/career-fields", (req, res) => {
  const ordered = CAREER_FIELDS.filter((f) => f !== "other").map((id) => ({ id, label: FIELD_PACKS[id].label }));
  ordered.push({ id: "other", label: FIELD_PACKS.other.label });
  return res.json({ fields: ordered });
});

app.get("/api/me/career-profile", requireUserId, async (req, res) => {
  try {
    const u = await User.findById(req.userId).lean();
    if (!u) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ careerProfile: careerProfileToJSON(u.careerProfile) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/me/career-profile", requireUserId, async (req, res) => {
  try {
    const u = await User.findById(req.userId);
    if (!u) {
      return res.status(404).json({ message: "User not found" });
    }
    const merged = normalizeCareerProfile(req.body, u.careerProfile);
    u.set("careerProfile", merged);
    await u.save();
    return res.json({ careerProfile: careerProfileToJSON(u.careerProfile) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/suggestions", requireUserId, async (req, res) => {
  try {
    const u = await User.findById(req.userId).lean();
    if (!u) {
      return res.status(404).json({ message: "User not found" });
    }
    const apps = await JobApplication.find({ userId: req.userId }).sort({ updatedAt: -1 }).lean();
    const bundle = await getSuggestionsBundle(u, apps);
    return res.json(bundle);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/suggestions/for-position", requireUserId, async (req, res) => {
  try {
    const currentPosition = String(req.query.currentPosition || "").trim();
    const applyingRole = String(req.query.applyingRole || "").trim();
    const anchor = currentPosition || applyingRole;
    if (anchor.length < 2) {
      return res.status(400).json({
        message: "Enter your current position or the role you are applying for (at least 2 characters).",
      });
    }
    if (anchor.length > 120) {
      return res.status(400).json({ message: "Title is too long." });
    }
    const u = await User.findById(req.userId).lean();
    if (!u) {
      return res.status(404).json({ message: "User not found" });
    }
    const bundle = await getSuggestionsForPosition(u, anchor);
    return res.json({
      ...bundle,
      meta: {
        ...bundle.meta,
        usedCurrentPosition: Boolean(currentPosition),
        usedApplyingRole: !currentPosition && Boolean(applyingRole),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});