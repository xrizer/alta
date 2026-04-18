"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import * as companyService from "@/services/company-service";
import * as moduleService from "@/services/module-service";
import type { Company, CompanyModule } from "@/lib/types";

export default function ModuleManagementPage() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === "superadmin";

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [rows, setRows] = useState<CompanyModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Load companies once
  useEffect(() => {
    (async () => {
      try {
        const res = await companyService.getCompanies({ page: 1, limit: 100 });
        if (res.success && res.data) {
          setCompanies(res.data.data);
          if (res.data.data.length > 0 && !selectedCompanyId) {
            setSelectedCompanyId(res.data.data[0].id);
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load companies");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRows = useCallback(async (companyId: string) => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await moduleService.getCompanyModules(companyId);
      if (res.success && res.data) {
        setRows(res.data);
      } else {
        setError(res.message || "Failed to load modules");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load modules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows(selectedCompanyId);
  }, [selectedCompanyId, loadRows]);

  const grouped = useMemo(() => {
    const out: Record<string, CompanyModule[]> = {};
    for (const r of rows) {
      const cat = r.module?.category ?? "other";
      if (!out[cat]) out[cat] = [];
      out[cat].push(r);
    }
    return out;
  }, [rows]);

  const handleToggle = async (row: CompanyModule, next: boolean) => {
    if (row.module?.is_core) return;
    setSavingKey(row.module_key);
    setError(null);
    try {
      const res = await moduleService.setCompanyModule(
        selectedCompanyId,
        row.module_key,
        { enabled: next }
      );
      if (res.success) {
        await loadRows(selectedCompanyId);
      } else {
        setError(res.message || "Update failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingKey(null);
    }
  };

  if (!isSuperadmin) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Module Management</h1>
        <p className="mt-3 text-gray-600">
          This page is restricted to superadmin users.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Module Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enable or disable feature modules per company. Core modules are always active.
          </p>
        </div>
        <select
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500">Loading modules…</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <section key={category}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {category}
              </h2>
              <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
                {items.map((row) => {
                  const m = row.module;
                  const isCore = m?.is_core ?? false;
                  const saving = savingKey === row.module_key;
                  return (
                    <div
                      key={row.module_key}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {m?.name ?? row.module_key}
                          </span>
                          {isCore && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-600">
                              Core
                            </span>
                          )}
                          {m?.depends_on && m.depends_on.length > 0 && (
                            <span className="text-[11px] text-gray-400">
                              needs: {m.depends_on.join(", ")}
                            </span>
                          )}
                        </div>
                        {m?.description && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            {m.description}
                          </p>
                        )}
                      </div>
                      <label
                        className={`relative inline-flex cursor-pointer items-center ${
                          isCore ? "cursor-not-allowed opacity-50" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={row.enabled}
                          disabled={isCore || saving}
                          onChange={(e) => handleToggle(row, e.target.checked)}
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                      </label>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
