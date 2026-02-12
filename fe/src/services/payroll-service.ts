import api from "@/lib/api";
import { ApiResponse, Payroll } from "@/lib/types";

export async function getPayrolls(params?: {
  employee_id?: string;
  month?: number;
  year?: number;
}): Promise<ApiResponse<Payroll[]>> {
  const searchParams = new URLSearchParams();
  if (params?.employee_id) searchParams.set("employee_id", params.employee_id);
  if (params?.month) searchParams.set("month", params.month.toString());
  if (params?.year) searchParams.set("year", params.year.toString());
  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const response = await api.get(`/payrolls${query}`);
  return response.data;
}

export async function getPayrollById(
  id: string
): Promise<ApiResponse<Payroll>> {
  const response = await api.get(`/payrolls/${id}`);
  return response.data;
}

export async function generatePayroll(data: {
  employee_id: string;
  month: number;
  year: number;
}): Promise<ApiResponse<Payroll>> {
  const response = await api.post("/payrolls/generate", data);
  return response.data;
}

export async function updatePayrollStatus(
  id: string,
  data: { status: string }
): Promise<ApiResponse<Payroll>> {
  const response = await api.put(`/payrolls/${id}/status`, data);
  return response.data;
}

export async function deletePayroll(id: string): Promise<ApiResponse<null>> {
  const response = await api.delete(`/payrolls/${id}`);
  return response.data;
}
