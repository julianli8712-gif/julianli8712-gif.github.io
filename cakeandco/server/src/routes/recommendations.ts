import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import { getAIRecommendation } from "../services/qwenService.js";
import { generateCakeImages } from "../services/qwenImageService.js";
import { ruleRecommend } from "../services/ruleEngine.js";
import { config } from "../config.js";

export const recommendationsRouter = Router();

// AI rate limit: 10 req/min
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => (req.headers["x-real-ip"] as string) || req.ip || "unknown",
  message: { code: 429, data: null, message: "请求太频繁，请稍后再试" },
});

// Stricter limit for image generation: 3 req/min
const imageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  keyGenerator: (req) => (req.headers["x-real-ip"] as string) || req.ip || "unknown",
  message: { code: 429, data: null, message: "AI 定制请求太频繁，请稍后再试" },
});

// POST /cake-api/recommend/occasion — AI scene recommendation
recommendationsRouter.post("/occasion", aiLimiter, async (req: Request, res: Response) => {
  try {
    const { occasion, people, budget, preferences, allergies } = req.body;

    if (!occasion) {
      return res.status(400).json({ code: 400, data: null, message: "请选择场景" });
    }

    // Get available cakes (preorder + grab)
    const availableCakes = await prisma.cake.findMany({
      where: { status: "ACTIVE" },
      include: { tags: { include: { tag: true } } },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    const formatted = availableCakes.map((cake) => ({
      ...cake,
      tags: cake.tags.map((t) => ({ type: t.tag.type, name: t.tag.name, nameEn: t.tag.nameEn })),
      prices: cake.prices.map((p) => Number(p)),
    }));

    let results: any[];
    let isOffline = false;

    try {
      const aiResults = await getAIRecommendation(
        { occasion, people, budget, preferences, allergies },
        formatted
      );

      // Match AI cake names to real cakes
      results = aiResults.map((r) => {
        const matched = formatted.find(
          (c) => c.name === r.cakeName || c.name.includes(r.cakeName) || r.cakeName.includes(c.name)
        );
        return {
          cake: matched || formatted[0],
          reason: r.reason,
          pairingDrink: r.pairingDrink,
          occasionFit: r.occasionFit,
        };
      });
    } catch {
      // Fallback to rule engine
      console.log("[recommend] AI failed, using rule engine");
      const ruleResults = ruleRecommend(occasion, formatted);
      results = ruleResults.map((r) => ({
        cake: formatted.find((c) => c.name === r.cakeName) || formatted[0],
        reason: r.reason,
        pairingDrink: "",
        occasionFit: 7,
      }));
      isOffline = true;
    }

    // Save recommendation record
    await prisma.recommendation.create({
      data: {
        direction: "OCCASION",
        sourceTags: [occasion, ...(preferences || []), ...(allergies || [])],
        results: results.map((r) => ({ cakeId: r.cake?.id, reason: r.reason })),
        isOffline,
      },
    });

    res.json({ code: 0, data: { results, isOffline }, message: "ok" });
  } catch (err: any) {
    console.error("[recommend] error:", err.message);
    res.status(500).json({ code: 500, data: null, message: "推荐失败，请重试" });
  }
});

// POST /cake-api/recommend/ai-image — AI image generation (Qwen-Image-2.0)
recommendationsRouter.post("/ai-image", imageLimiter, async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({ code: 400, data: null, message: "请描述您想要的蛋糕" });
    }
    if (prompt.length > 500) {
      return res.status(400).json({ code: 400, data: null, message: "描述内容过长，请控制在500字以内" });
    }

    const images = await generateCakeImages(prompt.trim(), 3);

    // Save recommendation record (skip if table schema mismatch)
    try {
      await prisma.recommendation.create({
        data: {
          direction: "AI_IMAGE",
          sourceTags: [prompt.trim()],
          results: images.map((img) => ({ url: img.url })),
          isOffline: false,
        },
      });
    } catch (dbErr: any) {
      console.warn("[ai-image] Failed to save recommendation record:", dbErr.message);
    }

    // Images are served via cakeandco.julianli.net server block (root /www/wwwroot/cakeandco)
    // Symlink: /www/wwwroot/cakeandco/img -> /www/wwwroot/julianli/img
    const publicImages = images.map((img) => ({
      ...img,
      url: img.url,  // /img/cakes/... — directly accessible via cakeandco.julianli.net/img/cakes/
    }));

    res.json({ code: 0, data: { images: publicImages }, message: "ok" });
  } catch (err: any) {
    console.error("[ai-image] error:", err.message);
    const msg = err.message?.includes("timeout") ? "图片生成超时，请重试" :
                err.message?.includes("generate") ? "图片生成失败，请重试" :
                "AI 暂时无法生成，请重试";
    res.status(500).json({ code: 500, data: null, message: msg });
  }
});
