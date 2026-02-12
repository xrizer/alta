"use client";

import { useAuth } from "@/contexts/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back, {user?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Your Role</h3>
          <p className="mt-2 text-2xl font-semibold capitalize text-gray-900">
            {user?.role}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Email</h3>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {user?.email}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Status</h3>
          <p className="mt-2 text-2xl font-semibold text-green-600">Active</p>
        </div>
      </div>
    </div>
  );
}
