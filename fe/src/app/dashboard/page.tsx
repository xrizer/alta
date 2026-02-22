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
import { useState } from "react";

// --- Mock Data ---

const attendanceTrendData = [
  { day: "Mon", attendance: 72 },
  { day: "Tue", attendance: 78 },
  { day: "Wed", attendance: 65 },
  { day: "Thu", attendance: 80 },
  { day: "Fri", attendance: 75 },
  { day: "Sat", attendance: 68 },
];

const employeeStatusData = [
  { name: "Permanent", value: 52, color: "#7C3AED" },
  { name: "Contract", value: 18, color: "#FF6800" },
  { name: "Internship", value: 10, color: "#06B6D4" },
];

const deptHeadcountData = [
  { name: "Engineering", count: 32 },
  { name: "Product & Design", count: 10 },
  { name: "Data & DevOps", count: 8 },
  { name: "Sales & Marketing", count: 14 },
  { name: "Customer Support", count: 8 },
  { name: "HR & Finance", count: 8 },
];

const deptGenderData = [
  { name: "Engineering", male: 78, female: 12 },
  { name: "Product & Design", male: 50, female: 52 },
  { name: "Data & DevOps", male: 85, female: 43 },
  { name: "Sales & Marketing", male: 11, female: 50 },
  { name: "Customer Support", male: 87, female: 34 },
  { name: "HR & Finance", male: 30, female: 26 },
];

const notifications = [
  {
    id: 1,
    type: "warning",
    title: "Leave Request Pending",
    description: "Andi Pratama submitted a 3-day leave request",
    time: "3 Hours Ago",
  },
  {
    id: 2,
    type: "error",
    title: "Permission Request",
    description: "Siti Aisyah requested sick leave for today",
    time: "Today, 08:15 AM",
  },
  {
    id: 3,
    type: "warning",
    title: "New Reimbursement Request",
    description: "Dayat submitted a reimbursement of Rp300.000",
    time: "Yesterday",
  },
  {
    id: 4,
    type: "warning",
    title: "New Reimbursement Request",
    description: "Dayat submitted a reimbursement of Rp300.000",
    time: "Yesterday",
  },
];

const DEPT_COLORS = ["#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#374151", "#DC2626"];

export default function DashboardPage() {
  const { user } = useAuth();
  const [trendPeriod, setTrendPeriod] = useState("Last Week");

  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>

      {/* Greeting + Date */}
      <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-6 py-5">
        <div>
          <h3 className="text-xl font-bold text-orange-500">
            Halo, {user?.name || "Alta"}!
          </h3>
          <p className="mt-0.5 text-sm text-gray-500">
            Here&apos;s your HR overview for today
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">
            {dayName}, {dateStr}
          </p>
          <p className="text-2xl font-bold text-gray-900">{timeStr}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-700">Quick Actions</span>
        <div className="flex items-center gap-3">
          <button className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors">
            Review Attendance
          </button>
          <button className="rounded-lg border border-orange-500 px-5 py-2 text-sm font-medium text-orange-500 hover:bg-orange-50 transition-colors">
            Review Approval
          </button>
          <button className="rounded-lg border border-orange-500 px-5 py-2 text-sm font-medium text-orange-500 hover:bg-orange-50 transition-colors">
            Process Payroll
          </button>
        </div>
      </div>

      {/* Overview + Notifications */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Overview Cards */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-lg font-bold text-gray-900">Overview</h3>

          {/* Total Employees */}
          <div className="rounded-xl border border-gray-100 bg-white px-5 py-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                  <Users size={20} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">80</p>
                </div>
              </div>
              <div className="flex gap-8 border-l border-gray-200 pl-6">
                <div>
                  <p className="text-xs text-gray-400">Permanent</p>
                  <p className="text-lg font-bold text-gray-900">60</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Contract</p>
                  <p className="text-lg font-bold text-gray-900">13</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Internship</p>
                  <p className="text-lg font-bold text-gray-900">7</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance/Pending + Status Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            {/* Left: Today Attendance + colored status strips */}
            <div className="space-y-2">
              <div className="rounded-xl border border-gray-100 bg-white px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                      <CheckCircle size={20} className="text-green-500" />
                    </div>
                    <p className="text-xs text-gray-500">Today Attendance</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    75<span className="text-base font-normal text-gray-400">/80</span>
                  </p>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <div className="flex items-center justify-between bg-orange-50 px-4 py-2">
                  <span className="text-sm text-orange-500">Late</span>
                  <span className="text-base font-bold text-orange-500">10</span>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <div className="flex items-center justify-between bg-green-50 px-4 py-2">
                  <span className="text-sm text-green-600">On Leave</span>
                  <span className="text-base font-bold text-green-600">5</span>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <div className="flex items-center justify-between bg-red-50 px-4 py-2">
                  <span className="text-sm text-red-500">Absent</span>
                  <span className="text-base font-bold text-red-500">5</span>
                </div>
              </div>
            </div>

            {/* Right: Pending Approval + plain status rows */}
            <div className="space-y-2">
              <div className="rounded-xl border border-gray-100 bg-white px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                      <Clock size={20} className="text-orange-500" />
                    </div>
                    <p className="text-xs text-gray-500">Pending Approval</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
              </div>
              <div className="rounded-lg border border-gray-100 bg-white px-4 py-2 flex items-center justify-between">
                <span className="text-sm text-gray-600">Leave</span>
                <span className="text-base font-bold text-gray-900">2</span>
              </div>
              <div className="rounded-lg border border-gray-100 bg-white px-4 py-2 flex items-center justify-between">
                <span className="text-sm text-gray-600">Permission</span>
                <span className="text-base font-bold text-gray-900">2</span>
              </div>
              <div className="rounded-lg border border-gray-100 bg-white px-4 py-2 flex items-center justify-between">
                <span className="text-sm text-gray-600">Reimbursement</span>
                <span className="text-base font-bold text-gray-900">4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
            <button className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600">
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-5">
            {notifications.map((n) => (
              <div key={n.id} className="flex gap-3">
                <div className="mt-1.5">
                  <span
                    className={`block h-2.5 w-2.5 rounded-full ${
                      n.type === "error" ? "bg-red-500" : "bg-yellow-400"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.description}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clock size={11} /> {n.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics */}
      <h3 className="text-lg font-bold text-gray-900">Analytics</h3>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Attendance Trend */}
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-gray-900">Attendance Trend</h4>
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
              <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} domain={[0, 100]} />
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
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="h-2 w-2 rounded-full bg-indigo-500" /> Permanent
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="h-2 w-2 rounded-full bg-orange-500" /> Contract
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="h-2 w-2 rounded-full bg-cyan-500" /> Internship
            </span>
          </div>
        </div>

        {/* Employee Status (Pie Chart) */}
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <h4 className="text-sm font-bold text-gray-900 text-center mb-2">Employee Status</h4>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="60%" height={220}>
              <PieChart>
                <Pie
                  data={employeeStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
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
            <div className="flex flex-col gap-3 ml-2">
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
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <h4 className="text-sm font-bold text-gray-900 mb-4">Departement Headcount</h4>
          <ResponsiveContainer width="100%" height={240}>
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
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <h4 className="text-sm font-bold text-gray-900 mb-4">Departement Headcount</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={deptGenderData} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={120} />
              <Tooltip />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs text-gray-600 capitalize">{value}</span>
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
