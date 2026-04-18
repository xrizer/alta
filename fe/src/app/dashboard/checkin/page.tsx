"use client";

import { useState, useEffect, useCallback } from "react";
import { Attendance, Employee } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as attendanceService from "@/services/attendance-service";
import * as employeeService from "@/services/employee-service";
import { getErrorMessage } from "@/lib/api";

export default function CheckInPage() {
  const { user } = useAuth();
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayAttendance = useCallback(async (emp: Employee) => {
    const today = new Date().toISOString().split("T")[0];
    try {
      const res = await attendanceService.getAttendances({
        employee_id: emp.id,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        page: 1,
        limit: 31,
      });
      if (res.success && res.data) {
        const todayAtt = res.data.data.find((a: Attendance) => a.date?.startsWith(today));
        setTodayAttendance(todayAtt || null);
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const empRes = await employeeService.getMyEmployee();
        if (empRes.success && empRes.data) {
          setMyEmployee(empRes.data);
          await fetchTodayAttendance(empRes.data);
        }
      } catch {
        // Admin/HR users may not have an employee record
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [fetchTodayAttendance]);

  const handleClockIn = async () => {
    if (!myEmployee) return;
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      const res = await attendanceService.clockIn({ employee_id: myEmployee.id, notes: notes || undefined });
      if (res.success && res.data) {
        setTodayAttendance(res.data);
        setSuccess("Clock in successful!");
        setNotes("");
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to clock in"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    if (!todayAttendance) return;
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      const res = await attendanceService.clockOut(todayAttendance.id, { notes: notes || undefined });
      if (res.success && res.data) {
        setTodayAttendance(res.data);
        setSuccess("Clock out successful!");
        setNotes("");
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to clock out"));
    } finally {
      setIsSubmitting(false);
    }
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

  const getCheckInState = () => {
    if (!todayAttendance) return "not_clocked_in";
    if (!todayAttendance.clock_out) return "clocked_in";
    return "completed";
  };

  const checkInState = getCheckInState();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Check In / Check Out</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Record your daily attendance</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4 text-sm text-green-700 dark:text-green-400">
          {success}
        </div>
      )}

      {!myEmployee ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No employee record found for your account. Please contact HR or admin.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Clock Card */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="text-5xl font-bold tabular-nums text-gray-900 dark:text-white tracking-tight">
              {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {currentTime.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>

            {/* Notes input */}
            {checkInState !== "completed" && (
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Action Button */}
            {checkInState === "not_clocked_in" && (
              <button
                onClick={handleClockIn}
                disabled={isSubmitting}
                className="w-full rounded-lg bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Processing..." : "Clock In"}
              </button>
            )}
            {checkInState === "clocked_in" && (
              <button
                onClick={handleClockOut}
                disabled={isSubmitting}
                className="w-full rounded-lg bg-red-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Processing..." : "Clock Out"}
              </button>
            )}
            {checkInState === "completed" && (
              <div className="w-full rounded-lg bg-gray-100 dark:bg-gray-700 px-6 py-3 text-base font-semibold text-gray-500 dark:text-gray-400 text-center">
                Attendance completed for today
              </div>
            )}
          </div>

          {/* Today's Summary Card */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today&apos;s Summary</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Employee: <span className="font-medium text-gray-900 dark:text-white">{user?.name}</span>
            </p>

            {todayAttendance ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[todayAttendance.status] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}>
                    {statusLabels[todayAttendance.status] || todayAttendance.status}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Clock In</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatTime(todayAttendance.clock_in)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Clock Out</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatTime(todayAttendance.clock_out)}</span>
                </div>
                {todayAttendance.overtime_hours > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Overtime</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{todayAttendance.overtime_hours}h</span>
                  </div>
                )}
                {todayAttendance.notes && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Notes</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{todayAttendance.notes}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-4 mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">No attendance recorded yet today.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Click &quot;Clock In&quot; to start your day.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
