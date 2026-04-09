'use client';

import { Users, CheckCircle, Clock, ChevronRight } from 'react-feather';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Employee, Attendance, Leave } from '@/lib/types';
import { getEmployees } from '@/services/employee-service';
import { getAttendances } from '@/services/attendance-service';
import { getLeaves } from '@/services/leave-service';
import Typography from '@/components/ui/typography';

export default function OverviewSection() {
  function formatLocalDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay} days ago`;
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
  }

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
        getLeaves({ status: 'pending' }),
      ]);

      if (empResult.status === 'fulfilled' && empResult.value.data) {
        setEmployees(empResult.value.data);
      }
      if (attResult.status === 'fulfilled' && attResult.value.data) {
        setAllAttendances(attResult.value.data.data || []);
      }
      if (leaveResult.status === 'fulfilled' && leaveResult.value.data) {
        setPendingLeaves(leaveResult.value.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 1. Employee status counts
  const employeeStats = useMemo(() => {
    let permanent = 0,
      contract = 0,
      internship = 0;
    for (const emp of employees) {
      if (emp.employee_status === 'tetap') permanent++;
      else if (emp.employee_status === 'kontrak') contract++;
      else if (emp.employee_status === 'probation') internship++;
    }
    return { total: employees.length, permanent, contract, internship };
  }, [employees]);

  // 2. Today attendance
  const todayAttendance = useMemo(() => {
    const todayStr = formatLocalDate(new Date());
    const todayRecords = allAttendances.filter((a) => a.date === todayStr);
    let present = 0,
      late = 0,
      onLeave = 0,
      absent = 0;
    for (const a of todayRecords) {
      const s = a.status;
      if (s === 'terlambat' || s === 'late_in') late++;
      else if (s === 'cuti' || s === 'izin' || s === 'sakit') onLeave++;
      else if (s === 'alpha') absent++;
      else present++;
    }
    return { total: todayRecords.length, present, late, onLeave, absent };
  }, [allAttendances]);

  // 3. Pending approval breakdown
  const pendingStats = useMemo(() => {
    let leave = 0,
      permission = 0;
    for (const l of pendingLeaves) {
      const t = l.leave_type;
      if (t === 'izin' || t === 'dinas_luar') permission++;
      else leave++;
    }
    return { total: pendingLeaves.length, leave, permission, reimbursement: 0 };
  }, [pendingLeaves]);

  // 4. Notifications from pending leaves
  const notifications = useMemo(() => {
    const sorted = [...pendingLeaves].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return sorted.slice(0, 4).map((l) => {
      const empName = l.employee?.user?.name || 'Employee';
      const isLeave = l.leave_type !== 'izin' && l.leave_type !== 'dinas_luar';
      return {
        id: l.id,
        type: isLeave ? 'warning' : 'error',
        title: isLeave ? 'Leave Request Pending' : 'Permission Request',
        description: isLeave
          ? `${empName} submitted a ${l.total_days}-day leave request`
          : `${empName} requested ${l.leave_type === 'dinas_luar' ? 'business trip' : 'permission'} for ${l.total_days} day${l.total_days > 1 ? 's' : ''}`,
        time: formatRelativeTime(l.created_at),
      };
    });
  }, [pendingLeaves]);

  return (
    <div>
      <Typography variant="lg">Overview</Typography>
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total Employees
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {employeeStats.total}
                  </p>
                </div>
              </div>
              <div className="flex gap-6 border-t border-gray-200 dark:border-gray-700 pt-3 sm:gap-8 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Permanent
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {employeeStats.permanent}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Contract
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {employeeStats.contract}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Internship
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {employeeStats.internship}
                  </p>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Today Attendance
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {todayAttendance.total}
                    <span className="text-base font-normal text-gray-400">
                      /{employeeStats.total}
                    </span>
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-gray-100 dark:border-gray-700 dark:bg-gray-800 border-l-4 border-l-orange-500 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-orange-500 font-medium">
                    Late
                  </span>
                  <span className="text-base font-bold text-orange-500">
                    {todayAttendance.late}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-gray-100 dark:border-gray-700 dark:bg-gray-800 border-l-4 border-l-green-500 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-green-500 font-medium">
                    On Leave
                  </span>
                  <span className="text-base font-bold text-green-500">
                    {todayAttendance.onLeave}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-gray-100 dark:border-gray-700 dark:bg-gray-800 border-l-4 border-l-red-500 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-red-500 font-medium">
                    Absent
                  </span>
                  <span className="text-base font-bold text-red-500">
                    {todayAttendance.absent}
                  </span>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Pending Approval
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {pendingStats.total}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 px-4 py-2 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Leave
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  {pendingStats.leave}
                </span>
              </div>
              <div className="rounded-lg border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 px-4 py-2 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Permission
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  {pendingStats.permission}
                </span>
              </div>
              <div className="rounded-lg border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 px-4 py-2 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Reimbursement
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  {pendingStats.reimbursement}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Notifications
            </h3>
            <button className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600">
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-5">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No pending notifications
              </p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="flex gap-3">
                  <div className="mt-1.5">
                    <span
                      className={`block h-2.5 w-2.5 rounded-full ${
                        n.type === 'error' ? 'bg-red-500' : 'bg-yellow-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {n.description}
                    </p>
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
    </div>
  );
}
