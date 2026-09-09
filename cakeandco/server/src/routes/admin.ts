import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "path";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { sendNotification } from "../services/notify.js";
import { jwtAuth, requireAdmin } from "../middleware/auth.js";

export const adminRouter = Router();

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => (req.headers["x-real-ip"] as string) || req.ip || "unknown",
  message: { code: 429, data: null, message: "Too many requests" },
});

adminRouter.use(adminLimiter);
adminRouter.use(jwtAuth);

// Audit log helper
function audit(req: Request, action: string, detail: string) {
  const ip = (req.headers["x-real-ip"] as string) || req.ip || "?";
  console.log(`[audit] ${new Date().toISOString()} | ${ip} | ${action} | ${detail}`);
}

// Validation helpers
function validateCakeInput(body: any): string | null {
  if (!body.name || body.name.trim().length === 0) return "蛋糕名称为必填";
  if (body.name.length > 100) return "蛋糕名称过长";
  if (body.stockQty !== undefined && (isNaN(body.stockQty) || body.stockQty < 0)) return "库存数量无效";
  if (body.prices) {
    for (const p of body.prices) {
      if (isNaN(Number(p)) || Number(p) < 0) return `价格 "${p}" 无效`;
    }
  }
  return null;
}

// --- Image Upload ---
const UPLOAD_DIR = "/www/wwwroot/julianli/img/cakes";
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

adminRouter.post("/upload", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ code: 400, data: null, message: "No file uploaded" });
  }
  const url = `/img/cakes/${req.file.filename}`;
  audit(req, "UPLOAD", `File: ${req.file.originalname} -> ${url}`);
  res.json({ code: 0, data: { url }, message: "ok" });
});

// --- Cakes CRUD ---

