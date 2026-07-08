import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({
  apiKey: config.dashscopeApiKey,
  baseURL: config.aiBaseUrl,
});

interface RecommendInput {
  occasion: string;
  people?: number;
  budget?: string;
  preferences?: string[];
  allergies?: string[];
}

interface RecommendResult {
  cakeName: string;
  reason: string;
  pairingDrink: string;
  occasionFit: number; // 1-10
}

const SYSTEM_PROMPT = `你是一位在五星酒店工作了20年的行政糕点主厨。
客人正在为特殊场合选择蛋糕，你需要推荐合适的蛋糕。

铁律：
1. 场景优先：先理解客人为什么需要蛋糕，再推荐
2. 口味诚实：不推荐你自己不会做的组合
3. 搭配完整：每款推荐必须配饮品建议（茶/咖啡/香槟等）
4. 故事动人：推荐理由要有温度，不只说"好吃"
5. 预算尊重：不推荐明显超出预算的选择
6. 忌口绝对：如果客人提到过敏或忌口，绝对不能推荐含有该成分的蛋糕

你绝不能：
- 只推最贵的
- 使用空洞的形容词（"美味""好吃"）

请以JSON格式回复，包含一个数组，每个元素包含：
- cakeName: 蛋糕名称（中文）
- reason: 推荐理由（30-50字，有温度）
- pairingDrink: 推荐搭配的饮品
- occasionFit: 场景匹配度（1-10的数字）

只返回JSON数组，不要有其他文字。`;

export async function getAIRecommendation(
  input: RecommendInput,
  availableCakes: any[]
): Promise<RecommendResult[]> {
  // Build cake list text
  const cakeListText = availableCakes
    .map(
      (c) =>
        `- ${c.name}（${c.category}）| ¥${c.prices?.[0] || "?"} | ${c.description || ""} | 标签: ${c.tags?.map((t: any) => t.name).join(", ") || ""}`
    )
    .join("\n");

  const userPrompt = `客人场合：${input.occasion}
${input.people ? `人数：${input.people}人` : ""}
${input.budget ? `预算：${input.budget}` : ""}
${input.preferences?.length ? `偏好：${input.preferences.join("、")}` : ""}
${input.allergies?.length ? `忌口/过敏：${input.allergies.join("、")}` : ""}

可选蛋糕列表：
${cakeListText}

请推荐3款最适合的蛋糕。`;

  try {
    const response = await openai.chat.completions.create(
      {
        model: config.aiModel,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 600,
      },
      { timeout: 6000 }
    );

    const content = response.choices[0]?.message?.content?.trim() || "";
    // Parse JSON from response (strip markdown code blocks if any)
    const jsonStr = content.replace(/^```json?\s*/, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(jsonStr);

    if (Array.isArray(parsed)) {
      return parsed.slice(0, 3).map((item: any) => ({
        cakeName: item.cakeName,
        reason: item.reason,
        pairingDrink: item.pairingDrink || "",
        occasionFit: item.occasionFit || 7,
      }));
    }

    return [];
  } catch (err: any) {
    console.error("[qwen] AI recommendation failed:", err.message);
    throw err;
  }
}
