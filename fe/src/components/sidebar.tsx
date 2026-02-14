"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

interface NavItem {
  name: string;
  href: string;
  roles: string[];
  key: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: "General",
    items: [
      { name: "Dashboard", href: "/dashboard", roles: ["admin", "hr", "employee"], key: "dashboard" },
    ],
  },
  {
    title: "Organization",
    items: [
      { name: "Companies", href: "/dashboard/companies", roles: ["admin", "hr"], key: "companies" },
      { name: "Departments", href: "/dashboard/departments", roles: ["admin", "hr"], key: "departments" },
      { name: "Positions", href: "/dashboard/positions", roles: ["admin", "hr"], key: "positions" },
      { name: "Shifts", href: "/dashboard/shifts", roles: ["admin", "hr"], key: "shifts" },
      { name: "Organization Structure", href: "/dashboard/organization-structure", roles: ["admin", "hr"], key: "organization_structure" },
    ],
  },
  {
    title: "People",
    items: [
      { name: "Users", href: "/dashboard/users", roles: ["admin", "hr"], key: "users" },
      { name: "Employees", href: "/dashboard/employees", roles: ["admin", "hr"], key: "employees" },
    ],
  },
  {
    title: "Time & Attendance",
    items: [
      { name: "Attendance", href: "/dashboard/attendance", roles: ["admin", "hr", "employee"], key: "attendance" },
      { name: "Leaves", href: "/dashboard/leaves", roles: ["admin", "hr", "employee"], key: "leaves" },
    ],
  },
  {
    title: "Payroll",
    items: [
      { name: "Payroll", href: "/dashboard/payroll", roles: ["admin", "hr"], key: "payroll" },
    ],
  },
  {
    title: "Administration",
    items: [
      { name: "Menu Access Policy", href: "/dashboard/menu-access", roles: ["admin"], key: "menu_access_policy" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, allowedMenuKeys } = useAuth();

  const filteredSections = navigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!user) return false;

        // If user has custom menu access configured, use that
        if (allowedMenuKeys !== null) {
          return allowedMenuKeys.includes(item.key);
        }

        // Otherwise fall back to role-based access
        return item.roles.includes(user.role);
      }),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <h1 className="text-xl font-bold text-blue-600">HRIS</h1>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {filteredSections.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
