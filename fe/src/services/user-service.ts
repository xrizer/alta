import api from "@/lib/api";
import {
  ApiResponse,
  CreateUserRequest,
  UpdateUserRequest,
  User,
} from "@/lib/types";

export async function getUsers(): Promise<ApiResponse<User[]>> {
  const response = await api.get("/users");
  return response.data;
}

export async function getUserById(id: string): Promise<ApiResponse<User>> {
  const response = await api.get(`/users/${id}`);
  return response.data;
}

export async function getMe(): Promise<ApiResponse<User>> {
  const response = await api.get("/users/me");
  return response.data;
}

export async function createUser(
  data: CreateUserRequest
): Promise<ApiResponse<User>> {
  const response = await api.post("/users", data);
  return response.data;
}

export async function updateUser(
  id: string,
  data: UpdateUserRequest
): Promise<ApiResponse<User>> {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
}

export async function deleteUser(id: string): Promise<ApiResponse<null>> {
  const response = await api.delete(`/users/${id}`);
  return response.data;
}
