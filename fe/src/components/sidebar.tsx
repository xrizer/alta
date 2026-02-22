"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Home, ChevronLeft, ChevronRight } from "react-feather";
import { useState } from "react";

interface NavItem {
  name: string;
  href: string;
  roles: string[];
  key: string;
  icon?: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: "General",
    items: [
      { name: "Overview", href: "/dashboard", roles: ["admin", "hr", "employee"], key: "dashboard", icon: <Home size={18} /> },
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
  const [collapsed, setCollapsed] = useState(false);

  const filteredSections = navigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!user) return false;
        if (allowedMenuKeys !== null) {
          return allowedMenuKeys.includes(item.key);
        }
        return item.roles.includes(user.role);
      }),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className={`flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
      <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
        <div className="flex items-center gap-2">
          <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
            <path d="M2 18L8 2" stroke="#FF6800" strokeWidth="3" strokeLinecap="round" />
            <path d="M9 18L15 2" stroke="#FF6800" strokeWidth="3" strokeLinecap="round" />
            <path d="M16 18L22 2" stroke="#FF6800" strokeWidth="3" strokeLinecap="round" />
          </svg>
          {!collapsed && <span className="text-lg font-bold text-orange-500">Alta</span>}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-gray-600"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {filteredSections.map((section) => (
          <div key={section.title} className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-3 text-xs font-bold uppercase tracking-wider text-gray-900">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-orange-50 text-orange-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } ${collapsed ? "justify-center" : ""}`}
                    title={collapsed ? item.name : undefined}
                  >
                    {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                    {!collapsed && <span>{item.name}</span>}
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
