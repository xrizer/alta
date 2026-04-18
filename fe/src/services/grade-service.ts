import api from "@/lib/api";
import { ApiResponse, Grade, CreateGradeRequest, UpdateGradeRequest } from "@/lib/types";

export async function getGrades(params?: { company_id?: string; job_level_id?: string }): Promise<ApiResponse<Grade[]>> {
  const searchParams = new URLSearchParams();
  if (params?.company_id) searchParams.set("company_id", params.company_id);
  if (params?.job_level_id) searchParams.set("job_level_id", params.job_level_id);
  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const res = await api.get(`/grades${query}`);
  return res.data;
}

export async function getGradeById(id: string): Promise<ApiResponse<Grade>> {
  const res = await api.get(`/grades/${id}`);
  return res.data;
}

export async function createGrade(data: CreateGradeRequest): Promise<ApiResponse<Grade>> {
  const res = await api.post("/grades", data);
  return res.data;
}

export async function updateGrade(id: string, data: UpdateGradeRequest): Promise<ApiResponse<Grade>> {
  const res = await api.put(`/grades/${id}`, data);
  return res.data;
}

export async function deleteGrade(id: string): Promise<ApiResponse<null>> {
  const res = await api.delete(`/grades/${id}`);
  return res.data;
}
