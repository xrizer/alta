"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Company, Department } from "@/lib/types";
import * as positionService from "@/services/position-service";
import * as companyService from "@/services/company-service";
import * as departmentService from "@/services/department-service";

export default function CreatePositionPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    company_id: "",
    department_id: "",
    name: "",
    base_salary: "",
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await companyService.getCompanies();
        if (res.success && res.data) setCompanies(res.data.filter((c) => c.is_active));
      } catch {
        setError("Failed to fetch companies");
      }
    };
    fetchCompanies();
  }, []);

  // Fetch departments when company changes
  useEffect(() => {
    if (!form.company_id) {
      setDepartments([]);
      setForm((prev) => ({ ...prev, department_id: "" }));
      return;
    }
    const fetchDepartments = async () => {
      try {
        const res = await departmentService.getDepartments(form.company_id);
        if (res.success && res.data) setDepartments(res.data.filter((d) => d.is_active));
      } catch {
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, [form.company_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await positionService.createPosition({
        company_id: form.company_id,
        department_id: form.department_id || undefined,
        name: form.name,
        base_salary: form.base_salary ? Number(form.base_salary) : undefined,
      });
      if (res.success) router.push("/dashboard/positions");
      else setError(res.message);
    } catch {
      setError("Failed to create position");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create Position</h2>
        <p className="mt-1 text-sm text-gray-600">Add a new position</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company *</label>
            <select
              name="company_id"
              required
              value={form.company_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <select
              name="department_id"
              value={form.department_id}
              onChange={handleChange}
              disabled={!form.company_id}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input name="name" required value={form.name} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Base Salary</label>
            <input name="base_salary" type="number" min="0" value={form.base_salary} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Creating..." : "Create Position"}</button>
        </div>
      </form>
    </div>
  );
}
