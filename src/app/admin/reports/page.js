"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  Users,
  CalendarCheck,
  IndianRupee,
  GraduationCap,
  Bell,
  CalendarDays,
} from "lucide-react";

export default function ReportsPage() {

  const [stats, setStats] = useState({
    students: 0,
    attendance: 0,
    fees: 0,
    results: 0,
    notifications: 0,
    timetable: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {

    try {

      const [
        studentsSnap,
        attendanceSnap,
        feesSnap,
        resultsSnap,
        notificationsSnap,
        timetableSnap,
      ] = await Promise.all([
        getDocs(collection(db, "students")),
        getDocs(collection(db, "attendance")),
        getDocs(collection(db, "fees")),
        getDocs(collection(db, "results")),
        getDocs(collection(db, "notifications")),
        getDocs(collection(db, "timetable")),
      ]);

      setStats({
        students: studentsSnap.size,
        attendance: attendanceSnap.size,
        fees: feesSnap.size,
        results: resultsSnap.size,
        notifications: notificationsSnap.size,
        timetable: timetableSnap.size,
      });

    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="p-8 text-lg">
        Loading Reports...
      </div>
    );
  }

  const cards = [
    {
      title: "Total Students",
      value: stats.students,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Attendance Records",
      value: stats.attendance,
      icon: CalendarCheck,
      color: "bg-green-500",
    },
    {
      title: "Fee Records",
      value: stats.fees,
      icon: IndianRupee,
      color: "bg-yellow-500",
    },
    {
      title: "Results",
      value: stats.results,
      icon: GraduationCap,
      color: "bg-purple-500",
    },
    {
      title: "Notifications",
      value: stats.notifications,
      icon: Bell,
      color: "bg-red-500",
    },
    {
      title: "Timetable Days",
      value: stats.timetable,
      icon: CalendarDays,
      color: "bg-indigo-500",
    },
  ];

  return (

    <div className="space-y-8">

      <div>

        <h1 className="text-3xl font-bold">
          Reports Dashboard
        </h1>

        <p className="text-gray-500 mt-2">
          Overview of your ERP system
        </p>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {cards.map((card) => {

          const Icon = card.icon;

          return (

            <div
              key={card.title}
              className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition"
            >

              <div className="flex justify-between items-center">

                <div>

                  <p className="text-gray-500">
                    {card.title}
                  </p>

                  <h2 className="text-4xl font-bold mt-3">
                    {card.value}
                  </h2>

                </div>

                <div
                  className={`${card.color} text-white p-4 rounded-xl`}
                >
                  <Icon size={30} />
                </div>

              </div>

            </div>

          );

        })}

      </div>
            <div className="bg-white rounded-2xl shadow-md p-6">

        <h2 className="text-2xl font-bold mb-6">
          System Summary
        </h2>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-100">

              <tr>
                <th className="text-left p-4">Module</th>
                <th className="text-center p-4">Records</th>
                <th className="text-center p-4">Status</th>
              </tr>

            </thead>

            <tbody>

              {cards.map((card) => (

                <tr
                  key={card.title}
                  className="border-b hover:bg-gray-50"
                >

                  <td className="p-4 font-medium">
                    {card.title}
                  </td>

                  <td className="p-4 text-center">
                    {card.value}
                  </td>

                  <td className="p-4 text-center">

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        card.value > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {card.value > 0 ? "Active" : "No Data"}
                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-md p-8 text-white">

        <h2 className="text-2xl font-bold mb-4">
          Project Status
        </h2>

        <p className="text-lg">
          🎉 Smart NFC Student ID ERP System is operational.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">

          <div className="bg-white/20 rounded-xl p-4 text-center">
            <p className="text-sm">Student Portal</p>
            <p className="font-bold text-xl">✅</p>
          </div>

          <div className="bg-white/20 rounded-xl p-4 text-center">
            <p className="text-sm">Admin Panel</p>
            <p className="font-bold text-xl">✅</p>
          </div>

          <div className="bg-white/20 rounded-xl p-4 text-center">
            <p className="text-sm">Firestore</p>
            <p className="font-bold text-xl">✅</p>
          </div>

          <div className="bg-white/20 rounded-xl p-4 text-center">
            <p className="text-sm">CRUD Modules</p>
            <p className="font-bold text-xl">6/6</p>
          </div>

        </div>

      </div>

    </div>

  );

}