"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  CalendarDays,
  Users,
  BarChart3,
  Plug,
  HardDrive,
  Settings,
  ChevronLeft,
  LogOut,
  Bell,
} from "lucide-react";
import clsx from "clsx";

const sidebarLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/conversations", icon: MessageSquare, label: "Conversas" },
  { href: "/agents", icon: Bot, label: "Agentes" },
  { href: "/appointments", icon: CalendarDays, label: "Agendamentos" },
  { href: "/patients", icon: Users, label: "Pacientes" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/integrations", icon: Plug, label: "Integrações" },
  { href: "/drive", icon: HardDrive, label: "Drive" },
  { href: "/settings", icon: Settings, label: "Configurações" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        "flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <span className="text-sm font-bold text-white">W</span>
            </div>
            <span className="text-lg font-bold text-gray-900">WppAgent</span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
            <span className="text-sm font-bold text-white">W</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={clsx(
            "rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600",
            collapsed && "mx-auto mt-2"
          )}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft
            size={18}
            className={clsx("transition-transform", collapsed && "rotate-180")}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {sidebarLinks.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname?.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <link.icon
                size={20}
                className={clsx(
                  isActive ? "text-emerald-600" : "text-gray-400"
                )}
              />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 p-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
          <LogOut size={20} className="text-gray-400" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}

export function TopBar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Clínica Saúde+</h2>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
          <Bell size={20} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-100" />
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">Admin</p>
            <p className="text-xs text-gray-500">admin@clinica.com</p>
          </div>
        </div>
      </div>
    </header>
  );
}
