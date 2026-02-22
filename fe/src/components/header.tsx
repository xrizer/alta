"use client";

import { useAuth } from "@/contexts/auth-context";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, Bell } from "react-feather";
import { getVisibleTabs, isTabActive } from "@/lib/menu-config";

export default function Header() {
  const { user, logout, allowedMenuKeys } = useAuth();
  const pathname = usePathname();

  const visibleTabs = getVisibleTabs(allowedMenuKeys);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex h-14 items-center justify-between px-6">
        <nav className="flex items-center gap-1">
          {visibleTabs.map((tab) => {
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
          <button className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
            <Bell size={18} />
          </button>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs capitalize text-gray-500">{user?.role}</p>
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
