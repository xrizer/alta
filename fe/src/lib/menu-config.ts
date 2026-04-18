// Menu configuration matching backend valid menu keys:
// dashboard, companies, departments, positions, shifts,
// organization_structure, users, employees, attendance,
// leaves, payroll, payslips, menu_access_policy,
// job_levels, grades
//
// Each tab and sub-item may also declare:
//   - `moduleKey`: the feature-module toggle that gates visibility
//                  (see internal/modules/registry.go)
//   - `requiredRole`: one or more user roles allowed to see the item.
//                     Omitted = any role may see it (subject to menu/module gates).
//
// Role gating is purely a UX nicety — the backend still enforces access.
// Use it to hide admin/superadmin-only links from non-privileged users.

import type { Role } from "@/lib/types";

export interface SubMenuItem {
  name: string;
  key: string; // matches backend menu key
  href: string;
  moduleKey?: string; // optional feature module gate
  requiredRole?: Role | Role[]; // optional role gate
}

export interface NavTab {
  name: string;
  href: string;
  menuKeys: string[]; // all backend menu keys under this tab
  subItems: SubMenuItem[];
  moduleKey?: string; // optional feature module gate for the whole tab
  requiredRole?: Role | Role[]; // optional role gate for the whole tab
}

export const navTabs: NavTab[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    menuKeys: ["dashboard"],
    subItems: [],
  },
  {
    name: "Organization",
    href: "/dashboard/companies",
    menuKeys: [
      "companies",
      "departments",
      "positions",
      "shifts",
      "organization_structure",
    ],
    subItems: [
      { name: "Companies", key: "companies", href: "/dashboard/companies" },
      {
        name: "Departments",
        key: "departments",
        href: "/dashboard/departments",
      },
      { name: "Positions", key: "positions", href: "/dashboard/positions" },
      { name: "Shifts", key: "shifts", href: "/dashboard/shifts" },
      {
        name: "Organization Structure",
        key: "organization_structure",
        href: "/dashboard/organization-structure",
      },
    ],
  },
  {
    name: "People",
    href: "/dashboard/users",
    menuKeys: ["users", "employees"],
    subItems: [
      { name: "Users", key: "users", href: "/dashboard/users" },
      { name: "Employees", key: "employees", href: "/dashboard/employees" },
    ],
  },
  {
    name: "Attendance",
    href: "/dashboard/attendance",
    menuKeys: ["attendance", "leaves"],
    subItems: [
      { name: "Attendance Records", key: "attendance", href: "/dashboard/attendance" },
      { name: "Check In / Check Out", key: "attendance", href: "/dashboard/checkin" },
      { name: "Leaves", key: "leaves", href: "/dashboard/leaves" },
    ],
  },
  {
    name: "Field Ops",
    href: "/dashboard/visits",
    menuKeys: ["attendance"], // reuse attendance key; gated further by module
    moduleKey: "visit_tracking",
    subItems: [
      {
        name: "Visits",
        key: "attendance",
        href: "/dashboard/visits",
        moduleKey: "visit_tracking",
      },
      {
        name: "Visit Plans",
        key: "attendance",
        href: "/dashboard/visit-plans",
        moduleKey: "visit_planning",
      },
      {
        name: "Adherence Report",
        key: "attendance",
        href: "/dashboard/visit-plans/report",
        moduleKey: "visit_planning",
        requiredRole: ["admin", "hr", "superadmin"],
      },
    ],
  },
  {
    name: "Payroll",
    href: "/dashboard/payroll",
    menuKeys: ["payroll", "payslips"],
    subItems: [
      { name: "Payroll Records", key: "payroll", href: "/dashboard/payroll" },
      { name: "Payslips", key: "payslips", href: "/dashboard/payslips" },
    ],
  },
  {
    name: "Administration",
    href: "/dashboard/menu-access",
    menuKeys: ["menu_access_policy"],
    subItems: [
      {
        name: "Menu Access",
        key: "menu_access_policy",
        href: "/dashboard/menu-access",
      },
      {
        // Backend enforces superadmin-only on /api/companies/:id/modules.
        // Hide the link from admins/hr so they don't hit a dead-end page.
        name: "Module Management",
        key: "menu_access_policy",
        href: "/dashboard/settings/modules",
        requiredRole: "superadmin",
      },
    ],
  },
  {
    name: "Settings",
    href: "/dashboard/settings/job-levels",
    menuKeys: ["job_levels", "grades"],
    subItems: [
      { name: "Job Levels", key: "job_levels", href: "/dashboard/settings/job-levels" },
      { name: "Grades", key: "grades", href: "/dashboard/settings/grades" },
    ],
  },
];

