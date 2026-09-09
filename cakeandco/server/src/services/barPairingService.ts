import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({
  apiKey: config.dashscopeApiKey,
  baseURL: config.aiBaseUrl,
});

export interface PairingInput {
  drinks: Array<{
    id: string;
    name: string;
    type: string;
    subtype?: string | null;
    region?: string | null;
    vintage?: string | null;
    abv?: number | null;
    flavorTags?: string[];
    description?: string | null;
    tastingNote?: string | null;
  }>;
  foods: Array<{
    id: string;
    name: string;
    category?: string | null;
    flavorNote?: string | null;
    description?: string | null;
  }>;
}

export interface PairingResult {
  drinkId: string;
  foodId: string;
  mode: string;
  reason: string;
  story: string;
  score: number;
}

const SYSTEM_PROMPT = `你是一位在亚洲50佳酒吧工作了15年的首席调酒师兼侍酒师。
你精通葡萄酒、烈酒、鸡尾酒和精酿啤酒，也深谙小食与酒的搭配艺术。

铁律：
1. 尊重风味层次：理解每款酒的风味结构，找到与之共鸣或形成精彩对比的食物
2. 故事驱动：每条搭配必须有一个动人的故事或典故——产区故事、酿造哲学、风味联想
3. 诚实推荐：不强行搭配明显不和谐的组合；如果某款酒不适合搭配任何现有食物，诚实说明
4. 三种搭配模式：
   - CLASSIC（经典搭配）：基于传统搭配法则，风味互补，稳健不出错。适合保守派客人。
   - BOLD（大胆搭配）：反传统，利用反差制造惊喜。酸度化解油腻、单宁碰撞辛辣、甜度对话咸鲜。
   - STORY（故事搭配）：以酒或食物的故事为主线，强调风土、人文、季节感。适合喜欢听故事的客人。

酒吧场景铁律：
- 这是酒吧，不是餐厅——搭配要配合饮酒节奏，食物是配角
- 烈酒（40%以上）配食需谨慎，优先考虑油脂丰富的食物来平衡灼烧感
- 鸡尾酒的搭配要考虑基酒风味和辅料
- 啤酒搭配更日常、更轻松

你绝不能：
- 使用"好喝""好吃"等空洞形容词
- 推荐你自己都不理解的组合
- 编造产区或历史事实
- 把葡萄酒的搭配规则生硬套用到清酒或烈酒上

请以JSON格式回复，只返回JSON数组，不要有任何其他文字。每个元素包含：
- drinkId: 酒款ID（必须从提供的酒款列表中选取）
- foodId: 餐食ID（必须从提供的餐食列表中选取）
- mode: "CLASSIC" | "BOLD" | "STORY"
- reason: 搭配理由，面向客人的描述（30-60字，有温度，有专业知识）
- story: 故事叙述（150-300字），要有画面感和情绪价值——这是酒吧体验的核心差异化能力
- score: 搭配评分（1-10的数字）`;

const STORY_SYSTEM_PROMPT = `你是一位在亚洲50佳酒吧工作了15年的首席调酒师兼侍酒师，同时也是一位获奖酒类作家。
你的文字功底让酒评人折服，你的故事让客人记住一款酒好几年。

你的任务是为一款酒撰写故事（150-300字）。

故事应该包含以下层次（至少覆盖3个）：
1. 风土/产区：这款酒来自哪里？那里的气候、土壤有什么特殊之处？
2. 酿造哲学：酿酒师/调酒师的理念是什么？有什么独到工艺？
3. 历史轶事：产区或酒庄有什么有趣的历史片段？
4. 风味旅程：从刚入口到余味，它给人怎样的感官旅程？
5. 情绪画面：这款酒让人联想到什么场景？秋天的果园？雨后的森林？海边的日落？

酒吧故事风格：
- 不背诵百科词条——要有情绪、有温度、有画面
- 不写说明书——不要罗列风味词汇
- 让客人觉得"这杯酒很特别"，而不是"这杯酒很贵"
- 适合打印在菜单上，体面但不矫情

你绝不能：
- 使用"好喝""美味""优质"等空洞形容词
- 复制粘贴百度百科
- 编造历史事实或造假年份数据
- 写成生硬的列条目式文字

请以JSON格式回复，只返回JSON对象，不要有任何其他文字：
- story: 故事（150-300字）
- tastingNote: 品鉴笔记（30-60字，一句话概括核心风味感受）`;

/**
 * Generate drink → food pairings
 */
export async function generateDrinkToFood(
  drink: PairingInput["drinks"][0],
  foods: PairingInput["foods"],
  mode: "CLASSIC" | "BOLD" | "STORY",
  lang = "zh"
): Promise<PairingResult[]> {
  return generatePairings(
    { drinks: [drink], foods },
    "drink_to_food",
    mode,
    lang
  );
}

