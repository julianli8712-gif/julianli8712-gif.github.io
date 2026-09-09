import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const drinksRouter = Router();

// GET /bar-api/drinks — list drinks with optional filters
drinksRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { type, subtype, search, status } = req.query;

    const where: any = {};
    if (type) where.type = String(type);
    if (subtype) where.subtype = String(subtype);
    if (status) where.status = String(status);
    else where.status = { not: "DELETED" };
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: "insensitive" } },
        { nameEn: { contains: String(search), mode: "insensitive" } },
        { region: { contains: String(search), mode: "insensitive" } },
        { producer: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const drinks = await prisma.drink.findMany({
      where,
      orderBy: [{ type: "asc" }, { subtype: "asc" }, { name: "asc" }],
    });

    res.json({ code: 0, data: drinks, message: "ok" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// GET /bar-api/drinks/:id — single drink with its pairings
drinksRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const drink = await prisma.drink.findUnique({
      where: { id: req.params.id },
      include: { foodPairings: { include: { food: true } } },
    });
    if (!drink) {
      return res.status(404).json({ code: 404, data: null, message: "Drink not found" });
    }
    res.json({ code: 0, data: drink, message: "ok" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// POST /bar-api/drinks — create (admin only)
drinksRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, nameEn, type, subtype, region, producer, vintage, abv, bottlePrice, glassPrice, description, tastingNote, flavorTags, imageUrl } = req.body;

    if (!name || !type) {
      return res.status(400).json({ code: 400, data: null, message: "name and type are required" });
    }

    const drink = await prisma.drink.create({
      data: {
        name,
        nameEn: nameEn || null,
        type,
        subtype: subtype || null,
        region: region || null,
        producer: producer || null,
        vintage: vintage || null,
        abv: abv ? Number(abv) : null,
        bottlePrice: bottlePrice ? Number(bottlePrice) : null,
        glassPrice: glassPrice ? Number(glassPrice) : null,
        description: description || null,
        tastingNote: tastingNote || null,
        flavorTags: flavorTags || [],
        imageUrl: imageUrl || null,
      },
    });

    res.status(201).json({ code: 0, data: drink, message: "created" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// PUT /bar-api/drinks/:id — update (admin only)
drinksRouter.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.drink.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ code: 404, data: null, message: "Drink not found" });
    }

    const { name, nameEn, type, subtype, region, producer, vintage, abv, bottlePrice, glassPrice, description, tastingNote, story, flavorTags, imageUrl, status } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (nameEn !== undefined) updateData.nameEn = nameEn;
    if (type !== undefined) updateData.type = type;
    if (subtype !== undefined) updateData.subtype = subtype;
    if (region !== undefined) updateData.region = region;
    if (producer !== undefined) updateData.producer = producer;
    if (vintage !== undefined) updateData.vintage = vintage;
    if (abv !== undefined) updateData.abv = Number(abv);
    if (bottlePrice !== undefined) updateData.bottlePrice = Number(bottlePrice);
    if (glassPrice !== undefined) updateData.glassPrice = Number(glassPrice);
    if (description !== undefined) updateData.description = description;
    if (tastingNote !== undefined) updateData.tastingNote = tastingNote;
    if (story !== undefined) updateData.story = story;
    if (flavorTags !== undefined) updateData.flavorTags = flavorTags;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (status !== undefined) updateData.status = status;

    const drink = await prisma.drink.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({ code: 0, data: drink, message: "updated" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// DELETE /bar-api/drinks/:id — soft delete (admin only)
drinksRouter.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const drink = await prisma.drink.update({
      where: { id: req.params.id },
      data: { status: "DELETED" },
    });
    res.json({ code: 0, data: drink, message: "deleted" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});
