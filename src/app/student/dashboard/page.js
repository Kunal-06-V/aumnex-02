"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useStudent } from "@/context/StudentContext";

import ProfileCard from "@/components/ProfileCard";
import DashboardCard from "@/components/DashboardCard";
import AttendanceChart from "@/components/AttendanceChart";
import CGPAChart from "@/components/CGPAChart";
import Timetable from "@/components/Timetable";
import NotificationPanel from "@/components/NotificationPanel";
import QuickActions from "@/components/QuickActions";

export default function StudentDashboard() {
  const { student, loading } = useStudent();
  

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="animate-pulse space-y-6">

          <div className="h-10 w-72 bg-gray-300 rounded"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-36 bg-white rounded-2xl shadow"
              />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="h-80 bg-white rounded-2xl shadow"></div>
            <div className="h-80 bg-white rounded-2xl shadow"></div>
          </div>

        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center">

          <h1 className="text-3xl font-bold">
            Student Not Found
          </h1>

          <p className="text-gray-500 mt-3">
            Unable to load student information.
          </p>

        </div>
      </div>
    );
  }
    return (
    <div className="bg-gray-100 min-h-screen p-6">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800">
          Welcome, {student.name}
        </h1>

        <p className="text-gray-500 mt-2">
          Smart NFC Student Management System
        </p>

        <p className="text-gray-600 mt-1">
          Logged in as: {student.email}
        </p>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <ProfileCard student={student} />

        <div className="xl:col-span-2">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <DashboardCard
              title="Overall CGPA"
              value={student.cgpa}
              color="text-green-600"
            />

            <DashboardCard
              title="Overall Attendance"
              value={`${student.attendance}%`}
              color="text-blue-600"
            />

            <DashboardCard
              title="Active Semester"
              value={`Semester ${student.semester}`}
              color="text-purple-600"
            />

            <DashboardCard
              title="Roll Number"
              value={student.rollNo}
              color="text-orange-600"
            />

          </div>

        </div>

      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">

        <AttendanceChart
          attendance={student.attendance}
        />

        <CGPAChart
          cgpa={student.cgpa}
        />

      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">

        <Timetable />

        <NotificationPanel />

      </div>

      {/* Row 4 */}
      <div className="mt-8">

        <QuickActions />

      </div>

    </div>
  );
}