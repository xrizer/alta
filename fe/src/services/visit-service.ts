import api from "@/lib/api";
import {
  ApiResponse,
  EndVisitRequest,
  PaginatedVisitResponse,
  StartVisitRequest,
  Visit,
} from "@/lib/types";

export async function startVisit(
  data: StartVisitRequest
): Promise<ApiResponse<Visit>> {
  const response = await api.post("/visits/start", data);
  return response.data;
}

export async function endVisit(
  id: string,
  data: EndVisitRequest
): Promise<ApiResponse<Visit>> {
  const response = await api.post(`/visits/${id}/end`, data);
  return response.data;
}

export async function getVisitById(id: string): Promise<ApiResponse<Visit>> {
  const response = await api.get(`/visits/${id}`);
  return response.data;
}

export async function getVisitsByAttendance(
  attendanceId: string
): Promise<ApiResponse<Visit[]>> {
  const response = await api.get(`/visits/attendance/${attendanceId}`);
  return response.data;
}

export async function listVisits(params?: {
  employee_id?: string;
  from?: string; // YYYY-MM-DD
  to?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedVisitResponse>> {
  const qs = new URLSearchParams();
  if (params?.employee_id) qs.set("employee_id", params.employee_id);
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  const response = await api.get(`/visits${query}`);
  return response.data;
}

export async function deleteVisit(id: string): Promise<ApiResponse<null>> {
  const response = await api.delete(`/visits/${id}`);
  return response.data;
}
