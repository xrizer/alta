import api from "@/lib/api";
import { ApiResponse, Attendance } from "@/lib/types";

export async function getAttendances(params?: {
  employee_id?: string;
  month?: number;
  year?: number;
}): Promise<ApiResponse<Attendance[]>> {
  const searchParams = new URLSearchParams();
  if (params?.employee_id) searchParams.set("employee_id", params.employee_id);
  if (params?.month) searchParams.set("month", params.month.toString());
  if (params?.year) searchParams.set("year", params.year.toString());
  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const response = await api.get(`/attendances${query}`);
  return response.data;
}

export async function getAttendanceById(
  id: string
): Promise<ApiResponse<Attendance>> {
  const response = await api.get(`/attendances/${id}`);
  return response.data;
}

export async function clockIn(data: {
  employee_id: string;
  notes?: string;
}): Promise<ApiResponse<Attendance>> {
  const response = await api.post("/attendances/clock-in", data);
  return response.data;
}

export async function clockOut(
  id: string,
  data?: { notes?: string }
): Promise<ApiResponse<Attendance>> {
  const response = await api.put(`/attendances/${id}/clock-out`, data || {});
  return response.data;
}

export async function createAttendance(data: {
  employee_id: string;
  shift_id?: string;
  date: string;
  clock_in?: string;
  clock_out?: string;
  status: string;
  overtime_hours?: number;
  notes?: string;
}): Promise<ApiResponse<Attendance>> {
  const response = await api.post("/attendances", data);
  return response.data;
}

export async function deleteAttendance(
  id: string
): Promise<ApiResponse<null>> {
  const response = await api.delete(`/attendances/${id}`);
  return response.data;
}

export async function importAttendance(
  file: File
): Promise<
  ApiResponse<{ imported: number; total: number; errors: string[] }>
> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/attendances/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}
