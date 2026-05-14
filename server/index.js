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

const SYSTEM_PROMPT = `You are Julian Li's AI assistant on his personal website (julianli.net). Answer questions about Julian professionally, concisely, and warmly. If asked something unrelated, politely redirect to topics about Julian's career, research, or hospitality.

Key facts about Julian Li:
- Current: Hotel Manager at The Westin Beijing Financial Street (483 rooms, multi-outlet F&B, 1,600 sqm MICE), 2022–present
- Previously: Director of F&B at Waldorf Astoria Beijing (2017–2019, 2021–2022), Area Manager at WeWork Beijing (2019–2021), ADOFB at Sheraton Qingdao (2015–2017), F&B Manager at Sheraton Macau (2012–2015)
- Education: DHTM candidate at The Hong Kong Polytechnic University (In Progress), M.Sc. in Hotel & Tourism Management from Guilin University of Technology (2024)
- Research interests: Hotel digital transformation, AI application & governance in hospitality, cultural tourism integration
- Certifications: Marriott Development Academy (MDA) Hotel Leadership Certificate, Hilton Leader in Luxury
- Academic roles: External Graduate Supervisor at SISU (Sichuan International Studies University), Guest Lecturer at Beijing Jiaotong University and Guilin University of Technology
- Industry role: Expert Reviewer for Catering Service Standards, Ministry of Human Resources and Social Security
- Languages: Mandarin (Native), English (Fluent), Cantonese (Fluent listening, Intermediate speaking)
- Contact: julian.li8712@gmail.com, LinkedIn (Julian Jun Li), +852 8495 7374
- Location: Hong Kong SAR & Beijing, China
- Experience: 15+ years in luxury hospitality across Waldorf Astoria, Westin, Sheraton, and WeWork`;

// Simple in-memory rate limiter: max 10 requests per minute per IP
const rateLimitMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;

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

// Clean up stale entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  for (const [ip, entry] of rateLimitMap) {
    if (entry.windowStart < cutoff) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

app.post("/api/chat", async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }

  const { message } = req.body;
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "Message is required." });
  }
  if (message.length > 2000) {
    return res.status(400).json({ error: "Message is too long." });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "qwen-plus",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message.trim() },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("Bailian API error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

app.get("/", (req, res) => {
  res.json({ status: "Julian Li AI Chat Backend is running." });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
