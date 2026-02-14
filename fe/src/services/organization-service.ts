import api from "@/lib/api";
import { ApiResponse, OrgStructureResponse } from "@/lib/types";

export async function getOrganizationStructure(
  companyId: string
): Promise<ApiResponse<OrgStructureResponse>> {
  const response = await api.get(
    `/organization/structure?company_id=${companyId}`
  );
  return response.data;
}
