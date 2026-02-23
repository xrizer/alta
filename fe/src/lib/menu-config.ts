// Menu configuration matching backend valid menu keys:
// dashboard, companies, departments, positions, shifts,
// organization_structure, users, employees, attendance,
// leaves, payroll, payslips, menu_access_policy

export interface SubMenuItem {
  name: string;
  key: string; // matches backend menu key
  href: string;
}

export interface NavTab {
  name: string;
  href: string;
  menuKeys: string[]; // all backend menu keys under this tab
  subItems: SubMenuItem[];
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
      { name: "Attendance", key: "attendance", href: "/dashboard/attendance" },
      { name: "Leaves", key: "leaves", href: "/dashboard/leaves" },
    ],
  },
  {
    name: "Payroll",
    href: "/dashboard/payroll",
    menuKeys: ["payroll", "payslips"],
    subItems: [
      { name: "Payroll", key: "payroll", href: "/dashboard/payroll" },
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
 * Filter nav tabs based on allowedMenuKeys.
 * If allowedMenuKeys is null, all tabs are shown (role defaults).
 * Otherwise, only tabs with at least one allowed sub-item are shown.
 */
export function getVisibleTabs(allowedMenuKeys: string[] | null): NavTab[] {
  if (allowedMenuKeys === null) return navTabs;

  return navTabs.filter((tab) => {
    // Dashboard is always visible
    if (tab.name === "Dashboard") return true;
    // Show tab if at least one of its menu keys is allowed
    return tab.menuKeys.some((key) => allowedMenuKeys.includes(key));
  });
}

/**
 * Filter sub-items based on allowedMenuKeys.
 * If allowedMenuKeys is null, all sub-items are shown.
 */
export function getVisibleSubItems(
  subItems: SubMenuItem[],
  allowedMenuKeys: string[] | null
): SubMenuItem[] {
  if (allowedMenuKeys === null) return subItems;
  return subItems.filter((sub) => allowedMenuKeys.includes(sub.key));
}
