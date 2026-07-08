import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Photo URL base
const IMG = "https://julianli.net/img/cakes";

const products = [
  // === 整只蛋糕 · 现货 ===
  { name: "巧克力慕斯蛋糕", nameEn: "Chocolate Mousse Cake", category: "whole_mousse", stockMode: "GRAB", prices: ["398"], sizes: ["2磅"], stockQty: 2, description: "法芙娜黑巧克力慕斯，浓郁丝滑", descriptionEn: "Valrhona dark chocolate mousse, rich and velvety", photo: "巧克力慕斯.jpg", occasion: ["生日","纪念日","节日"] },
  { name: "黑森林蛋糕", nameEn: "Black Forest Cake", category: "whole_chocolate", stockMode: "GRAB", prices: ["398"], sizes: ["2磅"], stockQty: 2, description: "经典黑森林，樱桃与巧克力的完美融合", descriptionEn: "Classic Black Forest, cherry and chocolate in perfect harmony", photo: "黑森林蛋糕.jpg", occasion: ["生日","纪念日"] },
  { name: "红丝绒蛋糕", nameEn: "Red Velvet Cake", category: "whole_cream", stockMode: "GRAB", prices: ["398"], sizes: ["2磅"], stockQty: 2, description: "经典红丝绒配奶油芝士霜", descriptionEn: "Classic red velvet with cream cheese frosting", photo: "红丝绒蛋糕.jpg", occasion: ["生日","纪念日","下午茶"] },
  { name: "水果奶油蛋糕", nameEn: "Fresh Fruit Cream Cake", category: "whole_cream", stockMode: "GRAB", prices: ["398"], sizes: ["2磅"], stockQty: 2, description: "新鲜时令水果搭配轻盈奶油", descriptionEn: "Seasonal fresh fruits with light whipped cream", photo: "水果奶油蛋糕.jpg", occasion: ["生日","儿童","下午茶"] },
  { name: "芝士蛋糕", nameEn: "New York Cheesecake", category: "whole_cheese", stockMode: "GRAB", prices: ["398"], sizes: ["2磅"], stockQty: 2, description: "经典纽约芝士，绵密醇厚", descriptionEn: "Classic New York cheesecake, dense and creamy", photo: "芝士蛋糕.jpg", occasion: ["下午茶","商务","长辈"] },

  // === 整只蛋糕 · 需预定 ===
  { name: "郁金香草莓奶油蛋糕", nameEn: "Tulip Strawberry Cream Cake", category: "whole_cream", stockMode: "PREORDER", prices: ["398"], sizes: ["2磅"], leadTimeHours: 24, description: "郁金香造型草莓奶油，浪漫优雅", descriptionEn: "Tulip-shaped strawberry cream, romantic and elegant", photo: "郁金香草莓奶油蛋糕.jpg", occasion: ["纪念日","生日"] },
  { name: "车厘子树莓蛋糕", nameEn: "Cherry Raspberry Cake", category: "whole_mousse", stockMode: "PREORDER", prices: ["398"], sizes: ["2磅"], leadTimeHours: 24, description: "车厘子与树莓的双重果味，酸甜交织", descriptionEn: "Dual fruit layers of cherry and raspberry, sweet-tart interplay", photo: "车厘子树莓蛋糕.jpg", occasion: ["纪念日","下午茶"] },
  { name: "榛子巧克力夹心蛋糕", nameEn: "Hazelnut Chocolate Layer Cake", category: "whole_chocolate", stockMode: "PREORDER", prices: ["398"], sizes: ["2磅"], leadTimeHours: 24, description: "榛子脆层搭配巧克力甘纳许", descriptionEn: "Hazelnut crunch with chocolate ganache", photo: "榛子巧克力夹心蛋糕.jpg", occasion: ["生日","商务","节日"] },
  { name: "树莓慕斯蛋糕", nameEn: "Raspberry Mousse Cake", category: "whole_mousse", stockMode: "PREORDER", prices: ["398"], sizes: ["2磅"], leadTimeHours: 24, description: "酸甜树莓慕斯，轻盈如云朵", descriptionEn: "Tangy raspberry mousse, light as a cloud", photo: "树莓慕斯蛋糕.jpg", occasion: ["下午茶","纪念日"] },
  { name: "香蕉焦糖巧克力蛋糕", nameEn: "Banana Caramel Chocolate Cake", category: "whole_chocolate", stockMode: "PREORDER", prices: ["398"], sizes: ["2磅"], leadTimeHours: 24, description: "香蕉焦糖与巧克力的甜蜜碰撞", descriptionEn: "Banana caramel meets chocolate in sweet harmony", photo: "香蕉焦糖巧克力蛋糕.jpg", occasion: ["生日","儿童"] },
  { name: "坚果白巧克力蛋糕", nameEn: "Nutty White Chocolate Cake", category: "whole_cream", stockMode: "PREORDER", prices: ["398"], sizes: ["2磅"], leadTimeHours: 24, description: "坚果脆香与白巧克力慕斯的优雅组合", descriptionEn: "Crunchy nuts with white chocolate mousse, elegant and refined", photo: "坚果白巧克力蛋糕.jpg", occasion: ["商务","长辈","节日"] },
  { name: "香草白巧克力蛋糕", nameEn: "Vanilla White Chocolate Cake", category: "whole_cream", stockMode: "PREORDER", prices: ["398"], sizes: ["2磅"], leadTimeHours: 24, description: "马达加斯加香草荚与白巧克力", descriptionEn: "Madagascar vanilla bean with white chocolate", photo: "香草白巧克力蛋糕.jpg", occasion: ["纪念日","生日"] },
  { name: "苹果派", nameEn: "Apple Pie", category: "whole_mousse", stockMode: "PREORDER", prices: ["398"], sizes: ["2磅"], leadTimeHours: 24, description: "手工酥皮包裹肉桂苹果馅，经典美式", descriptionEn: "Handmade crust with cinnamon apple filling, classic American", photo: "苹果派.jpg", occasion: ["下午茶","长辈","节日"] },

  // === 一人小食 · 现货 ===
  { name: "芝士蛋糕", nameEn: "Cheesecake", category: "mini_cheese", stockMode: "GRAB", prices: ["48"], sizes: ["约100g"], stockQty: 5, description: "经典纽约芝士，一人食分量", descriptionEn: "Classic New York cheesecake, single serving", photo: "小芝士蛋糕.jpg", occasion: ["下午茶","一人食"] },
  { name: "水果挞", nameEn: "Fruit Tart", category: "mini_tart", stockMode: "GRAB", prices: ["48"], sizes: ["约100g"], stockQty: 5, description: "酥脆挞壳配卡仕达酱和新鲜水果", descriptionEn: "Crisp tart shell with custard and fresh fruits", photo: "水果挞.jpg", occasion: ["下午茶"] },
  { name: "提拉米苏", nameEn: "Tiramisu", category: "mini_slice", stockMode: "GRAB", prices: ["48"], sizes: ["约100g"], stockQty: 5, description: "经典意式提拉米苏，咖啡与马斯卡彭", descriptionEn: "Classic Italian tiramisu, coffee and mascarpone", photo: "提拉米苏.jpg", occasion: ["下午茶","商务"] },
  { name: "布朗尼蛋糕", nameEn: "Brownie", category: "mini_slice", stockMode: "GRAB", prices: ["48"], sizes: ["约100g"], stockQty: 4, description: "浓郁黑巧布朗尼，外酥内软", descriptionEn: "Rich dark chocolate brownie, crisp outside, fudgy inside", photo: "布朗尼蛋糕.jpg", occasion: ["下午茶","儿童"] },
  { name: "巧克力慕斯蛋糕", nameEn: "Chocolate Mousse", category: "mini_mousse", stockMode: "GRAB", prices: ["48"], sizes: ["约100g"], stockQty: 5, description: "黑巧克力慕斯，一人食分量", descriptionEn: "Dark chocolate mousse, single serving", photo: "巧克力慕斯蛋糕.jpg", occasion: ["下午茶"] },
  { name: "小水果奶油蛋糕", nameEn: "Fruit Cream Cake", category: "mini_cream", stockMode: "GRAB", prices: ["48"], sizes: ["约100g"], stockQty: 5, description: "新鲜水果搭配轻盈奶油", descriptionEn: "Fresh fruits with light cream, single serving", photo: "小水果奶油蛋糕.jpg", occasion: ["下午茶","儿童"] },
  { name: "小香草奶油蛋糕", nameEn: "Vanilla Cream Cake", category: "mini_cream", stockMode: "GRAB", prices: ["48"], sizes: ["约100g"], stockQty: 5, description: "香草奶油搭配松软蛋糕", descriptionEn: "Vanilla cream with soft sponge cake", photo: "小香草奶油蛋糕.jpg", occasion: ["下午茶"] },
  { name: "小白巧克力慕斯蛋糕", nameEn: "White Chocolate Mousse", category: "mini_mousse", stockMode: "GRAB", prices: ["48"], sizes: ["约100g"], stockQty: 5, description: "白巧克力慕斯，清甜不腻", descriptionEn: "White chocolate mousse, sweet and light", photo: "小白巧克力慕斯蛋糕.jpg", occasion: ["下午茶","儿童"] },
  { name: "小红丝绒蛋糕", nameEn: "Red Velvet Cup", category: "mini_cream", stockMode: "GRAB", prices: ["48"], sizes: ["约100g"], stockQty: 5, description: "经典红丝绒，一人食分量", descriptionEn: "Classic red velvet, single serving", photo: "小红丝绒蛋糕.jpg", occasion: ["下午茶"] },
];

