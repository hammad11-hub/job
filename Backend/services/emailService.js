import nodemailer from "nodemailer";

export async function sendPasswordResetEmail(transporter, user, resetToken) {
  if (!transporter) {
    throw new Error("Email transporter is not initialized.");
  }
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const resetUrl = `${clientUrl}/reset-password.html?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(user.email)}`;
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"Job Tracker" <no-reply@jobtracker.local>`,
    to: user.email,
    subject: "Reset your password for Job Tracker",
    text: `You requested a password reset. Use the link below to set a new password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
    html: `<p>You requested a password reset. Use the link below to set a new password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, please ignore this email.</p>`,
  });
  return {
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info) || "",
  };
}
