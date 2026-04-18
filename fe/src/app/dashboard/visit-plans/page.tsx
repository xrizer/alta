"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Employee, VisitPlan, VisitPlanItemInput } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { getErrorMessage } from "@/lib/api";
import * as employeeService from "@/services/employee-service";
import * as visitPlanService from "@/services/visit-plan-service";

// My daily plan. Lets the employee draft tomorrow's stops, or view today's.
// Admin/HR see a richer page at /dashboard/visit-plans/report.
export default function VisitPlansPage() {
  const { user, enabledModules } = useAuth();
  const moduleEnabled = enabledModules?.includes("visit_planning") ?? true;

  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [plans, setPlans] = useState<VisitPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // New plan form
  const [planDate, setPlanDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<VisitPlanItemInput[]>([
    { location: "", sub_location: "", purpose: "", sequence_order: 1 },
  ]);

  const loadPlans = useCallback(async (empId: string) => {
    try {
      const res = await visitPlanService.listVisitPlansByEmployee(empId);
      if (res.success && res.data) setPlans(res.data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const empRes = await employeeService.getMyEmployee();
        if (empRes.success && empRes.data) {
          setMyEmployee(empRes.data);
          await loadPlans(empRes.data.id);
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [loadPlans]);

  const addItemRow = () =>
    setItems((prev) => [
      ...prev,
      {
        location: "",
        sub_location: "",
        purpose: "",
        sequence_order: prev.length + 1,
      },
    ]);

  const updateItem = (idx: number, patch: Partial<VisitPlanItemInput>) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    if (!myEmployee) return;
    const cleanItems = items.filter((it) => it.location.trim() !== "");
    if (cleanItems.length === 0) {
      setError("At least one item with a location is required");
      return;
    }
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      const res = await visitPlanService.createVisitPlan({
        employee_id: myEmployee.id,
        plan_date: planDate,
        notes: notes || undefined,
        items: cleanItems,
      });
      if (res.success) {
        setSuccess("Plan created");
        setNotes("");
        setItems([
          { location: "", sub_location: "", purpose: "", sequence_order: 1 },
        ]);
        await loadPlans(myEmployee.id);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create plan"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!moduleEnabled) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-sm text-gray-500">
        The Visit Planning module is not enabled for your company.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!myEmployee) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center text-gray-500">
        No employee record found for your account.
      </div>
    );
  }

  const isAdminOrHr = user?.role === "admin" || user?.role === "hr";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Visit Plans
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Pre-plan your daily visits; reconcile against actuals.
          </p>
        </div>
        {isAdminOrHr && (
          <Link
            href="/dashboard/visit-plans/report"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Daily Report
          </Link>
        )}
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create form */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            New plan
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="date"
              value={planDate}
              onChange={(e) => setPlanDate(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700"
            />
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes"
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700"
            />
          </div>
          <div className="space-y-2">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-gray-200 dark:border-gray-700 p-2 grid gap-2 sm:grid-cols-4"
              >
                <input
                  type="text"
                  value={it.location}
                  onChange={(e) =>
                    updateItem(idx, { location: e.target.value })
                  }
                  placeholder="Location"
                  className="col-span-2 rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm text-gray-900 dark:text-white dark:bg-gray-700"
                />
                <input
                  type="text"
                  value={it.sub_location || ""}
                  onChange={(e) =>
                    updateItem(idx, { sub_location: e.target.value })
                  }
                  placeholder="Sub-location"
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm text-gray-900 dark:text-white dark:bg-gray-700"
                />
                <input
                  type="text"
                  value={it.purpose || ""}
                  onChange={(e) => updateItem(idx, { purpose: e.target.value })}
                  placeholder="Purpose"
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm text-gray-900 dark:text-white dark:bg-gray-700"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="col-span-4 text-right text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={addItemRow}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add stop
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={isSubmitting}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              Save plan
            </button>
          </div>
        </div>

        {/* Existing plans */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            My plans ({plans.length})
          </h3>
          {plans.length === 0 ? (
            <p className="text-sm text-gray-500">No plans yet.</p>
          ) : (
            <ul className="space-y-3">
              {plans.map((p) => (
                <li
                  key={p.id}
                  className="rounded-lg border border-gray-100 dark:border-gray-700 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(p.plan_date).toLocaleDateString("id-ID")}
                    </span>
                    <span className="text-xs rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-gray-700 dark:text-gray-300">
                      {p.status}
                    </span>
                  </div>
                  {p.notes && (
                    <p className="text-xs text-gray-500 mt-1">{p.notes}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {p.items.length} stop{p.items.length === 1 ? "" : "s"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
