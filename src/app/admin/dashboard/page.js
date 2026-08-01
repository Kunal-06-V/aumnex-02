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
    sessions: 0,
    departments: 0,
    todayAttendance: 0,
  });
  const [recentSessions, setRecentSessions] = useState([]);

  const [todaySummary, setTodaySummary] = useState({
    sessions: 0,
    present: 0,
    absent: 0,
    percentage: 0,
  });
  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {

    try {

      const [
        studentsSnap,
        sessionsSnap,
      ] = await Promise.all([
        getDocs(collection(db, "students")),
        getDocs(collection(db, "attendanceSessions")),
      ]);
      const sessions = [];

      const departments = new Set();

      let totalPresent = 0;
      let totalStudents = 0;

      // Today's Attendance Summary
      let todaySessions = 0;
      let todayPresent = 0;
      let todayAbsent = 0;

      const today = new Date().toISOString().split("T")[0];

      for (const sessionDoc of sessionsSnap.docs) {

        const session = sessionDoc.data();

        let present = 0;
        let absent = 0;
        if (session.department) {
          departments.add(session.department);
        }

        if (session.date === today) {

          todaySessions++;

          const studentsSnap = await getDocs(
            collection(
              db,
              "attendanceSessions",
              sessionDoc.id,
              "students"
            )
          );
          studentsSnap.forEach((studentDoc) => {

            const status = studentDoc.data().status;

            if (status === "Present") {
              present++;
            }

            if (status === "Absent") {
              absent++;
            }

          });

          studentsSnap.forEach((studentDoc) => {

            totalStudents++;

            const status = studentDoc.data().status;

            if (status === "Present") {
              totalPresent++;
              todayPresent++;
            } else if (status === "Absent") {
              todayAbsent++;
            }

          });

        }
        sessions.push({
          id: sessionDoc.id,
          ...session,
          present,
          absent,
        });
      }

      const todayPercentage =
        todayPresent + todayAbsent === 0
          ? 0
          : Math.round(
            (todayPresent / (todayPresent + todayAbsent)) * 100);
            const todayAttendance = todayPercentage;
      sessions.sort(
        (a, b) =>
          b.createdAt.seconds -
          a.createdAt.seconds
      );

      setRecentSessions(
        sessions.slice(0, 5)
      );
      setTodaySummary({
        sessions: todaySessions,
        present: todayPresent,
        absent: todayAbsent,
        percentage: todayPercentage,
      });
      setStats({
        students: studentsSnap.size,
        sessions: sessionsSnap.size,
        departments: departments.size,
        todayAttendance,
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
      title: "Attendance Sessions",
      value: stats.sessions,
      icon: CalendarCheck,
      color: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Departments",
      value: stats.departments,
      icon: Users,
      color: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Today's Attendance",
      value: `${stats.todayAttendance}%`,
      icon: CalendarCheck,
      color: "bg-orange-100",
      iconColor: "text-orange-600",
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
          Today's Attendance Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-gray-500 text-sm">
              Sessions Today
            </p>

            <h3 className="text-3xl font-bold text-blue-600 mt-2">
              {todaySummary.sessions}
            </h3>
          </div>

          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-gray-500 text-sm">
              Present Students
            </p>

            <h3 className="text-3xl font-bold text-green-600 mt-2">
              {todaySummary.present}
            </h3>
          </div>

          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-gray-500 text-sm">
              Absent Students
            </p>

            <h3 className="text-3xl font-bold text-red-600 mt-2">
              {todaySummary.absent}
            </h3>
          </div>

          <div className="bg-yellow-50 rounded-xl p-4">
            <p className="text-gray-500 text-sm">
              Attendance %
            </p>

            <h3 className="text-3xl font-bold text-yellow-600 mt-2">
              {todaySummary.percentage}%
            </h3>
          </div>

        </div>

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

        <div className="flex justify-between items-center mb-6">

          <h2 className="text-2xl font-bold">
            Recent Attendance Sessions
          </h2>

          <Link
            href="/admin/attendance/history"
            className="text-blue-600 hover:underline"
          >
            View All →
          </Link>

        </div>

        <div className="text-center py-12 text-gray-500">

          {recentSessions.length === 0 ? (

            <div className="text-center py-12 text-gray-500">
              No Recent Sessions
            </div>

          ) : (

            <div className="space-y-4">

              {recentSessions.map((session) => (

                <div
                  key={session.id}
                  className="border rounded-xl p-4 flex justify-between items-center"
                >

                  <div>

                    <h3 className="font-semibold">
                      {session.subject}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {session.department}
                      {" • "}
                      Semester {session.semester}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-sm text-gray-500">
                      {session.date}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>


    </div>

  );

}
