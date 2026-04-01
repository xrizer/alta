"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { SquarePen, Trash } from "lucide-react";
import { User } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as userService from "@/services/user-service";
import Pagination from "@/components/pagination";

type SortField = "name" | "email" | "role" | "phone" | "is_active";
type SortOrder = "asc" | "desc";

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "superadmin";
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await userService.getUsers();
      if (res.success && res.data) setAllUsers(res.data);
    } catch {
      setError("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setCurrentPage(1); }, [search, sortBy, sortOrder, perPage]);

  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(val), 400);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortOrder("asc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <span className="ml-1 text-gray-300 text-xs">↑↓</span>;
    return <span className="ml-1 text-orange-500 text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await userService.deleteUser(id);
      if (res.success) setAllUsers((prev) => prev.filter((u) => u.id !== id));
      else setError(res.message);
    } catch {
      setError("Failed to delete user");
    }
  };

  const filtered = allUsers.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name") {
      return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    if (sortBy === "email") {
      return sortOrder === "asc" ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email);
    }
    if (sortBy === "role") {
      return sortOrder === "asc" ? a.role.localeCompare(b.role) : b.role.localeCompare(a.role);
    }
    if (sortBy === "phone") {
      const av = a.phone || ""; const bv = b.phone || "";
      return sortOrder === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    if (sortBy === "is_active") {
      return sortOrder === "asc"
        ? Number(a.is_active) - Number(b.is_active)
        : Number(b.is_active) - Number(a.is_active);
    }
    return 0;
  });

  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const users = sorted.slice((safePage - 1) * perPage, safePage * perPage);

  const colSpan = isAdmin ? 6 : 5;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage system users and their roles</p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/users/create"
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Add User
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      {/* Search */}
      <div className="flex items-center justify-end gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search"
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="w-64 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-white dark:bg-gray-800">
            <tr>
              {(
                [
                  { label: "Name", field: "name" as SortField },
                  { label: "Email", field: "email" as SortField },
                  { label: "Role", field: "role" as SortField },
                  { label: "Phone", field: "phone" as SortField },
                  { label: "Status", field: "is_active" as SortField },
                ] as const
              ).map(({ label, field }) => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none hover:text-gray-900 dark:hover:text-white"
                >
                  {label}
                  <SortIcon field={field} />
                </th>
              ))}
              {isAdmin && (
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={colSpan} className="px-6 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-6 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        user.role === "superadmin"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : user.role === "admin"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                            : user.role === "hr"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{user.phone || "-"}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ${
                        user.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/dashboard/users/${user.id}/edit`}
                          className="flex gap-2 font-medium items-center text-[#1890FF] hover:text-[#1890FF]/90"
                        >
                          <SquarePen width={20} color="#1890FF" /> Edit
                        </Link>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="flex gap-2 font-medium items-center text-[#FF4D4F] hover:text-[#FF4D4F]/90"
                          >
                            <Trash width={20} color="#FF4D4F" />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={totalItems}
          perPage={perPage}
          onPageChange={setCurrentPage}
          onPerPageChange={setPerPage}
        />
      </div>
    </div>
  );
}
