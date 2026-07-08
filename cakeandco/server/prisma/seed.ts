import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Cake & Co. database...");

  // Create tags
  const occasionTags = [
    { type: "occasion", name: "生日", nameEn: "Birthday" },
    { type: "occasion", name: "纪念日", nameEn: "Anniversary" },
    { type: "occasion", name: "下午茶", nameEn: "Afternoon Tea" },
    { type: "occasion", name: "商务", nameEn: "Business" },
    { type: "occasion", name: "儿童", nameEn: "Kids" },
    { type: "occasion", name: "节日", nameEn: "Festival" },
    { type: "occasion", name: "长辈", nameEn: "Elders" },
  ];

  const flavorTags = [
    { type: "flavor", name: "水果", nameEn: "Fruity" },
    { type: "flavor", name: "巧克力", nameEn: "Chocolate" },
    { type: "flavor", name: "抹茶", nameEn: "Matcha" },
    { type: "flavor", name: "咖啡", nameEn: "Coffee" },
    { type: "flavor", name: "坚果", nameEn: "Nutty" },
    { type: "flavor", name: "花香", nameEn: "Floral" },
    { type: "flavor", name: "酸奶", nameEn: "Yogurt" },
    { type: "flavor", name: "低糖", nameEn: "Low Sugar" },
  ];

  const allTags = [...occasionTags, ...flavorTags];
  const createdTags: Record<string, any> = {};

  // Delete existing tags first
  await prisma.cakeTagRelation.deleteMany();
  await prisma.cakeTag.deleteMany();

  for (const tag of allTags) {
    const created = await prisma.cakeTag.create({ data: tag });
    createdTags[`${tag.type}:${tag.name}`] = created;
  }

  console.log(`  ✅ ${allTags.length} tags created`);

  // Create sample cakes
  const cakes = [
    // GRAB (~15)
    { name: "杏仁可颂", category: "pastry", stockMode: "GRAB", prices: ["28"], sizes: ["标准"], stockQty: 12, description: "法式黄油可颂，表面撒满杏仁片" },
    { name: "巧克力丹麦", category: "pastry", stockMode: "GRAB", prices: ["32"], sizes: ["标准"], stockQty: 8, description: "酥脆丹麦面团包裹比利时黑巧克力" },
    { name: "抹茶瑞士卷", category: "cake_roll", stockMode: "GRAB", prices: ["38"], sizes: ["整条"], stockQty: 5, description: "日本宇治抹茶奶油卷，轻盈细腻" },
    { name: "提拉米苏卷", category: "cake_roll", stockMode: "GRAB", prices: ["42"], sizes: ["整条"], stockQty: 4, description: "咖啡浸泡手指饼干，马斯卡彭奶油" },
    { name: "红丝绒杯子蛋糕", category: "cupcake", stockMode: "GRAB", prices: ["28"], sizes: ["标准"], stockQty: 15, description: "经典红丝绒配奶油芝士霜" },
    { name: "海盐焦糖杯子蛋糕", category: "cupcake", stockMode: "GRAB", prices: ["32"], sizes: ["标准"], stockQty: 10, description: "焦糖奶油配海盐颗粒，甜咸交织" },
    { name: "法式水果挞", category: "puff", stockMode: "GRAB", prices: ["38"], sizes: ["标准"], stockQty: 6, description: "酥脆挞壳配卡仕达酱和新鲜水果" },
    { name: "闪电泡芙", category: "puff", stockMode: "GRAB", prices: ["28"], sizes: ["标准"], stockQty: 10, description: "巧克力淋面泡芙，内馅轻盈" },
    { name: "纽约芝士切片", category: "slice", stockMode: "GRAB", prices: ["38"], sizes: ["切片"], stockQty: 8, description: "经典纽约芝士蛋糕，绵密醇厚" },
    { name: "巧克力布朗尼切片", category: "slice", stockMode: "GRAB", prices: ["35"], sizes: ["切片"], stockQty: 6, description: "浓郁黑巧布朗尼，外酥内软" },
    // PREORDER (~25)
    { name: "草莓鲜奶蛋糕", category: "mousse", stockMode: "PREORDER", prices: ["288", "388", "588"], sizes: ["6寸", "8寸", "10寸"], leadTimeHours: 24, description: "新鲜草莓搭配轻盈奶油，经典之选" },
    { name: "芒果慕斯蛋糕", category: "mousse", stockMode: "PREORDER", prices: ["328", "428", "628"], sizes: ["6寸", "8寸", "10寸"], leadTimeHours: 24, description: "热带芒果慕斯配百香果淋面" },
    { name: "百香果慕斯", category: "mousse", stockMode: "PREORDER", prices: ["328", "428"], sizes: ["6寸", "8寸"], leadTimeHours: 24, description: "酸甜百香果慕斯，清爽夏日" },
    { name: "经典巧克力慕斯", category: "mousse", stockMode: "PREORDER", prices: ["328", "428", "628"], sizes: ["6寸", "8寸", "10寸"], leadTimeHours: 24, description: "法芙娜黑巧克力慕斯，浓郁丝滑" },
    { name: "抹茶千层", category: "mille_crepe", stockMode: "PREORDER", prices: ["388", "588", "888"], sizes: ["6寸", "8寸", "10寸"], leadTimeHours: 48, description: "32层手工可丽饼皮，抹茶奶油层层堆叠" },
    { name: "榴莲千层", category: "mille_crepe", stockMode: "PREORDER", prices: ["428", "628"], sizes: ["6寸", "8寸"], leadTimeHours: 48, description: "马来西亚猫山王榴莲，浓郁果肉搭配轻盈奶油" },
    { name: "纽约芝士蛋糕", category: "cheesecake", stockMode: "PREORDER", prices: ["258", "388"], sizes: ["6寸", "8寸"], leadTimeHours: 24, description: "经典纽约芝士，绵密醇厚，入口即化" },
    { name: "巴斯克芝士", category: "cheesecake", stockMode: "PREORDER", prices: ["258", "388", "588"], sizes: ["6寸", "8寸", "10寸"], leadTimeHours: 24, description: "焦香外表包裹丝滑内心，西班牙风格" },
  ];

  for (const cakeData of cakes) {
    const { ...data } = cakeData;
    const cake = await prisma.cake.create({ data: data as any });
    console.log(`  ✅ ${cake.name}`);
  }

  console.log(`\n🎉 Seed complete! ${cakes.length} cakes created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
