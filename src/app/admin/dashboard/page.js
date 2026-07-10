"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  Users,
  CalendarCheck,
  IndianRupee,
  Bell,
  ArrowRight,
} from "lucide-react";

export default function AdminDashboard() {

  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    students: 0,
    attendance: 0,
    feesCollected: 0,
    notifications: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {

    try {

      const [
        studentsSnap,
        attendanceSnap,
        feesSnap,
        notificationsSnap,
      ] = await Promise.all([
        getDocs(collection(db, "students")),
        getDocs(collection(db, "attendance")),
        getDocs(collection(db, "fees")),
        getDocs(collection(db, "notifications")),
      ]);

      let totalAttendance = 0;

      attendanceSnap.forEach((doc) => {
        totalAttendance += Number(
          doc.data().percentage || 0
        );
      });

      const averageAttendance =
        attendanceSnap.size > 0
          ? Math.round(
              totalAttendance / attendanceSnap.size
            )
          : 0;

      let totalFees = 0;

      feesSnap.forEach((doc) => {
        totalFees += Number(
          doc.data().paidFees || 0
        );
      });

      setStats({
        students: studentsSnap.size,
        attendance: averageAttendance,
        feesCollected: totalFees,
        notifications: notificationsSnap.size,
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-lg">
        Loading Dashboard...
      </div>
    );
  }

  const cards = [
    {
      title: "Students",
      value: stats.students,
      icon: Users,
      color: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Attendance",
      value: `${stats.attendance}%`,
      icon: CalendarCheck,
      color: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Fees Collected",
      value: `₹${stats.feesCollected.toLocaleString()}`,
      icon: IndianRupee,
      color: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      title: "Notifications",
      value: stats.notifications,
      icon: Bell,
      color: "bg-red-100",
      iconColor: "text-red-600",
    },
  ];

  const quickLinks = [
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

  return (

    <div className="space-y-8">

      <div>

        <h1 className="text-3xl font-bold">
          Admin Dashboard
        </h1>

        <p className="text-gray-500 mt-2">
          Welcome to the AUMNex Admin Portal
        </p>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {cards.map((card) => {

          const Icon = card.icon;

          return (

            <div
              key={card.title}
              className="bg-white rounded-2xl shadow-md p-6"
            >

              <div className="flex justify-between items-center">

                <div>

                  <p className="text-gray-500">
                    {card.title}
                  </p>

                  <h2 className="text-3xl font-bold mt-3">
                    {card.value}
                  </h2>

                </div>

                <div className={`${card.color} p-4 rounded-xl`}>

                  <Icon
                    size={30}
                    className={card.iconColor}
                  />

                </div>

              </div>

            </div>

          );

        })}

      </div>
            <div className="bg-white rounded-2xl shadow-md p-6">

        <h2 className="text-2xl font-bold mb-6">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          {quickLinks.map((item) => (

            <Link
              key={item.title}
              href={item.href}
              className="border rounded-xl p-4 hover:bg-blue-50 hover:border-blue-500 transition flex items-center justify-between"
            >
              <span className="font-medium">
                {item.title}
              </span>

              <ArrowRight
                size={18}
                className="text-gray-500"
              />

            </Link>

          ))}

        </div>

      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">

        <h2 className="text-2xl font-bold mb-6">
          Live Database Summary
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Students
            </p>
            <h3 className="text-3xl font-bold text-blue-600 mt-2">
              {stats.students}
            </h3>
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Attendance
            </p>
            <h3 className="text-3xl font-bold text-green-600 mt-2">
              {stats.attendance}%
            </h3>
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Fees Collected
            </p>
            <h3 className="text-3xl font-bold text-yellow-600 mt-2">
              ₹{stats.feesCollected.toLocaleString()}
            </h3>
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Notifications
            </p>
            <h3 className="text-3xl font-bold text-red-600 mt-2">
              {stats.notifications}
            </h3>
          </div>

        </div>

      </div>

    </div>

  );

}
