"use client";

import { useAuth } from "@/contexts/auth-context";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { User } from "react-feather";

const tabs = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Organization", href: "/dashboard/companies" },
  { name: "People", href: "/dashboard/users" },
  { name: "Attendance", href: "/dashboard/attendance" },
  { name: "Payroll", href: "/dashboard/payroll" },
  { name: "Administration", href: "/dashboard/menu-access" },
];

function isTabActive(pathname: string, tab: { name: string; href: string }) {
  if (tab.name === "Dashboard") return pathname === "/dashboard";
  if (tab.name === "Organization") {
    return ["/dashboard/companies", "/dashboard/departments", "/dashboard/positions", "/dashboard/shifts", "/dashboard/organization-structure"].some(
      (p) => pathname.startsWith(p)
    );
  }
  if (tab.name === "People") {
    return ["/dashboard/users", "/dashboard/employees"].some((p) => pathname.startsWith(p));
  }
  if (tab.name === "Attendance") {
    return ["/dashboard/attendance", "/dashboard/leaves"].some((p) => pathname.startsWith(p));
  }
  if (tab.name === "Payroll") return pathname.startsWith("/dashboard/payroll");
  if (tab.name === "Administration") return pathname.startsWith("/dashboard/menu-access");
  return false;
}

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex h-14 items-center justify-between px-6">
        <nav className="flex items-center gap-1">
          {tabs.map((tab) => {
            const active = isTabActive(pathname, tab);
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`relative px-4 py-4 text-sm font-medium transition-colors ${
                  active
                    ? "text-orange-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.name}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            <User size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
