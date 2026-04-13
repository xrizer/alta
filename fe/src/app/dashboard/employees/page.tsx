'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { SquarePen, Trash } from 'lucide-react';
import { Employee } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import * as employeeService from '@/services/employee-service';
import Pagination from '@/components/pagination';

type SortField =
  | 'employee_number'
  | 'name'
  | 'department'
  | 'position'
  | 'employee_status'
  | 'join_date';
type SortOrder = 'asc' | 'desc';

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-gray-400">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default function EmployeesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('employee_number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await employeeService.getEmployees();
      if (res.success && res.data) setAllEmployees(res.data);
    } catch {
      setError('Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, sortOrder, perPage]);

  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(val), 400);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field)
      return <span className="ml-1 text-gray-300 text-xs">↑↓</span>;
    return (
      <span className="ml-1 text-orange-500 text-xs">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      const res = await employeeService.deleteEmployee(id);
      if (res.success)
        setAllEmployees((prev) => prev.filter((e) => e.id !== id));
      else setError(res.message);
    } catch {
      setError('Failed to delete employee');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      tetap:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      kontrak:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      probation:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return (
      styles[status] ||
      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    );
  };

  const filtered = allEmployees.filter((emp) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      emp.employee_number?.toLowerCase().includes(q) ||
      emp.user?.name?.toLowerCase().includes(q) ||
      emp.department?.name?.toLowerCase().includes(q) ||
      emp.position?.name?.toLowerCase().includes(q) ||
      emp.employee_status?.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    let av = '',
      bv = '';
    if (sortBy === 'employee_number') {
      av = a.employee_number || '';
      bv = b.employee_number || '';
    } else if (sortBy === 'name') {
      av = a.user?.name || '';
      bv = b.user?.name || '';
    } else if (sortBy === 'department') {
      av = a.department?.name || '';
      bv = b.department?.name || '';
    } else if (sortBy === 'position') {
      av = a.position?.name || '';
      bv = b.position?.name || '';
    } else if (sortBy === 'employee_status') {
      av = a.employee_status || '';
      bv = b.employee_status || '';
    } else if (sortBy === 'join_date') {
      av = a.join_date || '';
      bv = b.join_date || '';
    }
    return sortOrder === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const employees = sorted.slice((safePage - 1) * perPage, safePage * perPage);

  const colSpan = isAdmin ? 7 : 6;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Employees
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage employee data
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/employees/create"
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors">
            <span className="text-base leading-none">+</span>
            Add Employee
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
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
            className="w-64 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-white dark:bg-gray-700">
            <tr>
              {(
                [
                  {
                    label: 'Employee No',
                    field: 'employee_number' as SortField,
                  },
                  { label: 'Name', field: 'name' as SortField },
                  { label: 'Department', field: 'department' as SortField },
                  { label: 'Position', field: 'position' as SortField },
                  { label: 'Status', field: 'employee_status' as SortField },
                  { label: 'Join Date', field: 'join_date' as SortField },
                ] as const
              ).map(({ label, field }) => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none hover:text-gray-900 dark:hover:text-white">
                  {label}
                  <SortIcon field={field} />
                </th>
              ))}
              {isAdmin && (
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-6 py-10 text-center text-sm text-gray-400">
                  Loading employees...
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-6 py-10 text-center text-sm text-gray-400">
                  No employees found
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {emp.employee_number}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {emp.user?.name || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {emp.department?.name || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {emp.position?.name || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ${statusBadge(emp.employee_status)}`}>
                      {emp.employee_status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(emp.join_date)}
                  </td>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/dashboard/employees/${emp.id}/edit`}
                          className="flex gap-2 font-medium items-center text-[#1890FF] hover:text-[#1890FF]/90">
                          <SquarePen width={20} color="#1890FF" /> Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="flex gap-2 font-medium items-center text-[#FF4D4F] hover:text-[#FF4D4F]/90">
                          <Trash width={20} color="#FF4D4F" />
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
