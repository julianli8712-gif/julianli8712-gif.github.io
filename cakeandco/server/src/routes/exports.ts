import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const exportRouter = Router();

// POST /bar-api/exports/menu-insert — generate menu insert export record
exportRouter.post("/menu-insert", requireAuth, async (req: Request, res: Response) => {
  try {
    const { drinkIds, mode = "STORY", layout = "A4_2COL", title = "Wine Menu" } = req.body;

    if (!Array.isArray(drinkIds) || drinkIds.length === 0) {
      return res.status(400).json({ code: 400, data: null, message: "drinkIds is required" });
    }

    // Fetch drinks with pairings
    const drinks = await prisma.drink.findMany({
      where: { id: { in: drinkIds }, status: "ACTIVE" },
      include: {
        foodPairings: {
          where: { mode },
          include: { food: true },
          orderBy: { score: "desc" },
          take: 2,
        },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    // Build HTML content for the menu insert
    const html = buildMenuInsertHtml(drinks, mode, layout, title);

    // Save export record
    const exp = await prisma.barExport.create({
      data: {
        type: "MENU_INSERT",
        title,
        htmlContent: html,
      },
    });

    res.json({ code: 0, data: exp, message: "export created, ready for download" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// POST /bar-api/exports/table-card — generate table card
exportRouter.post("/table-card", requireAuth, async (req: Request, res: Response) => {
  try {
    const { drinkId, pairingId, title = "Today's Pairing" } = req.body;

    if (!drinkId) {
      return res.status(400).json({ code: 400, data: null, message: "drinkId is required" });
    }

    const drink = await prisma.drink.findUnique({
      where: { id: drinkId },
      include: {
        foodPairings: {
          include: { food: true },
          orderBy: { score: "desc" },
          take: 1,
        },
      },
    });

    if (!drink) {
      return res.status(404).json({ code: 404, data: null, message: "Drink not found" });
    }

    const html = buildTableCardHtml(drink, title);

    const exp = await prisma.barExport.create({
      data: {
        type: "TABLE_CARD",
        title,
        htmlContent: html,
      },
    });

    res.json({ code: 0, data: exp, message: "export created" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// GET /bar-api/exports — list all exports
exportRouter.get("/", requireAuth, async (_req: Request, res: Response) => {
  try {
    const exports_ = await prisma.barExport.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json({ code: 0, data: exports_, message: "ok" });
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// GET /bar-api/exports/:id — retrieve single export (for HTML preview or download)
exportRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const exp = await prisma.barExport.findUnique({ where: { id: req.params.id } });
    if (!exp) {
      return res.status(404).json({ code: 404, data: null, message: "Export not found" });
    }

    // Return as HTML preview
    res.type("html").send(exp.htmlContent);
  } catch (err: any) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
});

// ─── HTML Builders ────────────────────────────────────

function buildMenuInsertHtml(
  drinks: any[],
  mode: string,
  layout: string,
  title: string
): string {
  const cols = layout === "A4_3COL" ? 3 : 2;
  const items = drinks.map((d) => {
    const pairing = d.foodPairings?.[0];
    return `
      <div class="drink-card" style="
        break-inside: avoid;
        padding: 12px 14px;
        margin-bottom: 10px;
        border-bottom: 1px solid #d4c5b0;
      ">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <h3 style="margin: 0; font-size: 15px; color: #2d1810;">${d.name}</h3>
          <span style="font-size: 12px; color: #a67c3d; font-weight: bold;">
            ${d.glassPrice ? `¥${Number(d.glassPrice)}/杯` : ""}
            ${d.bottlePrice ? ` ¥${Number(d.bottlePrice)}/瓶` : ""}
          </span>
        </div>
        ${d.nameEn ? `<p style="margin: 2px 0 0 0; font-size: 11px; color: #888; font-style: italic;">${d.nameEn}</p>` : ""}
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b5545; line-height: 1.5;">
          ${d.tastingNote || d.description || ""}
        </p>
        ${mode !== "NAME_GLASS_PRICE" && d.story ? `
          <p style="margin: 6px 0 0 0; font-size: 11px; color: #555; line-height: 1.7; font-style: italic;">
            ${d.story.slice(0, 200)}${d.story.length > 200 ? "..." : ""}
          </p>
        ` : ""}
        ${mode === "PAIRING_SUGGESTION" && pairing ? `
          <p style="margin: 6px 0 0 0; font-size: 11px; color: #a67c3d;">
            🍷 ${pairing.food.name}: ${pairing.reason || pairing.story?.slice(0, 80) || ""}
          </p>
        ` : ""}
      </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: 'Noto Serif SC', 'Songti SC', serif;
      font-size: 12px;
      color: #2d1810;
      line-height: 1.6;
      margin: 0;
      padding: 0;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #c8a96e;
    }
    .header h1 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 28px;
      color: #c8a96e;
      margin: 0;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .header p {
      margin: 4px 0 0 0;
      font-size: 11px;
      color: #999;
    }
    .grid {
      column-count: ${cols};
      column-gap: 20px;
    }
    .drink-card:first-child { margin-top: 0; }
    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px solid #d4c5b0;
      font-size: 10px;
      color: #bbb;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>Digital Sommelier · 数字侍酒师</p>
  </div>
  <div class="grid">${items}</div>
  <div class="footer">Powered by Digital Sommelier · 建议使用 A4 纸张打印</div>
</body>
</html>`;
}

function buildTableCardHtml(drink: any, title: string): string {
  const pairing = drink.foodPairings?.[0];
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page { size: A5; margin: 10mm; }
    body {
      font-family: 'Noto Serif SC', 'Songti SC', serif;
      font-size: 13px;
      color: #2d1810;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      text-align: center;
      background: #fdf8f0;
    }
    .card {
      padding: 24px;
      max-width: 300px;
    }
    .card h1 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 32px;
      color: #c8a96e;
      margin: 0 0 4px 0;
    }
    .card h2 {
      font-size: 20px;
      margin: 0 0 8px 0;
      color: #2d1810;
    }
    .card .meta {
      font-size: 12px;
      color: #888;
      margin-bottom: 12px;
    }
    .card p {
      font-size: 13px;
      line-height: 1.8;
      color: #555;
      margin: 0 0 8px 0;
    }
    .card .pairing {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #d4c5b0;
      font-size: 12px;
      color: #a67c3d;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <h2>${drink.name}</h2>
    ${drink.region || drink.vintage ? `<div class="meta">${drink.region || ""} ${drink.vintage || ""}</div>` : ""}
    ${drink.tastingNote ? `<p>${drink.tastingNote}</p>` : ""}
    ${drink.story ? `<p>${drink.story}</p>` : ""}
    ${drink.glassPrice ? `<p style="color: #c8a96e; font-weight: bold;">¥${Number(drink.glassPrice)} / 杯</p>` : ""}
    ${pairing ? `<div class="pairing">🍷 主厨推荐搭配<br/>${pairing.food.name}: ${pairing.reason || ""}</div>` : ""}
  </div>
</body>
</html>`;
}
