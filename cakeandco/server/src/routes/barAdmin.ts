import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { config } from "../config.js";

export const barAdminRouter = Router();

// Image upload setup
const storage = multer.diskStorage({
  destination: "/www/wwwroot/julianli/img/",
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `bar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// POST /bar-api/admin/upload — image upload
barAdminRouter.post("/upload", requireAuth, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, data: null, message: "No file uploaded" });
    }
    const url = `https://${config.domain}/img/${req.file.filename}`;
    res.json({ code: 0, data: { url, filename: req.file.filename }, message: "uploaded" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// GET /bar-api/admin/profile — get bar profile
barAdminRouter.get("/profile", async (_req: Request, res: Response) => {
  try {
    let profile = await prisma.barProfile.findFirst();
    if (!profile) {
      profile = await prisma.barProfile.create({
        data: { name: "My Bar", nameEn: "My Bar" },
      });
    }
    res.json({ code: 0, data: profile, message: "ok" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// PUT /bar-api/admin/profile — update bar profile
barAdminRouter.put("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    let profile = await prisma.barProfile.findFirst();
    if (!profile) {
      profile = await prisma.barProfile.create({ data: { name: "My Bar" } });
    }

    const { name, nameEn, description, logoUrl } = req.body;
    const updated = await prisma.barProfile.update({
      where: { id: profile.id },
      data: {
        name: name || profile.name,
        nameEn: nameEn !== undefined ? nameEn : profile.nameEn,
        description: description !== undefined ? description : profile.description,
        logoUrl: logoUrl !== undefined ? logoUrl : profile.logoUrl,
      },
    });
    res.json({ code: 0, data: updated, message: "updated" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// POST /bar-api/admin/import-drinks — import drinks from JSON array
barAdminRouter.post("/import-drinks", requireAuth, async (req: Request, res: Response) => {
  try {
    const { drinks } = req.body;
    if (!Array.isArray(drinks) || drinks.length === 0) {
      return res.status(400).json({ code: 400, data: null, message: "drinks must be a non-empty array" });
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const d of drinks) {
      if (!d.name || !d.type) {
        skipped++;
        errors.push(`Skipped item without name/type: ${JSON.stringify(d)}`);
        continue;
      }
      try {
        await prisma.drink.create({
          data: {
            name: d.name,
            nameEn: d.nameEn || null,
            type: d.type,
            subtype: d.subtype || null,
            region: d.region || null,
            producer: d.producer || null,
            vintage: d.vintage || null,
            abv: d.abv ? Number(d.abv) : null,
            bottlePrice: d.bottlePrice ? Number(d.bottlePrice) : null,
            glassPrice: d.glassPrice ? Number(d.glassPrice) : null,
            description: d.description || null,
            flavorTags: d.flavorTags || [],
          },
        });
        created++;
      } catch (e: any) {
        skipped++;
        errors.push(`${d.name}: ${e.message}`);
      }
    }

    res.json({ code: 0, data: { created, skipped, errors }, message: `Imported ${created}, skipped ${skipped}` });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// POST /bar-api/admin/import-foods — import foods from JSON array
barAdminRouter.post("/import-foods", requireAuth, async (req: Request, res: Response) => {
  try {
    const { foods } = req.body;
    if (!Array.isArray(foods) || foods.length === 0) {
      return res.status(400).json({ code: 400, data: null, message: "foods must be a non-empty array" });
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const f of foods) {
      if (!f.name) {
        skipped++;
        continue;
      }
      try {
        await prisma.foodItem.create({
          data: {
            name: f.name,
            nameEn: f.nameEn || null,
            category: f.category || null,
            description: f.description || null,
            flavorNote: f.flavorNote || null,
          },
        });
        created++;
      } catch (e: any) {
        skipped++;
        errors.push(`${f.name}: ${e.message}`);
      }
    }

    res.json({ code: 0, data: { created, skipped, errors }, message: `Imported ${created}, skipped ${skipped}` });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// POST /bar-api/admin/batch-status — batch toggle drink/food status
barAdminRouter.post("/batch-status", requireAuth, async (req: Request, res: Response) => {
  try {
    const { drinkIds, foodIds, status } = req.body;
    if (!status) {
      return res.status(400).json({ code: 400, data: null, message: "status is required" });
    }

    const results: any = { drinks: 0, foods: 0 };

    if (Array.isArray(drinkIds) && drinkIds.length > 0) {
      const r = await prisma.drink.updateMany({
        where: { id: { in: drinkIds } },
        data: { status },
      });
      results.drinks = r.count;
    }

    if (Array.isArray(foodIds) && foodIds.length > 0) {
      const r = await prisma.foodItem.updateMany({
        where: { id: { in: foodIds } },
        data: { status },
      });
      results.foods = r.count;
    }

    res.json({ code: 0, data: results, message: "updated" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});
