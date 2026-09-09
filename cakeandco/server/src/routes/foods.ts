import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const foodsRouter = Router();

// GET /bar-api/foods — list food items with optional filters
foodsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { category, search, status } = req.query;

    const where: any = {};
    if (category) where.category = String(category);
    if (status) where.status = String(status);
    else where.status = { not: "DELETED" };
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: "insensitive" } },
        { nameEn: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const foods = await prisma.foodItem.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    res.json({ code: 0, data: foods, message: "ok" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// GET /bar-api/foods/:id — single food item with its pairings
foodsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const food = await prisma.foodItem.findUnique({
      where: { id: req.params.id },
      include: { drinkPairings: { include: { drink: true } } },
    });
    if (!food) {
      return res.status(404).json({ code: 404, data: null, message: "Food item not found" });
    }
    res.json({ code: 0, data: food, message: "ok" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// POST /bar-api/foods — create (admin only)
foodsRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, nameEn, category, description, flavorNote, imageUrl } = req.body;

    if (!name) {
      return res.status(400).json({ code: 400, data: null, message: "name is required" });
    }

    const food = await prisma.foodItem.create({
      data: {
        name,
        nameEn: nameEn || null,
        category: category || null,
        description: description || null,
        flavorNote: flavorNote || null,
        imageUrl: imageUrl || null,
      },
    });

    res.status(201).json({ code: 0, data: food, message: "created" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// PUT /bar-api/foods/:id — update (admin only)
foodsRouter.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.foodItem.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ code: 404, data: null, message: "Food item not found" });
    }

    const { name, nameEn, category, description, flavorNote, story, imageUrl, status } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (nameEn !== undefined) updateData.nameEn = nameEn;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (flavorNote !== undefined) updateData.flavorNote = flavorNote;
    if (story !== undefined) updateData.story = story;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (status !== undefined) updateData.status = status;

    const food = await prisma.foodItem.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({ code: 0, data: food, message: "updated" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// DELETE /bar-api/foods/:id — soft delete (admin only)
foodsRouter.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    await prisma.foodItem.update({
      where: { id: req.params.id },
      data: { status: "DELETED" },
    });
    res.json({ code: 0, data: null, message: "deleted" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});
