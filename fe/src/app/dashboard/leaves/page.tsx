"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Leave, Employee } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as leaveService from "@/services/leave-service";
import * as employeeService from "@/services/employee-service";

export default function LeavesPage() {
  const { user } = useAuth();
  const isAdminOrHr = user?.role === "admin" || user?.role === "hr";
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = useCallback(async () => {
    try {
      if (isAdminOrHr) {
        const res = await leaveService.getLeaves();
        if (res.success && res.data) setLeaves(res.data);
      } else {
        const empRes = await employeeService.getMyEmployee();
        if (empRes.success && empRes.data) {
          setMyEmployee(empRes.data);
          const res = await leaveService.getLeaves({ employee_id: empRes.data.id });
          if (res.success && res.data) setLeaves(res.data);
        }
      }
    } catch {
      setError("Failed to fetch leaves");
    } finally {
      setIsLoading(false);
    }
  }, [isAdminOrHr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: string, status: "approved" | "rejected") => {
    setError("");
    setSuccess("");
    let rejectionReason = "";
    if (status === "rejected") {
      rejectionReason = prompt("Enter rejection reason:") || "";
      if (!rejectionReason) return;
    }
    try {
      const res = await leaveService.approveLeave(id, { status, rejection_reason: rejectionReason });
      if (res.success) {
        setSuccess(`Leave ${status}`);
        fetchData();
      } else {
        setError(res.message);
      }
    } catch {
      setError("Failed to update leave");
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  const leaveTypeLabels: Record<string, string> = {
    cuti_tahunan: "Cuti Tahunan",
    cuti_sakit: "Cuti Sakit",
    cuti_melahirkan: "Cuti Melahirkan",
    cuti_besar: "Cuti Besar",
    izin: "Izin",
    dinas_luar: "Dinas Luar",
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="text-gray-500">Loading...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leaves</h2>
          <p className="mt-1 text-sm text-gray-600">Manage leave requests</p>
        </div>
        {(myEmployee || !isAdminOrHr) && (
          <Link href="/dashboard/leaves/create" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            Request Leave
          </Link>
        )}
      </div>

      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{success}</div>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {isAdminOrHr && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Employee</th>}
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Start</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">End</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Days</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              {isAdminOrHr && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leaves.map((leave) => (
              <tr key={leave.id} className="hover:bg-gray-50">
                {isAdminOrHr && <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{leave.employee?.user?.name || "-"}</td>}
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{leaveTypeLabels[leave.leave_type] || leave.leave_type}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{leave.start_date}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{leave.end_date}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{leave.total_days}</td>
                <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-500">{leave.reason}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusColors[leave.status] || "bg-gray-100 text-gray-800"}`}>
                    {leave.status}
                  </span>
                </td>
                {isAdminOrHr && (
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {leave.status === "pending" && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(leave.id, "approved")} className="text-green-600 hover:text-green-900">Approve</button>
                        <button onClick={() => handleApprove(leave.id, "rejected")} className="text-red-600 hover:text-red-900">Reject</button>
                      </div>
                    )}
                    {leave.status === "rejected" && leave.rejection_reason && (
                      <span className="text-xs text-gray-400" title={leave.rejection_reason}>Reason: {leave.rejection_reason}</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {leaves.length === 0 && (
              <tr><td colSpan={isAdminOrHr ? 8 : 6} className="px-6 py-8 text-center text-sm text-gray-500">No leave requests found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
