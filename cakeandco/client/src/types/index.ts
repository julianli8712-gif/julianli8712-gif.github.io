export interface CakeTag {
  type: "occasion" | "flavor" | "dietary";
  name: string;
  nameEn?: string;
}

export interface Cake {
  id: string;
  name: string;
  nameEn?: string;
  category: string;
  stockMode: "GRAB" | "PREORDER";
  description?: string;
  descriptionEn?: string;
  story?: string;
  tastingNote?: string;
  imageUrls: string[];
  sizes: string[];
  prices: string[];
  pairingDrink?: string;
  salesTip?: string;
  status: string;
  stockQty: number;
  lowStockThreshold: number;
  isChefPick: boolean;
  leadTimeHours: number;
  tags: CakeTag[];
  createdAt: string;
}

export interface AiImageResult {
  url: string;
  width: number;
  height: number;
}

export interface Reservation {
  id: string;
  cakeId?: string;
  cakeName: string;
  size?: string;
  quantity: number;
  totalPrice?: number;
  accessories: string[];
  guestName: string;
  guestPhone: string;
  pickupMethod: string;
  pickupTime: string;
  message?: string;
  aiPrompt?: string;
  aiImageUrl?: string;
  specialRequirements?: string;
  isAiCustom?: boolean;
  status: ReservationStatus;
  staffNote?: string;
  createdAt: string;
}

export type ReservationStatus =
  | "PENDING"
  | "PENDING_AI"
  | "CONFIRMED"
  | "MAKING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export interface RecommendResult {
  cake: Cake;
  reason: string;
  pairingDrink: string;
  occasionFit: number;
}

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export const OCCASIONS = [
  { key: "生日", label: "生日", desc: "经典庆祝之选", scene: "birthday" },
  { key: "纪念日", label: "纪念日", desc: "浪漫甜蜜时刻", scene: "anniversary" },
  { key: "下午茶", label: "下午茶", desc: "精致午后时光", scene: "afternoon-tea" },
  { key: "商务", label: "商务", desc: "低调不失品味", scene: "business" },
  { key: "儿童", label: "儿童", desc: "缤纷童趣派对", scene: "kids" },
  { key: "节日", label: "节日", desc: "欢聚温馨时刻", scene: "festival" },
  { key: "长辈", label: "长辈", desc: "经典温暖心意", scene: "elders" },
  { key: "健康无负担", label: "健康无负担", desc: "低糖轻卡放心享", scene: "healthy" },
];

export const CATEGORIES: Record<string, string> = {
  whole_mousse: "慕斯蛋糕",
  whole_cheese: "芝士蛋糕",
  whole_cream: "奶油蛋糕",
  whole_chocolate: "巧克力蛋糕",
  mini_slice: "切片",
  mini_tart: "挞类",
  mini_mousse: "慕斯杯",
  mini_cheese: "芝士",
  mini_cream: "奶油杯",
};

// Size-first grouping for Grab & Go
export const GRAB_SIZE_GROUPS: Record<string, { label: string; categories: string[] }> = {
  whole: { label: "整只蛋糕", categories: ["whole_mousse", "whole_cheese", "whole_cream", "whole_chocolate"] },
  mini: { label: "一人小食", categories: ["mini_slice", "mini_tart", "mini_mousse", "mini_cheese", "mini_cream"] },
};

export const STOCK_MODE_LABELS: Record<string, string> = {
  GRAB: "即买即取",
  PREORDER: "提前预约",
};
