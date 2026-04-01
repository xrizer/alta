"use client";

import { useState, useEffect } from "react";
import {
  Company,
  OrgStructureResponse,
  OrgDepartmentNode,
  OrgPositionNode,
} from "@/lib/types";
import * as companyService from "@/services/company-service";
import * as organizationService from "@/services/organization-service";

function EmployeeIcon() {
  return (
    <svg className="inline-block w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function PositionBranch({ position }: { position: OrgPositionNode }) {
  const [open, setOpen] = useState(true);
  return (
    <li className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-left w-full"
      >
        <span className="flex items-center justify-center w-6 h-6 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold">
          P
        </span>
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{position.name}</span>
        {position.employees.length > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
            ({position.employees.length})
            <span className="ml-1">{open ? "▾" : "▸"}</span>
          </span>
        )}
      </button>
      {open && position.employees.length > 0 && (
        <ul className="ml-8 border-l border-gray-200 dark:border-gray-700 pl-4 pb-1">
          {position.employees.map((emp) => (
            <li key={emp.id} className="py-1">
              <div className="flex items-center gap-2 py-1 px-3 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                <EmployeeIcon />
                <span>{emp.user_name}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">#{emp.employee_number}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function DepartmentBranch({ department }: { department: OrgDepartmentNode }) {
  const [open, setOpen] = useState(true);
  const totalEmployees = department.positions.reduce(
    (sum, pos) => sum + pos.employees.length,
    0
  );
  return (
    <li className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left w-full"
      >
        <span className="flex items-center justify-center w-6 h-6 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold">
          D
        </span>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{department.name}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
          {department.positions.length} position{department.positions.length !== 1 ? "s" : ""} · {totalEmployees} employee{totalEmployees !== 1 ? "s" : ""}
          <span className="ml-1">{open ? "▾" : "▸"}</span>
        </span>
      </button>
      {open && department.positions.length > 0 && (
        <ul className="ml-8 border-l border-gray-200 dark:border-gray-700 pl-4 pb-1">
          {department.positions.map((pos) => (
            <PositionBranch key={pos.id} position={pos} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function OrganizationStructurePage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [structure, setStructure] = useState<OrgStructureResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await companyService.getCompaniesAll();
        if (res.success && res.data) {
          setCompanies(res.data);
          if (res.data.length === 1) {
            setSelectedCompany(res.data[0].id);
          }
        }
      } catch {
        setError("Failed to load companies");
      } finally {
        setLoadingCompanies(false);
      }
    }
    loadCompanies();
  }, []);

  useEffect(() => {
    if (!selectedCompany) {
      setStructure(null);
      return;
    }

    async function loadStructure() {
      setLoading(true);
      setError("");
      try {
        const res = await organizationService.getOrganizationStructure(selectedCompany);
        if (res.success && res.data) {
          setStructure(res.data);
        } else {
          setError(res.message || "Failed to load organization structure");
        }
      } catch {
        setError("Failed to load organization structure");
      } finally {
        setLoading(false);
      }
    }
    loadStructure();
  }, [selectedCompany]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organization Structure</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Visual mapping of company hierarchy: Departments, Positions, and Employees
        </p>
      </div>

      {/* Company Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Company
        </label>
        {loadingCompanies ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading companies...</div>
        ) : (
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Select a company --</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading organization structure...</div>
        </div>
      )}

      {/* Tree Visualization */}
      {structure && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          {/* Company Root */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold">
              C
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{structure.company_name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {structure.departments.length} department{structure.departments.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {structure.departments.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
              No departments found for this company
            </div>
          ) : (
            <ul className="space-y-1 ml-4 border-l border-gray-200 dark:border-gray-700 pl-4">
              {structure.departments.map((dept) => (
                <DepartmentBranch key={dept.id} department={dept} />
              ))}
            </ul>
          )}

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">C</span>
              Company
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-[10px] font-bold">D</span>
              Department
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-[10px] font-bold">P</span>
              Position
            </div>
            <div className="flex items-center gap-1">
              <EmployeeIcon />
              Employee
            </div>
          </div>
        </div>
      )}

      {!selectedCompany && !loading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="text-gray-400 dark:text-gray-500 text-sm">
            Select a company to view its organization structure
          </div>
        </div>
      )}
    </div>
  );
}
