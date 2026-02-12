"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Employee } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as employeeService from "@/services/employee-service";

export default function EmployeesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await employeeService.getEmployees();
      if (res.success && res.data) setEmployees(res.data);
    } catch {
      setError("Failed to fetch employees");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      const res = await employeeService.deleteEmployee(id);
      if (res.success) setEmployees(employees.filter((e) => e.id !== id));
      else setError(res.message);
    } catch {
      setError("Failed to delete employee");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      tetap: "bg-green-100 text-green-800",
      kontrak: "bg-yellow-100 text-yellow-800",
      probation: "bg-blue-100 text-blue-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading employees...</div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employees</h2>
          <p className="mt-1 text-sm text-gray-600">Manage employee data</p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/employees/create"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Add Employee
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
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Employee No</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Join Date</th>
              {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{emp.employee_number}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{emp.user?.name || "-"}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{emp.department?.name || "-"}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{emp.position?.name || "-"}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusBadge(emp.employee_status)}`}>
                    {emp.employee_status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(emp.join_date)}</td>
                {isAdmin && (
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <Link href={`/dashboard/employees/${emp.id}/edit`} className="mr-4 text-blue-600 hover:text-blue-900">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:text-red-900">
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-6 py-8 text-center text-sm text-gray-500">No employees found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
