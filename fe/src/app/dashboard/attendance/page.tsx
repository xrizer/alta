"use client";

import { useState, useEffect, useCallback } from "react";
import { Attendance, Employee } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as attendanceService from "@/services/attendance-service";
import * as employeeService from "@/services/employee-service";

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

  const fetchData = useCallback(async () => {
    try {
      setError("");

      // Try to get my employee record (admin may not have one — that's ok)
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

      // Fetch attendance list
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

      // Check today's attendance for clock in/out card
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
          // Non-critical — clock in/out card just won't show today's record
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

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="text-gray-500">Loading...</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Attendance</h2>
        <p className="mt-1 text-sm text-gray-600">Track daily attendance</p>
      </div>

      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{success}</div>}

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

      {/* Filter */}
      <div className="flex items-center gap-4">
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
      </div>

      {/* Attendance Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
              {isAdminOrHr && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Employee</th>}
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Clock In</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Clock Out</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Overtime</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {attendances.map((att) => (
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
            {attendances.length === 0 && (
              <tr><td colSpan={isAdminOrHr ? 7 : 6} className="px-6 py-8 text-center text-sm text-gray-500">No attendance records found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
