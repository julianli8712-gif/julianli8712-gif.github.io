import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import https from "https";
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

// WeChat code2Session — exchange wx.login() code for openid + session_key
function wechatCode2Session(code: string): Promise<{
  openid: string;
  session_key: string;
  unionid?: string;
} | null> {
  return new Promise((resolve, reject) => {
    const url =
      `https://api.weixin.qq.com/sns/jscode2session?appid=${config.wechatAppId}&secret=${config.wechatAppSecret}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`;
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.errcode) {
              console.error("[wechat] code2Session error:", json);
              return resolve(null);
            }
            resolve({
              openid: json.openid,
              session_key: json.session_key,
              unionid: json.unionid,
            });
          } catch {
            resolve(null);
          }
        });
      })
      .on("error", (err) => {
        console.error("[wechat] code2Session request error:", err.message);
        reject(err);
      });
  });
}

// POST /cake-api/auth/wechat — WeChat Mini Program login
authRouter.post("/wechat", loginLimiter, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ code: 400, data: null, message: "code 为必填" });
    }

    if (!config.wechatAppId || !config.wechatAppSecret) {
      return res.status(500).json({ code: 500, data: null, message: "微信登录未配置" });
    }

    const session = await wechatCode2Session(code);
    if (!session) {
      return res.status(401).json({ code: 401, data: null, message: "微信登录失败，请重试" });
    }

    // Upsert customer_accounts via raw SQL (Prisma 6.19.3 Linux bug)
    const existing = await prisma.$queryRawUnsafe<Array<{ id: string; nickname: string; avatar_url: string | null }>>(
      `SELECT id, nickname, avatar_url FROM customer_accounts WHERE openid = $1 LIMIT 1`,
      session.openid
    );

    let customerId: string;
    if (existing.length > 0) {
      customerId = existing[0].id;
      // Update session_key on re-login
      await prisma.$executeRawUnsafe(
        `UPDATE customer_accounts SET session_key = $1, updated_at = now() WHERE id = $2::uuid`,
        session.session_key,
        customerId
      );
    } else {
      const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `INSERT INTO customer_accounts (openid, unionid, session_key) VALUES ($1, $2, $3) RETURNING id`,
        session.openid,
        session.unionid || null,
        session.session_key
      );
      customerId = rows[0].id;
    }

    if (!config.jwtSecret) {
      return res.status(500).json({ code: 500, data: null, message: "JWT not configured" });
    }

    const token = jwt.sign(
      { id: customerId, openid: session.openid, role: "GUEST" },
      config.jwtSecret,
      { expiresIn: "30d" }
    );

    res.json({
      code: 0,
      data: {
        token,
        user: {
          id: customerId,
          nickname: existing?.[0]?.nickname || null,
          avatarUrl: existing?.[0]?.avatar_url || null,
          role: "GUEST",
        },
      },
      message: "ok",
    });
  } catch (err: any) {
    console.error("[auth] wechat login error:", err.message);
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// POST /cake-api/auth/login
authRouter.post("/login", loginLimiter, async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, data: null, message: "用户名和密码为必填" });
    }

    // Prisma 6.19.3 Linux bug: User model dropped from generated client → raw SQL
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; username: string; password_hash: string; role: string }>>(
      `SELECT id, username, password_hash, role FROM staff_accounts WHERE username = $1 LIMIT 1`,
      username
    );
    const user = rows?.[0];
    if (!user) {
      return res.status(401).json({ code: 401, data: null, message: "用户名或密码错误" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
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

  // GUEST: look up in customer_accounts
  if (authUser.role === "GUEST") {
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; openid: string; nickname: string | null; avatar_url: string | null }>>(
      `SELECT id, openid, nickname, avatar_url FROM customer_accounts WHERE id = $1::uuid LIMIT 1`,
      authUser.id
    );
    const user = rows?.[0];
    if (!user) return res.status(404).json({ code: 404, data: null, message: "User not found" });
    return res.json({
      code: 0,
      data: {
        user: {
          id: user.id,
          nickname: user.nickname,
          avatarUrl: user.avatar_url,
          role: "GUEST",
        },
      },
      message: "ok",
    });
  }

  // Prisma 6.19.3 Linux bug: User model dropped → raw SQL
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; username: string; role: string }>>(
    `SELECT id, username, role FROM staff_accounts WHERE id = $1::uuid LIMIT 1`,
    authUser.id
  );
  const user = rows?.[0];
  if (!user) return res.status(404).json({ code: 404, data: null, message: "User not found" });
  res.json({ code: 0, data: { user: { id: user.id, username: user.username, role: user.role } }, message: "ok" });
});
