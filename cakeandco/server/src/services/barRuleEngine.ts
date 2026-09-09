// Fallback rule engine for bar pairings when AI is unavailable
// Declarative lookup: drink type × food category → recommended pairings

interface RulePairing {
  drinkType: string;
  drinkSubtype?: string;
  foodCategory: string;
  reason: string;
  story: string;
  score: number;
}

const RULES: RulePairing[] = [
  // ─── RED WINE ──────────────────────────────
  { drinkType: "WINE", drinkSubtype: "RED", foodCategory: "CHARCUTERIE", score: 9, reason: "红酒的单宁与腊味中的油脂完美交融，经典的欧陆搭配", story: "在法国，人们深信红葡萄酒和腊肉是上天注定的伴侣。单宁像一把温柔的小刀，切开油脂的厚重，释放出肉质的鲜香。" },
  { drinkType: "WINE", drinkSubtype: "RED", foodCategory: "CHEESE", score: 9, reason: "陈年奶酪的浓郁与红酒的骨架相辅相成", story: "意大利酒农的餐桌上，永远有一瓶红酒和一块陈年帕尔马干酪。时间赋予了它们相似的灵魂——深沉、复杂、耐人寻味。" },
  { drinkType: "WINE", drinkSubtype: "RED", foodCategory: "MAIN", score: 8, reason: "红肉主菜与红酒是餐桌上的经典对话", story: "当炭火烤制的牛排遇见赤霞珠，这对老友开始了又一次完美的重聚。" },
  { drinkType: "WINE", drinkSubtype: "RED", foodCategory: "SNACK", score: 6, reason: "红酒的丰富层次给简单零食增添仪式感", story: "即使只是一把坚果，配上一杯好红酒，也能让平凡的夜晚变得值得回味。" },

  // ─── WHITE WINE ─────────────────────────────
  { drinkType: "WINE", drinkSubtype: "WHITE", foodCategory: "SMALL_PLATE", score: 9, reason: "白酒的清爽酸度衬托小食的精致，不抢风头", story: "就像一位出色的配角，好白酒从不出风头，却让旁边的每一道菜都更出彩。" },
  { drinkType: "WINE", drinkSubtype: "WHITE", foodCategory: "SNACK", score: 8, reason: "轻盈的香气是休闲小食的完美搭档", story: "夏天的傍晚，一杯冰镇白葡萄酒和几片风干火腿，这就是南欧人生活的浪漫。" },
  { drinkType: "WINE", drinkSubtype: "WHITE", foodCategory: "CHEESE", score: 8, reason: "白葡萄酒与软质芝士相得益彰", story: "布里奶酪在舌尖化开时，霞多丽恰好递来一缕果香，像一首精巧的重奏。" },

  // ─── SPARKLING ───────────────────────────────
  { drinkType: "WINE", drinkSubtype: "SPARKLING", foodCategory: "SNACK", score: 9, reason: "气泡的欢快感让任何小食瞬间变得有节日氛围", story: "香槟的迷人之处不在于它是奢侈品，而在于打开瓶塞那一刻所有人都笑了。" },
  { drinkType: "WINE", drinkSubtype: "SPARKLING", foodCategory: "DESSERT", score: 7, reason: "甜型起泡酒与甜品相得益彰，干型则宜配轻食", story: "一杯莫斯卡托配一份提拉米苏，甜蜜但不腻——这是意大利人教导我们的生活哲学。" },
  { drinkType: "WINE", drinkSubtype: "SPARKLING", foodCategory: "SMALL_PLATE", score: 8, reason: "起泡酒的万能搭配力让它几乎横扫一切前菜", story: "专业的侍酒师常说：当你不知道选什么酒时，选香槟永远不会错。" },

  // ─── ROSE ────────────────────────────────────
  { drinkType: "WINE", drinkSubtype: "ROSE", foodCategory: "SMALL_PLATE", score: 8, reason: "桃红酒的果香与各式小食都相处融洽", story: "普罗旺斯的桃红是夏天的颜色——不沉重、不复杂，却总能在第一口就让人放松下来。" },
  { drinkType: "WINE", drinkSubtype: "ROSE", foodCategory: "SNACK", score: 7, reason: "桃红的亲和力让它成为佐酒人的好伙伴", story: "桃红是最不装腔作势的酒——它不适合收藏，只适合此刻。" },

  // ─── FORTIFIED ───────────────────────────────
  { drinkType: "WINE", drinkSubtype: "FORTIFIED", foodCategory: "DESSERT", score: 9, reason: "波特酒与巧克力甜品的搭配堪称天作之合", story: "葡萄牙人在杜罗河谷酿出波特酒，就是为了甜点时刻。黑巧克力的苦与波特酒的甜，在口腔中完成了最精妙的博弈。" },
  { drinkType: "WINE", drinkSubtype: "FORTIFIED", foodCategory: "CHEESE", score: 8, reason: "加强酒与蓝纹芝士碰撞出惊人风味", story: "英国人几百年来坚持用波特酒配斯蒂尔顿蓝芝士——这不是保守，这是真理。" },

  // ─── COCKTAIL ─────────────────────────────────
  { drinkType: "COCKTAIL", foodCategory: "SNACK", score: 8, reason: "鸡尾酒的多变性格适配休闲小食", story: "一杯尼格罗尼配一盘橄榄，就像米兰的黄昏——苦中带甜，耐人寻味。" },
  { drinkType: "COCKTAIL", foodCategory: "SMALL_PLATE", score: 7, reason: "好的鸡尾酒本身就是一场味觉之旅，小食应当轻巧陪衬", story: "调酒师常说：鸡尾酒是第一主角，食物是它最好的配角——不能抢戏，但要足够精彩。" },
  { drinkType: "COCKTAIL", foodCategory: "DESSERT", score: 7, reason: "甜型鸡尾酒与甜品的呼应让味蕾更满足", story: "一杯浓缩咖啡马天尼配一块焦糖布丁——咖啡遇见焦糖，命运让他们今天在此相遇。" },

  // ─── SPIRIT ──────────────────────────────────
  { drinkType: "SPIRIT", foodCategory: "CHARCUTERIE", score: 8, reason: "烈酒的灼烧感被腊味的油脂温柔化解", story: "在苏格兰高地，人们相信威士忌和烟熏鹿肉是上天赐给寒冷冬夜的礼物。" },
  { drinkType: "SPIRIT", foodCategory: "CHEESE", score: 7, reason: "烈酒与奶酪的组合考验味觉的宽度", story: "一杯单一麦芽威士忌和一块切达干酪——简单的背后，是对品质的极致追求。" },
  { drinkType: "SPIRIT", foodCategory: "SMALL_PLATE", score: 6, reason: "细心挑选的小食能够在烈酒的冲击后提供舒适的缓冲", story: "日本人在喝山崎时会配一块黑巧克力——不是为了解酒，是为了让下一口更精彩。" },

  // ─── BEER ────────────────────────────────────
  { drinkType: "BEER", foodCategory: "SNACK", score: 9, reason: "啤酒是休闲小食的最佳拍档", story: "没有什么比冰镇啤酒更适合炸物了——这是全人类达成的少数共识之一。" },
  { drinkType: "BEER", foodCategory: "CHARCUTERIE", score: 8, reason: "精酿啤酒的丰富层次与腊味相得益彰", story: "比利时人用修道院啤酒配熏火腿，那是他们对朴素生活的最高敬意。" },
  { drinkType: "BEER", foodCategory: "MAIN", score: 7, reason: "一杯好啤酒配一道主菜，满足感爆棚", story: "德国家宴的核心从来不是那道猪肘，而是旁边那杯新鲜啤酒。" },

  // ─── SAKE ────────────────────────────────────
  { drinkType: "SAKE", foodCategory: "SMALL_PLATE", score: 9, reason: "清酒的细腻风味与精致小食是天然的伴侣", story: "在京都，一杯纯米吟酿搭配季节菜，是日本人对「旬」最朴素的尊重。" },
  { drinkType: "SAKE", foodCategory: "SNACK", score: 7, reason: "清酒的温润让任何小食都多了一分雅致", story: "居酒屋的精神核心不是热闹，而是一杯可以让时间慢下来的好酒。" },
  { drinkType: "SAKE", foodCategory: "CHEESE", score: 6, reason: "清酒与芝士的跨文化对话，意外地合拍", story: "日本酒×奶酪——这是东京年轻人为打破传统制造的最美妙意外。" },
];

export function fallbackPairings(
  drinkType: string,
  drinkSubtype?: string | null,
  foodCategories: string[] = []
): Array<{ foodCategory: string; reason: string; story: string; score: number }> {
  // Filter rules by drink type/subtype
  let matches = RULES.filter((r) => {
    if (r.drinkType !== drinkType) return false;
    if (r.drinkSubtype && drinkSubtype && r.drinkSubtype !== drinkSubtype) return false;
    return true;
  });

  // If specific food categories given, prefer those
  if (foodCategories.length > 0) {
    const targeted = matches.filter((r) => foodCategories.includes(r.foodCategory));
    if (targeted.length > 0) matches = targeted;
  }

  // Sort by score desc, take top 3
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => ({
      foodCategory: r.foodCategory,
      reason: r.reason,
      story: r.story,
      score: r.score,
    }));
}
