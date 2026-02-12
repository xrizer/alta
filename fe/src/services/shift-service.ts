import api from "@/lib/api";
import {
  ApiResponse,
  Shift,
  CreateShiftRequest,
  UpdateShiftRequest,
} from "@/lib/types";

export async function getShifts(
  companyId?: string
): Promise<ApiResponse<Shift[]>> {
  const params = companyId ? `?company_id=${companyId}` : "";
  const response = await api.get(`/shifts${params}`);
  return response.data;
}

export async function getShiftById(id: string): Promise<ApiResponse<Shift>> {
  const response = await api.get(`/shifts/${id}`);
  return response.data;
}

export async function createShift(
  data: CreateShiftRequest
): Promise<ApiResponse<Shift>> {
  const response = await api.post("/shifts", data);
  return response.data;
}

export async function updateShift(
  id: string,
  data: UpdateShiftRequest
): Promise<ApiResponse<Shift>> {
  const response = await api.put(`/shifts/${id}`, data);
  return response.data;
}

export async function deleteShift(id: string): Promise<ApiResponse<null>> {
  const response = await api.delete(`/shifts/${id}`);
  return response.data;
}
