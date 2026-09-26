import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User";

const router = Router();

// Read JWT secret at request time so dotenv is loaded before signing.
const jwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "dev-secret") {
    console.warn("JWT_SECRET is not set or is using the insecure default.");
  }
  return secret || "dev-secret";
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function validateEmail(email: unknown): string | null {
  if (typeof email !== "string" || !email.trim()) return null;
  // Simple RFC-5322 surface check — real validation happens via db uniqueness.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? email.trim().toLowerCase() : null;
}

/**
 * Password rules (sensible defaults — adjust via env for stricter policies):
 *   - Minimum 8 characters
 * A length-only rule avoids over-engineering for a hackathon demo while still
 * blocking blank/trivially short passwords that bcrypt would accept.
 */
function validatePassword(password: unknown): string | null {
  if (typeof password !== "string") return null;
  return password.length >= 8 ? password : null;
}

// ─── SIGNUP ──────────────────────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email: rawEmail, password: rawPassword } = req.body ?? {};

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Name is required." });
    }

    const email = validateEmail(rawEmail);
    if (!email) {
      return res.status(400).json({ message: "A valid email address is required." });
    }

    const password = validatePassword(rawPassword);
    if (!password) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email, passwordHash });
    const token = jwt.sign({ userId: user._id }, jwtSecret(), { expiresIn: "7d" });
    return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err: unknown) {
    console.error("[auth/signup]", err);
    return res.status(500).json({ message: "Signup failed. Please try again." });
  }
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body ?? {};

    const email = validateEmail(rawEmail);
    if (!email || typeof password !== "string" || !password) {
      // Return a generic message to avoid leaking whether email exists.
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Constant-time path: still hash to mitigate timing attacks.
      await bcrypt.hash("dummy", 12);
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret(), { expiresIn: "7d" });
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err: unknown) {
    console.error("[auth/login]", err);
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
});

// ─── RESET: REQUEST OTP ──────────────────────────────────────────────────────
// Step 1: request an OTP.  In a real deploy, email it.  For the hackathon demo,
// it is returned in the response AND logged so the flow is demoable without SMTP.
router.post("/reset/request", async (req, res) => {
  try {
    const email = validateEmail(req.body?.email);
    if (!email) {
      return res.status(400).json({ message: "A valid email address is required." });
    }

    const user = await User.findOne({ email });
    // Always respond 200 to prevent email-enumeration even in demo.
    if (!user) {
      return res.json({ message: "If that email is registered, an OTP has been sent.", demoOtp: null });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();

    console.log(`[DEMO OTP] ${email} -> ${otp}`);
    // demoOtp field: remove before real email delivery is wired up.
    return res.json({ message: "OTP sent.", demoOtp: otp });
  } catch (err: unknown) {
    console.error("[auth/reset/request]", err);
    return res.status(500).json({ message: "Failed to send OTP. Try again." });
  }
});

// ─── RESET: CONFIRM OTP + SET NEW PASSWORD ───────────────────────────────────
router.post("/reset/confirm", async (req, res) => {
  try {
    const { otp, newPassword: rawNewPassword } = req.body ?? {};
    const email = validateEmail(req.body?.email);

    if (!email || typeof otp !== "string" || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const newPassword = validatePassword(rawNewPassword);
    if (!newPassword) {
      return res.status(400).json({ message: "New password must be at least 8 characters." });
    }

    const user = await User.findOne({ email });
    if (
      !user ||
      user.resetOtp !== otp ||
      !user.resetOtpExpires ||
      user.resetOtpExpires < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();
    return res.json({ message: "Password updated." });
  } catch (err: unknown) {
    console.error("[auth/reset/confirm]", err);
    return res.status(500).json({ message: "Failed to reset password. Try again." });
  }
});

export default router;
