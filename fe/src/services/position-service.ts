import api from "@/lib/api";
import {
  ApiResponse,
  Position,
  CreatePositionRequest,
  UpdatePositionRequest,
} from "@/lib/types";

export async function getPositions(
  companyId?: string
): Promise<ApiResponse<Position[]>> {
  const params = companyId ? `?company_id=${companyId}` : "";
  const response = await api.get(`/positions${params}`);
  return response.data;
}

export async function getPositionById(
  id: string
): Promise<ApiResponse<Position>> {
  const response = await api.get(`/positions/${id}`);
  return response.data;
}

export async function createPosition(
  data: CreatePositionRequest
): Promise<ApiResponse<Position>> {
  const response = await api.post("/positions", data);
  return response.data;
}

export async function updatePosition(
  id: string,
  data: UpdatePositionRequest
): Promise<ApiResponse<Position>> {
  const response = await api.put(`/positions/${id}`, data);
  return response.data;
}

export async function deletePosition(id: string): Promise<ApiResponse<null>> {
  const response = await api.delete(`/positions/${id}`);
  return response.data;
}
