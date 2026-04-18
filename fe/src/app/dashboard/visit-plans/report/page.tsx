"use client";

import { useCallback, useEffect, useState } from "react";
import { Company, VisitAdherenceReport } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { getErrorMessage } from "@/lib/api";
import * as companyService from "@/services/company-service";
import * as visitPlanService from "@/services/visit-plan-service";

// Admin/HR view: daily visit-adherence report for a chosen company + date.
// Under-minimum (default <5 visits/day, PT Ahmad Aris policy) is a soft flag
// — the row is highlighted but no action is forced on the employee.
export default function VisitAdherenceReportPage() {
  const { user, enabledModules } = useAuth();
  const moduleEnabled = enabledModules?.includes("visit_planning") ?? true;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [minimum, setMinimum] = useState(5);
  const [report, setReport] = useState<VisitAdherenceReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isAllowed = user?.role === "admin" || user?.role === "hr" || user?.role === "superadmin";

  useEffect(() => {
    if (!isAllowed) return;
    companyService.getCompaniesAll().then((res) => {
      if (res.success && res.data) {
        setCompanies(res.data);
        if (res.data.length > 0 && !companyId) setCompanyId(res.data[0].id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAllowed]);

  const loadReport = useCallback(async () => {
    if (!companyId || !date) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await visitPlanService.getAdherenceReport({
        company_id: companyId,
        date,
        minimum,
      });
      if (res.success && res.data) {
        setReport(res.data);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load report"));
    } finally {
      setIsLoading(false);
    }
  }, [companyId, date, minimum]);

  if (!moduleEnabled) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-sm text-gray-500">
        The Visit Planning module is not enabled for your company.
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-sm text-gray-500">
        Admin or HR access required.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Visit Adherence Report
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Daily planned-vs-actual. Minimum {minimum} visits/day is a soft flag.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 grid gap-3 sm:grid-cols-4 items-end">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Company
          </label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Minimum
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={minimum}
              onChange={(e) => setMinimum(parseInt(e.target.value) || 5)}
              className="w-20 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700"
            />
            <button
              type="button"
              onClick={loadReport}
              disabled={isLoading || !companyId}
              className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Run"}
            </button>
          </div>
        </div>
      </div>

      {report && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3 text-right">Planned</th>
                <th className="px-4 py-3 text-right">Actual</th>
                <th className="px-4 py-3 text-right">Matched</th>
                <th className="px-4 py-3 text-right">Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {report.rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    No data for this date.
                  </td>
                </tr>
              ) : (
                report.rows.map((row) => (
                  <tr
                    key={row.employee_id}
                    className={
                      row.under_minimum
                        ? "bg-red-50/50 dark:bg-red-900/10"
                        : ""
                    }
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {row.employee_name || row.employee_id}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.planned_count}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.actual_count}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.matched_count}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.under_minimum ? (
                        <span className="inline-flex rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 text-xs font-semibold">
                          &lt; {row.minimum_target}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 text-xs font-semibold">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
