"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Smartphone,
  Brain,
  LayoutDashboard,
  Users,
  UserCog,
  CalendarCheck,
  History,
  GraduationCap,
  IndianRupee,
  CalendarDays,
  Bell,
  BarChart3,
  ShieldCheck,
  LogOut,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },

  {
    title: "Students",
    href: "/admin/students",
    icon: Users,
  },

  {
    title: "NFC Reader",
    href: "/admin/nfc-reader",
    icon: Smartphone,
  },

  {
    title: "Attendance",
    href: "/admin/attendance",
    icon: CalendarCheck,
  },

  {
    title: "Attendance History",
    href: "/admin/attendance/history",
    icon: History,
  },

  {
    title: "Results",
    href: "/admin/results",
    icon: GraduationCap,
  },

  {
    title: "Fees",
    href: "/admin/fees",
    icon: IndianRupee,
  },

  {
    title: "Timetable",
    href: "/admin/timetable",
    icon: CalendarDays,
  },

  {
    title: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },

  {
    title: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },

  {
    title: "Intelligence",
    href: "/admin/Ai",
    icon: Brain,
  },

  {
    title: "Data Integrity",
    href: "/admin/audit",
    icon: ShieldCheck,
  },

  {
    title: "Access Management",
    href: "/admin/access-requests",
    icon: UserCog,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white shadow-xl">

      {/* BRAND */}

      <div className="border-b border-slate-700 p-6">

        <h1 className="text-3xl font-bold text-blue-400">
          AUMNex
        </h1>

        <p className="mt-2 text-sm text-gray-400">
          Admin Panel
        </p>

      </div>

      {/* NAVIGATION */}

      <nav className="space-y-2 overflow-y-auto p-4 pb-24">

        {menuItems.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            pathname.startsWith(
              `${item.href}/`
            );

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-slate-800 hover:text-white"
              }`}
            >

              <Icon size={20} />

              <span className="font-medium">
                {item.title}
              </span>

            </Link>
          );
        })}

      </nav>

      {/* LOGOUT */}

      <div className="absolute bottom-0 left-0 w-full border-t border-slate-700 bg-slate-900 p-4">

        <button
          type="button"
          onClick={() => {
            localStorage.removeItem(
              "admin"
            );

            window.location.href = "/";
          }}
          className="flex w-full items-center gap-3 rounded-xl bg-red-600 px-4 py-3 transition hover:bg-red-700"
        >

          <LogOut size={20} />

          <span className="font-medium">
            Logout
          </span>

        </button>

      </div>

    </aside>
  );
}