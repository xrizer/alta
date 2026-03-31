"use client";

import { useAuth } from "@/contexts/auth-context";
import {
  Users,
  CheckCircle,
  Clock,
  ChevronRight,
  ChevronDown,
} from "react-feather";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Employee, Attendance, Leave } from "@/lib/types";
import { getEmployees } from "@/services/employee-service";
import { getAttendances } from "@/services/attendance-service";
import { getLeaves } from "@/services/leave-service";

const DEPT_COLORS = ["#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#374151", "#DC2626"];

// --- Helpers ---

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [trendPeriod, setTrendPeriod] = useState<"This Week" | "Last Week">("This Week");

  // Real-time clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Raw API data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allAttendances, setAllAttendances] = useState<Attendance[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const fourteenDaysAgo = new Date(today);
      fourteenDaysAgo.setDate(today.getDate() - 14);

      const [empResult, attResult, leaveResult] = await Promise.allSettled([
        getEmployees(),
        getAttendances({
          start_date: formatLocalDate(fourteenDaysAgo),
          end_date: formatLocalDate(today),
          limit: 5000,
        }),
        getLeaves({ status: "pending" }),
      ]);

      if (empResult.status === "fulfilled" && empResult.value.data) {
        setEmployees(empResult.value.data);
      }
      if (attResult.status === "fulfilled" && attResult.value.data) {
        setAllAttendances(attResult.value.data.data || []);
      }
      if (leaveResult.status === "fulfilled" && leaveResult.value.data) {
        setPendingLeaves(leaveResult.value.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Derived data ---

  // 1. Employee status counts
  const employeeStats = useMemo(() => {
    let permanent = 0, contract = 0, internship = 0;
    for (const emp of employees) {
      if (emp.employee_status === "tetap") permanent++;
      else if (emp.employee_status === "kontrak") contract++;
      else if (emp.employee_status === "probation") internship++;
    }
    return { total: employees.length, permanent, contract, internship };
  }, [employees]);

  // 2. Today attendance
  const todayAttendance = useMemo(() => {
    const todayStr = formatLocalDate(new Date());
    const todayRecords = allAttendances.filter((a) => a.date === todayStr);
    let present = 0, late = 0, onLeave = 0, absent = 0;
    for (const a of todayRecords) {
      const s = a.status;
      if (s === "terlambat" || s === "late_in") late++;
      else if (s === "cuti" || s === "izin" || s === "sakit") onLeave++;
      else if (s === "alpha") absent++;
      else present++;
    }
    return { total: todayRecords.length, present, late, onLeave, absent };
  }, [allAttendances]);

  // 3. Pending approval breakdown
  const pendingStats = useMemo(() => {
    let leave = 0, permission = 0;
    for (const l of pendingLeaves) {
      const t = l.leave_type;
      if (t === "izin" || t === "dinas_luar") permission++;
      else leave++;
    }
    return { total: pendingLeaves.length, leave, permission, reimbursement: 0 };
  }, [pendingLeaves]);

  // 4. Notifications from pending leaves
  const notifications = useMemo(() => {
    const sorted = [...pendingLeaves].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted.slice(0, 4).map((l) => {
      const empName = l.employee?.user?.name || "Employee";
      const isLeave = l.leave_type !== "izin" && l.leave_type !== "dinas_luar";
      return {
        id: l.id,
        type: isLeave ? "warning" : "error",
        title: isLeave ? "Leave Request Pending" : "Permission Request",
        description: isLeave
          ? `${empName} submitted a ${l.total_days}-day leave request`
          : `${empName} requested ${l.leave_type === "dinas_luar" ? "business trip" : "permission"} for ${l.total_days} day${l.total_days > 1 ? "s" : ""}`,
        time: formatRelativeTime(l.created_at),
      };
    });
  }, [pendingLeaves]);

  // 5. Attendance trend (weekly)
  const attendanceTrendData = useMemo(() => {
    const today = new Date();
    const thisMonday = getMonday(today);
    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(lastMonday.getDate() - 7);

    const startMonday = trendPeriod === "This Week" ? thisMonday : lastMonday;

    return DAY_NAMES.map((name, i) => {
      const dayDate = new Date(startMonday);
      dayDate.setDate(startMonday.getDate() + i);
      const dayStr = formatLocalDate(dayDate);
      const dayRecords = allAttendances.filter((a) => a.date === dayStr);
      return { day: name, attendance: dayRecords.length };
    });
  }, [allAttendances, trendPeriod]);

  // 6. Employee status pie chart
  const employeeStatusData = useMemo(() => [
    { name: "Permanent", value: employeeStats.permanent, color: "#7C3AED" },
    { name: "Contract", value: employeeStats.contract, color: "#FF6800" },
    { name: "Internship", value: employeeStats.internship, color: "#06B6D4" },
  ], [employeeStats]);

  // 7. Department headcount
  const deptHeadcountData = useMemo(() => {
    const deptMap: Record<string, number> = {};
    for (const emp of employees) {
      const dept = emp.department?.name || "Unknown";
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    }
    return Object.entries(deptMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [employees]);

  // 8. Department headcount by gender
  const deptGenderData = useMemo(() => {
    const deptMap: Record<string, { male: number; female: number }> = {};
    for (const emp of employees) {
      const dept = emp.department?.name || "Unknown";
      if (!deptMap[dept]) deptMap[dept] = { male: 0, female: 0 };
      const g = (emp.gender || "").toLowerCase();
      if (g === "male" || g === "laki-laki" || g === "l") deptMap[dept].male++;
      else if (g === "female" || g === "perempuan" || g === "p") deptMap[dept].female++;
    }
    return Object.entries(deptMap)
      .map(([name, { male, female }]) => ({ name, male, female }))
      .sort((a, b) => b.male + b.female - (a.male + a.female));
  }, [employees]);

  // --- Date / Time display ---
  const dayName = currentTime.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = currentTime.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // --- Loading skeleton ---
  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse dark:text-gray-100">
        <div className="h-7 w-36 rounded bg-gray-200 dark:bg-gray-700" />
        {/* Greeting skeleton */}
        <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 px-4 py-4 space-y-4 md:px-6 md:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-orange-500 md:text-xl">
                Halo, {user?.name || "Alta"}!
              </h3>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                Here&apos;s your HR overview for today
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {dayName}, {dateStr}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">{timeStr}</p>
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700" />
          <div className="h-10 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        {/* Overview skeleton */}
        <div className="h-6 w-28 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <div className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="h-52 rounded-xl bg-gray-200 dark:bg-gray-700" />
              <div className="h-52 rounded-xl bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
          <div className="h-72 rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>
        {/* Analytics skeleton */}
        <div className="h-6 w-28 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="h-72 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-72 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-72 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-72 rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h2>

      {/* Greeting + Date + Quick Actions */}
      <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 px-4 py-4 space-y-4 md:px-6 md:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-orange-500 md:text-xl">
              Halo, {user?.name || "Alta"}!
            </h3>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Here&apos;s your HR overview for today
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {dayName}, {dateStr}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">{timeStr}</p>
          </div>
        </div>
        <div className="border-t border-gray-100 dark:border-gray-700" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Quick Actions</span>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button onClick={() => router.push("/dashboard/attendance")} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors md:px-5">
              Review Attendance
            </button>
            <button onClick={() => router.push("/dashboard/leaves")} className="rounded-lg border border-orange-500 px-4 py-2 text-sm font-medium text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors md:px-5">
              Review Approval
            </button>
            <button onClick={() => router.push("/dashboard/payroll")} className="rounded-lg border border-orange-500 px-4 py-2 text-sm font-medium text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors md:px-5">
              Process Payroll
            </button>
          </div>
        </div>
      </div>

      {/* Overview + Notifications */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Overview</h3>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Overview Cards */}
        <div className="lg:col-span-2 space-y-3">
          {/* Total Employees */}
          <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 px-4 py-4 md:px-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                  <Users size={20} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{employeeStats.total}</p>
                </div>
              </div>
              <div className="flex gap-6 border-t border-gray-200 dark:border-gray-700 pt-3 sm:gap-8 sm:border-l sm:border-t-0 dark:border-gray-700 sm:pl-6 sm:pt-0">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Permanent</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{employeeStats.permanent}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Contract</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{employeeStats.contract}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Internship</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{employeeStats.internship}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance/Pending + Status Breakdown */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Left: Today Attendance + colored status strips */}
            <div className="space-y-2">
              <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 px-4 py-4 md:px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                      <CheckCircle size={20} className="text-green-500" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Today Attendance</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {todayAttendance.total}
                    <span className="text-base font-normal text-gray-400">/{employeeStats.total}</span>
                  </p>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <div className="flex items-center justify-between bg-orange-50 px-4 py-2">
                  <span className="text-sm text-orange-500">Late</span>
                  <span className="text-base font-bold text-orange-500">{todayAttendance.late}</span>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <div className="flex items-center justify-between bg-green-50 px-4 py-2">
                  <span className="text-sm text-green-600">On Leave</span>
                  <span className="text-base font-bold text-green-600">{todayAttendance.onLeave}</span>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <div className="flex items-center justify-between bg-red-50 px-4 py-2">
                  <span className="text-sm text-red-500">Absent</span>
                  <span className="text-base font-bold text-red-500">{todayAttendance.absent}</span>
                </div>
              </div>
            </div>

            {/* Right: Pending Approval + plain status rows */}
            <div className="space-y-2">
              <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 px-4 py-4 md:px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                      <Clock size={20} className="text-orange-500" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pending Approval</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingStats.total}</p>
                </div>
              </div>
              <div className="rounded-lg border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 px-4 py-2 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Leave</span>
                <span className="text-base font-bold text-gray-900 dark:text-white">{pendingStats.leave}</span>
              </div>
              <div className="rounded-lg border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 px-4 py-2 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Permission</span>
                <span className="text-base font-bold text-gray-900 dark:text-white">{pendingStats.permission}</span>
              </div>
              <div className="rounded-lg border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 px-4 py-2 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Reimbursement</span>
                <span className="text-base font-bold text-gray-900 dark:text-white">{pendingStats.reimbursement}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h3>
            <button className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600">
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-5">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No pending notifications</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="flex gap-3">
                  <div className="mt-1.5">
                    <span
                      className={`block h-2.5 w-2.5 rounded-full ${
                        n.type === "error" ? "bg-red-500" : "bg-yellow-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{n.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.description}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                      <Clock size={11} /> {n.time}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Analytics */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Analytics</h3>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Attendance Trend */}
        <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Attendance Trend</h4>
            <button
              onClick={() =>
                setTrendPeriod(trendPeriod === "Last Week" ? "This Week" : "Last Week")
              }
              className="flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-xs font-medium text-white"
            >
              {trendPeriod} <ChevronDown size={14} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={attendanceTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="attendance"
                stroke="#6366F1"
                strokeWidth={2}
                dot={{ r: 4, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="h-2 w-2 rounded-full bg-indigo-500" /> Attendance
            </span>
          </div>
        </div>

        {/* Employee Status (Pie Chart) */}
        <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 md:p-5">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white text-center mb-2">Employee Status</h4>
          <div className="flex flex-col items-center sm:flex-row sm:justify-center">
            <ResponsiveContainer width="100%" height={280} className="sm:max-w-[60%]">
              <PieChart>
                <Pie
                  data={employeeStatusData}
                  cx="50%"
                  cy="45%"
                  outerRadius={75}
                  dataKey="value"
                  label={({ name, value, percent, x, y, textAnchor }) => (
                    <text x={x} y={y} textAnchor={textAnchor} fill="#6B7280" fontSize={11}>
                      {`${name}`}
                      <tspan x={x} dy={14} fill={employeeStatusData.find(d => d.name === name)?.color} fontWeight="bold" fontSize={12}>
                        {`${value}`}
                      </tspan>
                      <tspan fill="#9CA3AF" fontSize={11}>{` ${((percent ?? 0) * 100).toFixed(1)}%`}</tspan>
                    </text>
                  )}
                  labelLine={{ stroke: "#D1D5DB", strokeWidth: 1 }}
                >
                  {employeeStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-row gap-4 mt-3 sm:mt-0 sm:ml-2 sm:flex-col sm:gap-3">
              {employeeStatusData.map((entry) => (
                <span key={entry.name} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Department Headcount */}
        <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 md:p-5">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Department Headcount</h4>
          <ResponsiveContainer width="100%" height={Math.max(240, deptHeadcountData.length * 40)}>
            <BarChart data={deptHeadcountData} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={120} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {deptHeadcountData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Headcount by Gender */}
        <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 md:p-5">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Department Headcount by Gender</h4>
          <ResponsiveContainer width="100%" height={Math.max(240, deptGenderData.length * 40)}>
            <BarChart data={deptGenderData} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={120} />
              <Tooltip />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs text-gray-600 dark:text-gray-300 capitalize">{value}</span>
                )}
              />
              <Bar dataKey="male" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="female" stackId="a" fill="#F472B6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
