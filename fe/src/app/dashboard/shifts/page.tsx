"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Shift, Company } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as shiftService from "@/services/shift-service";
import * as companyService from "@/services/company-service";

export default function ShiftsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [shiftsRes, companiesRes] = await Promise.all([
        shiftService.getShifts(),
        companyService.getCompanies(),
      ]);
      if (shiftsRes.success && shiftsRes.data) setShifts(shiftsRes.data);
      if (companiesRes.success && companiesRes.data) setCompanies(companiesRes.data);
    } catch {
      setError("Failed to fetch shifts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCompanyName = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    return company ? company.name : "-";
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shift?")) return;
    try {
      const res = await shiftService.deleteShift(id);
      if (res.success) setShifts(shifts.filter((s) => s.id !== id));
      else setError(res.message);
    } catch {
      setError("Failed to delete shift");
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading shifts...</div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shifts</h2>
          <p className="mt-1 text-sm text-gray-600">Manage work shifts</p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/shifts/create"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Add Shift
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Start Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">End Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {shifts.map((shift) => (
              <tr key={shift.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{shift.name}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{shift.company?.name || getCompanyName(shift.company_id)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{shift.start_time}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{shift.end_time}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${shift.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {shift.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                {isAdmin && (
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <Link href={`/dashboard/shifts/${shift.id}/edit`} className="text-blue-600 hover:text-blue-900 mr-4">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(shift.id)} className="text-red-600 hover:text-red-900">
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {shifts.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-sm text-gray-500">No shifts found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
