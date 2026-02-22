"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  ChevronLeft,
  ChevronRight,
  Users,
  FileText,
  Clock,
  Calendar,
  DollarSign,
  Shield,
  Briefcase,
  GitBranch,
} from "react-feather";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  getActiveTab,
  getVisibleSubItems,
  isSubItemActive,
  type SubMenuItem,
} from "@/lib/menu-config";

// Map backend menu keys to react-feather icons
const menuIconMap: Record<string, React.ReactNode> = {
  companies: <Users size={18} />,
  departments: <Users size={18} />,
  positions: <FileText size={18} />,
  shifts: <FileText size={18} />,
  organization_structure: <GitBranch size={18} />,
  users: <Users size={18} />,
  employees: <Briefcase size={18} />,
  attendance: <Clock size={18} />,
  leaves: <Calendar size={18} />,
  payroll: <DollarSign size={18} />,
  menu_access_policy: <Shield size={18} />,
};

export default function Sidebar() {
  const pathname = usePathname();
  const { allowedMenuKeys } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const activeTab = getActiveTab(pathname);
  const subItems = activeTab
    ? getVisibleSubItems(activeTab.subItems, allowedMenuKeys)
    : [];

  const isDashboardActive = pathname === "/dashboard";

  return (
    <aside
      className={`flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div
        className={`flex h-16 items-center border-b border-gray-100 ${
          collapsed ? "justify-center gap-0 px-2" : "justify-between px-4"
        }`}
      >
        {collapsed ? (
          <div className="relative flex items-center justify-center w-full">
            <div className="flex-shrink-0 overflow-hidden w-3.5 h-3.5">
              <Image
                src="/logo.png"
                alt="Alta"
                width={140}
                height={36}
                className="h-3.5 max-w-none object-cover object-left"
                style={{ width: "auto" }}
              />
            </div>
            <button
              onClick={() => setCollapsed(false)}
              className="absolute -right-1 text-gray-400 hover:text-gray-600"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <>
            <Image
              src="/logo.png"
              alt="Alta"
              width={140}
              height={36}
              className="object-contain"
            />
            <button
              onClick={() => setCollapsed(true)}
              className="text-gray-400 hover:text-gray-600"
            >
              <ChevronLeft size={18} />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Show sub-items when a tab with children is active */}
        {subItems.length > 0 ? (
          <div className="flex flex-col gap-1">
            {subItems.map((sub: SubMenuItem) => {
              const active = isSubItemActive(pathname, sub);
              const icon = menuIconMap[sub.key] || <FileText size={18} />;
              return (
                <Link
                  key={sub.key}
                  href={sub.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  } ${collapsed ? "justify-center" : ""}`}
                  title={collapsed ? sub.name : undefined}
                >
                  {icon}
                  {!collapsed && <span>{sub.name}</span>}
                </Link>
              );
            })}
          </div>
        ) : (
          /* Dashboard / tabs with no sub-items: show Overview */
          <Link
            href="/dashboard"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isDashboardActive
                ? "bg-orange-50 text-orange-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            } ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? "Overview" : undefined}
          >
            <Home size={18} />
            {!collapsed && <span>Overview</span>}
          </Link>
        )}
      </nav>
    </aside>
  );
}
