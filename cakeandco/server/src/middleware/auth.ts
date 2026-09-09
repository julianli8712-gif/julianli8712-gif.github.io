import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export interface AuthUser {
  id: string;
  username?: string;
  openid?: string;
  role: string;
}

// JWT auth middleware — if JWT_SECRET is set, use JWT; otherwise fall back to static key
export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  // Fallback: static key
  if (!config.jwtSecret) {
    const key = req.headers["x-admin-key"] as string;
    const adminKey = process.env.ADMIN_KEY;
    if (!adminKey) {
      return res.status(500).json({ code: 500, data: null, message: "Server not configured" });
    }
    if (key !== adminKey) {
      return res.status(401).json({ code: 401, data: null, message: "Unauthorized" });
    }
    (req as any).user = { id: "static", username: "admin", role: "ADMIN" };
    return next();
  }

  // JWT mode
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ code: 401, data: null, message: "请先登录" });
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, config.jwtSecret) as AuthUser;
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ code: 401, data: null, message: "登录已过期，请重新登录" });
  }
}

// Require ADMIN role
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as AuthUser;
  if (!user || user.role !== "ADMIN") {
    return res.status(403).json({ code: 403, data: null, message: "需要管理员权限" });
  }
  next();
}
