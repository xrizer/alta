"use client";

import { useState, useEffect, useCallback } from "react";
import { Payroll, Employee } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as payrollService from "@/services/payroll-service";
import * as employeeService from "@/services/employee-service";

const formatCurrency = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export default function PayrollPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDetail, setShowDetail] = useState<Payroll | null>(null);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // Generate modal state
  const [showGenerate, setShowGenerate] = useState(false);
  const [genEmployee, setGenEmployee] = useState("");
  const [genMonth, setGenMonth] = useState(now.getMonth() + 1);
  const [genYear, setGenYear] = useState(now.getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError("");
      // Fetch payrolls and employees independently so one failure doesn't block the other
      const [payrollRes, empRes] = await Promise.allSettled([
        payrollService.getPayrolls({ month, year }),
        employeeService.getEmployees(),
      ]);
      if (payrollRes.status === "fulfilled" && payrollRes.value.success) {
        setPayrolls(payrollRes.value.data || []);
      }
      if (empRes.status === "fulfilled" && empRes.value.success) {
        setEmployees(empRes.value.data || []);
      }
      // Show error only if both failed
      if (payrollRes.status === "rejected" && empRes.status === "rejected") {
        setError("Failed to fetch data");
      }
    } catch {
      setError("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = async () => {
    if (!genEmployee) return;
    setError("");
    setSuccess("");
    setIsGenerating(true);
    try {
      const res = await payrollService.generatePayroll({
        employee_id: genEmployee,
        month: genMonth,
        year: genYear,
      });
      if (res.success) {
        setSuccess("Payroll generated successfully!");
        setShowGenerate(false);
        fetchData();
      } else {
        setError(res.message);
      }
    } catch {
      setError("Failed to generate payroll");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await payrollService.updatePayrollStatus(id, { status });
      if (res.success) {
        setSuccess(`Payroll status updated to ${status}`);
        fetchData();
      } else setError(res.message);
    } catch {
      setError("Failed to update status");
    }
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    processed: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="text-gray-500">Loading...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll</h2>
          <p className="mt-1 text-sm text-gray-600">Generate and manage monthly payroll</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowGenerate(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            Generate Payroll
          </button>
        )}
      </div>

      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{success}</div>}

      {/* Generate Modal */}
      {showGenerate && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Generate Payroll</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee *</label>
              <select value={genEmployee} onChange={(e) => setGenEmployee(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.employee_number} - {emp.user?.name || "Unknown"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Month</label>
              <select value={genMonth} onChange={(e) => setGenMonth(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString("id-ID", { month: "long" })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <select value={genYear} onChange={(e) => setGenYear(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                {Array.from({ length: 5 }, (_, i) => { const y = now.getFullYear() - 2 + i; return <option key={y} value={y}>{y}</option>; })}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowGenerate(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleGenerate} disabled={isGenerating || !genEmployee} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{isGenerating ? "Generating..." : "Generate"}</button>
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
          {Array.from({ length: 5 }, (_, i) => { const y = now.getFullYear() - 2 + i; return <option key={y} value={y}>{y}</option>; })}
        </select>
      </div>

      {/* Payroll Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Gross</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Deductions</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Net Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payrolls.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{p.employee?.user?.name || "-"}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{`${p.period_month}/${p.period_year}`}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatCurrency(p.gross_salary)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-red-500">{formatCurrency(p.total_deductions)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(p.net_salary)}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusColors[p.status] || "bg-gray-100 text-gray-800"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <button onClick={() => setShowDetail(p)} className="text-blue-600 hover:text-blue-900 mr-3">Detail</button>
                  {isAdmin && p.status === "draft" && (
                    <button onClick={() => handleStatusUpdate(p.id, "processed")} className="text-blue-600 hover:text-blue-900 mr-3">Process</button>
                  )}
                  {isAdmin && p.status === "processed" && (
                    <button onClick={() => handleStatusUpdate(p.id, "paid")} className="text-green-600 hover:text-green-900">Mark Paid</button>
                  )}
                </td>
              </tr>
            ))}
            {payrolls.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">No payroll records found for this period</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDetail(null)}>
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Payroll Detail</h3>
            <p className="text-sm text-gray-500">{showDetail.employee?.user?.name} — {showDetail.period_month}/{showDetail.period_year}</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Working Days</span><span>{showDetail.present_days}/{showDetail.working_days}</span></div>
              <hr />
              <div className="flex justify-between"><span className="text-gray-500">Basic Salary</span><span>{formatCurrency(showDetail.basic_salary)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Allowances</span><span>{formatCurrency(showDetail.total_allowances)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Overtime Pay</span><span>{formatCurrency(showDetail.overtime_pay)}</span></div>
              {showDetail.thr > 0 && <div className="flex justify-between"><span className="text-gray-500">THR</span><span>{formatCurrency(showDetail.thr)}</span></div>}
              <div className="flex justify-between font-semibold border-t pt-2"><span>Gross Salary</span><span>{formatCurrency(showDetail.gross_salary)}</span></div>
              <hr />
              <div className="flex justify-between text-red-600"><span>BPJS Kesehatan</span><span>-{formatCurrency(showDetail.bpjs_kes_deduction)}</span></div>
              <div className="flex justify-between text-red-600"><span>BPJS Ketenagakerjaan</span><span>-{formatCurrency(showDetail.bpjs_tk_deduction)}</span></div>
              <div className="flex justify-between text-red-600"><span>PPh 21</span><span>-{formatCurrency(showDetail.pph21)}</span></div>
              {showDetail.other_deductions > 0 && <div className="flex justify-between text-red-600"><span>Other</span><span>-{formatCurrency(showDetail.other_deductions)}</span></div>}
              <div className="flex justify-between font-semibold text-red-600 border-t pt-2"><span>Total Deductions</span><span>-{formatCurrency(showDetail.total_deductions)}</span></div>
              <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Net Salary</span><span className="text-green-600">{formatCurrency(showDetail.net_salary)}</span></div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowDetail(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
