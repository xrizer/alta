"use client";

import { useState, useEffect, useCallback } from "react";
import { JobLevel } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as companyService from "@/services/company-service";
import * as jobLevelService from "@/services/job-level-service";
import { getErrorMessage } from "@/lib/api";
import Pagination from "@/components/pagination";
import { SquarePen, Trash } from "lucide-react";

export default function JobLevelsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [levels, setLevels] = useState<JobLevel[]>([]);
  const [companyID, setCompanyID] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<JobLevel | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formOrder, setFormOrder] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const fetchLevels = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [compRes, levelsRes] = await Promise.allSettled([
        companyService.getCompaniesAll(),
        jobLevelService.getJobLevels(),
      ]);
      if (compRes.status === "fulfilled" && compRes.value.success && compRes.value.data?.length) {
        setCompanyID(compRes.value.data[0].id);
      }
      if (levelsRes.status === "fulfilled" && levelsRes.value.success) {
        setLevels(levelsRes.value.data || []);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch job levels"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLevels(); }, [fetchLevels]);

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormDesc("");
    setFormOrder(levels.length + 1);
    setShowModal(true);
  };

  const openEdit = (jl: JobLevel) => {
    setEditing(jl);
    setFormName(jl.name);
    setFormDesc(jl.description || "");
    setFormOrder(jl.level_order);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setIsSaving(true);
    setError("");
    try {
      if (editing) {
        const res = await jobLevelService.updateJobLevel(editing.id, {
          name: formName,
          description: formDesc,
          level_order: formOrder,
        });
        if (res.success) {
          setSuccess("Job level updated");
          setShowModal(false);
          fetchLevels();
        } else {
          setError(res.message);
        }
      } else {
        const res = await jobLevelService.createJobLevel({
          company_id: companyID,
          name: formName,
          description: formDesc,
          level_order: formOrder,
        });
        if (res.success) {
          setSuccess("Job level created");
          setShowModal(false);
          fetchLevels();
        } else {
          setError(res.message);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save job level"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job level?")) return;
    setError("");
    try {
      const res = await jobLevelService.deleteJobLevel(id);
      if (res.success) {
        setSuccess("Job level deleted");
        setLevels((prev) => prev.filter((jl) => jl.id !== id));
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete job level"));
    }
  };

  const handleToggleActive = async (jl: JobLevel) => {
    setError("");
    try {
      const res = await jobLevelService.updateJobLevel(jl.id, { is_active: !jl.is_active });
      if (res.success) fetchLevels();
      else setError(res.message);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update status"));
    }
  };

  const totalPages = Math.max(1, Math.ceil(levels.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const displayData = levels.slice((safePage - 1) * perPage, safePage * perPage);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Job Levels</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Define hierarchy levels (Staff, Manager, Director…)</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Add Level
          </button>
        )}
      </div>

      {error && <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">{error}</div>}
      {success && <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4 text-sm text-green-700 dark:text-green-400">{success}</div>}

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-white dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Order</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Description</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
              {isAdmin && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {isLoading ? (
              <tr><td colSpan={isAdmin ? 5 : 4} className="px-6 py-10 text-center text-sm text-gray-400">Loading…</td></tr>
            ) : displayData.length === 0 ? (
              <tr><td colSpan={isAdmin ? 5 : 4} className="px-6 py-10 text-center text-sm text-gray-400">No job levels found</td></tr>
            ) : (
              displayData.map((jl) => (
                <tr key={jl.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{jl.level_order}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{jl.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{jl.description || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {isAdmin ? (
                      <button
                        onClick={() => handleToggleActive(jl)}
                        className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold cursor-pointer ${
                          jl.is_active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {jl.is_active ? "Active" : "Inactive"}
                      </button>
                    ) : (
                      <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ${jl.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {jl.is_active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => openEdit(jl)} className="flex gap-1.5 items-center text-sm font-medium text-[#1890FF] hover:text-[#1890FF]/90">
                          <SquarePen size={16} /> Edit
                        </button>
                        <button onClick={() => handleDelete(jl.id)} className="flex gap-1.5 items-center text-sm font-medium text-[#FF4D4F] hover:text-[#FF4D4F]/90">
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
        <Pagination currentPage={safePage} totalPages={totalPages} totalItems={levels.length} perPage={perPage} onPageChange={setCurrentPage} onPerPageChange={setPerPage} />
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="mx-4 w-full max-w-md rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editing ? "Edit Job Level" : "Add Job Level"}</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Manager"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Level Order</label>
                <input
                  type="number"
                  value={formOrder}
                  min={0}
                  onChange={(e) => setFormOrder(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formName.trim()}
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
