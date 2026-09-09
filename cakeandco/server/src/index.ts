import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config, isProd } from "./config.js";
import { cakesRouter } from "./routes/cakes.js";
import { recommendationsRouter } from "./routes/recommendations.js";
import { reservationsRouter } from "./routes/reservations.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { tagsRouter } from "./routes/tags.js";
import { wechatRouter } from "./routes/wechat.js";
import { drinksRouter } from "./routes/drinks.js";
import { foodsRouter } from "./routes/foods.js";
import { barPairingRouter } from "./routes/barPairings.js";
import { storyRouter } from "./routes/stories.js";
import { exportRouter } from "./routes/exports.js";
import { barAdminRouter } from "./routes/barAdmin.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "https://dashscope.aliyuncs.com"],
    },
  },
}));
app.use(cors({ origin: [`https://${config.domain}`, "http://localhost:5173"] }));

// Global rate limit
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.headers["x-real-ip"] as string) || req.ip || "unknown",
});
app.use(globalLimiter);

app.use(express.json({ limit: "5mb" }));

// Health check
app.get("/cake-api/health", (_req, res) => {
  res.json({ name: "Cake & Co. API", status: "ok", version: "1.0.0" });
});

app.get("/bar-api/health", (_req, res) => {
  res.json({ name: "Digital Sommelier API", status: "ok", version: "1.0.0" });
});

// Cake API routes
app.use("/cake-api/cakes", cakesRouter);
app.use("/cake-api/recommend", recommendationsRouter);
app.use("/cake-api/reservations", reservationsRouter);
app.use("/cake-api/auth", authRouter);
app.use("/cake-api/wechat", wechatRouter);
app.use("/cake-api/admin", adminRouter);
app.use("/cake-api/tags", tagsRouter);

// Bar API routes (Digital Sommelier)
app.use("/bar-api/drinks", drinksRouter);
app.use("/bar-api/foods", foodsRouter);
app.use("/bar-api/pairings", barPairingRouter);
app.use("/bar-api/stories", storyRouter);
app.use("/bar-api/exports", exportRouter);
app.use("/bar-api/admin", barAdminRouter);

// Error handler
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`🍰 Cake & Co. API running on port ${config.port}`);
  console.log(`   Mode: ${config.nodeEnv}`);
  console.log(`   Health: http://localhost:${config.port}/cake-api/health`);
});

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`\n[shutdown] Received ${signal}, closing...`);
  server.close();
  const { prisma } = await import("./lib/prisma.js");
  await prisma.$disconnect();
  console.log("[shutdown] Prisma disconnected. Bye!");
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

export default app;
