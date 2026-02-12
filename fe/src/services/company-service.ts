import api from "@/lib/api";
import {
  ApiResponse,
  Company,
  CreateCompanyRequest,
  UpdateCompanyRequest,
} from "@/lib/types";

export async function getCompanies(): Promise<ApiResponse<Company[]>> {
  const response = await api.get("/companies");
  return response.data;
}

export async function getCompanyById(
  id: string
): Promise<ApiResponse<Company>> {
  const response = await api.get(`/companies/${id}`);
  return response.data;
}

export async function createCompany(
  data: CreateCompanyRequest
): Promise<ApiResponse<Company>> {
  const response = await api.post("/companies", data);
  return response.data;
}

export async function updateCompany(
  id: string,
  data: UpdateCompanyRequest
): Promise<ApiResponse<Company>> {
  const response = await api.put(`/companies/${id}`, data);
  return response.data;
}

export async function deleteCompany(id: string): Promise<ApiResponse<null>> {
  const response = await api.delete(`/companies/${id}`);
  return response.data;
}
