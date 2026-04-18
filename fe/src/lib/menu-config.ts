// Menu configuration matching backend valid menu keys:
// dashboard, companies, departments, positions, shifts,
// organization_structure, users, employees, attendance,
// leaves, payroll, payslips, menu_access_policy,
// job_levels, grades
//
// Each tab and sub-item may also declare a `moduleKey` — the feature-module
// toggle that gates visibility. If omitted, visibility is not gated by modules
// (treated as always-available). See internal/modules/registry.go for the list.

export interface SubMenuItem {
  name: string;
  key: string; // matches backend menu key
  href: string;
  moduleKey?: string; // optional feature module gate
}

export interface NavTab {
  name: string;
  href: string;
  menuKeys: string[]; // all backend menu keys under this tab
  subItems: SubMenuItem[];
  moduleKey?: string; // optional feature module gate for the whole tab
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
        name: "Module Management",
        key: "menu_access_policy",
        href: "/dashboard/settings/modules",
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
 * Filter nav tabs based on allowedMenuKeys and enabledModules.
 * If allowedMenuKeys is null, all tabs pass the menu-key check (role defaults).
 * A tab is shown if it has at least one sub-item that passes BOTH filters.
 */
export function getVisibleTabs(
  allowedMenuKeys: string[] | null,
  enabledModules: string[] | null = null
): NavTab[] {
  return navTabs.filter((tab) => {
    // Dashboard is always visible
    if (tab.name === "Dashboard") return true;

    // Tab-level module gate
    if (!moduleAllowed(tab.moduleKey, enabledModules)) return false;

    // Menu key gate
    const menuOk =
      allowedMenuKeys === null ||
      tab.menuKeys.some((key) => allowedMenuKeys.includes(key));
    if (!menuOk) return false;

    // At least one visible sub-item must remain after module filtering
    if (tab.subItems.length > 0) {
      const anyVisibleSub = tab.subItems.some((sub) => {
        const keyOk =
          allowedMenuKeys === null || allowedMenuKeys.includes(sub.key);
        return keyOk && moduleAllowed(sub.moduleKey, enabledModules);
      });
      if (!anyVisibleSub) return false;
    }

    return true;
  });
}

/**
 * Filter sub-items based on allowedMenuKeys and enabledModules.
 * If allowedMenuKeys is null, the menu-key check is skipped.
 */
export function getVisibleSubItems(
  subItems: SubMenuItem[],
  allowedMenuKeys: string[] | null,
  enabledModules: string[] | null = null
): SubMenuItem[] {
  return subItems.filter((sub) => {
    const keyOk =
      allowedMenuKeys === null || allowedMenuKeys.includes(sub.key);
    return keyOk && moduleAllowed(sub.moduleKey, enabledModules);
  });
}
