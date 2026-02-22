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
  X,
} from "react-feather";
import { useState, useEffect } from "react";
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

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { allowedMenuKeys } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    onMobileClose?.();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeTab = getActiveTab(pathname);
  const subItems = activeTab
    ? getVisibleSubItems(activeTab.subItems, allowedMenuKeys)
    : [];

  const isDashboardActive = pathname === "/dashboard";

  const sidebarContent = (
    <>
      {/* Logo */}
      <div
        className={`flex h-16 items-center border-b border-gray-100 ${
          collapsed && !mobileOpen
            ? "justify-center gap-0 px-2"
            : "justify-between px-4"
        }`}
      >
        {collapsed && !mobileOpen ? (
          <div className="relative flex w-full items-center justify-center">
            <div className="h-3.5 w-3.5 flex-shrink-0 overflow-hidden">
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
            {mobileOpen ? (
              <button
                onClick={onMobileClose}
                className="text-gray-400 hover:text-gray-600 md:hidden"
              >
                <X size={20} />
              </button>
            ) : (
              <button
                onClick={() => setCollapsed(true)}
                className="hidden text-gray-400 hover:text-gray-600 md:block"
              >
                <ChevronLeft size={18} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {subItems.length > 0 ? (
          <div className="flex flex-col gap-1">
            {subItems.map((sub: SubMenuItem) => {
              const active = isSubItemActive(pathname, sub);
              const icon = menuIconMap[sub.key] || <FileText size={18} />;
              const isCollapsedDesktop = collapsed && !mobileOpen;
              return (
                <Link
                  key={sub.key}
                  href={sub.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  } ${isCollapsedDesktop ? "justify-center" : ""}`}
                  title={isCollapsedDesktop ? sub.name : undefined}
                >
                  {icon}
                  {!isCollapsedDesktop && <span>{sub.name}</span>}
                </Link>
              );
            })}
          </div>
        ) : (
          <Link
            href="/dashboard"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isDashboardActive
                ? "bg-orange-50 text-orange-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            } ${collapsed && !mobileOpen ? "justify-center" : ""}`}
            title={collapsed && !mobileOpen ? "Overview" : undefined}
          >
            <Home size={18} />
            {!(collapsed && !mobileOpen) && <span>Overview</span>}
          </Link>
        )}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-white shadow-xl md:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
