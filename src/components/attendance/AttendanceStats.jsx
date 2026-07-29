"use client";

import {
  CheckCircle2,
  XCircle,
  Clock3,
  Percent,
} from "lucide-react";

export default function AttendanceStats({ attendance = {} }) {
  const values = Object.values(attendance);

  const present = values.filter(
    (item) => item === "Present"
  ).length;

  const absent = values.filter(
    (item) => item === "Absent"
  ).length;

  const leave = values.filter(
    (item) => item === "Leave"
  ).length;

  const totalMarked = values.length;

  const attendancePercentage =
    totalMarked === 0
      ? 0
      : Math.round((present / totalMarked) * 100);

  const stats = [
    {
      title: "Present",
      value: present,
      icon: CheckCircle2,
      bg: "bg-green-100",
      color: "text-green-600",
    },
    {
      title: "Absent",
      value: absent,
      icon: XCircle,
      bg: "bg-red-100",
      color: "text-red-600",
    },
    {
      title: "Leave",
      value: leave,
      icon: Clock3,
      bg: "bg-yellow-100",
      color: "text-yellow-600",
    },
    {
      title: "Attendance %",
      value: `${attendancePercentage}%`,
      icon: Percent,
      bg: "bg-blue-100",
      color: "text-blue-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">
                  {item.title}
                </p>

                <h2 className="text-4xl font-bold mt-3">
                  {item.value}
                </h2>
              </div>

              <div
                className={`h-14 w-14 rounded-2xl flex items-center justify-center ${item.bg}`}
              >
                <Icon
                  className={item.color}
                  size={28}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}