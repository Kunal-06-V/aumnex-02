"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  CalendarCheck,
  GraduationCap,
  IndianRupee,
  CalendarDays,
  Bell,
  ShieldAlert,
  Brain,
  LogOut,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/student/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Attendance",
    href: "/student/attendance",
    icon: CalendarCheck,
  },
  {
    title: "Results",
    href: "/student/results",
    icon: GraduationCap,
  },
  {
    title: "Fees",
    href: "/student/fees",
    icon: IndianRupee,
  },
  {
    title: "Timetable",
    href: "/student/timetable",
    icon: CalendarDays,
  },
  {
  title: "Notifications",
  href: "/student/notifications",
  icon: Bell,
},

{
  title: "AI Advisor",
  href: "/student/Ai",
  icon: Brain,
},

{
  title: "SOS",
  href: "/student/sos",
  icon: ShieldAlert,
},
];

export default function StudentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white shadow-xl">

      <div className="p-6 border-b border-slate-700">
        <h1 className="text-3xl font-bold text-blue-400">
          AUMNex
        </h1>

        <p className="text-gray-400 text-sm mt-2">
          Student Portal
        </p>
      </div>

      <nav className="p-4 space-y-2">

        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
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

      <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-700">

        <button
          onClick={() => {
            localStorage.removeItem("student");
            window.location.href = "/";
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 transition"
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