export interface Drink {
  id: string;
  name: string;
  nameEn?: string | null;
  type: 'WINE' | 'COCKTAIL' | 'SPIRIT' | 'BEER' | 'SAKE' | 'OTHER';
  subtype?: string | null;
  region?: string | null;
  producer?: string | null;
  vintage?: string | null;
  abv?: number | null;
  bottlePrice?: number | null;
  glassPrice?: number | null;
  description?: string | null;
  tastingNote?: string | null;
  story?: string | null;
  flavorTags: string[];
  imageUrl?: string | null;
  status: 'ACTIVE' | 'DISCONTINUED' | 'DELETED';
  createdAt: string;
  updatedAt: string;
  foodPairings?: FoodPairing[];
}

export interface FoodItem {
  id: string;
  name: string;
  nameEn?: string | null;
  category?: string | null;
  description?: string | null;
  flavorNote?: string | null;
  story?: string | null;
  imageUrl?: string | null;
  status: 'ACTIVE' | 'DELETED';
  createdAt: string;
  updatedAt: string;
  drinkPairings?: FoodPairing[];
}

export interface FoodPairing {
  id: string;
  drinkId: string;
  foodId: string;
  mode: 'CLASSIC' | 'BOLD' | 'STORY';
  reason?: string | null;
  story?: string | null;
  score: number;
  drink?: Drink;
  food?: FoodItem;
  createdAt: string;
}

export interface BarProfile {
  id: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  logoUrl?: string | null;
}

export interface BarExport {
  id: string;
  type: 'MENU_INSERT' | 'TABLE_CARD' | 'STORY_CARD';
  title: string;
  htmlContent: string;
  pdfUrl?: string | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export type PairingMode = 'CLASSIC' | 'BOLD' | 'STORY';
