import api from "@/lib/api";
import { ApiResponse, Leave, CreateLeaveRequest } from "@/lib/types";

export async function getLeaves(params?: {
  employee_id?: string;
  status?: string;
}): Promise<ApiResponse<Leave[]>> {
  const searchParams = new URLSearchParams();
  if (params?.employee_id) searchParams.set("employee_id", params.employee_id);
  if (params?.status) searchParams.set("status", params.status);
  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const response = await api.get(`/leaves${query}`);
  return response.data;
}

export async function getLeaveById(id: string): Promise<ApiResponse<Leave>> {
  const response = await api.get(`/leaves/${id}`);
  return response.data;
}

export async function createLeave(
  data: CreateLeaveRequest
): Promise<ApiResponse<Leave>> {
  const response = await api.post("/leaves", data);
  return response.data;
}

export async function approveLeave(
  id: string,
  data: { status: "approved" | "rejected"; rejection_reason?: string }
): Promise<ApiResponse<Leave>> {
  const response = await api.put(`/leaves/${id}/approve`, data);
  return response.data;
}

export async function deleteLeave(id: string): Promise<ApiResponse<null>> {
  const response = await api.delete(`/leaves/${id}`);
  return response.data;
}
