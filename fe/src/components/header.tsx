"use client";

import { useAuth } from "@/contexts/auth-context";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, Bell, Menu, LogOut } from "react-feather";
import { getVisibleTabs, isTabActive } from "@/lib/menu-config";
import { useState, useRef, useEffect } from "react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout, allowedMenuKeys } = useAuth();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const visibleTabs = getVisibleTabs(allowedMenuKeys);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <button
            onClick={onMenuClick}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 md:hidden"
          >
            <Menu size={20} />
          </button>

          {/* Nav tabs - hidden on mobile (use sidebar hamburger menu instead) */}
          <div className="relative min-w-0 flex-1 hidden md:block">
            <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {visibleTabs.map((tab) => {
                const active = isTabActive(pathname, tab);
                return (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className={`relative whitespace-nowrap px-3 py-4 text-sm font-medium transition-colors md:px-4 ${
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
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
            <Bell size={18} />
          </button>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs capitalize text-gray-500">{user?.role}</p>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
            >
              <User size={18} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-lg border border-gray-100 bg-white shadow-md z-50">
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 rounded-lg"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
