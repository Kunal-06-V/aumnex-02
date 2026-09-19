"use client";

import Link from "next/link";
import { CalendarDays, History } from "lucide-react";

export default function AttendanceHeader() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 text-white shadow-xl">
      <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/20 p-3">
              <CalendarDays size={28} />
            </div>

            <div>
              <h1 className="text-4xl font-bold">
                Attendance Management
              </h1>

              <p className="mt-2 text-blue-100">
                Track and manage attendance across departments.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/admin/attendance/history"
          className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-blue-700 shadow-lg transition hover:scale-105"
        >
          <History size={18} />
          View History
        </Link>
      </div>
    </div>
  );
}