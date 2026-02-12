"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Department } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as departmentService from "@/services/department-service";

export default function DepartmentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await departmentService.getDepartments();
      if (res.success && res.data) setDepartments(res.data);
    } catch {
      setError("Failed to fetch departments");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      const res = await departmentService.deleteDepartment(id);
      if (res.success) setDepartments(departments.filter((d) => d.id !== id));
      else setError(res.message);
    } catch {
      setError("Failed to delete department");
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading departments...</div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Departments</h2>
          <p className="mt-1 text-sm text-gray-600">Manage department data</p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/departments/create"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Add Department
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
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {departments.map((department) => (
              <tr key={department.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{department.name}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{department.company?.name || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{department.description || "-"}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${department.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {department.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                {isAdmin && (
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <Link href={`/dashboard/departments/${department.id}/edit`} className="text-blue-600 hover:text-blue-900 mr-4">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(department.id)} className="text-red-600 hover:text-red-900">
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-6 py-8 text-center text-sm text-gray-500">No departments found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
