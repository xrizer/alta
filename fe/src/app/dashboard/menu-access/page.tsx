"use client";

import { useState, useEffect, useCallback } from "react";
import { User, MenuAccessConfig } from "@/lib/types";
import * as userService from "@/services/user-service";
import * as menuAccessService from "@/services/menu-access-service";

const ALL_MENU_SECTIONS = [
  {
    section: "General",
    items: [{ key: "dashboard", label: "Dashboard" }],
  },
  {
    section: "Organization",
    items: [
      { key: "companies", label: "Companies" },
      { key: "departments", label: "Departments" },
      { key: "positions", label: "Positions" },
      { key: "shifts", label: "Shifts" },
      { key: "organization_structure", label: "Organization Structure" },
    ],
  },
  {
    section: "People",
    items: [
      { key: "users", label: "Users" },
      { key: "employees", label: "Employees" },
    ],
  },
  {
    section: "Time & Attendance",
    items: [
      { key: "attendance", label: "Attendance" },
      { key: "leaves", label: "Leaves" },
    ],
  },
  {
    section: "Payroll",
    items: [{ key: "payroll", label: "Payroll" }],
  },
  {
    section: "Administration",
    items: [{ key: "menu_access_policy", label: "Menu Access Policy" }],
  },
];

// Default menu keys per role
const ROLE_DEFAULTS: Record<string, string[]> = {
  admin: [
    "dashboard", "companies", "departments", "positions", "shifts",
    "organization_structure", "users", "employees", "attendance", "leaves",
    "payroll", "menu_access_policy",
  ],
  hr: [
    "dashboard", "companies", "departments", "positions", "shifts",
    "organization_structure", "users", "employees", "attendance", "leaves",
    "payroll",
  ],
  employee: ["dashboard", "attendance", "leaves"],
};

export default function MenuAccessPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [menuConfigs, setMenuConfigs] = useState<MenuAccessConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, menuRes] = await Promise.all([
        userService.getUsers(),
        menuAccessService.getAllMenuAccess(),
      ]);

      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data);
      }
      if (menuRes.success && menuRes.data) {
        setMenuConfigs(menuRes.data);
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function getUserMenuConfig(userId: string): MenuAccessConfig | undefined {
    return menuConfigs.find((c) => c.user_id === userId);
  }

  function openConfigModal(user: User) {
    setSelectedUser(user);
    const existing = getUserMenuConfig(user.id);
    if (existing) {
      setCheckedKeys([...existing.menu_keys]);
    } else {
      // Default to role-based defaults
      setCheckedKeys([...(ROLE_DEFAULTS[user.role] || [])]);
    }
    setModalOpen(true);
  }

  function toggleKey(key: string) {
    setCheckedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function selectAll() {
    const allKeys = ALL_MENU_SECTIONS.flatMap((s) => s.items.map((i) => i.key));
    setCheckedKeys(allKeys);
  }

  function deselectAll() {
    setCheckedKeys([]);
  }

  function resetToDefaults() {
    if (selectedUser) {
      setCheckedKeys([...(ROLE_DEFAULTS[selectedUser.role] || [])]);
    }
  }

  async function handleSave() {
    if (!selectedUser) return;
    setSaving(true);
    setError("");
    try {
      const res = await menuAccessService.setUserMenuAccess({
        user_id: selectedUser.id,
        menu_keys: checkedKeys,
      });
      if (res.success) {
        setModalOpen(false);
        await loadData();
      } else {
        setError(res.message || "Failed to save");
      }
    } catch {
      setError("Failed to save menu access");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetToRoleDefaults(userId: string) {
    setSaving(true);
    setError("");
    try {
      const res = await menuAccessService.deleteUserMenuAccess(userId);
      if (res.success) {
        setModalOpen(false);
        await loadData();
      } else {
        setError(res.message || "Failed to reset");
      }
    } catch {
      setError("Failed to reset menu access");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Menu Access Policy</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure which sidebar menu items each user can access. Users without custom
          configuration will use their role&apos;s default menus.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Menu Config
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const config = getUserMenuConfig(user.id);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : user.role === "hr"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        {config ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                            Custom ({config.menu_keys.length} menus)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                            Role Default
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openConfigModal(user)}
                            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                          >
                            Configure
                          </button>
                          {config && (
                            <button
                              onClick={() => handleResetToRoleDefaults(user.id)}
                              className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configuration Modal */}
      {modalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Configure Menu Access
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedUser.name} ({selectedUser.role})
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                &times;
              </button>
            </div>

            {/* Bulk actions */}
            <div className="flex gap-2 px-6 pt-4">
              <button
                onClick={selectAll}
                className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Deselect All
              </button>
              <button
                onClick={resetToDefaults}
                className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Role Defaults
              </button>
            </div>

            {/* Checkbox list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {ALL_MENU_SECTIONS.map((section) => (
                <div key={section.section}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    {section.section}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isRoleDefault = (
                        ROLE_DEFAULTS[selectedUser.role] || []
                      ).includes(item.key);
                      return (
                        <label
                          key={item.key}
                          className="flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checkedKeys.includes(item.key)}
                            onChange={() => toggleKey(item.key)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-800">{item.label}</span>
                          {isRoleDefault && (
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              role default
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
