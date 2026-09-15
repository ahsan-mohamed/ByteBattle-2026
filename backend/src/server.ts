import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import session from "express-session";
import rateLimit from "express-rate-limit";

import participantRoutes from "./routes/participantRoutes";
import adminRoutes from "./routes/adminRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { ensureUniqueIdSequence } from "./utils/uniqueId";
import { bootstrapAdmin } from "./services/adminBootstrap";
import { prisma } from "./utils/prisma";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// NOTE: express-session's default MemoryStore is fine for a single-instance
// deploy (typical for a single symposium event) but does not share sessions
// across multiple server instances. If you scale the backend horizontally,
// swap in a shared store (e.g. connect-pg-simple against the same Postgres DB).
app.use(
  session({
    secret: process.env.SESSION_SECRET || "insecure-dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // Frontend (Vercel) and backend (Render/Railway) live on different
      // domains in production, so the admin session cookie must be sent
      // cross-site - that requires sameSite "none" + secure:true (browsers
      // reject "none" without secure). Locally, both run on localhost so
      // "lax" is fine and doesn't require HTTPS.
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 8 * 60 * 60 * 1000, // 8 hour admin session
    },
  })
);

// General rate limit; the admin routes (added in part 2) get a stricter one.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api", participantRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function main() {
  await ensureUniqueIdSequence();
  await bootstrapAdmin();
  app.listen(PORT, () => {
    console.log(`ByteBattle backend listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
