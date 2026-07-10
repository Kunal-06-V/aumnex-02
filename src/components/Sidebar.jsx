"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Bell,
  User,
  ShieldAlert,
  Smartphone,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/student/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Academics",
    href: "/student/results",
    icon: BookOpen,
  },
  {
    title: "Attendance",
    href: "/student/attendance",
    icon: CalendarDays,
  },
  {
    title: "NFC Attendance",
    href: "/student/nfc",
    icon: Smartphone,
  },
  {
    title: "Notifications",
    href: "/student/notifications",
    icon: Bell,
  },
  {
    title: "Profile",
    href: "/student/profile",
    icon: User,
  },
  {
    title: "SOS",
    href: "/student/sos",
    icon: ShieldAlert,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 w-64 h-screen bg-blue-700 text-white p-6 overflow-y-auto z-50">

      <h1 className="text-3xl font-bold mb-10">
        AUMNex
      </h1>

      <nav className="space-y-3">

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg transition ${
                pathname === item.href
                  ? "bg-blue-900"
                  : "hover:bg-blue-600"
              }`}
            >
              <Icon size={20} />
              {item.title}
            </Link>
          );
        })}

      </nav>

    </aside>
  );
}