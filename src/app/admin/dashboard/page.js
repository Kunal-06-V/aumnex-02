"use client";

import {
  Users,
  Bell,
  CalendarCheck,
  IndianRupee,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const stats = [
  {
    title: "Students",
    value: "1,250",
    icon: Users,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Attendance",
    value: "92%",
    icon: CalendarCheck,
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Fees Collected",
    value: "₹18.5L",
    icon: IndianRupee,
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    title: "Notifications",
    value: "12",
    icon: Bell,
    color: "bg-red-100 text-red-600",
  },
];

const quickActions = [
  {
    title: "Manage Students",
    href: "/admin/students",
  },
  {
    title: "Manage Attendance",
    href: "/admin/attendance",
  },
  {
    title: "Manage Fees",
    href: "/admin/fees",
  },
  {
    title: "Manage Results",
    href: "/admin/results",
  },
  {
    title: "Manage Timetable",
    href: "/admin/timetable",
  },
  {
    title: "Manage Notifications",
    href: "/admin/notifications",
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Admin Dashboard
        </h1>

        <p className="text-gray-500 mt-2">
          Welcome to the AUMNex Admin Portal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="bg-white rounded-2xl shadow-md p-6"
            >
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center ${item.color}`}
              >
                <Icon size={28} />
              </div>

              <h2 className="text-gray-500 mt-5">
                {item.title}
              </h2>

              <p className="text-3xl font-bold mt-2">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">
          Quick Actions
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {quickActions.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="border rounded-xl p-5 hover:bg-blue-50 hover:border-blue-500 transition flex items-center justify-between"
            >
              <span className="font-medium">
                {item.title}
              </span>

              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
