import api from "@/lib/api";
import {
  ApiResponse,
  CustomFieldDefinition,
  CreateCustomFieldDefinitionRequest,
  UpdateCustomFieldDefinitionRequest,
} from "@/lib/types";

export async function getCustomFields(params?: {
  company_id?: string;
  entity_type?: string;
}): Promise<ApiResponse<CustomFieldDefinition[]>> {
  const sp = new URLSearchParams();
  if (params?.company_id) sp.set("company_id", params.company_id);
  if (params?.entity_type) sp.set("entity_type", params.entity_type);
  const query = sp.toString() ? `?${sp.toString()}` : "";
  const res = await api.get(`/custom-fields${query}`);
  return res.data;
}

export async function getCustomFieldById(
  id: string
): Promise<ApiResponse<CustomFieldDefinition>> {
  const res = await api.get(`/custom-fields/${id}`);
  return res.data;
}

export async function createCustomField(
  data: CreateCustomFieldDefinitionRequest
): Promise<ApiResponse<CustomFieldDefinition>> {
  const res = await api.post("/custom-fields", data);
  return res.data;
}

export async function updateCustomField(
  id: string,
  data: UpdateCustomFieldDefinitionRequest
): Promise<ApiResponse<CustomFieldDefinition>> {
  const res = await api.put(`/custom-fields/${id}`, data);
  return res.data;
}

export async function deleteCustomField(id: string): Promise<ApiResponse<null>> {
  const res = await api.delete(`/custom-fields/${id}`);
  return res.data;
}
