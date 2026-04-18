"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { Department, Position, Shift, JobLevel, Grade, EmployeeStatus, CustomFieldDefinition } from "@/lib/types";
import * as employeeService from "@/services/employee-service";
import * as departmentService from "@/services/department-service";
import * as positionService from "@/services/position-service";
import * as shiftService from "@/services/shift-service";
import * as jobLevelService from "@/services/job-level-service";
import * as gradeService from "@/services/grade-service";
import * as customFieldService from "@/services/custom-field-service";
import CustomFieldsForm, { serializeCustomValues } from "@/components/custom-fields-form";
import { getErrorMessage } from "@/lib/api";

const CONTRACT_STATUSES: EmployeeStatus[] = ["kontrak", "probation", "pkwt", "internship"];

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [jobLevels, setJobLevels] = useState<JobLevel[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, unknown>>({});
  const [companyId, setCompanyId] = useState<string>("");

  // Read-only display fields
  const [readOnly, setReadOnly] = useState({
    user_name: "",
    user_email: "",
    company_name: "",
    employee_number: "",
  });

  const [form, setForm] = useState({
    department_id: "",
    position_id: "",
    shift_id: "",
    job_level_id: "",
    grade_id: "",
    employee_status: "tetap" as EmployeeStatus,
    nik: "",
    gender: "",
    birth_place: "",
    birth_date: "",
    marital_status: "",
    religion: "",
    contract_start_date: "",
    contract_end_date: "",
    resign_date: "",
    bank_name: "",
    bank_account: "",
    bpjs_kes_no: "",
    bpjs_tk_no: "",
    npwp: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [employeeRes, departmentsRes, positionsRes, shiftsRes, jobLevelsRes, gradesRes] =
          await Promise.all([
            employeeService.getEmployeeById(employeeId),
            departmentService.getDepartments(),
            positionService.getPositions(),
            shiftService.getShifts(),
            jobLevelService.getJobLevels(),
            gradeService.getGrades(),
          ]);

        if (departmentsRes.success && departmentsRes.data) setDepartments(departmentsRes.data);
        if (positionsRes.success && positionsRes.data) setPositions(positionsRes.data);
        if (shiftsRes.success && shiftsRes.data) setShifts(shiftsRes.data);
        if (jobLevelsRes.success && jobLevelsRes.data) setJobLevels(jobLevelsRes.data);
        if (gradesRes.success && gradesRes.data) setGrades(gradesRes.data);

        if (employeeRes.success && employeeRes.data) {
          const emp = employeeRes.data;
          setCompanyId(emp.company_id);
          setCustomValues((emp.custom_fields as Record<string, unknown>) || {});
          setReadOnly({
            user_name: emp.user?.name || "-",
            user_email: emp.user?.email || "-",
            company_name: emp.company?.name || "-",
            employee_number: emp.employee_number,
          });
          setForm({
            department_id: emp.department_id,
            position_id: emp.position_id,
            shift_id: emp.shift_id,
            job_level_id: emp.job_level_id || "",
            grade_id: emp.grade_id || "",
            employee_status: (emp.employee_status || "tetap") as EmployeeStatus,
            nik: emp.nik || "",
            gender: emp.gender || "",
            birth_place: emp.birth_place || "",
            birth_date: emp.birth_date ? emp.birth_date.split("T")[0] : "",
            marital_status: emp.marital_status || "",
            religion: emp.religion || "",
            contract_start_date: emp.contract_start_date ? emp.contract_start_date.split("T")[0] : "",
            contract_end_date: emp.contract_end_date ? emp.contract_end_date.split("T")[0] : "",
            resign_date: emp.resign_date ? emp.resign_date.split("T")[0] : "",
            bank_name: emp.bank_name || "",
            bank_account: emp.bank_account || "",
            bpjs_kes_no: emp.bpjs_kes_no || "",
            bpjs_tk_no: emp.bpjs_tk_no || "",
            npwp: emp.npwp || "",
          });
        } else {
          setError("Employee not found");
        }
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load employee data"));
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [employeeId]);

  // Load custom field definitions for the employee's company
  useEffect(() => {
    if (!companyId) return;
    const loadDefs = async () => {
      try {
        const res = await customFieldService.getCustomFields({
          company_id: companyId,
          entity_type: "employee",
        });
        if (res.success && res.data) {
          setCustomFieldDefs(res.data);
        } else {
          setCustomFieldDefs([]);
        }
      } catch {
        setCustomFieldDefs([]);
      }
    };
    loadDefs();
  }, [companyId]);

  const handleCustomChange = (key: string, value: unknown) => {
    setCustomValues((prev) => ({ ...prev, [key]: value }));
  };

  const filteredGrades = useMemo(() => {
    if (!form.job_level_id) return grades;
    return grades.filter((g) => g.job_level_id === form.job_level_id);
  }, [grades, form.job_level_id]);

  const showContractFields = CONTRACT_STATUSES.includes(form.employee_status);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "job_level_id") {
      setForm({ ...form, job_level_id: value, grade_id: "" });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const custom_fields = serializeCustomValues(customFieldDefs, customValues);
      const res = await employeeService.updateEmployee(employeeId, {
        department_id: form.department_id,
        position_id: form.position_id,
        shift_id: form.shift_id,
        job_level_id: form.job_level_id || undefined,
        grade_id: form.grade_id || undefined,
        employee_status: form.employee_status,
        nik: form.nik || undefined,
        gender: form.gender || undefined,
        birth_place: form.birth_place || undefined,
        birth_date: form.birth_date || undefined,
        marital_status: form.marital_status || undefined,
        religion: form.religion || undefined,
        contract_start_date: showContractFields && form.contract_start_date ? form.contract_start_date : undefined,
        contract_end_date: showContractFields && form.contract_end_date ? form.contract_end_date : undefined,
        resign_date: form.resign_date || undefined,
        bank_name: form.bank_name || undefined,
        bank_account: form.bank_account || undefined,
        bpjs_kes_no: form.bpjs_kes_no || undefined,
        bpjs_tk_no: form.bpjs_tk_no || undefined,
        npwp: form.npwp || undefined,
        custom_fields,
      });
      if (res.success) router.push("/dashboard/employees");
      else setError(res.message);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update employee"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white dark:placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";
  const readOnlyClass =
    "mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-gray-500 dark:text-gray-400";

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Employee</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update employee information</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6"
      >
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {/* Read-Only Info Section */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Employee Info</h3>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-900">User</label>
              <input
                disabled
                value={`${readOnly.user_name} (${readOnly.user_email})`}
                className={readOnlyClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">Company</label>
              <input
                disabled
                value={readOnly.company_name}
                className={readOnlyClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">Employee Number</label>
              <input
                disabled
                value={readOnly.employee_number}
                className={readOnlyClass}
              />
            </div>
          </div>
        </div>

        {/* Assignment Section */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Assignment</h3>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-900">Department</label>
              <select
                name="department_id"
                value={form.department_id}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">Position</label>
              <select
                name="position_id"
                value={form.position_id}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select position</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">Shift</label>
              <select
                name="shift_id"
                value={form.shift_id}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select shift</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.start_time} - {s.end_time})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">Job Level</label>
              <select
                name="job_level_id"
                value={form.job_level_id}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select job level</option>
                {jobLevels.map((jl) => (
                  <option key={jl.id} value={jl.id}>
                    {jl.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">Grade</label>
              <select
                name="grade_id"
                value={form.grade_id}
                onChange={handleChange}
                className={inputClass}
                disabled={!form.job_level_id}
              >
                <option value="">
                  {form.job_level_id ? "Select grade" : "Select job level first"}
                </option>
                {filteredGrades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">Employee Status</label>
              <select
                name="employee_status"
                value={form.employee_status}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="tetap">Tetap (PKWTT Permanent)</option>
                <option value="pkwtt">PKWTT (Permanent)</option>
                <option value="pkwt">PKWT (Fixed-term)</option>
                <option value="kontrak">Kontrak</option>
                <option value="probation">Probation</option>
                <option value="internship">Internship / Magang</option>
              </select>
            </div>
            {showContractFields && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Contract Start Date</label>
                  <input
                    name="contract_start_date"
                    type="date"
                    value={form.contract_start_date}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Contract End Date</label>
                  <input
                    name="contract_end_date"
                    type="date"
                    value={form.contract_end_date}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-900">Resign Date</label>
              <input
                name="resign_date"
                type="date"
                value={form.resign_date}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Personal Information</h3>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-900">NIK</label>
              <input
                name="nik"
                value={form.nik}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select gender</option>
                <option value="laki-laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">Birth Place</label>
              <input
                name="birth_place"
                value={form.birth_place}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">Birth Date</label>
              <input
                name="birth_date"
                type="date"
                value={form.birth_date}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">Marital Status</label>
              <select
                name="marital_status"
                value={form.marital_status}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select marital status</option>
                <option value="belum_kawin">Belum Kawin</option>
                <option value="kawin">Kawin</option>
                <option value="cerai">Cerai</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">Religion</label>
              <input
                name="religion"
                value={form.religion}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Bank & Insurance Section */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Bank & Insurance</h3>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-900">Bank Name</label>
              <input
                name="bank_name"
                value={form.bank_name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">Bank Account</label>
              <input
                name="bank_account"
                value={form.bank_account}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">BPJS Kesehatan No</label>
              <input
                name="bpjs_kes_no"
                value={form.bpjs_kes_no}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">BPJS Ketenagakerjaan No</label>
              <input
                name="bpjs_tk_no"
                value={form.bpjs_tk_no}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">NPWP</label>
              <input
                name="npwp"
                value={form.npwp}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Custom Fields Section */}
        <CustomFieldsForm
          definitions={customFieldDefs}
          values={customValues}
          onChange={handleCustomChange}
          disabled={isSubmitting}
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-orange-500 px-4 py-2 text-sm font-medium text-orange-500 hover:bg-orange-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Update Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
