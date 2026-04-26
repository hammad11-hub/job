import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "./models/User.js";
import { JobApplication } from "./models/JobApplication.js";
import { ReminderLog } from "./models/ReminderLog.js";
import { CAREER_FIELDS, FIELD_PACKS } from "./lib/careerFieldPacks.js";
import { getSuggestionsBundle, getSuggestionsForPosition } from "./lib/suggestionEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(uploadDir));
app.use("/api", apiLimiter);
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

function requireUserId(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const cookieToken = req.cookies?.auth_token || "";
  const token = bearerToken || cookieToken;
  if (!token) {
    return res.status(401).json({ message: "Missing auth token" });
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const sub = decoded?.sub;
    if (!sub || !mongoose.Types.ObjectId.isValid(sub)) {
      return res.status(401).json({ message: "Invalid auth token" });
    }
    req.userId = new mongoose.Types.ObjectId(sub);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired auth token" });
  }
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production and be at least 16 characters");
  }
  return "dev_insecure_jwt_secret_change_me";
}

function signAuthToken(userDoc) {
  return jwt.sign(
    {
      sub: String(userDoc._id),
      email: userDoc.email,
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
    careerProfile: careerProfileToJSON(u.careerProfile),
  };
}

app.post("/upload-resume", requireUserId, upload.single("resume"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No resume uploaded" });
  }
  return res.status(201).json({ fileName: req.file.filename, url: `/uploads/${req.file.filename}` });
});

app.post("/send-reminder", requireUserId, reminderLimiter, async (req, res) => {
  const { email, company, role, followUpDate, notes } = req.body;

  if (!email || !company || !role) {
    return res.status(400).json({ message: "Missing required reminder fields." });
  }

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

app.post("/register", authLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email: String(email).toLowerCase().trim(),
      passwordHash,
      name: typeof name === "string" ? name.trim() : "",
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

app.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

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

app.get("/api/jobs", requireUserId, async (req, res) => {
  try {
    const list = await JobApplication.find({ userId: req.userId }).sort({ updatedAt: -1 }).lean();
    return res.json({ jobs: list.map((j) => jobToClient(j)) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/jobs", requireUserId, async (req, res) => {
  try {
    const { company, role, status, date, followUpDate, notes, resumeName, resumeUrl, currentPosition } = req.body;
    if (!company || !role || !date) {
      return res.status(400).json({ message: "company, role, and date are required" });
    }
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
});

app.put("/api/jobs/:id", requireUserId, async (req, res) => {
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
});

app.delete("/api/jobs/:id", requireUserId, async (req, res) => {
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

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Resume file too large. Max size is 5MB." });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err?.message && err.message.includes("Only .pdf, .doc, and .docx")) {
    return res.status(400).json({ message: err.message });
  }
  if (err?.message === "Origin not allowed by CORS") {
    return res.status(403).json({ message: "Origin not allowed" });
  }
  console.error("Unhandled error:", err);
  return res.status(500).json({ message: "Internal server error" });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});