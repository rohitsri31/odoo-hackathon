import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import warehouseRoutes from "./routes/warehouse.routes";
import operationRoutes from "./routes/operation.routes";
import dashboardRoutes from "./routes/dashboard.routes";

dotenv.config();

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
// Allowed origins: set CORS_ORIGIN env var to your deployed Vercel URL.
// Falls back to localhost for development.  Do NOT use '*' in production.
const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:8081")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl) or wildcard
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// ─── RATE LIMITING ───────────────────────────────────────────────────────────
// Auth endpoints are the highest brute-force risk.
// Threshold: 15 attempts per 15-minute window per IP — tight enough to block
// password sprayers, lenient enough for legitimate users fat-fingering a password.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please wait 15 minutes and try again." },
});

// General API rate-limit: 300 req/min — prevents scraping / runaway clients.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Slow down and try again." },
});

app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/operations", operationRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ─── 404 HANDLER ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────
// Logs full error server-side; returns only a generic message to the client
// so stack traces and internal details are never leaked.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("[StockSense Error]", message, err instanceof Error ? err.stack : "");
  // Only expose validation/business-logic messages (4xx); mask 5xx details.
  if (res.statusCode && res.statusCode >= 400 && res.statusCode < 500) {
    res.json({ message });
  } else {
    res.status(500).json({ message: "An unexpected error occurred. Please try again." });
  }
});

// ─── DATABASE + SERVER ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
const MONGO_URI =
  process.env.MONGO_URI ||
  (() => {
    // Hard-coded URI is a dev-only fallback — never commit to production.
    console.warn("MONGO_URI not set, falling back to localhost.");
    return "mongodb://localhost:27017/stocksense";
  })();

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`StockSense API running on :${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
