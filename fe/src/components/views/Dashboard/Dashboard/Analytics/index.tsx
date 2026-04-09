'use client';

import { ChevronDown } from 'react-feather';
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
} from 'recharts';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Employee, Attendance } from '@/lib/types';
import { getEmployees } from '@/services/employee-service';
import { getAttendances } from '@/services/attendance-service';

const DEPT_COLORS = [
  '#3B82F6',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#374151',
  '#DC2626',
];

export default function Analytics() {
  function formatLocalDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
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

  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const [trendPeriod, setTrendPeriod] = useState<'This Week' | 'Last Week'>(
    'This Week',
  );

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allAttendances, setAllAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const fourteenDaysAgo = new Date(today);
      fourteenDaysAgo.setDate(today.getDate() - 14);

      const [empResult, attResult] = await Promise.allSettled([
        getEmployees(),
        getAttendances({
          start_date: formatLocalDate(fourteenDaysAgo),
          end_date: formatLocalDate(today),
          limit: 5000,
        }),
      ]);

      if (empResult.status === 'fulfilled' && empResult.value.data) {
        setEmployees(empResult.value.data);
      }

      if (attResult.status === 'fulfilled' && attResult.value.data) {
        setAllAttendances(attResult.value.data.data || []);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Employee status
  const employeeStats = useMemo(() => {
    let permanent = 0,
      contract = 0,
      internship = 0;

    for (const emp of employees) {
      if (emp.employee_status === 'tetap') permanent++;
      else if (emp.employee_status === 'kontrak') contract++;
      else if (emp.employee_status === 'probation') internship++;
    }

    return { permanent, contract, internship };
  }, [employees]);

  // Attendance trend
  const attendanceTrendData = useMemo(() => {
    const today = new Date();
    const thisMonday = getMonday(today);
    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(lastMonday.getDate() - 7);

    const startMonday = trendPeriod === 'This Week' ? thisMonday : lastMonday;

    return DAY_NAMES.map((name, i) => {
      const dayDate = new Date(startMonday);
      dayDate.setDate(startMonday.getDate() + i);
      const dayStr = formatLocalDate(dayDate);

      const dayRecords = allAttendances.filter((a) => a.date === dayStr);

      return {
        day: name,
        attendance: dayRecords.length,
      };
    });
  }, [allAttendances, trendPeriod]);

  // Pie data
  const employeeStatusData = useMemo(
    () => [
      { name: 'Permanent', value: employeeStats.permanent, color: '#7C3AED' },
      { name: 'Contract', value: employeeStats.contract, color: '#FF6800' },
      { name: 'Internship', value: employeeStats.internship, color: '#06B6D4' },
    ],
    [employeeStats],
  );

  // Department headcount
  const deptHeadcountData = useMemo(() => {
    const deptMap: Record<string, number> = {};

    for (const emp of employees) {
      const dept = emp.department?.name || 'Unknown';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    }

    return Object.entries(deptMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [employees]);

  // Department gender
  const deptGenderData = useMemo(() => {
    const deptMap: Record<string, { male: number; female: number }> = {};

    for (const emp of employees) {
      const dept = emp.department?.name || 'Unknown';

      if (!deptMap[dept]) {
        deptMap[dept] = { male: 0, female: 0 };
      }

      const g = (emp.gender || '').toLowerCase();

      if (g === 'male' || g === 'laki-laki' || g === 'l') {
        deptMap[dept].male++;
      } else if (g === 'female' || g === 'perempuan' || g === 'p') {
        deptMap[dept].female++;
      }
    }

    return Object.entries(deptMap)
      .map(([name, { male, female }]) => ({ name, male, female }))
      .sort((a, b) => b.male + b.female - (a.male + a.female));
  }, [employees]);

  return (
    <>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
        Analytics
      </h3>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Attendance Trend */}
        <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              Attendance Trend
            </h4>
            <button
              onClick={() =>
                setTrendPeriod(
                  trendPeriod === 'Last Week' ? 'This Week' : 'Last Week',
                )
              }
              className="flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-xs font-medium text-white">
              {trendPeriod} <ChevronDown size={14} />
            </button>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={attendanceTrendData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#F3F4F6"
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="attendance"
                stroke="#6366F1"
                strokeWidth={2}
                dot={{ r: 4, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Employee Status */}
        <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 md:p-5">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white text-center mb-2">
            Employee Status
          </h4>

          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={employeeStatusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value">
                {employeeStatusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Department Headcount */}
        <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 md:p-5">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
            Department Headcount
          </h4>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deptHeadcountData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Bar dataKey="count">
                {deptHeadcountData.map((_, i) => (
                  <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Gender */}
        <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 md:p-5">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
            Department Headcount by Gender
          </h4>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deptGenderData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Legend />
              <Bar dataKey="male" stackId="a" fill="#3B82F6" />
              <Bar dataKey="female" stackId="a" fill="#F472B6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
