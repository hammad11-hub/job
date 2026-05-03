import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production and be at least 16 characters");
  }
  return "dev_insecure_jwt_secret_change_me";
}

export function requireUserId(req, res, next) {
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
    req.userRole = decoded?.role || "jobseeker";
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired auth token" });
  }
}

export function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ message: "Missing role information" });
    }
    const roles = ["jobseeker", "employer", "admin"];
    if (!roles.includes(requiredRole)) {
      return res.status(500).json({ message: "Invalid role configuration" });
    }
    const order = roles.indexOf(req.userRole);
    const requiredIndex = roles.indexOf(requiredRole);
    if (order === -1 || order < requiredIndex) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    return next();
  };
}
