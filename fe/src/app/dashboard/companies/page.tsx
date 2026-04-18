"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { SquarePen, Trash } from "lucide-react";
import { Company } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as companyService from "@/services/company-service";
import { getErrorMessage } from "@/lib/api";
import Pagination from "@/components/pagination";

type SortField = "name" | "email" | "phone" | "npwp" | "is_active" | "created_at";
type SortOrder = "asc" | "desc";

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default function CompaniesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Sort
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Multiple select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await companyService.getCompanies({
        page: currentPage,
        limit: perPage,
        search: search || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      if (res.success && res.data) {
        setCompanies(res.data.data);
        setTotalItems(res.data.total_items);
        setTotalPages(res.data.total_pages || 1);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch companies"));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [search, sortBy, sortOrder, perPage]);

  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(val), 400);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field)
      return (
        <span className="ml-1 text-gray-300 text-xs">
          ↑↓
        </span>
      );
    return (
      <span className="ml-1 text-orange-500 text-xs">
        {sortOrder === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(companies.map((c) => c.id)) : new Set());
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this company?")) return;
    try {
      const res = await companyService.deleteCompany(id);
      if (res.success) {
        setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
        fetchCompanies();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete company"));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} company(s)?`)) return;
    setIsDeleting(true);
    try {
      const res = await companyService.deleteMultipleCompanies(Array.from(selectedIds));
      if (res.success) {
        setSelectedIds(new Set());
        fetchCompanies();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete companies"));
    } finally {
      setIsDeleting(false);
    }
  };

  const safePage = Math.min(Math.max(currentPage, 1), totalPages || 1);
  const allSelected = companies.length > 0 && companies.every((c) => selectedIds.has(c.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Companies</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage company data</p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/companies/create"
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Add Company
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Search + Delete Selected — top right */}
      <div className="flex items-center justify-end gap-3">
        {isAdmin && selectedIds.size > 0 && (
          <button
            onClick={handleDeleteSelected}
            disabled={isDeleting}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {isDeleting ? "Deleting..." : `Delete Selected (${selectedIds.size})`}
          </button>
        )}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search"
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="w-64 rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-white dark:bg-gray-800">
            <tr>
              {isAdmin && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 accent-orange-500"
                  />
                </th>
              )}
              {(
                [
                  { label: "Name", field: "name" as SortField },
                  { label: "Email", field: "email" as SortField },
                  { label: "Phone", field: "phone" as SortField },
                  { label: "NPWP", field: "npwp" as SortField },
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
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-6 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                  Loading companies...
                </td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-6 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                  No companies found
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr
                  key={company.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedIds.has(company.id) ? "bg-orange-50" : ""}`}
                >
                  {isAdmin && (
                    <td className="px-4 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(company.id)}
                        onChange={(e) => handleSelectOne(company.id, e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600 accent-orange-500"
                      />
                    </td>
                  )}
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {company.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {company.email || "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {company.phone || "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {company.npwp || "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ${
                        company.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {company.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/dashboard/companies/${company.id}/edit`}
                        className="flex gap-2 font-medium items-center text-[#1890FF] hover:text-[#1890FF]/90"
                      >
                        <SquarePen width={20} color="#1890FF" /> Edit
                      </Link>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(company.id)}
                          className="flex gap-2 font-medium items-center text-[#FF4D4F] hover:text-[#FF4D4F]/90"
                        >
                          <Trash width={20} color="#FF4D4F" />
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
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
