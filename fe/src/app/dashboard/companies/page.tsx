"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Company } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as companyService from "@/services/company-service";

type SortField = "name" | "email" | "phone" | "npwp" | "is_active" | "created_at";
type SortOrder = "asc" | "desc";

export default function CompaniesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
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
    } catch {
      setError("Failed to fetch companies");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Reset to page 1 when search/sort/perPage changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [search, sortBy, sortOrder, perPage]);

  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(val);
    }, 400);
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
    if (sortBy !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-blue-500 ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(companies.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
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
    } catch {
      setError("Failed to delete company");
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
    } catch {
      setError("Failed to delete companies");
    } finally {
      setIsDeleting(false);
    }
  };

  const safePage = Math.min(Math.max(currentPage, 1), totalPages || 1);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * perPage + 1;
  const endItem = Math.min(safePage * perPage, totalItems);
  const allSelected = companies.length > 0 && companies.every((c) => selectedIds.has(c.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Companies</h2>
          <p className="mt-1 text-sm text-gray-600">Manage company data</p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/companies/create"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Add Company
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <input
            type="text"
            placeholder="Search by name, email, phone, NPWP..."
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
          {isAdmin && selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 whitespace-nowrap"
            >
              {isDeleting ? "Deleting..." : `Delete Selected (${selectedIds.size})`}
            </button>
          )}
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {isAdmin && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none hover:text-gray-700"
                onClick={() => handleSort("name")}
              >
                Name <SortIcon field="name" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none hover:text-gray-700"
                onClick={() => handleSort("email")}
              >
                Email <SortIcon field="email" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none hover:text-gray-700"
                onClick={() => handleSort("phone")}
              >
                Phone <SortIcon field="phone" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none hover:text-gray-700"
                onClick={() => handleSort("npwp")}
              >
                NPWP <SortIcon field="npwp" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none hover:text-gray-700"
                onClick={() => handleSort("is_active")}
              >
                Status <SortIcon field="is_active" />
              </th>
              {isAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 5} className="px-6 py-8 text-center text-sm text-gray-500">
                  Loading companies...
                </td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 5} className="px-6 py-8 text-center text-sm text-gray-500">
                  No companies found
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr
                  key={company.id}
                  className={`hover:bg-gray-50 ${selectedIds.has(company.id) ? "bg-blue-50" : ""}`}
                >
                  {isAdmin && (
                    <td className="px-4 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(company.id)}
                        onChange={(e) => handleSelectOne(company.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {company.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {company.email || "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {company.phone || "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {company.npwp || "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        company.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {company.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <Link
                        href={`/dashboard/companies/${company.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(company.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Rows per page:</label>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-900"
            >
              {[5, 10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {startItem}–{endItem} of {totalItems}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safePage <= 1}
                className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                &laquo;
              </button>
              <button
                onClick={() => setCurrentPage(safePage - 1)}
                disabled={safePage <= 1}
                className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span className="px-2 text-sm text-gray-700">
                Page {safePage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(safePage + 1)}
                disabled={safePage >= totalPages}
                className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage >= totalPages}
                className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
