"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import * as shiftService from "@/services/shift-service";
import * as companyService from "@/services/company-service";

export default function EditShiftPage() {
  const router = useRouter();
  const params = useParams();
  const shiftId = params.id as string;
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [form, setForm] = useState({
    name: "",
    start_time: "",
    end_time: "",
    is_active: true,
  });

  useEffect(() => {
    const fetchShift = async () => {
      try {
        const res = await shiftService.getShiftById(shiftId);
        if (res.success && res.data) {
          setForm({
            name: res.data.name,
            start_time: res.data.start_time,
            end_time: res.data.end_time,
            is_active: res.data.is_active,
          });
          if (res.data.company?.name) {
            setCompanyName(res.data.company.name);
          } else {
            try {
              const companyRes = await companyService.getCompanyById(res.data.company_id);
              if (companyRes.success && companyRes.data) setCompanyName(companyRes.data.name);
            } catch {
              setCompanyName("-");
            }
          }
        } else {
          setError("Shift not found");
        }
      } catch {
        setError("Failed to fetch shift");
      } finally {
        setIsLoading(false);
      }
    };
    fetchShift();
  }, [shiftId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    else setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await shiftService.updateShift(shiftId, form);
      if (res.success) router.push("/dashboard/shifts");
      else setError(res.message);
    } catch {
      setError("Failed to update shift");
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
        <h2 className="text-2xl font-bold text-gray-900">Edit Shift</h2>
        <p className="mt-1 text-sm text-gray-600">Update shift information</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Company</label>
            <input
              value={companyName}
              disabled
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <input
              name="start_time"
              type="time"
              value={form.start_time}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Time</label>
            <input
              name="end_time"
              type="time"
              value={form.end_time}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="is_active" id="is_active" checked={form.is_active} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Updating..." : "Update Shift"}</button>
        </div>
      </form>
    </div>
  );
}
