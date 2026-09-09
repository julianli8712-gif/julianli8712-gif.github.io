import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { generateDrinkStory } from "../services/barPairingService.js";

export const storyRouter = Router();

// AI rate limit: 10 req/min
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => (req.headers["x-real-ip"] as string) || req.ip || "unknown",
  message: { code: 429, data: null, message: "请求太频繁，请稍后再试" },
});

// POST /bar-api/stories/generate — generate story for a single drink
storyRouter.post("/generate", requireAuth, aiLimiter, async (req: Request, res: Response) => {
  try {
    const { drinkId, lang = "zh" } = req.body;

    if (!drinkId) {
      return res.status(400).json({ code: 400, data: null, message: "drinkId is required" });
    }

    const drink = await prisma.drink.findUnique({ where: { id: drinkId } });
    if (!drink) {
      return res.status(404).json({ code: 404, data: null, message: "Drink not found" });
    }

    let story: string;
    let tastingNote: string;

    try {
      const result = await generateDrinkStory({
        id: drink.id,
        name: drink.name,
        type: drink.type,
        subtype: drink.subtype,
        region: drink.region,
        vintage: drink.vintage,
        abv: drink.abv ? Number(drink.abv) : null,
        flavorTags: drink.flavorTags,
        description: drink.description,
        tastingNote: drink.tastingNote,
      }, lang);

      story = result.story;
      tastingNote = result.tastingNote;
    } catch (aiErr: any) {
      console.error("[stories] AI failed:", aiErr.message);
      story = `${drink.name}以其独特的${drink.region ? drink.region + "产区" : ""}风味征服每一位品鉴者。${drink.vintage ? drink.vintage + "年的自然恩赐，" : ""}让这款酒展现出${drink.flavorTags?.join("、") || "丰富"}的魅力。`;
      tastingNote = "";
    }

    // Save story to DB
    const updateData: any = { story };
    if (tastingNote) updateData.tastingNote = tastingNote;

    const updated = await prisma.drink.update({
      where: { id: drinkId },
      data: updateData,
    });

    res.json({ code: 0, data: updated, message: "story generated" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// POST /bar-api/stories/batch — generate stories for all drinks without one
storyRouter.post("/batch", requireAuth, aiLimiter, async (req: Request, res: Response) => {
  try {
    const { lang = "zh" } = req.body;

    // Find drinks without stories
    const drinks = await prisma.drink.findMany({
      where: { status: "ACTIVE", story: null },
      orderBy: { name: "asc" },
    });

    if (drinks.length === 0) {
      return res.json({ code: 0, data: { processed: 0, message: "All drinks already have stories" }, message: "ok" });
    }

    // Process sequentially to avoid burst throttling
    let processed = 0;
    const errors: string[] = [];

    for (const drink of drinks) {
      try {
        // Small delay between requests
        if (processed > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        const result = await generateDrinkStory({
          id: drink.id,
          name: drink.name,
          type: drink.type,
          subtype: drink.subtype,
          region: drink.region,
          vintage: drink.vintage,
          abv: drink.abv ? Number(drink.abv) : null,
          flavorTags: drink.flavorTags,
          description: drink.description,
          tastingNote: drink.tastingNote,
        }, lang);

        await prisma.drink.update({
          where: { id: drink.id },
          data: {
            story: result.story,
            tastingNote: result.tastingNote || drink.tastingNote,
          },
        });

        processed++;
      } catch (e: any) {
        errors.push(`${drink.name}: ${e.message}`);
      }
    }

    res.json({
      code: 0,
      data: { processed, total: drinks.length, errors },
      message: `Generated ${processed}/${drinks.length} stories`,
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});