/**
 * Generate food → drink pairings
 */
export async function generateFoodToDrink(
  food: PairingInput["foods"][0],
  drinks: PairingInput["drinks"],
  mode: "CLASSIC" | "BOLD" | "STORY",
  lang = "zh"
): Promise<PairingResult[]> {
  return generatePairings(
    { drinks, foods: [food] },
    "food_to_drink",
    mode,
    lang
  );
}

/**
 * Generate story for a single drink
 */
export async function generateDrinkStory(
  drink: PairingInput["drinks"][0],
  lang = "zh"
): Promise<{ story: string; tastingNote: string }> {
  const userPrompt = `请为以下酒款撰写故事：

酒款：${drink.name}
类型：${drink.type}${drink.subtype ? ` / ${drink.subtype}` : ""}
${drink.region ? `产区：${drink.region}` : ""}
${drink.vintage ? `年份：${drink.vintage}` : ""}
${drink.abv ? `酒精度：${drink.abv}%` : ""}
${drink.tastingNote ? `现有品鉴笔记：${drink.tastingNote}` : ""}
${drink.description ? `描述：${drink.description}` : ""}
${drink.flavorTags?.length ? `风味标签：${drink.flavorTags.join("、")}` : ""}

语言：${lang === "zh" ? "中文" : "English"}

请为这款酒创作一个有温度、有画面感的故事。`;

  const response = await callAI(STORY_SYSTEM_PROMPT, userPrompt, 0.7, 800);
  return parseStoryResponse(response);
}

// ─── Internal helpers ──────────────────────────────────

async function generatePairings(
  input: PairingInput,
  direction: "drink_to_food" | "food_to_drink",
  mode: "CLASSIC" | "BOLD" | "STORY",
  lang: string
): Promise<PairingResult[]> {
  const drinksText = input.drinks
    .map((d) => `  [${d.id}] ${d.name} | ${d.type}${d.subtype ? `/${d.subtype}` : ""} | ABV:${d.abv ?? "?"}%${d.flavorTags?.length ? ` | 风味:${d.flavorTags.join(",")}` : ""}${d.tastingNote ? ` | ${d.tastingNote}` : ""}`)
    .join("\n");

  const foodsText = input.foods
    .map((f) => `  [${f.id}] ${f.name}${f.category ? ` | ${f.category}` : ""}${f.flavorNote ? ` | ${f.flavorNote}` : ""}`)
    .join("\n");

  const directionPrompt = direction === "drink_to_food"
    ? `我有一款酒：\n${drinksText}\n\n请从以下餐食中选出3个最合适的搭配：\n${foodsText}`
    : `我有一道餐食：\n${foodsText}\n\n请从以下酒款中选出3杯最合适的搭配：\n${drinksText}`;

  const userPrompt = `${directionPrompt}

搭配模式：${mode}
语言：${lang === "zh" ? "中文" : "English"}

请给出 3 组搭配建议。`;

  const response = await callAI(SYSTEM_PROMPT, userPrompt, 0.5, 800);
  return parsePairingResponse(response, input.drinks, input.foods);
}

async function callAI(
  system: string,
  user: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const completion = await openai.chat.completions.create(
      {
        model: config.aiModel,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      },
      { signal: controller.signal }
    );

    return completion.choices[0]?.message?.content || "";
  } catch (err: any) {
    if (err.name === "AbortError") throw new Error("AI response timeout");
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function parsePairingResponse(
  text: string,
  drinks: PairingInput["drinks"],
  foods: PairingInput["foods"]
): PairingResult[] {
  // Strip markdown code fences
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  // Extract JSON array
  let results: any[];
  try {
    results = JSON.parse(cleaned);
    if (!Array.isArray(results)) {
      throw new Error("Not an array");
    }
  } catch {
    // Try to find array brackets
    const match = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) {
      try {
        results = JSON.parse(match[0]);
      } catch {
        return [];
      }
    } else {
      return [];
    }
  }

  const drinkIds = new Set(drinks.map((d) => d.id));
  const foodIds = new Set(foods.map((f) => f.id));

  return results
    .filter((r) => {
      // Must reference valid drink and food IDs
      return drinkIds.has(r.drinkId) && foodIds.has(r.foodId);
    })
    .map((r) => ({
      drinkId: r.drinkId,
      foodId: r.foodId,
      mode: r.mode || "CLASSIC",
      reason: r.reason || "",
      story: r.story || r.reason || "",
      score: Math.min(10, Math.max(1, r.score || 5)),
    }));
}

function parseStoryResponse(text: string): { story: string; tastingNote: string } {
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  try {
    const obj = JSON.parse(cleaned);
    return {
      story: obj.story || "",
      tastingNote: obj.tastingNote || "",
    };
  } catch {
    // Fallback: use the raw text as story
    return { story: cleaned.slice(0, 400), tastingNote: "" };
  }
}
