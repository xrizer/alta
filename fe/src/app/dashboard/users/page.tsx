"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { User } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import UserTable from "@/components/user-table";
import * as userService from "@/services/user-service";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await userService.getUsers();
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch {
      setError("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await userService.deleteUser(id);
      if (res.success) {
        setUsers(users.filter((u) => u.id !== id));
      } else {
        setError(res.message);
      }
    } catch {
      setError("Failed to delete user");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Users</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage system users and their roles
          </p>
        </div>
        {currentUser?.role === "admin" && (
          <Link
            href="/dashboard/users/create"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Add User
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <UserTable users={users} onDelete={handleDelete} />
    </div>
  );
}
