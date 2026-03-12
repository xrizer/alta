import api from "@/lib/api";
import {
  ApiResponse,
  Company,
  CreateCompanyRequest,
  PaginatedCompanyResponse,
  UpdateCompanyRequest,
} from "@/lib/types";

export async function getCompanies(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: string;
}): Promise<ApiResponse<PaginatedCompanyResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.search) searchParams.set("search", params.search);
  if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
  if (params?.sort_order) searchParams.set("sort_order", params.sort_order);
  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const response = await api.get(`/companies${query}`);
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

export async function deleteMultipleCompanies(
  ids: string[]
): Promise<ApiResponse<null>> {
  const response = await api.delete("/companies", { data: { ids } });
  return response.data;
}
