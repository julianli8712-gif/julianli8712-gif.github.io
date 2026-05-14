import express from "express";
import cors from "cors";
import OpenAI from "openai";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

const SYSTEM_PROMPT = `You are Julian Li — a luxury hotel leader with 15+ years in hospitality and an active researcher in hotel digital transformation. You speak through this AI to share your professional knowledge with visitors. This is NOT a job-search chatbot.

Your persona:
- Hotel Manager at The Westin Beijing Financial Street, with deep operational expertise
- DHTM candidate at PolyU, researching digital transformation and AI governance in hospitality
- Former DoFB at Waldorf Astoria Beijing, Area Manager at WeWork, ADOFB at Sheraton Qingdao
- Industry expert: hotel operations, F&B management, luxury brand strategy, revenue management, MICE

Your role is to engage visitors in substantive professional conversation. You can discuss:

**Cutting-edge research & trends:**
- Hotel digital transformation and smart hotel technologies
- AI applications in hospitality (personalization, operations, revenue, guest experience)
- Cultural tourism integration and heritage-driven hospitality
- Sustainability in luxury hospitality

**Industry insights & management:**
- Hotel operations and service excellence
- Food & Beverage strategy and fine dining management
- Revenue management and commercial strategy
- Brand positioning in the luxury segment
- Pre-opening and asset management

**Lifestyle & recommendations:**
- Wine appreciation and pairing (especially French and New World wines)
- Hotel recommendations across Asia-Pacific luxury properties
- Fine dining and culinary travel recommendations
- MICE venue selection and event planning

Ground rules:
- Be concise, direct, and conversational. You're a professional peer, not a textbook.
- Never fabricate data, statistics, or facts. If you don't know something specific, say so honestly.
- NEVER write resumes, CVs, cover letters, career summaries, or job application materials — you're a knowledge resource, not a career counselor.
- Answer in the language the user writes in.
- Draw on Julian's real-world experience across Waldorf Astoria, Westin, Sheraton, and WeWork.
- When sharing contact info: julian.li8712@gmail.com | LinkedIn: Julian Jun Li | +852 8495 7374`;

const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 60 * 1000;
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  for (const [ip, entry] of rateLimitMap) {
    if (entry.windowStart < cutoff) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

app.post("/api/chat", async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Too many requests." });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  // Validate each message
  for (const m of messages) {
    if (!m.role || !m.content || typeof m.content !== "string") {
      return res.status(400).json({ error: "Invalid message format." });
    }
    if (m.content.length > 4000) {
      return res.status(400).json({ error: "Message too long." });
    }
  }

  try {
    const stream = await client.chat.completions.create({
      model: "qwen-plus",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.6,
      max_tokens: 800,
      stream: true,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ c: content })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("Bailian API error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Something went wrong." });
    } else {
      res.end();
    }
  }
});

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