/**
 * Find the active nav tab based on the current pathname.
 */
export function getActiveTab(pathname: string): NavTab | undefined {
  if (pathname === "/dashboard") return navTabs[0];

  return navTabs.find((tab) => {
    if (tab.name === "Dashboard") return false;
    if (tab.subItems.length > 0) {
      return tab.subItems.some((sub) => pathname.startsWith(sub.href));
    }
    return pathname.startsWith(tab.href);
  });
}

/**
 * Check if a nav tab is active for the given pathname.
 */
export function isTabActive(pathname: string, tab: NavTab): boolean {
  if (tab.name === "Dashboard") return pathname === "/dashboard";
  if (tab.subItems.length > 0) {
    return tab.subItems.some((sub) => pathname.startsWith(sub.href));
  }
  return pathname.startsWith(tab.href);
}

/**
 * Check if a sub-item is active for the given pathname.
 */
export function isSubItemActive(
  pathname: string,
  subItem: SubMenuItem
): boolean {
  return pathname.startsWith(subItem.href);
}

/**
 * Check if an item's required feature module is enabled.
 * An item with no moduleKey is always allowed.
 * enabledModules === null means "unknown/loading" — treat as allow to avoid flicker.
 */
function moduleAllowed(
  moduleKey: string | undefined,
  enabledModules: string[] | null
): boolean {
  if (!moduleKey) return true;
  if (enabledModules === null) return true;
  return enabledModules.includes(moduleKey);
}

/**
 * Check if the current role is allowed to see an item.
 * Items with no `requiredRole` are visible to everyone.
 * A null role (not signed in / still loading) is treated as "allow" to avoid flicker.
 */
function roleAllowed(
  requiredRole: Role | Role[] | undefined,
  role: Role | null
): boolean {
  if (!requiredRole) return true;
  if (role === null) return true;
  const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return allowed.includes(role);
}

/**
 * Filter nav tabs based on allowedMenuKeys, enabledModules, and current role.
 * If allowedMenuKeys is null, all tabs pass the menu-key check (role defaults).
 * A tab is shown if it has at least one sub-item that passes ALL filters.
 */
export function getVisibleTabs(
  allowedMenuKeys: string[] | null,
  enabledModules: string[] | null = null,
  role: Role | null = null
): NavTab[] {
  return navTabs.filter((tab) => {
    // Dashboard is always visible
    if (tab.name === "Dashboard") return true;

    // Tab-level gates
    if (!moduleAllowed(tab.moduleKey, enabledModules)) return false;
    if (!roleAllowed(tab.requiredRole, role)) return false;

    // Menu key gate
    const menuOk =
      allowedMenuKeys === null ||
      tab.menuKeys.some((key) => allowedMenuKeys.includes(key));
    if (!menuOk) return false;

    // At least one visible sub-item must remain after module + role filtering
    if (tab.subItems.length > 0) {
      const anyVisibleSub = tab.subItems.some((sub) => {
        const keyOk =
          allowedMenuKeys === null || allowedMenuKeys.includes(sub.key);
        return (
          keyOk &&
          moduleAllowed(sub.moduleKey, enabledModules) &&
          roleAllowed(sub.requiredRole, role)
        );
      });
      if (!anyVisibleSub) return false;
    }

    return true;
  });
}

/**
 * Filter sub-items based on allowedMenuKeys, enabledModules, and current role.
 * If allowedMenuKeys is null, the menu-key check is skipped.
 */
export function getVisibleSubItems(
  subItems: SubMenuItem[],
  allowedMenuKeys: string[] | null,
  enabledModules: string[] | null = null,
  role: Role | null = null
): SubMenuItem[] {
  return subItems.filter((sub) => {
    const keyOk =
      allowedMenuKeys === null || allowedMenuKeys.includes(sub.key);
    return (
      keyOk &&
      moduleAllowed(sub.moduleKey, enabledModules) &&
      roleAllowed(sub.requiredRole, role)
    );
  });
}