adminRouter.get("/cakes", async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { nameEn: { contains: search as string, mode: "insensitive" } },
      ];
    }
    const cakes = await prisma.cake.findMany({
      where,
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: "desc" },
    });
    const formatted = cakes.map((c) => ({
      ...c,
      tags: c.tags.map((t) => ({ type: t.tag.type, name: t.tag.name, nameEn: t.tag.nameEn })),
      prices: c.prices.map((p) => Number(p)),
    }));
    res.json({ code: 0, data: formatted, message: "ok" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

adminRouter.post("/cakes", async (req: Request, res: Response) => {
  try {
    const err = validateCakeInput(req.body);
    if (err) return res.status(400).json({ code: 400, data: null, message: err });

    const { tags, ...data } = req.body;
    data.stockQty = data.stockQty || 0;
    const cake = await prisma.cake.create({ data });
    audit(req, "CREATE_CAKE", `${cake.name} (${cake.id.slice(0, 8)})`);

    if (tags && Array.isArray(tags)) {
      for (const tagInput of tags) {
        let tag = await prisma.cakeTag.findFirst({ where: { name: tagInput.name, type: tagInput.type } });
        if (!tag) tag = await prisma.cakeTag.create({ data: { name: tagInput.name, type: tagInput.type, nameEn: tagInput.nameEn || null } });
        await prisma.cakeTagRelation.create({ data: { cakeId: cake.id, tagId: tag.id } });
      }
    }
    res.json({ code: 0, data: cake, message: "Cake created" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

adminRouter.put("/cakes/:id", async (req: Request, res: Response) => {
  try {
    const err = validateCakeInput(req.body);
    if (err) return res.status(400).json({ code: 400, data: null, message: err });

    const existing = await prisma.cake.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ code: 404, data: null, message: "Cake not found" });

    const { tags, ...data } = req.body;
    const cake = await prisma.cake.update({ where: { id: req.params.id }, data });
    audit(req, "UPDATE_CAKE", `${cake.name} (${cake.id.slice(0, 8)})`);

    if (tags && Array.isArray(tags)) {
      await prisma.cakeTagRelation.deleteMany({ where: { cakeId: cake.id } });
      for (const tagInput of tags) {
        let tag = await prisma.cakeTag.findFirst({ where: { name: tagInput.name, type: tagInput.type } });
        if (!tag) tag = await prisma.cakeTag.create({ data: { name: tagInput.name, type: tagInput.type, nameEn: tagInput.nameEn || null } });
        await prisma.cakeTagRelation.create({ data: { cakeId: cake.id, tagId: tag.id } });
      }
    }
    res.json({ code: 0, data: cake, message: "Cake updated" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

adminRouter.delete("/cakes/:id", async (req: Request, res: Response) => {
  try {
    const existing = await prisma.cake.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ code: 404, data: null, message: "Cake not found" });

    const newStatus = existing.status === "DISCONTINUED" ? "ACTIVE" : "DISCONTINUED";
    await prisma.cake.update({ where: { id: req.params.id }, data: { status: newStatus } });
    audit(req, newStatus === "DISCONTINUED" ? "DISCONTINUE_CAKE" : "REACTIVATE_CAKE", `${existing.name} (${req.params.id.slice(0, 8)})`);
    res.json({ code: 0, data: { status: newStatus }, message: newStatus === "DISCONTINUED" ? "已下架" : "已上架" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// --- Reservations ---

adminRouter.get("/reservations", async (req: Request, res: Response) => {
  try {
    const { status, start, end, date: queryDate, sort } = req.query;
    const where: any = {};
    if (status) where.status = status;

    // "today" filter — shortcuts to pickupTime within current day
    if (queryDate === "today") {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      where.pickupTime = { gte: startOfDay, lte: endOfDay };
    } else if (start || end) {
      where.pickupTime = {};
      if (start) where.pickupTime.gte = new Date(start as string);
      if (end) where.pickupTime.lte = new Date(end as string);
    }

    // Sort: default pickup_asc so nearest pickup first
    const sortParam = (sort as string) || "pickup_asc";
    const orderByMap: Record<string, any> = {
      pickup_asc: { pickupTime: "asc" },
      pickup_desc: { pickupTime: "desc" },
      created_desc: { createdAt: "desc" },
    };
    const orderBy = orderByMap[sortParam] || orderByMap.pickup_asc;

    const reservations = await prisma.reservation.findMany({
      where,
      orderBy,
      take: 100,
    });
    const formatted = reservations.map((r) => ({ ...r, totalPrice: r.totalPrice ? Number(r.totalPrice) : null }));
    res.json({ code: 0, data: formatted, message: "ok" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

adminRouter.patch("/reservations/:id/status", async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ["PENDING", "PENDING_AI", "CONFIRMED", "MAKING", "READY", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ code: 400, data: null, message: "Invalid status" });
    }

    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!reservation) return res.status(404).json({ code: 404, data: null, message: "Reservation not found" });

    // State machine enforcement
    const allowed: Record<string, string[]> = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      PENDING_AI: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["MAKING", "CANCELLED"],
      MAKING: ["READY", "CANCELLED"],
      READY: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };
    if (!allowed[reservation.status]?.includes(status)) {
      return res.status(400).json({ code: 400, data: null, message: `不能从 ${reservation.status} 变更为 ${status}` });
    }

    const updated = await prisma.reservation.update({ where: { id: req.params.id }, data: { status } });
    audit(req, "UPDATE_RESERVATION", `${reservation.cakeName} #${req.params.id.slice(0, 8)} ${reservation.status}->${status}`);

    // Push notification to WeCom bot
    const emojiMap: Record<string, string> = {
      CONFIRMED: "✅", MAKING: "🔪", READY: "📦", COMPLETED: "🏁", CANCELLED: "❌",
    };
    const labelMap: Record<string, string> = {
      CONFIRMED: "已确认", MAKING: "制作中", READY: "待取货", COMPLETED: "已完成", CANCELLED: "已取消",
    };
    const sizeText = reservation.size ? ` ${reservation.size}` : "";
    sendNotification(
      `${emojiMap[status] || "📌"} 订单状态更新 · ${labelMap[status] || status}\n${reservation.cakeName}${sizeText} × ${reservation.quantity}\n客人：${reservation.guestName} ${reservation.guestPhone}\n取货：${new Date(reservation.pickupTime).toLocaleString("zh-CN")}\n${reservation.status} → ${status}`
    );

    res.json({ code: 0, data: { ...updated, totalPrice: updated.totalPrice ? Number(updated.totalPrice) : null }, message: "Status updated" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// --- Tags ---
adminRouter.get("/tags", async (_req: Request, res: Response) => {
  const tags = await prisma.cakeTag.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] });
  res.json({ code: 0, data: tags, message: "ok" });
});

// --- Users (ADMIN only) ---
// Prisma 6.19.3 Linux bug: User model dropped → all queries use raw SQL
adminRouter.get("/users", requireAdmin, async (_req: Request, res: Response) => {
  const users = await prisma.$queryRawUnsafe<Array<{ id: string; username: string; role: string; created_at: string }>>(
    `SELECT id, username, role, created_at FROM staff_accounts ORDER BY created_at DESC`
  );
  const formatted = users.map((u: any) => ({ id: u.id, username: u.username, role: u.role, createdAt: u.created_at }));
  res.json({ code: 0, data: formatted, message: "ok" });
});

adminRouter.post("/users", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ code: 400, data: null, message: "用户名和密码为必填" });
    if (username.length < 2 || username.length > 30) return res.status(400).json({ code: 400, data: null, message: "用户名长度2-30位" });
    if (password.length < 6) return res.status(400).json({ code: 400, data: null, message: "密码至少6位" });

    const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM staff_accounts WHERE username = $1 LIMIT 1`, username
    );
    if (existing.length > 0) return res.status(400).json({ code: 400, data: null, message: "用户名已存在" });

    const passwordHash = await bcrypt.hash(password, 10);
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; username: string; role: string; created_at: string }>>(
      `INSERT INTO staff_accounts (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at`,
      username, passwordHash, role || "STAFF"
    );
    const user = rows[0];
    audit(req, "CREATE_USER", `${username} (${user.id.slice(0, 8)})`);
    res.json({ code: 0, data: { id: user.id, username: user.username, role: user.role, createdAt: user.created_at }, message: "ok" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

adminRouter.put("/users/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { role, password } = req.body;
    const authUser = (req as any).user;
    if (req.params.id === authUser.id && role && role !== authUser.role) {
      return res.status(400).json({ code: 400, data: null, message: "不能修改自己的角色" });
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    if (role) { setClauses.push(`role = $${values.length + 1}`); values.push(role); }
    if (password) {
      if (password.length < 6) return res.status(400).json({ code: 400, data: null, message: "密码至少6位" });
      const passwordHash = await bcrypt.hash(password, 10);
      setClauses.push(`password_hash = $${values.length + 1}`);
      values.push(passwordHash);
    }
    if (setClauses.length === 0) return res.status(400).json({ code: 400, data: null, message: "无更新内容" });

    values.push(req.params.id);
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; username: string; role: string; created_at: string }>>(
      `UPDATE staff_accounts SET ${setClauses.join(", ")} WHERE id = $${values.length}::uuid RETURNING id, username, role, created_at`,
      ...values
    );
    const user = rows[0];
    audit(req, "UPDATE_USER", `${user.username} (${req.params.id.slice(0, 8)})`);
    res.json({ code: 0, data: { id: user.id, username: user.username, role: user.role, createdAt: user.created_at }, message: "ok" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

adminRouter.delete("/users/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    if (req.params.id === authUser.id) {
      return res.status(400).json({ code: 400, data: null, message: "不能删除自己" });
    }

    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; username: string; role: string }>>(
      `SELECT id, username, role FROM staff_accounts WHERE id = $1::uuid LIMIT 1`, req.params.id
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ code: 404, data: null, message: "User not found" });

    if (user.role === "ADMIN") {
      const countRows = await prisma.$queryRawUnsafe<Array<{ cnt: string }>>(
        `SELECT COUNT(*)::text AS cnt FROM staff_accounts WHERE role = 'ADMIN'`
      );
      const adminCount = parseInt(countRows[0].cnt, 10);
      if (adminCount <= 1) return res.status(400).json({ code: 400, data: null, message: "不能删除最后一个管理员" });
    }

    await prisma.$executeRawUnsafe(`DELETE FROM staff_accounts WHERE id = $1::uuid`, req.params.id);
    audit(req, "DELETE_USER", `${user.username} (${req.params.id.slice(0, 8)})`);
    res.json({ code: 0, data: null, message: "User deleted" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});
