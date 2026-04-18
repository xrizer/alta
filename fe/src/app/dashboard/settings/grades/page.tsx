"use client";

import { useState, useEffect, useCallback } from "react";
import { Grade, JobLevel } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as companyService from "@/services/company-service";
import * as gradeService from "@/services/grade-service";
import * as jobLevelService from "@/services/job-level-service";
import { getErrorMessage } from "@/lib/api";
import Pagination from "@/components/pagination";
import { SquarePen, Trash } from "lucide-react";

const formatSalary = (v: number) =>
  v > 0 ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v) : "—";

export default function GradesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [grades, setGrades] = useState<Grade[]>([]);
  const [jobLevels, setJobLevels] = useState<JobLevel[]>([]);
  const [companyID, setCompanyID] = useState("");
  const [filterJobLevel, setFilterJobLevel] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Grade | null>(null);
  const [formJobLevel, setFormJobLevel] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formMin, setFormMin] = useState(0);
  const [formMax, setFormMax] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [compRes, gradesRes, levelsRes] = await Promise.allSettled([
        companyService.getCompanies(),
        gradeService.getGrades(),
        jobLevelService.getJobLevels(),
      ]);
      if (compRes.status === "fulfilled" && compRes.value.success && compRes.value.data?.length) {
        setCompanyID(compRes.value.data[0].id);
      }
      if (gradesRes.status === "fulfilled" && gradesRes.value.success) {
        setGrades(gradesRes.value.data || []);
      }
      if (levelsRes.status === "fulfilled" && levelsRes.value.success) {
        setJobLevels(levelsRes.value.data || []);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch grades"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setFormJobLevel(filterJobLevel || (jobLevels[0]?.id ?? ""));
    setFormName("");
    setFormDesc("");
    setFormMin(0);
    setFormMax(0);
    setShowModal(true);
  };

  const openEdit = (g: Grade) => {
    setEditing(g);
    setFormJobLevel(g.job_level_id);
    setFormName(g.name);
    setFormDesc(g.description || "");
    setFormMin(g.min_salary);
    setFormMax(g.max_salary);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formJobLevel) return;
    setIsSaving(true);
    setError("");
    try {
      if (editing) {
        const res = await gradeService.updateGrade(editing.id, {
          job_level_id: formJobLevel,
          name: formName,
          description: formDesc,
          min_salary: formMin,
          max_salary: formMax,
        });
        if (res.success) { setSuccess("Grade updated"); setShowModal(false); fetchData(); }
        else setError(res.message);
      } else {
        const res = await gradeService.createGrade({
          company_id: companyID,
          job_level_id: formJobLevel,
          name: formName,
          description: formDesc,
          min_salary: formMin,
          max_salary: formMax,
        });
        if (res.success) { setSuccess("Grade created"); setShowModal(false); fetchData(); }
        else setError(res.message);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save grade"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this grade?")) return;
    setError("");
    try {
      const res = await gradeService.deleteGrade(id);
      if (res.success) { setSuccess("Grade deleted"); setGrades((prev) => prev.filter((g) => g.id !== id)); }
      else setError(res.message);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete grade"));
    }
  };

  const filtered = filterJobLevel ? grades.filter((g) => g.job_level_id === filterJobLevel) : grades;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const displayData = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Grades</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Salary bands per job level (Grade 1, Grade 2…)</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Add Grade
          </button>
        )}
      </div>

      {error && <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">{error}</div>}
      {success && <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4 text-sm text-green-700 dark:text-green-400">{success}</div>}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={filterJobLevel}
          onChange={(e) => { setFilterJobLevel(e.target.value); setCurrentPage(1); }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700"
        >
          <option value="">All Job Levels</option>
          {jobLevels.map((jl) => <option key={jl.id} value={jl.id}>{jl.name}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-white dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Grade</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Job Level</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Min Salary</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Max Salary</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
              {isAdmin && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {isLoading ? (
              <tr><td colSpan={isAdmin ? 6 : 5} className="px-6 py-10 text-center text-sm text-gray-400">Loading…</td></tr>
            ) : displayData.length === 0 ? (
              <tr><td colSpan={isAdmin ? 6 : 5} className="px-6 py-10 text-center text-sm text-gray-400">No grades found</td></tr>
            ) : (
              displayData.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{g.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{g.job_level_name || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatSalary(g.min_salary)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatSalary(g.max_salary)}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ${g.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                      {g.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => openEdit(g)} className="flex gap-1.5 items-center text-sm font-medium text-[#1890FF] hover:text-[#1890FF]/90">
                          <SquarePen size={16} /> Edit
                        </button>
                        <button onClick={() => handleDelete(g.id)} className="flex gap-1.5 items-center text-sm font-medium text-[#FF4D4F] hover:text-[#FF4D4F]/90">
                          <Trash size={16} /> Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination currentPage={safePage} totalPages={totalPages} totalItems={filtered.length} perPage={perPage} onPageChange={setCurrentPage} onPerPageChange={setPerPage} />
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="mx-4 w-full max-w-md rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editing ? "Edit Grade" : "Add Grade"}</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Level *</label>
                <select
                  value={formJobLevel}
                  onChange={(e) => setFormJobLevel(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                >
                  <option value="">Select job level</option>
                  {jobLevels.filter((jl) => jl.is_active).map((jl) => <option key={jl.id} value={jl.id}>{jl.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Grade Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Grade 1"
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Optional"
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Min Salary (IDR)</label>
                  <input
                    type="number"
                    value={formMin}
                    min={0}
                    onChange={(e) => setFormMin(Number(e.target.value))}
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Salary (IDR)</label>
                  <input
                    type="number"
                    value={formMax}
                    min={0}
                    onChange={(e) => setFormMax(Number(e.target.value))}
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formName.trim() || !formJobLevel}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving…" : editing ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
