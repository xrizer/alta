"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Position } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as positionService from "@/services/position-service";

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const formatSalary = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);

export default function PositionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPositions = useCallback(async () => {
    try {
      const res = await positionService.getPositions();
      if (res.success && res.data) setPositions(res.data);
    } catch {
      setError("Failed to fetch positions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this position?")) return;
    try {
      const res = await positionService.deletePosition(id);
      if (res.success) setPositions(positions.filter((p) => p.id !== id));
      else setError(res.message);
    } catch {
      setError("Failed to delete position");
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading positions...</div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Positions</h2>
          <p className="mt-1 text-sm text-gray-600">Manage position data</p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/positions/create"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
          >
            Add Position
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
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Base Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {positions.map((position) => (
              <tr key={position.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{position.name}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{position.company?.name || "-"}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{position.department?.name || "-"}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatSalary(position.base_salary)}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${position.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {position.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                {isAdmin && (
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/dashboard/positions/${position.id}/edit`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <EditIcon />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(position.id)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                      >
                        <TrashIcon />
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {positions.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-sm text-gray-500">No positions found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
