"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  const [specificDate, setSpecificDate] = useState("");

  // Column search filters
  const [searchDate, setSearchDate] = useState("");
  const [searchEmployee, setSearchEmployee] = useState("");
  const [searchClockIn, setSearchClockIn] = useState("");
  const [searchClockOut, setSearchClockOut] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [searchOvertime, setSearchOvertime] = useState("");
  const [searchNotes, setSearchNotes] = useState("");

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; total: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      if (isAdminOrHr) {
        const res = await attendanceService.getAttendances({ month, year });
        if (res.success) setAttendances(res.data || []);
      } else if (empData) {
        const res = await attendanceService.getAttendances({
          employee_id: empData.id,
          month,
          year,
        });
        if (res.success) setAttendances(res.data || []);
      }

      if (empData) {
        const today = new Date().toISOString().split("T")[0];
        try {
          const todayRes = await attendanceService.getAttendances({
            employee_id: empData.id,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          });
          if (todayRes.success && todayRes.data) {
            const todayAtt = todayRes.data.find((a: Attendance) => a.date?.startsWith(today));
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
  }, [isAdminOrHr, month, year]);

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
    hadir: "bg-green-100 text-green-800",
    terlambat: "bg-yellow-100 text-yellow-800",
    alpha: "bg-red-100 text-red-800",
    izin: "bg-blue-100 text-blue-800",
    sakit: "bg-purple-100 text-purple-800",
    cuti: "bg-indigo-100 text-indigo-800",
  };

  // Filter and sort attendances
  const filteredAndSorted = useMemo(() => {
    let filtered = [...attendances];

    // Specific date filter
    if (specificDate) {
      filtered = filtered.filter((a) => a.date === specificDate);
    }

    // Column search filters
    if (searchDate) {
      filtered = filtered.filter((a) => a.date?.toLowerCase().includes(searchDate.toLowerCase()));
    }
    if (searchEmployee) {
      filtered = filtered.filter((a) =>
        (a.employee?.user?.name || "").toLowerCase().includes(searchEmployee.toLowerCase())
      );
    }
    if (searchClockIn) {
      filtered = filtered.filter((a) => formatTime(a.clock_in).includes(searchClockIn));
    }
    if (searchClockOut) {
      filtered = filtered.filter((a) => formatTime(a.clock_out).includes(searchClockOut));
    }
    if (searchStatus) {
      filtered = filtered.filter((a) => a.status?.toLowerCase().includes(searchStatus.toLowerCase()));
    }
    if (searchOvertime) {
      filtered = filtered.filter((a) => {
        const val = a.overtime_hours > 0 ? `${a.overtime_hours}h` : "-";
        return val.toLowerCase().includes(searchOvertime.toLowerCase());
      });
    }
    if (searchNotes) {
      filtered = filtered.filter((a) =>
        (a.notes || "").toLowerCase().includes(searchNotes.toLowerCase())
      );
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
  }, [attendances, specificDate, searchDate, searchEmployee, searchClockIn, searchClockOut, searchStatus, searchOvertime, searchNotes, sortKey, sortDir]);

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
          <h2 className="text-2xl font-bold text-gray-900">Attendance</h2>
          <p className="mt-1 text-sm text-gray-600">Track daily attendance</p>
        </div>
        {isAdminOrHr && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Download Template
            </button>
            <label className={`cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 ${isImporting ? "opacity-50 pointer-events-none" : ""}`}>
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

      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{success}</div>}

      {/* Import Result Details */}
      {importResult && importResult.errors.length > 0 && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-800">Import completed with {importResult.errors.length} error(s):</p>
          <ul className="mt-2 max-h-32 overflow-y-auto text-sm text-yellow-700">
            {importResult.errors.map((err, i) => (
              <li key={i}>- {err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Clock In/Out Card */}
      {myEmployee && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Attendance</h3>
          <p className="mt-1 text-sm text-gray-500">{new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          <div className="mt-4 flex items-center gap-4">
            {!todayAttendance ? (
              <button onClick={handleClockIn} className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700">
                Clock In
              </button>
            ) : !todayAttendance.clock_out ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Clocked in at {formatTime(todayAttendance.clock_in)}</span>
                <button onClick={handleClockOut} className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700">
                  Clock Out
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                Clocked in: {formatTime(todayAttendance.clock_in)} — Clocked out: {formatTime(todayAttendance.clock_out)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString("id-ID", { month: "long" })}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900">
          {Array.from({ length: 5 }, (_, i) => {
            const y = now.getFullYear() - 2 + i;
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={specificDate}
            onChange={(e) => setSpecificDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            placeholder="Filter by date"
          />
          {specificDate && (
            <button
              onClick={() => setSpecificDate("")}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none" onClick={() => handleSort("date")}>
                  Date<SortIcon columnKey="date" />
                </th>
                {isAdminOrHr && (
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none" onClick={() => handleSort("employee")}>
                    Employee<SortIcon columnKey="employee" />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none" onClick={() => handleSort("clock_in")}>
                  Clock In<SortIcon columnKey="clock_in" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none" onClick={() => handleSort("clock_out")}>
                  Clock Out<SortIcon columnKey="clock_out" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none" onClick={() => handleSort("status")}>
                  Status<SortIcon columnKey="status" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none" onClick={() => handleSort("overtime")}>
                  Overtime<SortIcon columnKey="overtime" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none" onClick={() => handleSort("notes")}>
                  Notes<SortIcon columnKey="notes" />
                </th>
              </tr>
              {/* Column Search Row */}
              <tr className="bg-gray-50">
                <th className="px-6 py-2">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-normal text-gray-700"
                  />
                </th>
                {isAdminOrHr && (
                  <th className="px-6 py-2">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchEmployee}
                      onChange={(e) => setSearchEmployee(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-normal text-gray-700"
                    />
                  </th>
                )}
                <th className="px-6 py-2">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchClockIn}
                    onChange={(e) => setSearchClockIn(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-normal text-gray-700"
                  />
                </th>
                <th className="px-6 py-2">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchClockOut}
                    onChange={(e) => setSearchClockOut(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-normal text-gray-700"
                  />
                </th>
                <th className="px-6 py-2">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchStatus}
                    onChange={(e) => setSearchStatus(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-normal text-gray-700"
                  />
                </th>
                <th className="px-6 py-2">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchOvertime}
                    onChange={(e) => setSearchOvertime(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-normal text-gray-700"
                  />
                </th>
                <th className="px-6 py-2">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchNotes}
                    onChange={(e) => setSearchNotes(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-normal text-gray-700"
                  />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSorted.map((att) => (
                <tr key={att.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{att.date}</td>
                  {isAdminOrHr && <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{att.employee?.user?.name || "-"}</td>}
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatTime(att.clock_in)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatTime(att.clock_out)}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusColors[att.status] || "bg-gray-100 text-gray-800"}`}>
                      {att.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{att.overtime_hours > 0 ? `${att.overtime_hours}h` : "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{att.notes || "-"}</td>
                </tr>
              ))}
              {filteredAndSorted.length === 0 && (
                <tr><td colSpan={isAdminOrHr ? 7 : 6} className="px-6 py-8 text-center text-sm text-gray-500">No attendance records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
