import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import { config } from "../config.js";
import { jwtAuth } from "../middleware/auth.js";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => (req.headers["x-real-ip"] as string) || req.ip || "unknown",
  message: { code: 429, data: null, message: "Too many login attempts" },
});

// POST /cake-api/auth/login
authRouter.post("/login", loginLimiter, async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, data: null, message: "用户名和密码为必填" });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ code: 401, data: null, message: "用户名或密码错误" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ code: 401, data: null, message: "用户名或密码错误" });
    }

    if (!config.jwtSecret) {
      return res.status(500).json({ code: 500, data: null, message: "JWT not configured" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: "24h" }
    );

    res.json({
      code: 0,
      data: {
        token,
        user: { id: user.id, username: user.username, role: user.role },
      },
      message: "ok",
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// GET /cake-api/auth/me
authRouter.get("/me", jwtAuth, async (req: Request, res: Response) => {
  const authUser = (req as any).user;
  if (authUser.id === "static") {
    return res.json({ code: 0, data: { user: authUser }, message: "ok" });
  }
  const user = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!user) return res.status(404).json({ code: 404, data: null, message: "User not found" });
  res.json({ code: 0, data: { user: { id: user.id, username: user.username, role: user.role } }, message: "ok" });
});
