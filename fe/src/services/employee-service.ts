import api from "@/lib/api";
import {
  ApiResponse,
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
} from "@/lib/types";

export async function getEmployees(
  companyId?: string
): Promise<ApiResponse<Employee[]>> {
  const params = companyId ? `?company_id=${companyId}` : "";
  const response = await api.get(`/employees${params}`);
  return response.data;
}

export async function getEmployeeById(
  id: string
): Promise<ApiResponse<Employee>> {
  const response = await api.get(`/employees/${id}`);
  return response.data;
}

export async function getMyEmployee(): Promise<ApiResponse<Employee>> {
  const response = await api.get("/employees/me");
  return response.data;
}

export async function createEmployee(
  data: CreateEmployeeRequest
): Promise<ApiResponse<Employee>> {
  const response = await api.post("/employees", data);
  return response.data;
}

export async function updateEmployee(
  id: string,
  data: UpdateEmployeeRequest
): Promise<ApiResponse<Employee>> {
  const response = await api.put(`/employees/${id}`, data);
  return response.data;
}

export async function deleteEmployee(id: string): Promise<ApiResponse<null>> {
  const response = await api.delete(`/employees/${id}`);
  return response.data;
}
