// Fallback rule engine when AI is unavailable
// Maps occasion tags → cake categories with simple reason templates

interface RuleResult {
  cakeName: string;
  reason: string;
}

const OCCASION_RULES: Record<string, string[]> = {
  "生日": ["mousse", "mille_crepe", "cheesecake"],
  "纪念日": ["mousse", "mille_crepe", "cheesecake"],
  "下午茶": ["pastry", "cake_roll", "puff", "cupcake", "slice"],
  "商务": ["cheesecake", "mousse"],
  "儿童": ["cupcake", "mille_crepe", "mousse"],
  "节日": ["mousse", "mille_crepe", "cheesecake"],
  "长辈": ["cheesecake", "mille_crepe"],
  "健康无负担": ["mini_cream", "mini_mousse", "whole_cream"],
};

const REASON_TEMPLATES: Record<string, string> = {
  "生日": "经典的庆祝之选，造型精致适合许愿时刻",
  "纪念日": "浪漫细腻的口感，为特别的日子增添甜蜜",
  "下午茶": "精致小巧，搭配茶或咖啡刚刚好",
  "商务": "优雅大气，适合商务场合的品味之选",
  "儿童": "色彩缤纷口感轻盈，小朋友的最爱",
  "节日": "节日氛围浓厚，分享欢乐的首选",
  "长辈": "口感醇厚不甜腻，长辈喜爱的经典风味",
  "健康无负担": "低糖轻卡，清新自然无负担",
};

export function ruleRecommend(occasion: string, availableCakes: any[], count = 3): RuleResult[] {
  const preferredCategories = OCCASION_RULES[occasion] || ["mousse", "cheesecake"];
  const reason = REASON_TEMPLATES[occasion] || "精心为您挑选";

  // Find cakes matching preferred categories
  const preferred = availableCakes.filter((cake) =>
    preferredCategories.includes(cake.category)
  );

  // Fill with other cakes if not enough
  const others = availableCakes.filter((cake) =>
    !preferredCategories.includes(cake.category)
  );

  const candidates = [...preferred, ...others].slice(0, count);

  return candidates.map((cake) => ({
    cakeName: cake.name,
    reason,
  }));
}
