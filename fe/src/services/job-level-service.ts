import api from "@/lib/api";
import { ApiResponse, JobLevel, CreateJobLevelRequest, UpdateJobLevelRequest } from "@/lib/types";

export async function getJobLevels(params?: { company_id?: string }): Promise<ApiResponse<JobLevel[]>> {
  const query = params?.company_id ? `?company_id=${params.company_id}` : "";
  const res = await api.get(`/job-levels${query}`);
  return res.data;
}

export async function getJobLevelById(id: string): Promise<ApiResponse<JobLevel>> {
  const res = await api.get(`/job-levels/${id}`);
  return res.data;
}

export async function createJobLevel(data: CreateJobLevelRequest): Promise<ApiResponse<JobLevel>> {
  const res = await api.post("/job-levels", data);
  return res.data;
}

export async function updateJobLevel(id: string, data: UpdateJobLevelRequest): Promise<ApiResponse<JobLevel>> {
  const res = await api.put(`/job-levels/${id}`, data);
  return res.data;
}

export async function deleteJobLevel(id: string): Promise<ApiResponse<null>> {
  const res = await api.delete(`/job-levels/${id}`);
  return res.data;
}
