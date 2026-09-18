"use client";

import { useRouter } from "next/navigation";

import {
  CalendarCheck,
  FileText,
  CreditCard,
  ShieldAlert,
} from "lucide-react";

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      title: "Attendance",
      icon: CalendarCheck,
      color: "bg-blue-100 text-blue-600",
      route: "/student/attendance",
    },
    {
      title: "Results",
      icon: FileText,
      color: "bg-green-100 text-green-600",
      route: "/student/results",
    },
    {
      title: "Fees",
      icon: CreditCard,
      color: "bg-yellow-100 text-yellow-600",
      route: "/student/fees",
    },
    {
      title: "SOS",
      icon: ShieldAlert,
      color: "bg-red-100 text-red-600",
      route: "/student/sos",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">

      <h2 className="text-xl font-bold mb-6">
        ⚡ Quick Actions
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

        {actions.map((action, index) => {
          const Icon = action.icon;

          return (
            <button
              key={index}
              onClick={() =>
                router.push(action.route)
              }
              className="flex flex-col items-center justify-center p-6 rounded-xl border hover:shadow-lg hover:scale-105 transition"
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center ${action.color}`}
              >
                <Icon size={28} />
              </div>

              <p className="mt-4 font-semibold text-center">
                {action.title}
              </p>
            </button>
          );
        })}

      </div>
    </div>
  );
}