import api from "@/lib/api";
import {
  ApiResponse,
  Department,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
} from "@/lib/types";

export async function getDepartments(
  companyId?: string
): Promise<ApiResponse<Department[]>> {
  const params = companyId ? `?company_id=${companyId}` : "";
  const response = await api.get(`/departments${params}`);
  return response.data;
}

export async function getDepartmentById(
  id: string
): Promise<ApiResponse<Department>> {
  const response = await api.get(`/departments/${id}`);
  return response.data;
}

export async function createDepartment(
  data: CreateDepartmentRequest
): Promise<ApiResponse<Department>> {
  const response = await api.post("/departments", data);
  return response.data;
}

export async function updateDepartment(
  id: string,
  data: UpdateDepartmentRequest
): Promise<ApiResponse<Department>> {
  const response = await api.put(`/departments/${id}`, data);
  return response.data;
}

export async function deleteDepartment(
  id: string
): Promise<ApiResponse<null>> {
  const response = await api.delete(`/departments/${id}`);
  return response.data;
}
