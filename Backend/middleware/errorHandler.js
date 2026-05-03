export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.status && typeof err.status === "number") {
    return res.status(err.status).json({ message: err.message || "Request failed" });
  }

  if (err?.name === "UnauthorizedError") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (err?.message && err.message.includes("Only .pdf, .doc, and .docx")) {
    return res.status(400).json({ message: err.message });
  }

  if (err?.message === "Origin not allowed by CORS") {
    return res.status(403).json({ message: "Origin not allowed" });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ message: "Internal server error" });
}
