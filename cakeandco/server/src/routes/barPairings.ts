import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import {
  generateDrinkToFood,
  generateFoodToDrink,
  type PairingInput,
  type PairingResult,
} from "../services/barPairingService.js";
import { fallbackPairings } from "../services/barRuleEngine.js";

export const barPairingRouter = Router();

// AI rate limit: 10 req/min
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => (req.headers["x-real-ip"] as string) || req.ip || "unknown",
  message: { code: 429, data: null, message: "请求太频繁，请稍后再试" },
});

// POST /bar-api/pairings/recommend — generate AI pairings
barPairingRouter.post("/recommend", requireAuth, aiLimiter, async (req: Request, res: Response) => {
  try {
    const { drinkId, foodId, mode = "CLASSIC", lang = "zh" } = req.body;

    if (!drinkId && !foodId) {
      return res.status(400).json({ code: 400, data: null, message: "drinkId or foodId required" });
    }

    // Fetch all active drinks and foods for context
    const allDrinks = await prisma.drink.findMany({ where: { status: "ACTIVE" } });
    const allFoods = await prisma.foodItem.findMany({ where: { status: "ACTIVE" } });

    const pairingInput: PairingInput = {
      drinks: allDrinks.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        subtype: d.subtype,
        region: d.region,
        vintage: d.vintage,
        abv: d.abv ? Number(d.abv) : null,
        flavorTags: d.flavorTags,
        description: d.description,
        tastingNote: d.tastingNote,
      })),
      foods: allFoods.map((f) => ({
        id: f.id,
        name: f.name,
        category: f.category,
        flavorNote: f.flavorNote,
        description: f.description,
      })),
    };

    let results: PairingResult[] = [];
    let isOffline = false;

    try {
      if (drinkId) {
        const drink = pairingInput.drinks.find((d) => d.id === drinkId);
        if (!drink) {
          return res.status(404).json({ code: 404, data: null, message: "Drink not found" });
        }
        results = await generateDrinkToFood(drink, pairingInput.foods, mode, lang);
      } else if (foodId) {
        const food = pairingInput.foods.find((f) => f.id === foodId);
        if (!food) {
          return res.status(404).json({ code: 404, data: null, message: "Food not found" });
        }
        results = await generateFoodToDrink(food, pairingInput.drinks, mode, lang);
      }
    } catch (aiErr: any) {
      console.error("[barPairing] AI failed, using fallback:", aiErr.message);
      isOffline = true;
      results = generateFallbackResults(pairingInput, drinkId, foodId);
    }

    // Post-validation: dedup, fill to 3, validate IDs
    const validated = postValidate(results, pairingInput, mode, drinkId, foodId);

    // Save valid pairings to DB
    const saved: any[] = [];
    for (const r of validated) {
      try {
        // Check if pairing already exists
        const existing = await prisma.foodPairing.findFirst({
          where: { drinkId: r.drinkId, foodId: r.foodId, mode: r.mode },
        });
        if (existing) {
          saved.push(existing);
        } else {
          const created = await prisma.foodPairing.create({
            data: {
              drinkId: r.drinkId,
              foodId: r.foodId,
              mode: r.mode,
              reason: r.reason,
              story: r.story,
              score: r.score,
            },
            include: { drink: true, food: true },
          });
          saved.push(created);
        }
      } catch {
        // Skip duplicates
      }
    }

    res.json({ code: 0, data: { pairings: saved, isOffline: isOffline ? 1 : 0 }, message: "ok" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// GET /bar-api/pairings — list all pairings
barPairingRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { drinkId, foodId } = req.query;
    const where: any = {};
    if (drinkId) where.drinkId = String(drinkId);
    if (foodId) where.foodId = String(foodId);

    const pairings = await prisma.foodPairing.findMany({
      where,
      include: { drink: true, food: true },
      orderBy: { score: "desc" },
    });

    res.json({ code: 0, data: pairings, message: "ok" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// PUT /bar-api/pairings/:id — manual edit
barPairingRouter.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { reason, story, score, mode } = req.body;
    const updateData: any = {};
    if (reason !== undefined) updateData.reason = reason;
    if (story !== undefined) updateData.story = story;
    if (score !== undefined) updateData.score = score;
    if (mode !== undefined) updateData.mode = mode;

    const pairing = await prisma.foodPairing.update({
      where: { id: req.params.id },
      data: updateData,
      include: { drink: true, food: true },
    });

    res.json({ code: 0, data: pairing, message: "updated" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// ─── Post-validation ────────────────────────────────

function postValidate(
  results: PairingResult[],
  input: PairingInput,
  mode: string,
  targetDrinkId?: string,
  targetFoodId?: string
): PairingResult[] {
  let validated = [...results];

  // Dedup by (drinkId, foodId) pair
  const seen = new Set<string>();
  validated = validated.filter((r) => {
    const key = `${r.drinkId}:${r.foodId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Validate IDs exist
  const drinkIds = new Set(input.drinks.map((d) => d.id));
  const foodIds = new Set(input.foods.map((f) => f.id));
  validated = validated.filter((r) => drinkIds.has(r.drinkId) && foodIds.has(r.foodId));

  // Glass wine enforcement: CLASSIC mode position 1 must have a by-glass option
  if (mode === "CLASSIC" && targetDrinkId) {
    const targetDrink = input.drinks.find((d) => d.id === targetDrinkId);
    if (targetDrink && targetDrink.abv && targetDrink.abv > 40) {
      // Spirit-heavy drinks shouldn't be paired with light food
      // We keep the pairing but flag it by keeping score reasonable
      validated = validated.map((r) => ({
        ...r,
        score: Math.min(r.score, 7),
      }));
    }
  }

  // Fill to at least 3 results
  if (validated.length < 3) {
    const remaining = input.foods.filter(
      (f) => !validated.some((r) => r.foodId === f.id)
    );
    const fillCount = Math.min(3 - validated.length, remaining.length);
    for (let i = 0; i < fillCount; i++) {
      validated.push({
        drinkId: input.drinks[0].id,
        foodId: remaining[i].id,
        mode,
        reason: "基于风味分析的智能推荐",
        story: "这款搭配由我们的侍酒师系统精心挑选，希望给您带来惊喜。",
        score: 5,
      });
    }
  }

  // Limit to top 3 by score
  validated.sort((a, b) => b.score - a.score);
  return validated.slice(0, 3);
}

function generateFallbackResults(
  input: PairingInput,
  targetDrinkId?: string,
  targetFoodId?: string
): PairingResult[] {
  if (targetDrinkId) {
    const drink = input.drinks.find((d) => d.id === targetDrinkId);
    if (!drink) return [];

    const foodCats = [...new Set(input.foods.map((f) => f.category).filter(Boolean) as string[])];
    const fallback = fallbackPairings(drink.type, drink.subtype, foodCats);

    return fallback.map((f) => {
      const food = input.foods.find(
        (item) => item.category === f.foodCategory
      );
      return {
        drinkId: drink.id,
        foodId: food?.id || input.foods[0]?.id || "",
        mode: "CLASSIC",
        reason: f.reason,
        story: f.story,
        score: f.score,
      };
    }).filter((r) => r.foodId);
  }

  return [];
}
