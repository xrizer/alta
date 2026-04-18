export type Role = "superadmin" | "admin" | "hr" | "employee";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
  address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  address?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  phone?: string;
  address?: string;
  is_active?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// Company
export interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  npwp: string;
  npp: string;
  logo: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedCompanyResponse {
  data: Company[];
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface CreateCompanyRequest {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  npwp?: string;
  npp?: string;
  logo?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  npwp?: string;
  npp?: string;
  logo?: string;
  is_active?: boolean;
}

// Job Level & Grade
export interface JobLevel {
  id: string;
  company_id: string;
  name: string;
  description: string;
  level_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateJobLevelRequest {
  company_id: string;
  name: string;
  description?: string;
  level_order?: number;
}

export interface UpdateJobLevelRequest {
  name?: string;
  description?: string;
  level_order?: number;
  is_active?: boolean;
}

export interface Grade {
  id: string;
  company_id: string;
  job_level_id: string;
  job_level_name?: string;
  name: string;
  description: string;
  min_salary: number;
  max_salary: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGradeRequest {
  company_id: string;
  job_level_id: string;
  name: string;
  description?: string;
  min_salary?: number;
  max_salary?: number;
}

export interface UpdateGradeRequest {
  job_level_id?: string;
  name?: string;
  description?: string;
  min_salary?: number;
  max_salary?: number;
  is_active?: boolean;
}

// Department
export interface Department {
  id: string;
  company_id: string;
  company?: Company;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentRequest {
  company_id: string;
  name: string;
  description?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

// Position
export interface Position {
  id: string;
  company_id: string;
  company?: Company;
  department_id: string;
  department?: Department;
  name: string;
  base_salary: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePositionRequest {
  company_id: string;
  department_id?: string;
  name: string;
  base_salary?: number;
}

export interface UpdatePositionRequest {
  department_id?: string;
  name?: string;
  base_salary?: number;
  is_active?: boolean;
}

// Shift
export interface Shift {
  id: string;
  company_id: string;
  company?: Company;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateShiftRequest {
  company_id: string;
  name: string;
  start_time: string;
  end_time: string;
}

export interface UpdateShiftRequest {
  name?: string;
  start_time?: string;
  end_time?: string;
  is_active?: boolean;
}

// Employee
export type EmployeeStatus = "tetap" | "kontrak" | "probation";

export interface Employee {
  id: string;
  user_id: string;
  user?: User;
  company_id: string;
  company?: Company;
  department_id: string;
  department?: Department;
  position_id: string;
  position?: Position;
  shift_id: string;
  shift?: Shift;
  employee_number: string;
  nik: string;
  gender: string;
  birth_place: string;
  birth_date: string;
  marital_status: string;
  religion: string;
  blood_type: string;
  last_education: string;
  join_date: string;
  resign_date: string;
  employee_status: EmployeeStatus;
  bank_name: string;
  bank_account: string;
  bpjs_kes_no: string;
  bpjs_tk_no: string;
  npwp: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeRequest {
  user_id: string;
  company_id: string;
  department_id: string;
  position_id: string;
  shift_id: string;
  employee_number: string;
  join_date: string;
  employee_status?: EmployeeStatus;
  nik?: string;
  gender?: string;
  birth_place?: string;
  birth_date?: string;
  marital_status?: string;
  religion?: string;
  blood_type?: string;
  last_education?: string;
  bank_name?: string;
  bank_account?: string;
  bpjs_kes_no?: string;
  bpjs_tk_no?: string;
  npwp?: string;
}

export interface UpdateEmployeeRequest {
  department_id?: string;
  position_id?: string;
  shift_id?: string;
  nik?: string;
  gender?: string;
  birth_place?: string;
  birth_date?: string;
  marital_status?: string;
  religion?: string;
  blood_type?: string;
  last_education?: string;
  resign_date?: string;
  employee_status?: EmployeeStatus;
  bank_name?: string;
  bank_account?: string;
  bpjs_kes_no?: string;
  bpjs_tk_no?: string;
  npwp?: string;
}

// Attendance
export type AttendanceStatus = "hadir" | "alpha" | "terlambat" | "izin" | "sakit" | "cuti" | "early_in" | "on_time" | "late_in";

export interface Attendance {
  id: string;
  employee_id: string;
  employee?: Employee;
  shift_id: string;
  date: string;
  clock_in: string;
  clock_out: string;
  status: AttendanceStatus;
  overtime_hours: number;
  notes: string;
  // GPS + photo capture (populated when geo_attendance module is enabled)
  clock_in_lat?: number;
  clock_in_lng?: number;
  clock_in_photo?: string;
  clock_in_distance_m?: number;
  clock_out_lat?: number;
  clock_out_lng?: number;
  clock_out_photo?: string;
  clock_out_distance_m?: number;
  created_at: string;
  updated_at: string;
}

export interface ClockInRequest {
  employee_id: string;
  notes?: string;
  lat?: number;
  lng?: number;
  photo?: string;
  distance_m?: number;
}

export interface ClockOutRequest {
  notes?: string;
  lat?: number;
  lng?: number;
  photo?: string;
  distance_m?: number;
}

export interface PaginatedAttendanceResponse {
  data: Attendance[];
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

// Leave
export type LeaveType = "cuti_tahunan" | "cuti_sakit" | "cuti_melahirkan" | "cuti_besar" | "izin" | "dinas_luar";
export type LeaveStatus = "pending" | "approved" | "rejected";

export interface Leave {
  id: string;
  employee_id: string;
  employee?: Employee;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  attachment: string;
  status: LeaveStatus;
  approved_by: string;
  approver?: User;
  approved_at: string;
  rejection_reason: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeaveRequest {
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  attachment?: string;
}

// Organization Structure
export interface OrgEmployeeNode {
  id: string;
  employee_number: string;
  user_name: string;
}

export interface OrgPositionNode {
  id: string;
  name: string;
  employees: OrgEmployeeNode[];
}

export interface OrgDepartmentNode {
  id: string;
  name: string;
  positions: OrgPositionNode[];
}

export interface OrgStructureResponse {
  company_id: string;
  company_name: string;
  departments: OrgDepartmentNode[];
}

// Menu Access
export interface MenuAccessConfig {
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  menu_keys: string[];
}

export interface SetMenuAccessRequest {
  user_id: string;
  menu_keys: string[];
}

export interface UserMenuKeysResponse {
  menu_keys: string[];
}

// Payroll
export type PayrollStatus = "draft" | "processed" | "paid";

export interface Payroll {
  id: string;
  employee_id: string;
  employee?: Employee;
  period_month: number;
  period_year: number;
  working_days: number;
  present_days: number;
  basic_salary: number;
  total_allowances: number;
  overtime_pay: number;
  thr: number;
  gross_salary: number;
  total_deductions: number;
  bpjs_kes_deduction: number;
  bpjs_tk_deduction: number;
  pph21: number;
  other_deductions: number;
  net_salary: number;
  status: PayrollStatus;
  paid_at: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Employee Salary
export interface EmployeeSalary {
  id: string;
  employee_id: string;
  basic_salary: number;
  transport_allowance: number;
  meal_allowance: number;
  housing_allowance: number;
  position_allowance: number;
  bpjs_kes_employee: number;
  bpjs_kes_company: number;
  bpjs_tk_jht_employee: number;
  bpjs_tk_jht_company: number;
  bpjs_tk_jkk: number;
  bpjs_tk_jkm: number;
  bpjs_tk_jp_employee: number;
  bpjs_tk_jp_company: number;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeSalaryRequest {
  employee_id: string;
  basic_salary: number;
  transport_allowance?: number;
  meal_allowance?: number;
  housing_allowance?: number;
  position_allowance?: number;
  effective_date: string;
}

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  ref_id?: string;
  ref_type?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface UnreadCountResponse {
  count: number;
}

// Feature Modules
export interface Module {
  key: string;
  name: string;
  description: string;
  category: string;
  depends_on: string[];
  is_core: boolean;
}

export interface CompanyModule {
  id: string;
  company_id: string;
  module_key: string;
  module?: Module;
  enabled: boolean;
  config: string;
  enabled_at: string | null;
  enabled_by: string;
  updated_at: string;
}

export interface MyModulesResponse {
  company_id: string;
  enabled_modules: string[];
}

export interface SetCompanyModuleRequest {
  enabled: boolean;
  config?: string;
}

