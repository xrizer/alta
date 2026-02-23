"use client";

import { useState, useEffect, useCallback } from "react";
import { Payroll } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as payrollService from "@/services/payroll-service";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function formatPeriod(month: number, year: number) {
  return `${monthNames[month - 1]} ${year}`;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PayslipsPage() {
  const { user } = useAuth();
  const isAdminOrHR = user?.role === "admin" || user?.role === "hr";
  const [payslips, setPayslips] = useState<Payroll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPayslip, setSelectedPayslip] = useState<Payroll | null>(null);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const fetchData = useCallback(async () => {
    try {
      setError("");
      setIsLoading(true);
      if (isAdminOrHR) {
        const res = await payrollService.getPayrolls({ month, year });
        if (res.success) {
          setPayslips(
            (res.data || []).filter((p) => p.status === "paid")
          );
        } else {
          setError(res.message);
        }
      } else {
        const res = await payrollService.getMyPayslips();
        if (res.success) {
          setPayslips(res.data || []);
        } else {
          setError(res.message);
        }
      }
    } catch {
      setError("Failed to fetch payslips");
    } finally {
      setIsLoading(false);
    }
  }, [month, year, isAdminOrHR]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );

  // Detail / Print View
  if (selectedPayslip) {
    return (
      <PayslipDetail
        payslip={selectedPayslip}
        onBack={() => setSelectedPayslip(null)}
      />
    );
  }

  // List View
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Payslips</h2>
        <p className="mt-1 text-sm text-gray-600">
          View and print your salary slips
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2000, i).toLocaleString("id-ID", { month: "long" })}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          {Array.from({ length: 5 }, (_, i) => {
            const y = now.getFullYear() - 2 + i;
            return (
              <option key={y} value={y}>
                {y}
              </option>
            );
          })}
        </select>
      </div>

      {/* Payslips Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {isAdminOrHR && (
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Employee
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Gross Salary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Deductions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Net Salary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Paid Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payslips.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                {isAdminOrHR && (
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {p.employee?.user?.name || "-"}
                  </td>
                )}
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatPeriod(p.period_month, p.period_year)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatCurrency(p.gross_salary)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-red-500">
                  {formatCurrency(p.total_deductions)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                  {formatCurrency(p.net_salary)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(p.paid_at)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <button
                    onClick={() => setSelectedPayslip(p)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Slip
                  </button>
                </td>
              </tr>
            ))}
            {payslips.length === 0 && (
              <tr>
                <td
                  colSpan={isAdminOrHR ? 7 : 6}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No payslips found for this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Formatted Payslip Detail / Print View
function PayslipDetail({
  payslip,
  onBack,
}: {
  payslip: Payroll;
  onBack: () => void;
}) {
  const emp = payslip.employee;
  const company = emp?.company;

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          aside, header, nav, .print-hidden { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; }
          body { background: white !important; }
          @page { margin: 15mm; size: A4; }
        }
      `}</style>

      {/* Action buttons (hidden on print) */}
      <div className="mb-6 flex items-center gap-3 print-hidden">
        <button
          onClick={onBack}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to List
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          Print Payslip
        </button>
      </div>

      {/* Payslip Document */}
      <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-8">
        {/* Company Header */}
        <div className="border-b-2 border-gray-800 pb-4 text-center">
          <h1 className="text-xl font-bold uppercase text-gray-900">
            {company?.name || "Company Name"}
          </h1>
          {company?.address && (
            <p className="mt-1 text-sm text-gray-600">{company.address}</p>
          )}
          <div className="mt-1 flex items-center justify-center gap-4 text-sm text-gray-600">
            {company?.phone && <span>{company.phone}</span>}
            {company?.email && <span>{company.email}</span>}
          </div>
        </div>

        {/* Title */}
        <div className="border-b border-gray-300 py-3 text-center">
          <h2 className="text-lg font-bold text-gray-900">SLIP GAJI</h2>
          <p className="text-sm text-gray-600">
            Periode: {formatPeriod(payslip.period_month, payslip.period_year)}
          </p>
        </div>

        {/* Employee Info */}
        <div className="border-b border-gray-300 py-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Data Karyawan
          </h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Nama</span>
              <span className="font-medium text-gray-900">
                {emp?.user?.name || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">No. Karyawan</span>
              <span className="font-medium text-gray-900">
                {emp?.employee_number || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Jabatan</span>
              <span className="font-medium text-gray-900">
                {emp?.position?.name || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Departemen</span>
              <span className="font-medium text-gray-900">
                {emp?.department?.name || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">NPWP</span>
              <span className="font-medium text-gray-900">
                {emp?.npwp || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className="font-medium text-gray-900 capitalize">
                {emp?.employee_status || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Earnings and Deductions Side by Side */}
        <div className="grid grid-cols-2 gap-0 border-b border-gray-300">
          {/* Pendapatan (Earnings) */}
          <div className="border-r border-gray-300 py-4 pr-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Pendapatan
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Gaji Pokok</span>
                <span className="text-gray-900">
                  {formatCurrency(payslip.basic_salary)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tunjangan</span>
                <span className="text-gray-900">
                  {formatCurrency(payslip.total_allowances)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lembur</span>
                <span className="text-gray-900">
                  {formatCurrency(payslip.overtime_pay)}
                </span>
              </div>
              {payslip.thr > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">THR</span>
                  <span className="text-gray-900">
                    {formatCurrency(payslip.thr)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
                <span className="text-gray-900">Total Pendapatan</span>
                <span className="text-gray-900">
                  {formatCurrency(payslip.gross_salary)}
                </span>
              </div>
            </div>
          </div>

          {/* Potongan (Deductions) */}
          <div className="py-4 pl-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Potongan
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">BPJS Kesehatan</span>
                <span className="text-red-600">
                  {formatCurrency(payslip.bpjs_kes_deduction)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">BPJS Ketenagakerjaan</span>
                <span className="text-red-600">
                  {formatCurrency(payslip.bpjs_tk_deduction)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">PPh 21</span>
                <span className="text-red-600">
                  {formatCurrency(payslip.pph21)}
                </span>
              </div>
              {payslip.other_deductions > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Potongan Lainnya</span>
                  <span className="text-red-600">
                    {formatCurrency(payslip.other_deductions)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
                <span className="text-red-600">Total Potongan</span>
                <span className="text-red-600">
                  {formatCurrency(payslip.total_deductions)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Info */}
        <div className="border-b border-gray-300 py-3">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div>
              <span className="text-gray-500">Hari Kerja: </span>
              <span className="font-medium text-gray-900">
                {payslip.working_days}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Hari Hadir: </span>
              <span className="font-medium text-gray-900">
                {payslip.present_days}
              </span>
            </div>
          </div>
        </div>

        {/* Take Home Pay */}
        <div className="border-b-2 border-gray-800 py-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">
              TAKE HOME PAY
            </span>
            <span className="text-xl font-bold text-green-600">
              {formatCurrency(payslip.net_salary)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 text-sm text-gray-500">
          <span>Tanggal Bayar: {formatDate(payslip.paid_at)}</span>
          <span>
            Dicetak:{" "}
            {new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Confidentiality Notice */}
        <div className="mt-6 rounded-lg bg-gray-50 p-3 text-center text-xs text-gray-400">
          Dokumen ini bersifat rahasia dan hanya ditujukan untuk karyawan yang
          bersangkutan.
        </div>
      </div>
    </>
  );
}
