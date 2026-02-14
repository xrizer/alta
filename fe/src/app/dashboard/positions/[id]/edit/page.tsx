"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { Department } from "@/lib/types";
import * as positionService from "@/services/position-service";
import * as departmentService from "@/services/department-service";

export default function EditPositionPage() {
  const router = useRouter();
  const params = useParams();
  const positionId = params.id as string;
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    department_id: "",
    name: "",
    base_salary: "",
    is_active: true,
  });

  useEffect(() => {
    const fetchPosition = async () => {
      try {
        const res = await positionService.getPositionById(positionId);
        if (res.success && res.data) {
          setForm({
            department_id: res.data.department_id || "",
            name: res.data.name,
            base_salary: res.data.base_salary ? String(res.data.base_salary) : "",
            is_active: res.data.is_active,
          });
          setCompanyName(res.data.company?.name || "-");
          setCompanyId(res.data.company_id || "");
        } else setError("Position not found");
      } catch {
        setError("Failed to fetch position");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosition();
  }, [positionId]);

  // Fetch departments when companyId is available
  useEffect(() => {
    if (!companyId) return;
    const fetchDepartments = async () => {
      try {
        const res = await departmentService.getDepartments(companyId);
        if (res.success && res.data) setDepartments(res.data.filter((d) => d.is_active));
      } catch {
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, [companyId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    else setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await positionService.updatePosition(positionId, {
        department_id: form.department_id || undefined,
        name: form.name,
        base_salary: form.base_salary ? Number(form.base_salary) : undefined,
        is_active: form.is_active,
      });
      if (res.success) router.push("/dashboard/positions");
      else setError(res.message);
    } catch {
      setError("Failed to update position");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Edit Position</h2>
        <p className="mt-1 text-sm text-gray-600">Update position information</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company</label>
            <input value={companyName} disabled className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <select
              name="department_id"
              value={form.department_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Base Salary</label>
            <input name="base_salary" type="number" min="0" value={form.base_salary} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="is_active" id="is_active" checked={form.is_active} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Updating..." : "Update Position"}</button>
        </div>
      </form>
    </div>
  );
}