async function main() {
  console.log("🌱 Importing real Westin cake products...\n");

  // Clear existing (order matters for FK constraints)
  await prisma.cakeTagRelation.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.cake.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.cakeTag.deleteMany();

  // Create tags
  const allOccasions = ["生日","纪念日","下午茶","商务","儿童","节日","长辈","一人食"];
  const tagMap: Record<string, any> = {};

  for (const occ of allOccasions) {
    const tag = await prisma.cakeTag.create({ data: { type: "occasion", name: occ } });
    tagMap[occ] = tag;
  }

  // Flavor tags
  const flavors = [
    { name: "巧克力" }, { name: "水果" }, { name: "奶油" }, { name: "芝士" },
    { name: "坚果" }, { name: "咖啡" }, { name: "树莓" },
  ];
  for (const f of flavors) {
    const tag = await prisma.cakeTag.create({ data: { type: "flavor", name: f.name } });
    tagMap[f.name] = tag;
  }

  console.log(`✅ ${Object.keys(tagMap).length} tags created\n`);

  // Create products
  for (const p of products) {
    const { occasion, photo, leadTimeHours, ...data } = p;
    const imageUrl = `${IMG}/${photo}`;

    const cake = await prisma.cake.create({
      data: {
        ...data,
        imageUrls: [imageUrl],
        leadTimeHours: leadTimeHours || 0,
      },
    });

    // Attach occasion tags
    for (const occ of occasion) {
      if (tagMap[occ]) {
        await prisma.cakeTagRelation.create({ data: { cakeId: cake.id, tagId: tagMap[occ].id } });
      }
    }

    console.log(`  ✅ ${cake.name} (${data.stockMode === "GRAB" ? "🟢即买即取" : "🔵预约"}) - ¥${data.prices[0]}`);
  }

  // Count
  const grabCount = await prisma.cake.count({ where: { stockMode: "GRAB" } });
  const preorderCount = await prisma.cake.count({ where: { stockMode: "PREORDER" } });

  console.log(`\n🎉 Import complete!`);
  console.log(`   🟢 即买即取: ${grabCount} 款`);
  console.log(`   🔵 提前预约: ${preorderCount} 款`);
  console.log(`   📸 全部带真实产品照片`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
