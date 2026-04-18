"use client";

import { useCallback, useEffect, useState } from "react";
import { Attendance, Employee, Visit } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { getErrorMessage } from "@/lib/api";
import * as attendanceService from "@/services/attendance-service";
import * as employeeService from "@/services/employee-service";
import * as visitService from "@/services/visit-service";

// Self-service visits page — shows today's attendance + nested visits and lets
// the employee start a new visit or end the currently open one. Non-sales
// tenants never see this page because the sidebar gates it on the
// visit_tracking module.
export default function VisitsPage() {
  const { enabledModules } = useAuth();
  const moduleEnabled = enabledModules?.includes("visit_tracking") ?? true;

  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Start visit form
  const [location, setLocation] = useState("");
  const [subLocation, setSubLocation] = useState("");
  const [purpose, setPurpose] = useState("");

  // End visit form
  const [endingId, setEndingId] = useState<string>("");
  const [resultNotes, setResultNotes] = useState("");

  const loadVisits = useCallback(async (attendanceId: string) => {
    try {
      const res = await visitService.getVisitsByAttendance(attendanceId);
      if (res.success && res.data) setVisits(res.data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const empRes = await employeeService.getMyEmployee();
        if (empRes.success && empRes.data) {
          setMyEmployee(empRes.data);
          const today = new Date().toISOString().split("T")[0];
          const attRes = await attendanceService.getAttendances({
            employee_id: empRes.data.id,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            page: 1,
            limit: 31,
          });
          if (attRes.success && attRes.data) {
            const todayAtt = attRes.data.data.find((a: Attendance) =>
              a.date?.startsWith(today)
            );
            if (todayAtt) {
              setTodayAttendance(todayAtt);
              await loadVisits(todayAtt.id);
            }
          }
        }
      } catch {
        // non-critical
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [loadVisits]);

  const openVisit = visits.find((v) => !v.left_at);

  const handleStart = async () => {
    if (!todayAttendance || !location.trim()) {
      setError("Please clock in first and enter a location");
      return;
    }
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      const res = await visitService.startVisit({
        attendance_id: todayAttendance.id,
        location,
        sub_location: subLocation || undefined,
        purpose: purpose || undefined,
      });
      if (res.success) {
        setSuccess("Visit started");
        setLocation("");
        setSubLocation("");
        setPurpose("");
        await loadVisits(todayAttendance.id);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to start visit"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnd = async (visitId: string) => {
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      const res = await visitService.endVisit(visitId, {
        result_notes: resultNotes || undefined,
      });
      if (res.success) {
        setSuccess("Visit ended");
        setResultNotes("");
        setEndingId("");
        if (todayAttendance) await loadVisits(todayAttendance.id);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to end visit"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmtTime = (dt?: string) =>
    !dt
      ? "-"
      : new Date(dt).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });

  if (!moduleEnabled) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-sm text-gray-500">
        The Multi-Point Visit Tracking module is not enabled for your company.
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Visits
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Log multiple on-site visits within today&apos;s attendance session.
        </p>
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

      {!todayAttendance ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center text-gray-500">
          You need to clock in first before logging visits today.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Start / End card */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-3">
            {openVisit ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  End current visit
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {openVisit.location}
                  {openVisit.sub_location ? ` — ${openVisit.sub_location}` : ""}
                </p>
                <p className="text-xs text-gray-400">
                  Arrived {fmtTime(openVisit.arrived_at)}
                </p>
                <textarea
                  value={endingId === openVisit.id ? resultNotes : ""}
                  onFocus={() => setEndingId(openVisit.id)}
                  onChange={(e) => setResultNotes(e.target.value)}
                  placeholder="Result notes (optional)"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700"
                  rows={3}
                />
                <button
                  type="button"
                  onClick={() => handleEnd(openVisit.id)}
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  End Visit
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Start a new visit
                </h3>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location (required)"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700"
                />
                <input
                  type="text"
                  value={subLocation}
                  onChange={(e) => setSubLocation(e.target.value)}
                  placeholder="Sub-location (e.g. ward / booth)"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700"
                />
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Purpose"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700"
                />
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Start Visit
                </button>
              </>
            )}
          </div>

          {/* Timeline card */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Today&apos;s visits ({visits.length})
            </h3>
            {visits.length === 0 ? (
              <p className="text-sm text-gray-500">No visits logged yet.</p>
            ) : (
              <ul className="space-y-3">
                {visits.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-start gap-3 border-l-2 pl-3 border-blue-400"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {v.location}
                        {v.sub_location ? ` — ${v.sub_location}` : ""}
                      </p>
                      {v.purpose && (
                        <p className="text-xs text-gray-500">{v.purpose}</p>
                      )}
                      <p className="text-xs text-gray-400 tabular-nums">
                        {fmtTime(v.arrived_at)}
                        {v.left_at ? ` → ${fmtTime(v.left_at)}` : " — open"}
                      </p>
                      {v.result_notes && (
                        <p className="text-xs mt-1 text-gray-600 dark:text-gray-300">
                          {v.result_notes}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
