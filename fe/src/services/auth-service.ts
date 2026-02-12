import api from "@/lib/api";
import { ApiResponse, LoginRequest, TokenResponse } from "@/lib/types";

export async function login(
  data: LoginRequest
): Promise<ApiResponse<TokenResponse>> {
  const response = await api.post("/auth/login", data);
  return response.data;
}

export async function refreshToken(): Promise<ApiResponse<TokenResponse>> {
  const response = await api.post("/auth/refresh");
  return response.data;
}

export async function logout(): Promise<ApiResponse<null>> {
  const response = await api.post("/auth/logout");
  return response.data;
}
