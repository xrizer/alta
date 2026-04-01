"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Pagination from "@/components/pagination";
import { Attendance, Employee } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as attendanceService from "@/services/attendance-service";
import * as employeeService from "@/services/employee-service";

type SortKey = "date" | "employee" | "clock_in" | "clock_out" | "status" | "overtime" | "notes";
type SortDir = "asc" | "desc";

export default function AttendancePage() {
  const { user } = useAuth();
  const isAdminOrHr = user?.role === "admin" || user?.role === "hr";
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Global search filter
  const [globalSearch, setGlobalSearch] = useState("");

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; total: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Server-side pagination metadata
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      setError("");

      let empData: Employee | null = null;
      try {
        const empRes = await employeeService.getMyEmployee();
        if (empRes.success && empRes.data) {
          empData = empRes.data;
          setMyEmployee(empData);
        }
      } catch {
        // Admin/HR users may not have an employee record
      }

      const params: {
        employee_id?: string;
        month: number;
        year: number;
        page: number;
        limit: number;
        start_date?: string;
        end_date?: string;
      } = { month, year, page: currentPage, limit: perPage };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      if (isAdminOrHr) {
        const res = await attendanceService.getAttendances(params);
        if (res.success && res.data) {
          setAttendances(res.data.data || []);
          setTotalItems(res.data.total_items);
          setTotalPages(res.data.total_pages);
        }
      } else if (empData) {
        params.employee_id = empData.id;
        const res = await attendanceService.getAttendances(params);
        if (res.success && res.data) {
          setAttendances(res.data.data || []);
          setTotalItems(res.data.total_items);
          setTotalPages(res.data.total_pages);
        }
      }

      if (empData) {
        const today = new Date().toISOString().split("T")[0];
        try {
          const todayRes = await attendanceService.getAttendances({
            employee_id: empData.id,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            page: 1,
            limit: 31,
          });
          if (todayRes.success && todayRes.data) {
            const todayAtt = todayRes.data.data.find((a: Attendance) => a.date?.startsWith(today));
            if (todayAtt) setTodayAttendance(todayAtt);
          }
        } catch {
          // Non-critical
        }
      }
    } catch {
      setError("Failed to fetch attendance data");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminOrHr, month, year, currentPage, perPage, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClockIn = async () => {
    if (!myEmployee) return;
    setError("");
    setSuccess("");
    try {
      const res = await attendanceService.clockIn({ employee_id: myEmployee.id });
      if (res.success && res.data) {
        setTodayAttendance(res.data);
        setSuccess("Clock in successful!");
        fetchData();
      } else {
        setError(res.message);
      }
    } catch {
      setError("Failed to clock in");
    }
  };

  const handleClockOut = async () => {
    if (!todayAttendance) return;
    setError("");
    setSuccess("");
    try {
      const res = await attendanceService.clockOut(todayAttendance.id);
      if (res.success && res.data) {
        setTodayAttendance(res.data);
        setSuccess("Clock out successful!");
        fetchData();
      } else {
        setError(res.message);
      }
    } catch {
      setError("Failed to clock out");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);
    setError("");
    setSuccess("");

    try {
      const res = await attendanceService.importAttendance(file);
      if (res.success && res.data) {
        setImportResult(res.data);
        setSuccess(`Imported ${res.data.imported} of ${res.data.total} records`);
        fetchData();
      } else {
        setError(res.message);
      }
    } catch {
      setError("Failed to import file");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    // Use xlsx library to create a template
    import("xlsx").then((XLSX) => {
      const ws = XLSX.utils.aoa_to_sheet([
        ["employee_number", "date", "clock_in", "clock_out", "status", "overtime_hours", "notes"],
        ["EMP001", "2026-02-14", "08:00", "17:00", "hadir", "0", ""],
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      XLSX.writeFile(wb, "attendance_import_template.xlsx");
    });
  };

  const formatTime = (dt: string) => {
    if (!dt) return "-";
    return new Date(dt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const statusColors: Record<string, string> = {
    hadir: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    terlambat: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    alpha: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    izin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    sakit: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    cuti: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    early_in: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    on_time: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    late_in: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  };

  const statusLabels: Record<string, string> = {
    hadir: "Hadir",
    terlambat: "Terlambat",
    alpha: "Alpha",
    izin: "Izin",
    sakit: "Sakit",
    cuti: "Cuti",
    early_in: "Early In",
    on_time: "On Time",
    late_in: "Late In",
  };

  // Filter and sort attendances (global search + sort are client-side on current page)
  const filteredAndSorted = useMemo(() => {
    let filtered = [...attendances];

    // Global search filter — matches against all visible columns
    if (globalSearch) {
      const q = globalSearch.toLowerCase();
      filtered = filtered.filter((a) => {
        const date = (a.date || "").toLowerCase();
        const employee = (a.employee?.user?.name || "").toLowerCase();
        const clockIn = formatTime(a.clock_in).toLowerCase();
        const clockOut = formatTime(a.clock_out).toLowerCase();
        const status = (a.status || "").toLowerCase();
        const overtime = a.overtime_hours > 0 ? `${a.overtime_hours}h` : "-";
        const notes = (a.notes || "").toLowerCase();
        return (
          date.includes(q) ||
          employee.includes(q) ||
          clockIn.includes(q) ||
          clockOut.includes(q) ||
          status.includes(q) ||
          overtime.toLowerCase().includes(q) ||
          notes.includes(q)
        );
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "date":
          cmp = (a.date || "").localeCompare(b.date || "");
          break;
        case "employee":
          cmp = (a.employee?.user?.name || "").localeCompare(b.employee?.user?.name || "");
          break;
        case "clock_in":
          cmp = (a.clock_in || "").localeCompare(b.clock_in || "");
          break;
        case "clock_out":
          cmp = (a.clock_out || "").localeCompare(b.clock_out || "");
          break;
        case "status":
          cmp = (a.status || "").localeCompare(b.status || "");
          break;
        case "overtime":
          cmp = (a.overtime_hours || 0) - (b.overtime_hours || 0);
          break;
        case "notes":
          cmp = (a.notes || "").localeCompare(b.notes || "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [attendances, globalSearch, sortKey, sortDir]);

  // Reset to page 1 when server-side filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, month, year, perPage]);

  // Pagination uses server-side values; column search/sort are client-side on the current page
  const displayData = filteredAndSorted;
  const safePage = Math.min(currentPage, Math.max(1, totalPages));

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <span className="ml-1 text-gray-300">&uarr;&darr;</span>;
    }
    return <span className="ml-1">{sortDir === "asc" ? "\u2191" : "\u2193"}</span>;
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="text-gray-500">Loading...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Track daily attendance</p>
        </div>
        {isAdminOrHr && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Download Template
            </button>
            <label className={`cursor-pointer rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 ${isImporting ? "opacity-50 pointer-events-none" : ""}`}>
              {isImporting ? "Importing..." : "Import XLSX"}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleImport}
                disabled={isImporting}
              />
            </label>
          </div>
        )}
      </div>

      {error && <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">{error}</div>}
      {success && <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4 text-sm text-green-700 dark:text-green-400">{success}</div>}

      {/* Import Result Details */}
      {importResult && importResult.errors.length > 0 && (
        <div className="rounded-md border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/30 p-4">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Import completed with {importResult.errors.length} error(s):</p>
          <ul className="mt-2 max-h-32 overflow-y-auto text-sm text-yellow-700 dark:text-yellow-400">
            {importResult.errors.map((err, i) => (
              <li key={i}>- {err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Clock In/Out Card */}
      {myEmployee && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today&apos;s Attendance</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          <div className="mt-4 flex items-center gap-4">
            {!todayAttendance ? (
              <button onClick={handleClockIn} className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700">
                Clock In
              </button>
            ) : !todayAttendance.clock_out ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">Clocked in at {formatTime(todayAttendance.clock_in)}</span>
                <button onClick={handleClockOut} className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700">
                  Clock Out
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Clocked in: {formatTime(todayAttendance.clock_in)} — Clocked out: {formatTime(todayAttendance.clock_out)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString("id-ID", { month: "long" })}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700">
          {Array.from({ length: 5 }, (_, i) => {
            const y = now.getFullYear() - 2 + i;
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700"
          />
          <label className="text-sm text-gray-600 dark:text-gray-400">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(""); setEndDate(""); }}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Clear
            </button>
          )}
        </div>
        <div className="ml-auto">
          <input
            type="text"
            placeholder="Search all columns..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700 w-64"
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 cursor-pointer select-none" onClick={() => handleSort("date")}>
                  Date<SortIcon columnKey="date" />
                </th>
                {isAdminOrHr && (
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 cursor-pointer select-none" onClick={() => handleSort("employee")}>
                    Employee<SortIcon columnKey="employee" />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 cursor-pointer select-none" onClick={() => handleSort("clock_in")}>
                  Clock In<SortIcon columnKey="clock_in" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 cursor-pointer select-none" onClick={() => handleSort("clock_out")}>
                  Clock Out<SortIcon columnKey="clock_out" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 cursor-pointer select-none" onClick={() => handleSort("status")}>
                  Status<SortIcon columnKey="status" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 cursor-pointer select-none" onClick={() => handleSort("overtime")}>
                  Overtime<SortIcon columnKey="overtime" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 cursor-pointer select-none" onClick={() => handleSort("notes")}>
                  Notes<SortIcon columnKey="notes" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {displayData.map((att) => (
                <tr key={att.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">{att.date}</td>
                  {isAdminOrHr && <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">{att.employee?.user?.name || "-"}</td>}
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatTime(att.clock_in)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatTime(att.clock_out)}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusColors[att.status] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}>
                      {statusLabels[att.status] || att.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{att.overtime_hours > 0 ? `${att.overtime_hours}h` : "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{att.notes || "-"}</td>
                </tr>
              ))}
              {displayData.length === 0 && (
                <tr><td colSpan={isAdminOrHr ? 7 : 6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No attendance records found</td></tr>
              )}
            </tbody>
          </table>
        </div>

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
