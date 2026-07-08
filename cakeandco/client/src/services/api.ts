import axios from "axios";
import type { ApiResponse, AiImageResult, Cake, Reservation, RecommendResult } from "../types";

const api = axios.create({
  baseURL: "/cake-api",
  timeout: 15000,
});

// Cakes
export async function fetchCakes(params?: {
  stock_mode?: string;
  occasion?: string;
  flavor?: string;
  category?: string;
  search?: string;
}): Promise<Cake[]> {
  const { data } = await api.get<ApiResponse<Cake[]>>("/cakes", { params });
  return data.data;
}

export async function fetchCake(id: string): Promise<Cake> {
  const { data } = await api.get<ApiResponse<Cake>>(`/cakes/${id}`);
  return data.data;
}

// Recommend
export async function recommendByOccasion(input: {
  occasion: string;
  people?: number;
  budget?: string;
  preferences?: string[];
  allergies?: string[];
}): Promise<{ results: RecommendResult[]; isOffline: boolean }> {
  const { data } = await api.post<ApiResponse<{ results: RecommendResult[]; isOffline: boolean }>>(
    "/recommend/occasion",
    input
  );
  return data.data;
}

// AI Image Generation
const imageApi = axios.create({
  baseURL: "/cake-api",
  timeout: 60000,
});

export async function generateAiImage(prompt: string): Promise<AiImageResult[]> {
  const { data } = await imageApi.post<ApiResponse<{ images: AiImageResult[] }>>(
    "/recommend/ai-image",
    { prompt }
  );
  return data.data.images;
}

// Reservations
export async function createReservation(input: {
  cakeId?: string;
  cakeName: string;
  size?: string;
  quantity?: number;
  totalPrice?: number;
  accessories?: string[];
  guestName: string;
  guestPhone: string;
  pickupMethod?: string;
  pickupTime: string;
  message?: string;
  isAiCustom?: boolean;
  aiPrompt?: string;
  aiImageUrl?: string;
}): Promise<Reservation> {
  const { data } = await api.post<ApiResponse<Reservation>>("/reservations", input);
  return data.data;
}

// Reservations by phone
export async function fetchReservationsByPhone(phone: string): Promise<Reservation[]> {
  const { data } = await api.get<ApiResponse<Reservation[]>>(`/reservations?phone=${phone}`);
  return data.data;
}

export async function cancelReservation(id: string): Promise<void> {
  await api.patch(`/reservations/${id}`, { status: "CANCELLED" });
}

// Auth
export async function login(username: string, password: string) {
  const { data } = await api.post("/auth/login", { username, password });
  return data.data as { token: string; user: { id: string; username: string; role: string } };
}

export async function fetchMe() {
  const { data } = await api.get("/auth/me", authHeaders());
  return data.data.user as { id: string; username: string; role: string };
}

// Admin
function authHeaders() {
  const token = localStorage.getItem("auth_token");
  if (token) return { headers: { Authorization: `Bearer ${token}` } };
  return { headers: { "x-admin-key": localStorage.getItem("admin_key") || "" } };
}

const adminHeaders = () => authHeaders();

export async function fetchAdminCakes(): Promise<Cake[]> {
  const { data } = await api.get<ApiResponse<Cake[]>>("/admin/cakes", adminHeaders());
  return data.data;
}

export async function createCake(input: any): Promise<Cake> {
  const { data } = await api.post<ApiResponse<Cake>>("/admin/cakes", input, adminHeaders());
  return data.data;
}

export async function updateCake(id: string, input: any): Promise<Cake> {
  const { data } = await api.put<ApiResponse<Cake>>(`/admin/cakes/${id}`, input, adminHeaders());
  return data.data;
}

export async function deleteCake(id: string): Promise<void> {
  await api.delete(`/admin/cakes/${id}`, adminHeaders());
}

export async function fetchAdminReservations(status?: string): Promise<Reservation[]> {
  const { data } = await api.get<ApiResponse<Reservation[]>>("/admin/reservations", {
    ...adminHeaders(),
    params: status ? { status } : {},
  });
  return data.data;
}

export async function updateReservationStatus(id: string, status: string): Promise<void> {
  await api.patch(`/admin/reservations/${id}/status`, { status }, adminHeaders());
}

export async function fetchAdminTags(): Promise<{ id: string; type: string; name: string }[]> {
  const { data } = await api.get("/admin/tags", adminHeaders());
  return data.data;
}

// User management
export async function fetchUsers(): Promise<{ id: string; username: string; role: string; createdAt: string }[]> {
  const { data } = await api.get("/admin/users", adminHeaders());
  return data.data;
}

export async function createUser(input: { username: string; password: string; role: string }): Promise<any> {
  const { data } = await api.post("/admin/users", input, adminHeaders());
  return data.data;
}

export async function updateUser(id: string, input: { role?: string; password?: string }): Promise<any> {
  const { data } = await api.put(`/admin/users/${id}`, input, adminHeaders());
  return data.data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/admin/users/${id}`, adminHeaders());
}
