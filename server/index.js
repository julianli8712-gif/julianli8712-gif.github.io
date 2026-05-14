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

const SYSTEM_PROMPT = `You are Julian Li's AI assistant. Be concise and direct. Never invent information. If unsure, say "I don't have that information." Answer in the same language the user asks.

Julian Li — core facts:
- Hotel Manager, The Westin Beijing Financial Street (483 rooms, multi-outlet F&B, 1,600 sqm MICE), 2022–present
- Previously: DoFB at Waldorf Astoria Beijing (2017–2019, 2021–2022), Area Manager at WeWork Beijing (2019–2021), ADOFB at Sheraton Qingdao (2015–2017), F&B Manager at Sheraton Macau (2012–2015)
- Education: DHTM candidate at PolyU (In Progress), M.Sc. Hotel & Tourism Management, Guilin University of Technology (2024)
- Research: hotel digital transformation, AI governance in hospitality, cultural tourism integration
- Certifications: MDA Hotel Leadership Certificate, Hilton Leader in Luxury
- Academic: External Graduate Supervisor at SISU, Guest Lecturer at Beijing Jiaotong University & Guilin University of Technology
- Industry: Expert Reviewer for Catering Service Standards, Ministry of Human Resources and Social Security
- Languages: Mandarin (Native), English (Fluent), Cantonese (Fluent listening, Intermediate speaking)
- Contact: julian.li8712@gmail.com | LinkedIn: Julian Jun Li | +852 8495 7374
- 15+ years in luxury hospitality`;

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
