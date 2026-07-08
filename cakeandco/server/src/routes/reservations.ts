import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { sendNotification } from "../services/notify.js";

export const reservationsRouter = Router();

// POST /cake-api/reservations — create reservation
reservationsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const {
      cakeId, cakeName, size, quantity, totalPrice, accessories,
      guestName, guestPhone, pickupMethod, pickupTime, message,
      isAiCustom, aiPrompt, aiImageUrl, status: reqStatus,
    } = req.body;

    if (!guestName || !guestPhone || !pickupTime) {
      return res.status(400).json({ code: 400, data: null, message: "姓名、手机号、取货时间为必填" });
    }
    if (!/^\d{11}$/.test(guestPhone)) {
      return res.status(400).json({ code: 400, data: null, message: "请输入正确的11位手机号码" });
    }
    if (guestName.length > 50) {
      return res.status(400).json({ code: 400, data: null, message: "姓名过长" });
    }
    if (message && message.length > 500) {
      return res.status(400).json({ code: 400, data: null, message: "祝福语过长" });
    }
    // Validate pickup time is in the future
    const pickupDate = new Date(pickupTime);
    if (isNaN(pickupDate.getTime()) || pickupDate <= new Date()) {
      return res.status(400).json({ code: 400, data: null, message: "取货时间必须是未来时间" });
    }

    // Create without aiImageUrl (not in generated Prisma client yet)
    // then update with raw SQL
    const reservation = await prisma.reservation.create({
      data: {
        cakeId: cakeId || null,
        cakeName: cakeName || "未指定蛋糕",
        size: size || null,
        quantity: quantity || 1,
        totalPrice: totalPrice || null,
        accessories: accessories || [],
        guestName,
        guestPhone,
        pickupMethod: pickupMethod || "PICKUP",
        pickupTime: new Date(pickupTime),
        message: message || null,
        status: (reqStatus === "PENDING_AI") ? "PENDING_AI" : "PENDING",
        isAiCustom: isAiCustom === true,
        aiPrompt: aiPrompt || null,
      },
    });

    // Set aiImageUrl via raw SQL (prisma generate drops this field)
    if (aiImageUrl) {
      await prisma.$executeRawUnsafe(
        `UPDATE reservations SET ai_image_url = $1 WHERE id = $2::uuid`,
        aiImageUrl,
        reservation.id
      );
    }

    const sizeText = size ? ` ${size}` : "";
    const notifyMsg = `🆕 新预约\n${cakeName}${sizeText} × ${quantity}${totalPrice ? ` ¥${totalPrice}` : ""}\n客人：${guestName} ${guestPhone}\n取货：${new Date(pickupTime).toLocaleString("zh-CN")}\n${message ? `祝福语：${message}` : ""}`;
    sendNotification(notifyMsg);

    // Read back aiImageUrl from DB (raw SQL bypassed Prisma client)
    const rawRows = await prisma.$queryRawUnsafe<Array<{ ai_image_url: string | null }>>(
      `SELECT ai_image_url FROM reservations WHERE id = $1::uuid`,
      reservation.id
    );

    res.json({
      code: 0,
      data: {
        ...reservation,
        totalPrice: reservation.totalPrice != null ? Number(reservation.totalPrice) : null,
        aiImageUrl: rawRows?.[0]?.ai_image_url || aiImageUrl || null,
      },
      message: "预约已提交，酒店将电话确认",
    });
  } catch (err: any) {
    console.error("[reservations] create error:", err.message);
    res.status(500).json({ code: 500, data: null, message: "Failed to create reservation" });
  }
});

// GET /cake-api/reservations?phone=xxx — look up by phone
reservationsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ code: 400, data: null, message: "Phone number required" });
    }
    const reservations = await prisma.reservation.findMany({
      where: { guestPhone: phone as string },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    // Fetch aiImageUrl from raw query (Prisma drops this field)
    const allIds = reservations.map((r: any) => r.id);
    let aiUrlMap: Record<string, string | null> = {};
    if (allIds.length > 0) {
      const idList = allIds.map((_: string, i: number) => `$${i + 1}::uuid`).join(",");
      const rawRows = await prisma.$queryRawUnsafe<Array<{ id: string; ai_image_url: string | null }>>(
        `SELECT id, ai_image_url FROM reservations WHERE id IN (${idList})`,
        ...allIds
      );
      for (const row of rawRows) {
        aiUrlMap[row.id] = row.ai_image_url || null;
      }
    }

    const formatted = reservations.map((r: any) => ({
      ...r,
      totalPrice: r.totalPrice ? Number(r.totalPrice) : null,
      aiImageUrl: aiUrlMap[r.id] || null,
    }));
    res.json({ code: 0, data: formatted, message: "ok" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: "Failed to fetch reservations" });
  }
});

// GET /cake-api/reservations/:id
reservationsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!reservation) {
      return res.status(404).json({ code: 404, data: null, message: "Reservation not found" });
    }
    // Fetch aiImageUrl from raw DB (prisma generate drops this field)
    const rawRows = await prisma.$queryRawUnsafe<Array<{ ai_image_url: string | null }>>(
      `SELECT ai_image_url FROM reservations WHERE id = $1::uuid`,
      reservation.id
    );
    const aiImageUrl = rawRows?.[0]?.ai_image_url || null;

    res.json({
      code: 0,
      data: { ...reservation, totalPrice: reservation.totalPrice ? Number(reservation.totalPrice) : null, aiImageUrl },
      message: "ok",
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: "Failed to fetch reservation" });
  }
});

// PATCH /cake-api/reservations/:id — update (guest cancel)
reservationsRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!reservation) {
      return res.status(404).json({ code: 404, data: null, message: "Reservation not found" });
    }
    if (status === "CANCELLED" && reservation.status !== "PENDING") {
      return res.status(400).json({ code: 400, data: null, message: "只能取消待确认状态的订单" });
    }
    const updated = await prisma.reservation.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ code: 0, data: { ...updated, totalPrice: updated.totalPrice ? Number(updated.totalPrice) : null }, message: "ok" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: "Failed to update reservation" });
  }
});
