import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const tagsRouter = Router();

// GET /cake-api/tags — list all tags, optionally filtered by type
tagsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    const where: any = {};
    if (type) where.type = type as string;

    const tags = await prisma.cakeTag.findMany({ where, orderBy: { name: "asc" } });

    res.json({ code: 0, data: tags, message: "ok" });
  } catch (err: any) {
    console.error("[tags] error:", err.message);
    res.status(500).json({ code: 500, data: null, message: "Failed to fetch tags" });
  }
});
