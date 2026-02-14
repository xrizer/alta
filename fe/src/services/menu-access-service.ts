import api from "@/lib/api";
import {
  ApiResponse,
  MenuAccessConfig,
  SetMenuAccessRequest,
  UserMenuKeysResponse,
} from "@/lib/types";

export async function getMyMenuKeys(): Promise<
  ApiResponse<UserMenuKeysResponse>
> {
  const response = await api.get("/menu-access/me");
  return response.data;
}

export async function getAllMenuAccess(): Promise<
  ApiResponse<MenuAccessConfig[]>
> {
  const response = await api.get("/menu-access");
  return response.data;
}

export async function setUserMenuAccess(
  data: SetMenuAccessRequest
): Promise<ApiResponse<null>> {
  const response = await api.post("/menu-access", data);
  return response.data;
}

export async function deleteUserMenuAccess(
  userId: string
): Promise<ApiResponse<null>> {
  const response = await api.delete(`/menu-access/${userId}`);
  return response.data;
}
