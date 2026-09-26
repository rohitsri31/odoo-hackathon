import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

const router = Router();
// Read at request time so dotenv configuration is available before signing tokens.
const jwtSecret = () => process.env.JWT_SECRET || "dev-secret";

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ message: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });
  const token = jwt.sign({ userId: user._id }, jwtSecret(), { expiresIn: "7d" });
  res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ userId: user._id }, jwtSecret(), { expiresIn: "7d" });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
});

// Step 1: request an OTP. In a real deploy, email it. For the hackathon demo, it's
// returned in the response AND logged to console so the flow is demoable without SMTP.
router.post("/reset/request", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user) return res.status(404).json({ message: "No account with that email" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetOtp = otp;
  user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await user.save();

  console.log(`[DEMO OTP] ${email} -> ${otp}`);
  res.json({ message: "OTP sent", demoOtp: otp }); // remove demoOtp before real deploy
});

// Step 2: verify OTP + set new password
router.post("/reset/confirm", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user || user.resetOtp !== otp || !user.resetOtpExpires || user.resetOtpExpires < new Date()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetOtp = undefined;
  user.resetOtpExpires = undefined;
  await user.save();
  res.json({ message: "Password updated" });
});

export default router;
