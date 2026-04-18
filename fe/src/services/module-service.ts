import api from "@/lib/api";
import {
  ApiResponse,
  CompanyModule,
  Module,
  MyModulesResponse,
  SetCompanyModuleRequest,
} from "@/lib/types";

// Fetch the full module catalog
export async function getModuleCatalog(): Promise<ApiResponse<Module[]>> {
  const res = await api.get<ApiResponse<Module[]>>("/modules");
  return res.data;
}

// Fetch the enabled modules for the current user's company
export async function getMyModules(): Promise<ApiResponse<MyModulesResponse>> {
  const res = await api.get<ApiResponse<MyModulesResponse>>("/me/modules");
  return res.data;
}

// Superadmin: list every module for one company with its toggle state
export async function getCompanyModules(
  companyId: string
): Promise<ApiResponse<CompanyModule[]>> {
  const res = await api.get<ApiResponse<CompanyModule[]>>(
    `/companies/${companyId}/modules`
  );
  return res.data;
}

// Superadmin: enable/disable a module for one company
export async function setCompanyModule(
  companyId: string,
  moduleKey: string,
  body: SetCompanyModuleRequest
): Promise<ApiResponse<CompanyModule>> {
  const res = await api.put<ApiResponse<CompanyModule>>(
    `/companies/${companyId}/modules/${moduleKey}`,
    body
  );
  return res.data;
}
