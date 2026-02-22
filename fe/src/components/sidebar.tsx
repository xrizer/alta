"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, ChevronLeft, ChevronRight } from "react-feather";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isOverviewActive = pathname === "/dashboard";

  return (
    <aside className={`flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
      <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
        <Image
          src="/logo.png"
          alt="Alta"
          width={collapsed ? 28 : 100}
          height={28}
          className="object-contain"
        />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-gray-600"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <Link
          href="/dashboard"
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isOverviewActive
              ? "bg-orange-50 text-orange-600"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          } ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "Overview" : undefined}
        >
          <Home size={18} />
          {!collapsed && <span>Overview</span>}
        </Link>
      </nav>
    </aside>
  );
}
