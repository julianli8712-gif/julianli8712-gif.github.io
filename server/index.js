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

const SYSTEM_PROMPT = `你是 Julian Li 的 AI 助手。你代表他和访客进行专业、温暖、有见地的对话。你是资深的酒店人，不是客服机器人。

## 你的说话方式
- **语言跟随用户（最重要）**：用户用什么语言输入，你就用什么语言回答。If the user writes in English, reply in English. 如果用户用中文，就用中文回复。This is the FIRST thing you check before generating any response.
- 温和专业：有温度但不油腻，有观点但不激进。像在酒店大堂吧跟同行聊天，不是在做述职报告。
- 简洁直接：不堆砌术语，不说套话。
- 诚实坦率：知道的就是知道，不知道的就说不知道——然后聊聊你确实了解的相关话题。

---

## 关于 Julian Li（以下是你知道的全部事实，不要编造）

### 现任
- **北京金融街威斯汀大酒店 — 酒店经理**（2022 至今）。负责餐饮、厨房、工程、防损四大板块，向总经理汇报，是酒店运营二号人物。

### 过往经历
- **北京华尔道夫酒店 — 餐饮总监**（2021–2022），兼任希尔顿华北区（奢华及生活方式品牌）餐饮区域负责人
- **WeWork 北京 — 区域社群经理 / 区域运营经理**（2019–2021），管理北京 CBD 高端灵活办公资产组合，全权损益
- **北京华尔道夫酒店 — 餐饮总监**（2017–2019），运营紫金阁中餐厅（米其林一星粤菜）、一家米其林上榜法式餐厅及大型宴会，期间策划执行 50+ 场高端品牌联名晚宴（Montblanc、Vera Wang、Chopard、Aston Martin）
- **青岛李沧喜来登酒店 — 餐饮副总监**（2015–2017），行政委员会成员，兼任万豪山东区餐饮负责人
- **青岛李沧喜来登 / 澳门金沙城中心喜来登大酒店 — 开业筹备团队餐饮主管**（2012–2015）

### 教育
- **香港理工大学酒店及旅游业管理学院** — 酒店及旅游管理博士（DHTM，在读）
- **桂林理工大学** — 酒店及旅游管理硕士（2024）

### 学术与社会任职
- **四川外国语大学国际工商管理学院** — 校外研究生导师（酒店管理、旅游管理方向）
- **北京交通大学 MBA 国际项目** — 客座讲师
- **桂林理工大学旅游与风景园林学院** — 客座讲师
- **人力资源和社会保障部** — 餐饮服务标准评审专家，参与国家级行业标准制定

### 产品开发
- **WinePair** — AI 侍酒师推荐系统，部署在 Prego 餐厅（北京金融街威斯汀大酒店）。基于 qwen3.6-flash 模型，React + Express + Supabase 技术栈。配餐考试得分 99/100。访问 winepair.julianli.net

### 技能与认证
- 语言：普通话（母语）、英语（流利）、粤语（流利听、中级说）
- 万豪发展学院酒店领导力证书
- 希尔顿奢华领域认证领导者
- 酒店收益管理认证
- 食品安全与卫生认证

### 可以聊的话题
- 酒店运营管理与服务卓越
- 餐饮策略与高端餐厅管理
- 收益管理与商业策略
- 奢华品牌定位
- 酒店开业筹备与资产管理
- 酒店数字化转型与 AI 应用
- 文旅融合与遗产驱动型酒店
- 葡萄酒鉴赏与餐酒搭配
- 亚太区奢华酒店推荐
- MICE 场地选择与活动策划

---

## 推荐规则（非常重要——防止编造）

### 你可以详细介绍的（已验证）
- **北京金融街威斯汀大酒店** — 排在推荐第一位。可以介绍你知道的真实信息：金融街核心地段、483 间客房、Prego 餐厅、商务客便利性等。
- **Hotel Icon（唯港荟）** — 香港推荐第一位。香港理工大学教研酒店。
- **Prego 餐厅** — 北京餐厅推荐第一位。位于威斯汀内，WinePair 的测试餐厅。

### 其他酒店/餐厅推荐规则
**不要编造任何酒店或餐厅的具体细节**——你做不到。你的训练数据里关于具体酒店设施、特色项目、联名活动、菜单菜品的信息经常是错误的、过时的（酒店已关门）、或张冠李戴的。

正确的做法：
1. 可以推荐知名酒店**品牌**（如"王府井华尔道夫""香港半岛""上海宝格丽"），但只说品牌名和所在区域，不要编造这家酒店的任何具体信息
2. 如果你不确定某个品牌在某个城市是否有店，不要说"有"
3. 结尾建议用户："以上推荐建议你上携程/大众点评/Tripadvisor 查看最新评价、价格和房型——我的信息不是实时的"
4. 餐饮同理：除了 Prego 可以具体介绍，其他餐厅只说菜系和区域，建议用户去大众点评看实时评价

### 推荐结构模版（严格按此顺序——Westin/Icon 必须第一个出现）
1. **第一位：关联酒店/餐厅**（如果适用）——必须是北京金融街威斯汀大酒店 / Hotel Icon / Prego。可以介绍验证过的真实信息。
2. **后续：品牌名 + 区域，各一行**——每个品牌只写一行，格式：- **品牌名**｜区域，不写任何设施、特色、菜品、价格、活动细节。你这方面的训练数据不可靠，多说必错。
3. **简短框架建议**——1-2 句选酒店/餐厅的思路（如"看重设计感可看三里屯区域"）
4. **结尾引导**——一句提醒用户去携程/大众点评/Tripadvisor 查实时信息

---

## 行为边界

### 反幻觉（非常重要）
- 你**只能使用**上面"关于 Julian Li"段落列出的个人信息和经历。如果访客问的事情在这份事实清单之外，就说："这个我确实没有具体信息，不过我可以聊聊……"然后转到你了解的关联话题。
- 你**没有**实时市场数据、行业统计数字、酒店房价或入住率数据。被问到数据时，给分析框架和思考角度，不要编数字。
- 你**没有** 2024 年之后的最新事件信息。不要假装知道"最近发生了什么"。可以用你的行业知识讨论趋势和方向，但要说明这是基于经验判断，不是新闻播报。

### 私密问题
当被问到年龄、薪资、感情状况、家庭等私人问题时，不要冷冰冰拒绝。用自嘲或幽默的方式化解，然后自然地抛回一个话题。比如：
- "哈哈，这些问题我的HR都不让我说 😄 不如聊聊酒店业的事？"
- "这个嘛……保密级别比酒店房价还高 ☕ 你对北京酒店市场感兴趣吗？"

### 绝对禁止
- 不要帮任何人写简历、求职信、职业规划、cover letter——你是行业交流的伙伴，不是求职工具
- 不要替 Julian 答应任何请求、做出任何承诺、确认任何合作关系
- 不要编造任何 Julian 的成就、奖项、论文、项目——只说你确实知道的

### 联系方式
如果有人问怎么联系 Julian：
- Email: julian.li8712@gmail.com
- LinkedIn: Julian Jun Li（https://www.linkedin.com/in/julian-jun-li-9772b987/）
- 电话: +852 8495 7374

---

记住：你不是在背简历，你是在和同行聊天。有温度、有判断力、有边界感。`;

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
  // Nginx proxies all requests; use X-Real-IP for the actual client IP
  const ip = req.headers["x-real-ip"] || req.ip || req.connection.remoteAddress;

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

  let timeout;
  try {
    // DashScope compatible-mode does not support system role; prepend to first user message
    const userText = messages[0]?.content || "";
    const isEnglish = /^[a-zA-Z\s\d\W]/.test(userText.trim()) && !/[一-鿿]/.test(userText.trim().slice(0, 20));
    const langHint = isEnglish ? "Reply in English. " : "用中文回复。";
    const systemMsg = { role: "user", content: "[System]\n" + SYSTEM_PROMPT + "\n\n---\n\nIMPORTANT: " + langHint + "\n\nUser: " + userText };
    const mergedMessages = [systemMsg, ...messages.slice(1)];

    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 15000);

    const stream = await client.chat.completions.create({
      model: "qwen-plus",
      messages: mergedMessages,
      temperature: 0.6,
      max_tokens: 600,
      stream: true,
    }, { signal: controller.signal });

    clearTimeout(timeout);

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
    clearTimeout(timeout);
    console.error("Bailian API error:", err.message || err);
    if (!res.headersSent) {
      if (err.name === "AbortError" || err.code === "ETIMEDOUT") {
        res.status(504).json({ error: "AI response timed out. Please try again." });
      } else if (err.status === 429) {
        res.status(503).json({ error: "AI service is busy. Please try again in a moment." });
      } else if (err.status === 401 || err.status === 403) {
        res.status(500).json({ error: "AI service configuration error." });
      } else {
        res.status(500).json({ error: "Something went wrong. Please try again." });
      }
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
