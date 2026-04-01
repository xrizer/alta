"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Company } from "@/lib/types";
import * as shiftService from "@/services/shift-service";
import * as companyService from "@/services/company-service";

export default function CreateShiftPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState({
    company_id: "",
    name: "",
    start_time: "",
    end_time: "",
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await companyService.getCompaniesAll();
        if (res.success && res.data) setCompanies(res.data);
      } catch {
        setError("Failed to fetch companies");
      }
    };
    fetchCompanies();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await shiftService.createShift(form);
      if (res.success) router.push("/dashboard/shifts");
      else setError(res.message);
    } catch {
      setError("Failed to create shift");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Shift</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add a new work shift</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white">Company *</label>
            <select
              name="company_id"
              required
              value={form.company_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white">Name *</label>
            <input
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900">Start Time *</label>
            <input
              name="start_time"
              type="time"
              required
              value={form.start_time}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900">End Time *</label>
            <input
              name="end_time"
              type="time"
              required
              value={form.end_time}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-orange-500 px-4 py-2 text-sm font-medium text-orange-500 hover:bg-orange-50">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Creating..." : "Create Shift"}</button>
        </div>
      </form>
    </div>
  );
}
