"use client";

import Link from "next/link";
import { User } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";

interface UserTableProps {
  users: User[];
  onDelete: (id: string) => void;
}

export default function UserTable({ users, onDelete }: UserTableProps) {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Phone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            {isAdmin && (
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {user.name}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {user.email}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    user.role === "admin"
                      ? "bg-purple-100 text-purple-800"
                      : user.role === "hr"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {user.phone || "-"}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    user.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              {isAdmin && (
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  <Link
                    href={`/dashboard/users/${user.id}/edit`}
                    className="mr-3 text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </Link>
                  {user.id !== currentUser?.id && (
                    <button
                      onClick={() => onDelete(user.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td
                colSpan={isAdmin ? 6 : 5}
                className="px-6 py-8 text-center text-sm text-gray-500"
              >
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
