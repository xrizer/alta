"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Position } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as positionService from "@/services/position-service";
import Pagination from "@/components/pagination";

type SortField = "name" | "company" | "department" | "base_salary" | "is_active";
type SortOrder = "asc" | "desc";

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

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const formatSalary = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);

export default function PositionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPositions = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await positionService.getPositions();
      if (res.success && res.data) setAllPositions(res.data);
    } catch {
      setError("Failed to fetch positions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPositions(); }, [fetchPositions]);
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
    if (!confirm("Are you sure you want to delete this position?")) return;
    try {
      const res = await positionService.deletePosition(id);
      if (res.success) setAllPositions((prev) => prev.filter((p) => p.id !== id));
      else setError(res.message);
    } catch {
      setError("Failed to delete position");
    }
  };

  const filtered = allPositions.filter((pos) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      pos.name?.toLowerCase().includes(q) ||
      pos.company?.name?.toLowerCase().includes(q) ||
      pos.department?.name?.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name") {
      return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    if (sortBy === "company") {
      const av = a.company?.name || ""; const bv = b.company?.name || "";
      return sortOrder === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    if (sortBy === "department") {
      const av = a.department?.name || ""; const bv = b.department?.name || "";
      return sortOrder === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    if (sortBy === "base_salary") {
      return sortOrder === "asc" ? a.base_salary - b.base_salary : b.base_salary - a.base_salary;
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
  const positions = sorted.slice((safePage - 1) * perPage, safePage * perPage);

  const colSpan = isAdmin ? 6 : 5;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Positions</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage position data</p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/positions/create"
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Add Position
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
                  { label: "Company", field: "company" as SortField },
                  { label: "Department", field: "department" as SortField },
                  { label: "Base Salary", field: "base_salary" as SortField },
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
                  Loading positions...
                </td>
              </tr>
            ) : positions.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-6 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                  No positions found
                </td>
              </tr>
            ) : (
              positions.map((position) => (
                <tr key={position.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{position.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{position.company?.name || "-"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{position.department?.name || "-"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatSalary(position.base_salary)}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ${
                        position.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
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
