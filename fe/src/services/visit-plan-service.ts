import api from "@/lib/api";
import {
  ApiResponse,
  CreateVisitPlanRequest,
  UpdateVisitPlanItemRequest,
  UpdateVisitPlanRequest,
  VisitAdherenceReport,
  VisitPlan,
  VisitPlanItem,
  VisitPlanItemInput,
} from "@/lib/types";

export async function createVisitPlan(
  data: CreateVisitPlanRequest
): Promise<ApiResponse<VisitPlan>> {
  const response = await api.post("/visit-plans", data);
  return response.data;
}

export async function updateVisitPlan(
  id: string,
  data: UpdateVisitPlanRequest
): Promise<ApiResponse<VisitPlan>> {
  const response = await api.put(`/visit-plans/${id}`, data);
  return response.data;
}

export async function getVisitPlanById(
  id: string
): Promise<ApiResponse<VisitPlan>> {
  const response = await api.get(`/visit-plans/${id}`);
  return response.data;
}

/**
 * Fetch plan for an employee on a given date. Use employee_id="me" to look up
 * based on the signed-in user.
 */
export async function getVisitPlanByDate(params: {
  employee_id: string;
  date: string;
}): Promise<ApiResponse<VisitPlan>> {
  const qs = new URLSearchParams({
    employee_id: params.employee_id,
    date: params.date,
  });
  const response = await api.get(`/visit-plans/by-date?${qs.toString()}`);
  return response.data;
}

export async function listVisitPlansByEmployee(
  employeeId: string,
  params?: { from?: string; to?: string }
): Promise<ApiResponse<VisitPlan[]>> {
  const qs = new URLSearchParams();
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  const response = await api.get(
    `/visit-plans/employee/${employeeId}${query}`
  );
  return response.data;
}

export async function deleteVisitPlan(
  id: string
): Promise<ApiResponse<null>> {
  const response = await api.delete(`/visit-plans/${id}`);
  return response.data;
}

export async function addVisitPlanItem(
  planId: string,
  data: VisitPlanItemInput
): Promise<ApiResponse<VisitPlanItem>> {
  const response = await api.post(`/visit-plans/${planId}/items`, data);
  return response.data;
}

export async function updateVisitPlanItem(
  itemId: string,
  data: UpdateVisitPlanItemRequest
): Promise<ApiResponse<VisitPlanItem>> {
  const response = await api.put(`/visit-plans/items/${itemId}`, data);
  return response.data;
}

export async function deleteVisitPlanItem(
  itemId: string
): Promise<ApiResponse<null>> {
  const response = await api.delete(`/visit-plans/items/${itemId}`);
  return response.data;
}

export async function getAdherenceReport(params: {
  company_id: string;
  date: string;
  minimum?: number;
}): Promise<ApiResponse<VisitAdherenceReport>> {
  const qs = new URLSearchParams({
    company_id: params.company_id,
    date: params.date,
  });
  if (params.minimum) qs.set("minimum", String(params.minimum));
  const response = await api.get(`/visit-plans/report?${qs.toString()}`);
  return response.data;
}
