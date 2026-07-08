import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const cakesRouter = Router();

// GET /cake-api/cakes — list cakes with optional filters
cakesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { stock_mode, occasion, flavor, category, search } = req.query;

    const where: any = { status: "ACTIVE" };

    if (stock_mode && (stock_mode === "GRAB" || stock_mode === "PREORDER")) {
      where.stockMode = stock_mode;
    }

    if (category) {
      where.category = category as string;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { nameEn: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    // Filter by tag
    if (occasion || flavor) {
      const tagNames = [...(occasion ? [occasion as string] : []), ...(flavor ? [flavor as string] : [])];
      where.tags = {
        some: {
          tag: {
            name: { in: tagNames },
          },
        },
      };
    }

    const cakes = await prisma.cake.findMany({
      where,
      include: {
        tags: {
          include: { tag: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = cakes.map((cake) => ({
      ...cake,
      tags: cake.tags.map((t) => ({ type: t.tag.type, name: t.tag.name, nameEn: t.tag.nameEn })),
      prices: cake.prices.map((p) => Number(p)),
    }));

    res.json({ code: 0, data: formatted, message: "ok" });
  } catch (err: any) {
    console.error("[cakes] list error:", err.message);
    res.status(500).json({ code: 500, data: null, message: "Failed to fetch cakes" });
  }
});

// GET /cake-api/cakes/:id
cakesRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const cake = await prisma.cake.findUnique({
      where: { id: req.params.id },
      include: { tags: { include: { tag: true } } },
    });

    if (!cake) {
      return res.status(404).json({ code: 404, data: null, message: "Cake not found" });
    }

    const formatted = {
      ...cake,
      tags: cake.tags.map((t) => ({ type: t.tag.type, name: t.tag.name, nameEn: t.tag.nameEn })),
      prices: cake.prices.map((p) => Number(p)),
    };

    res.json({ code: 0, data: formatted, message: "ok" });
  } catch (err: any) {
    console.error("[cakes] detail error:", err.message);
    res.status(500).json({ code: 500, data: null, message: "Failed to fetch cake" });
  }
});
