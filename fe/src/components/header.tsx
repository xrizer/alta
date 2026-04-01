"use client";

import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, Bell, Menu, LogOut, Sun, Moon, Check } from "react-feather";
import { getVisibleTabs, isTabActive } from "@/lib/menu-config";
import { useState, useRef, useEffect, useCallback } from "react";
import { Notification } from "@/lib/types";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/services/notification-service";

interface HeaderProps {
  onMenuClick?: () => void;
}

const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  info: "bg-blue-500",
  success: "bg-green-500",
  warning: "bg-yellow-400",
  error: "bg-red-500",
};

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return "Yesterday";
  return `${diffDay}d ago`;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout, allowedMenuKeys } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const visibleTabs = getVisibleTabs(allowedMenuKeys);

  // Fetch unread count periodically
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      if (res.success) setUnreadCount(res.data?.count ?? 0);
    } catch {
      // silently ignore — Kafka/backend may be unavailable
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Load notifications when dropdown opens
  const handleNotifOpen = useCallback(async () => {
    if (notifDropdownOpen) {
      setNotifDropdownOpen(false);
      return;
    }
    setNotifDropdownOpen(true);
    setNotifLoading(true);
    try {
      const res = await getNotifications(15);
      if (res.success) setNotifications(res.data ?? []);
    } catch {
      // silently ignore
    } finally {
      setNotifLoading(false);
    }
  }, [notifDropdownOpen]);

  const handleMarkAsRead = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await markAsRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // silently ignore
      }
    },
    []
  );

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silently ignore
    }
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(e.target as Node)
      ) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <button
            onClick={onMenuClick}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
          >
            <Menu size={20} />
          </button>

          {/* Nav tabs */}
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
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notification bell */}
          <div className="relative" ref={notifDropdownRef}>
            <button
              onClick={handleNotifOpen}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-100 bg-white shadow-lg z-50 dark:border-gray-700 dark:bg-gray-800">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        {unreadCount} unread
                      </span>
                    )}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600"
                    >
                      <Check size={12} /> Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifLoading ? (
                    <div className="py-8 text-center text-sm text-gray-400">
                      Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition-colors dark:border-gray-700/50 ${
                          !n.is_read
                            ? "bg-blue-50/50 dark:bg-blue-900/10"
                            : ""
                        }`}
                      >
                        <div className="mt-1.5 flex-shrink-0">
                          <span
                            className={`block h-2 w-2 rounded-full ${
                              NOTIFICATION_TYPE_COLORS[n.type] ?? "bg-gray-400"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                            {n.title}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                            {formatRelativeTime(n.created_at)}
                          </p>
                        </div>
                        {!n.is_read && (
                          <button
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            className="flex-shrink-0 self-start mt-1 text-gray-300 hover:text-blue-500 dark:text-gray-600 dark:hover:text-blue-400"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {user?.name}
            </p>
            <p className="text-xs capitalize text-gray-500 dark:text-gray-400">
              {user?.role}
            </p>
          </div>

          {/* User dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setUserDropdownOpen((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
            >
              <User size={18} />
            </button>
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-lg border border-gray-100 bg-white shadow-md z-50 dark:border-gray-700 dark:bg-gray-800">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 rounded-lg dark:hover:bg-gray-700"
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
