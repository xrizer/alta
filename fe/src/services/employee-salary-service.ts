import api from "@/lib/api";
import { ApiResponse, CreateEmployeeSalaryRequest, EmployeeSalary } from "@/lib/types";

export async function getEmployeeSalaries(params?: {
  employee_id?: string;
}): Promise<ApiResponse<EmployeeSalary[]>> {
  const query = params?.employee_id ? `?employee_id=${params.employee_id}` : "";
  const response = await api.get(`/employee-salaries${query}`);
  return response.data;
}

export async function createEmployeeSalary(
  data: CreateEmployeeSalaryRequest
): Promise<ApiResponse<EmployeeSalary>> {
  const response = await api.post("/employee-salaries", data);
  return response.data;
}

export async function seedSalaryFromPosition(
  employeeId: string
): Promise<ApiResponse<EmployeeSalary>> {
  const response = await api.post(
    `/employee-salaries/seed-from-position/${employeeId}`
  );
  return response.data;
}
