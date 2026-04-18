'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  Calendar,
  DollarSign,
  X,
} from 'react-feather';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  getActiveTab,
  getVisibleTabs,
  getVisibleSubItems,
  isTabActive,
  isSubItemActive,
  type SubMenuItem,
} from '@/lib/menu-config';
import {
  Briefcase,
  Copy,
  House,
  Settings,
  Share2,
  Shield,
  Target,
  User,
  Users2,
  Wrench,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';

// Map backend menu keys to react-feather icons
const menuIconMap: Record<string, React.ReactNode> = {
  companies: <Copy size={18} />,
  departments: <House size={18} />,
  positions: <Target size={18} />,
  shifts: <Settings size={18} />,
  organization_structure: <Share2 size={18} />,
  users: <User size={18} />,
  employees: <Users2 size={18} />,
  attendance: <Clock size={18} />,
  leaves: <Calendar size={18} />,
  payroll: <DollarSign size={18} />,
  payslips: <FileText size={18} />,
  menu_access_policy: <Wrench size={18} />,
  job_levels: <Layers size={18} />,
  grades: <SlidersHorizontal size={18} />,
};

const tabIconMap: Record<string, React.ReactNode> = {
  Dashboard: <Home size={18} />,
  Organization: <Briefcase size={18} />,
  People: <User size={18} />,
  Attendance: <Clock size={18} />,
  Payroll: <DollarSign size={18} />,
  Administration: <Shield size={18} />,
  Settings: <Settings size={18} />,
};

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, allowedMenuKeys, enabledModules } = useAuth();
  const role = user?.role ?? null;
  const [collapsed, setCollapsed] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    onMobileClose?.();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeTab = getActiveTab(pathname);
  const visibleTabs = getVisibleTabs(allowedMenuKeys, enabledModules, role);
  const subItems = activeTab
    ? getVisibleSubItems(activeTab.subItems, allowedMenuKeys, enabledModules, role)
    : [];

  const isDashboardActive = pathname === '/dashboard';

  // Logo section (shared between mobile and desktop)
  const logoSection = (
    <div
      className={`flex h-16 items-center border-b border-gray-100 dark:border-gray-700 ${
        collapsed && !mobileOpen
          ? 'justify-center gap-0 px-2'
          : 'justify-between px-4'
      }`}>
      {collapsed && !mobileOpen ? (
        <div className="flex w-full items-center justify-between px-1">
          <div
            className="flex-shrink-0 overflow-hidden"
            style={{ height: '12px', width: '24px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Alta"
              style={{ height: '12px', width: 'auto' }}
            />
          </div>
          <button
            onClick={() => setCollapsed(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <ChevronRight size={14} />
          </button>
        </div>
      ) : (
        <>
          <Image
            src="/logo-full.png"
            alt="Alta"
            width={80}
            height={26}
            className="object-contain"
          />
          {mobileOpen ? (
            <button
              onClick={onMobileClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 md:hidden">
              <X size={20} />
            </button>
          ) : (
            <button
              onClick={() => setCollapsed(true)}
              className="hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 md:block">
              <ChevronLeft size={18} />
            </button>
          )}
        </>
      )}
    </div>
  );

  // Desktop nav: show sub-items of the active tab only
  const desktopNavContent = (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {subItems.length > 0 ? (
        <div className="flex flex-col gap-1">
          {subItems.map((sub: SubMenuItem) => {
            const active = isSubItemActive(pathname, sub);
            const icon = menuIconMap[sub.key] || <FileText size={18} />;
            const isCollapsedDesktop = collapsed && !mobileOpen;
            return (
              <Link
                key={sub.href}
                href={sub.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                } ${isCollapsedDesktop ? 'justify-center' : ''}`}
                title={isCollapsedDesktop ? sub.name : undefined}>
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
              ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
          } ${collapsed && !mobileOpen ? 'justify-center' : ''}`}
          title={collapsed && !mobileOpen ? 'Overview' : undefined}>
          <Home size={18} />
          {!(collapsed && !mobileOpen) && <span>Overview</span>}
        </Link>
      )}
    </nav>
  );

  // Mobile nav: show all top-level tabs + their sub-items
  const mobileNavContent = (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      <div className="flex flex-col gap-1">
        {visibleTabs.map((tab) => {
          const tabActive = isTabActive(pathname, tab);
          const visibleSubs = getVisibleSubItems(tab.subItems, allowedMenuKeys, enabledModules, role);
          const tabIcon = tabIconMap[tab.name] || <FileText size={18} />;
          return (
            <div key={tab.name}>
              <Link
                href={tab.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  tabActive
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                }`}>
                {tabIcon}
                <span>{tab.name}</span>
              </Link>
              {visibleSubs.length > 0 && (
                <div className="ml-6 mt-0.5 mb-1 flex flex-col gap-0.5">
                  {visibleSubs.map((sub) => {
                    const subActive = isSubItemActive(pathname, sub);
                    const icon = menuIconMap[sub.key] || <FileText size={16} />;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                          subActive
                            ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                        }`}>
                        {icon}
                        <span>{sub.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );

  const sidebarContent = (
    <>
      {logoSection}
      {mobileOpen ? mobileNavContent : desktopNavContent}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex h-screen flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-white shadow-xl dark:bg-gray-900 md:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
