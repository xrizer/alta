export type Role = "admin" | "hr" | "employee";

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
  logo: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyRequest {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  npwp?: string;
  logo?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  npwp?: string;
  logo?: string;
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
export type AttendanceStatus = "hadir" | "alpha" | "terlambat" | "izin" | "sakit" | "cuti";

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
  created_at: string;
  updated_at: string;
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
