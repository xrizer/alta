"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Employee, LeaveType } from "@/lib/types";
import * as leaveService from "@/services/leave-service";
import * as employeeService from "@/services/employee-service";

export default function CreateLeavePage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);

  const [form, setForm] = useState({
    leave_type: "cuti_tahunan" as LeaveType,
    start_date: "",
    end_date: "",
    total_days: 1,
    reason: "",
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await employeeService.getMyEmployee();
        if (res.success && res.data) setMyEmployee(res.data);
        else setError("Employee record not found. Please contact admin.");
      } catch {
        setError("Failed to load employee data");
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "total_days" ? Number(value) : value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!myEmployee) return;
    setError("");
    setIsSubmitting(true);
    try {
      const res = await leaveService.createLeave({
        employee_id: myEmployee.id,
        ...form,
      });
      if (res.success) router.push("/dashboard/leaves");
      else setError(res.message);
    } catch {
      setError("Failed to create leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="text-gray-500">Loading...</div></div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Request Leave</h2>
        <p className="mt-1 text-sm text-gray-600">Submit a new leave request</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Leave Type *</label>
            <select name="leave_type" value={form.leave_type} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="cuti_tahunan">Cuti Tahunan</option>
              <option value="cuti_sakit">Cuti Sakit</option>
              <option value="cuti_melahirkan">Cuti Melahirkan</option>
              <option value="cuti_besar">Cuti Besar</option>
              <option value="izin">Izin</option>
              <option value="dinas_luar">Dinas Luar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Days *</label>
            <input name="total_days" type="number" min={1} required value={form.total_days} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date *</label>
            <input name="start_date" type="date" required value={form.start_date} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date *</label>
            <input name="end_date" type="date" required value={form.end_date} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Reason *</label>
          <textarea name="reason" rows={3} required value={form.reason} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={isSubmitting || !myEmployee} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Submitting..." : "Submit Request"}</button>
        </div>
      </form>
    </div>
  );
}
