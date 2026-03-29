"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Shift, Company } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as shiftService from "@/services/shift-service";
import * as companyService from "@/services/company-service";

type SortField = "name" | "company" | "start_time" | "end_time" | "is_active";
type SortOrder = "asc" | "desc";

function getPageNumbers(current: number, total: number, maxVisible = 3): number[] {
  if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1);
  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;
  if (end > total) {
    end = total;
    start = Math.max(1, end - maxVisible + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

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

export default function ShiftsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [shiftsRes, companiesRes] = await Promise.all([
        shiftService.getShifts(),
        companyService.getCompaniesAll(),
      ]);
      if (shiftsRes.success && shiftsRes.data) setAllShifts(shiftsRes.data);
      if (companiesRes.success && companiesRes.data) setCompanies(companiesRes.data);
    } catch {
      setError("Failed to fetch shifts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
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

  const getCompanyName = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    return company ? company.name : "-";
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shift?")) return;
    try {
      const res = await shiftService.deleteShift(id);
      if (res.success) setAllShifts((prev) => prev.filter((s) => s.id !== id));
      else setError(res.message);
    } catch {
      setError("Failed to delete shift");
    }
  };

  const filtered = allShifts.filter((shift) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const companyName = shift.company?.name || getCompanyName(shift.company_id);
    return (
      shift.name?.toLowerCase().includes(q) ||
      companyName.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const companyA = a.company?.name || getCompanyName(a.company_id);
    const companyB = b.company?.name || getCompanyName(b.company_id);
    if (sortBy === "name") {
      return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    if (sortBy === "company") {
      return sortOrder === "asc" ? companyA.localeCompare(companyB) : companyB.localeCompare(companyA);
    }
    if (sortBy === "start_time") {
      const av = a.start_time || ""; const bv = b.start_time || "";
      return sortOrder === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    if (sortBy === "end_time") {
      const av = a.end_time || ""; const bv = b.end_time || "";
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
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * perPage + 1;
  const endItem = Math.min(safePage * perPage, totalItems);
  const shifts = sorted.slice((safePage - 1) * perPage, safePage * perPage);
  const pageNumbers = getPageNumbers(safePage, totalPages);

  const colSpan = isAdmin ? 6 : 5;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shifts</h2>
          <p className="mt-1 text-sm text-gray-500">Manage work shifts</p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/shifts/create"
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Add Shift
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
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
            className="w-64 rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              {(
                [
                  { label: "Name", field: "name" as SortField },
                  { label: "Company", field: "company" as SortField },
                  { label: "Start Time", field: "start_time" as SortField },
                  { label: "End Time", field: "end_time" as SortField },
                  { label: "Status", field: "is_active" as SortField },
                ] as const
              ).map(({ label, field }) => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none hover:text-gray-900"
                >
                  {label}
                  <SortIcon field={field} />
                </th>
              ))}
              {isAdmin && (
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={colSpan} className="px-6 py-10 text-center text-sm text-gray-400">
                  Loading shifts...
                </td>
              </tr>
            ) : shifts.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-6 py-10 text-center text-sm text-gray-400">
                  No shifts found
                </td>
              </tr>
            ) : (
              shifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-gray-50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{shift.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{shift.company?.name || getCompanyName(shift.company_id)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{shift.start_time}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{shift.end_time}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ${
                        shift.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {shift.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/dashboard/shifts/${shift.id}/edit`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <EditIcon />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(shift.id)}
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

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
          <p className="text-sm text-gray-500">
            Showing {startItem} to {endItem} of {totalItems} results
          </p>
          <div className="flex items-center gap-1">
            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[32px] h-8 rounded px-2 text-sm font-medium transition-colors ${
                  page === safePage ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(safePage + 1, totalPages))}
              disabled={safePage >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              &gt;
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Page per Row</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:outline-none focus:border-orange-400"
            >
              {[5, 10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
