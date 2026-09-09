import axios from "axios";
import type { ApiResponse, Drink, FoodItem, FoodPairing, BarProfile, BarExport, PairingMode } from "../types";

const http = axios.create({ baseURL: "/bar-api" });

// Attach JWT token
http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("bar_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ─── Auth ──────────────────────────────────────────────

export async function login(username: string, password: string): Promise<string> {
  const res = await axios.post("/cake-api/auth/login", { username, password });
  if (res.data.code === 0 && res.data.data?.token) {
    localStorage.setItem("bar_token", res.data.data.token);
    return res.data.data.token;
  }
  throw new Error(res.data.message || "Login failed");
}

export function logout() {
  localStorage.removeItem("bar_token");
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem("bar_token");
}

// ─── Drinks ────────────────────────────────────────────

export async function fetchDrinks(params?: Record<string, string>): Promise<Drink[]> {
  const res = await http.get<ApiResponse<Drink[]>>("/drinks", { params });
  return res.data.data;
}

export async function fetchDrink(id: string): Promise<Drink> {
  const res = await http.get<ApiResponse<Drink>>(`/drinks/${id}`);
  return res.data.data;
}

export async function createDrink(data: Partial<Drink>): Promise<Drink> {
  const res = await http.post<ApiResponse<Drink>>("/drinks", data);
  return res.data.data;
}

export async function updateDrink(id: string, data: Partial<Drink>): Promise<Drink> {
  const res = await http.put<ApiResponse<Drink>>(`/drinks/${id}`, data);
  return res.data.data;
}

export async function deleteDrink(id: string): Promise<void> {
  await http.delete(`/drinks/${id}`);
}

// ─── Foods ─────────────────────────────────────────────

export async function fetchFoods(params?: Record<string, string>): Promise<FoodItem[]> {
  const res = await http.get<ApiResponse<FoodItem[]>>("/foods", { params });
  return res.data.data;
}

export async function fetchFood(id: string): Promise<FoodItem> {
  const res = await http.get<ApiResponse<FoodItem>>(`/foods/${id}`);
  return res.data.data;
}

export async function createFood(data: Partial<FoodItem>): Promise<FoodItem> {
  const res = await http.post<ApiResponse<FoodItem>>("/foods", data);
  return res.data.data;
}

export async function updateFood(id: string, data: Partial<FoodItem>): Promise<FoodItem> {
  const res = await http.put<ApiResponse<FoodItem>>(`/foods/${id}`, data);
  return res.data.data;
}

export async function deleteFood(id: string): Promise<void> {
  await http.delete(`/foods/${id}`);
}

// ─── Pairings ──────────────────────────────────────────

export async function generatePairing(params: {
  drinkId?: string;
  foodId?: string;
  mode: PairingMode;
  lang?: string;
}): Promise<FoodPairing[]> {
  const res = await http.post<ApiResponse<FoodPairing[]>>("/pairings/recommend", params);
  return res.data.data;
}

export async function fetchPairings(params?: Record<string, string>): Promise<FoodPairing[]> {
  const res = await http.get<ApiResponse<FoodPairing[]>>("/pairings", { params });
  return res.data.data;
}

export async function updatePairing(id: string, data: Partial<FoodPairing>): Promise<FoodPairing> {
  const res = await http.put<ApiResponse<FoodPairing>>(`/pairings/${id}`, data);
  return res.data.data;
}

// ─── Stories ───────────────────────────────────────────

export async function generateStory(drinkId: string, lang = "zh"): Promise<Drink> {
  const res = await http.post<ApiResponse<Drink>>("/stories/generate", { drinkId, lang });
  return res.data.data;
}

export async function batchGenerateStories(lang = "zh"): Promise<{ processed: number }> {
  const res = await http.post<ApiResponse<{ processed: number }>>("/stories/batch", { lang });
  return res.data.data;
}

// ─── Exports ────────────────────────────────────────────

export async function generateExport(params: {
  drinkIds: string[];
  mode: string;
  layout: string;
}): Promise<BarExport> {
  const res = await http.post<ApiResponse<BarExport>>("/exports/menu-insert", params);
  return res.data.data;
}

export async function fetchExports(): Promise<BarExport[]> {
  const res = await http.get<ApiResponse<BarExport[]>>("/exports");
  return res.data.data;
}

// ─── Admin ─────────────────────────────────────────────

export async function fetchProfile(): Promise<BarProfile> {
  const res = await http.get<ApiResponse<BarProfile>>("/admin/profile");
  return res.data.data;
}

export async function updateProfile(data: Partial<BarProfile>): Promise<BarProfile> {
  const res = await http.put<ApiResponse<BarProfile>>("/admin/profile", data);
  return res.data.data;
}

export async function uploadImage(file: File): Promise<{ url: string; filename: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await http.post<ApiResponse<{ url: string; filename: string }>>("/admin/upload", form);
  return res.data.data;
}

export async function importDrinks(drinks: Partial<Drink>[]): Promise<{ created: number; skipped: number }> {
  const res = await http.post("/admin/import-drinks", { drinks });
  return res.data.data;
}
