"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  Users,
  CalendarCheck,
  IndianRupee,
  Bell,
  ArrowRight,
  GraduationCap,
  AlertTriangle,
  Clock,
  Brain,
  BookOpen,
  WalletCards,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDayName(date) {
  return date
    .toLocaleDateString("en-US", {
      weekday: "long",
    })
    .toLowerCase();
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function getTimestampValue(value) {
  if (!value) return 0;

  if (typeof value?.seconds === "number") {
    return value.seconds;
  }

  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseTimeToMinutes(value) {
  if (!value) return 9999;

  const text = String(value).trim();

  const match = text.match(
    /(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i
  );

  if (!match) return 9999;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === "AM" && hours === 12) {
    hours = 0;
  }

  if (meridiem === "PM" && hours !== 12) {
    hours += 12;
  }

  return hours * 60 + minutes;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [selectedSemester, setSelectedSemester] =
    useState("semester4");

  const [dashboard, setDashboard] = useState({
    students: 0,

    departments: 0,

    results: {
      total: 0,
      pass: 0,
      fail: 0,
      atkt: 0,
    },

    attendance: {
      sessionsToday: 0,
      presentToday: 0,
      absentToday: 0,
      percentageToday: null,
    },

    fees: {
      totalFees: 0,
      paidFees: 0,
      pendingFees: 0,
      totalRecords: 0,
      paidRecords: 0,
      partialRecords: 0,
      pendingRecords: 0,
    },

    notifications: {
      total: 0,
      highPriority: 0,
      recent: [],
    },

    academicAttention: 0,

    recentSessions: [],

    upcomingTimetable: [],
  });

  useEffect(() => {
    loadDashboard();
  }, [selectedSemester]);

  async function loadDashboard(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [
        studentsSnap,
        sessionsSnap,
        resultsSnap,
        feesSnap,
        notificationsSnap,
        timetableSnapshot,
      ] = await Promise.all([
        getDocs(collection(db, "students")),
        getDocs(collection(db, "attendanceSessions")),
        getDocs(collection(db, "results")),
        getDocs(collection(db, "fees")),
        getDocs(collection(db, "notifications")),
        loadTimetable(selectedSemester),
      ]);

      /* ---------------------------------
         STUDENTS
      --------------------------------- */

      const students = studentsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      const departments = new Set();

      students.forEach((student) => {
        if (student.department) {
          departments.add(student.department);
        }
      });

      /* ---------------------------------
         ATTENDANCE
      --------------------------------- */

      const today = getLocalDateString();

      let todaySessions = 0;
      let todayPresent = 0;
      let todayAbsent = 0;

      const recentSessions = [];

      for (const sessionDoc of sessionsSnap.docs) {
        if (sessionDoc.id === "current") {
          continue;
        }

        const session = sessionDoc.data();

        if (session.date === today) {
          todaySessions++;

          const studentsRef = collection(
            db,
            "attendanceSessions",
            sessionDoc.id,
            "students"
          );

          const attendanceStudentsSnap =
            await getDocs(studentsRef);

          attendanceStudentsSnap.forEach((studentDoc) => {
            const status = studentDoc.data()?.status;

            if (status === "Present") {
              todayPresent++;
            }

            if (status === "Absent") {
              todayAbsent++;
            }
          });
        }

        recentSessions.push({
          id: sessionDoc.id,
          ...session,
          present: Number(session.present || 0),
          absent: Number(session.absent || 0),
        });
      }

      recentSessions.sort(
        (a, b) =>
          getTimestampValue(b.createdAt) -
          getTimestampValue(a.createdAt)
      );

      const attendanceRecorded =
        todayPresent + todayAbsent > 0;

      const todayPercentage = attendanceRecorded
        ? Math.round(
            (todayPresent /
              (todayPresent + todayAbsent)) *
              100
          )
        : null;

      /* ---------------------------------
         RESULTS
      --------------------------------- */

      let totalResults = 0;
      let totalPass = 0;
      let totalFail = 0;
      let totalAtkt = 0;
      let academicAttention = 0;

      for (const resultDoc of resultsSnap.docs) {
        const semesterSnapshot = await getDocs(
          collection(
            db,
            "results",
            resultDoc.id,
            "semesters"
          )
        );

        semesterSnapshot.forEach((semesterDoc) => {
          const result = semesterDoc.data();

          totalResults++;

          if (result.status === "PASS") {
            totalPass++;
          }

          if (result.status === "FAIL") {
            totalFail++;
            academicAttention++;
          }

          if (result.status === "ATKT") {
            totalAtkt++;
            academicAttention++;
          }

          if (
            Number(result.failedSubjects || 0) > 0 &&
            result.status !== "FAIL" &&
            result.status !== "ATKT"
          ) {
            academicAttention++;
          }
        });
      }

      /* ---------------------------------
         FEES
      --------------------------------- */

      let totalFees = 0;
      let paidFees = 0;
      let pendingFees = 0;

      let paidRecords = 0;
      let partialRecords = 0;
      let pendingRecords = 0;

      feesSnap.forEach((feeDoc) => {
        const fee = feeDoc.data();

        totalFees += Number(fee.totalFees || 0);
        paidFees += Number(fee.paidFees || 0);
        pendingFees += Number(fee.pendingFees || 0);

        if (fee.status === "Paid") {
          paidRecords++;
        } else if (fee.status === "Partial") {
          partialRecords++;
        } else if (fee.status === "Pending") {
          pendingRecords++;
        }
      });

      /* ---------------------------------
         NOTIFICATIONS
      --------------------------------- */

      const notifications = notificationsSnap.docs.map(
        (notificationDoc) => ({
          id: notificationDoc.id,
          ...notificationDoc.data(),
        })
      );

      const highPriorityNotifications =
        notifications.filter(
          (item) => item.priority === "High"
        ).length;

      notifications.sort(
        (a, b) =>
          getTimestampValue(b.createdAt) -
          getTimestampValue(a.createdAt)
      );

      /* ---------------------------------
         FINAL DASHBOARD STATE
      --------------------------------- */

      setDashboard({
        students: studentsSnap.size,

        departments: departments.size,

        results: {
          total: totalResults,
          pass: totalPass,
          fail: totalFail,
          atkt: totalAtkt,
        },

        attendance: {
          sessionsToday: todaySessions,
          presentToday: todayPresent,
          absentToday: todayAbsent,
          percentageToday: todayPercentage,
        },

        fees: {
          totalFees,
          paidFees,
          pendingFees,
          totalRecords: feesSnap.size,
          paidRecords,
          partialRecords,
          pendingRecords,
        },

        notifications: {
          total: notifications.length,
          highPriority: highPriorityNotifications,
          recent: notifications.slice(0, 5),
        },

        academicAttention,

        recentSessions: recentSessions.slice(0, 5),

        upcomingTimetable:
          buildUpcomingTimetable(timetableSnapshot),
      });
    } catch (err) {
      console.error("Dashboard loading error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadTimetable(semester) {
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    const result = {};

    await Promise.all(
      days.map(async (day) => {
        const ref = doc(
          db,
          "timetable",
          semester,
          "days",
          day
        );

        const snap = await getDoc(ref);

        result[day] = snap.exists()
          ? snap.data()
          : {};
      })
    );

    return result;
  }

  function buildUpcomingTimetable(timetable) {
    const periods = [
      "period1",
      "period2",
      "period3",
      "period4",
      "period5",
      "period6",
    ];

    const now = new Date();

    const currentDayIndex = now.getDay();

    const dayOrder = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    const upcoming = [];

    for (let offset = 0; offset < 7; offset++) {
      const dayIndex =
        (currentDayIndex + offset) % 7;

      const dayName = dayOrder[dayIndex];

      if (
        dayName === "sunday" ||
        !timetable[dayName]
      ) {
        continue;
      }

      periods.forEach((period, periodIndex) => {
        const lecture =
          timetable[dayName]?.[period];

        if (!lecture) return;

        if (
          lecture.type === "Break" ||
          !lecture.subject
        ) {
          return;
        }

        const minutes =
          parseTimeToMinutes(lecture.time);

        if (
          offset === 0 &&
          minutes !== 9999
        ) {
          const currentMinutes =
            now.getHours() * 60 +
            now.getMinutes();

          if (minutes < currentMinutes) {
            return;
          }
        }

        upcoming.push({
          day: dayName,
          dayLabel:
            dayName.charAt(0).toUpperCase() +
            dayName.slice(1),

          period: periodIndex + 1,

          subject: lecture.subject,

          time: lecture.time || "Time unavailable",

          faculty:
            lecture.faculty || "Faculty unavailable",

          room:
            lecture.room || "Room unavailable",

          type: lecture.type || "Theory",

          sortOrder:
            offset * 100 + periodIndex,
        });
      });

      if (upcoming.length >= 6) {
        break;
      }
    }

    return upcoming
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, 6);
  }

  const feeCollectionPercentage = useMemo(() => {
    if (dashboard.fees.totalFees <= 0) {
      return null;
    }

    return Math.round(
      (dashboard.fees.paidFees /
        dashboard.fees.totalFees) *
        100
    );
  }, [dashboard.fees]);

if (loading) {
  return (
    <div className="flex items-center justify-center min-h-100">
      <div className="text-gray-500">
        Loading Command Center...
      </div>
    </div>
  );
}

  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Admin Command Center
          </h1>

          <p className="text-gray-500 mt-2">
            AUMNex institutional overview and control center
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSemester}
            onChange={(e) =>
              setSelectedSemester(e.target.value)
            }
            className="border rounded-xl px-4 py-3 bg-white"
          >
            <option value="semester1">
              Semester 1
            </option>

            <option value="semester2">
              Semester 2
            </option>

            <option value="semester3">
              Semester 3
            </option>

            <option value="semester4">
              Semester 4
            </option>

            <option value="semester5">
              Semester 5
            </option>

            <option value="semester6">
              Semester 6
            </option>

            <option value="semester7">
              Semester 7
            </option>

            <option value="semester8">
              Semester 8
            </option>
          </select>

          <button
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="border rounded-xl px-4 py-3 hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw
              size={18}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>
      </div>

      {/* MAIN OVERVIEW */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500">
                Students
              </p>

              <h2 className="text-3xl font-bold mt-3">
                {dashboard.students}
              </h2>
            </div>

            <div className="bg-blue-100 p-4 rounded-xl">
              <Users className="text-blue-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500">
                Results
              </p>

              <h2 className="text-3xl font-bold mt-3">
                {dashboard.results.total}
              </h2>

              <p className="text-sm text-green-600 mt-2">
                {dashboard.results.pass} passed
              </p>
            </div>

            <div className="bg-green-100 p-4 rounded-xl">
              <GraduationCap
                className="text-green-600"
                size={28}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500">
                Attendance
              </p>

              <h2 className="text-3xl font-bold mt-3">
                {dashboard.attendance.percentageToday ===
                null
                  ? "Unavailable"
                  : `${dashboard.attendance.percentageToday}%`}
              </h2>

              <p className="text-sm text-gray-500 mt-2">
                Today's attendance
              </p>
            </div>

            <div className="bg-orange-100 p-4 rounded-xl">
              <CalendarCheck
                className="text-orange-600"
                size={28}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500">
                Academic Attention
              </p>

              <h2 className="text-3xl font-bold mt-3">
                {dashboard.academicAttention}
              </h2>

              <p className="text-sm text-gray-500 mt-2">
                FAIL / ATKT / failed subjects
              </p>
            </div>

            <div className="bg-red-100 p-4 rounded-xl">
              <AlertTriangle
                className="text-red-600"
                size={28}
              />
            </div>
          </div>
        </div>

      </div>

      {/* TODAY'S ATTENDANCE */}

      <div className="bg-white rounded-2xl shadow-md p-6">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            Today's Overview
          </h2>

          <Link
            href="/admin/attendance"
            className="text-blue-600 hover:underline"
          >
            Attendance →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <div className="bg-blue-50 rounded-xl p-5">
            <p className="text-gray-500 text-sm">
              Sessions Today
            </p>

            <h3 className="text-3xl font-bold mt-2">
              {dashboard.attendance.sessionsToday}
            </h3>
          </div>

          <div className="bg-green-50 rounded-xl p-5">
            <p className="text-gray-500 text-sm">
              Present Students
            </p>

            <h3 className="text-3xl font-bold text-green-600 mt-2">
              {dashboard.attendance.presentToday}
            </h3>
          </div>

          <div className="bg-red-50 rounded-xl p-5">
            <p className="text-gray-500 text-sm">
              Absent Students
            </p>

            <h3 className="text-3xl font-bold text-red-600 mt-2">
              {dashboard.attendance.absentToday}
            </h3>
          </div>

        </div>

        {dashboard.attendance.percentageToday === null && (
          <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
            Attendance data unavailable for today.
            No attendance percentage is being assumed.
          </div>
        )}

      </div>

      {/* ACADEMIC SUMMARY + FEES */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <div className="bg-white rounded-2xl shadow-md p-6">

          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                Academic Summary
              </h2>

              <p className="text-gray-500 mt-1">
                Current result records
              </p>
            </div>

            <Link
              href="/admin/results"
              className="text-blue-600 hover:underline"
            >
              Manage →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="border rounded-xl p-4">
              <div className="flex items-center gap-2">
                <BookOpen size={18} />
                <span className="text-gray-500">
                  Total
                </span>
              </div>

              <p className="text-2xl font-bold mt-2">
                {dashboard.results.total}
              </p>
            </div>

            <div className="border rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={18} />
                <span>
                  PASS
                </span>
              </div>

              <p className="text-2xl font-bold mt-2">
                {dashboard.results.pass}
              </p>
            </div>

            <div className="border rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle size={18} />
                <span>
                  FAIL
                </span>
              </div>

              <p className="text-2xl font-bold mt-2">
                {dashboard.results.fail}
              </p>
            </div>

            <div className="border rounded-xl p-4">
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle size={18} />
                <span>
                  ATKT
                </span>
              </div>

              <p className="text-2xl font-bold mt-2">
                {dashboard.results.atkt}
              </p>
            </div>

          </div>

        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">

          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                Fees Summary
              </h2>

              <p className="text-gray-500 mt-1">
                Current fee collection
              </p>
            </div>

            <Link
              href="/admin/fees"
              className="text-blue-600 hover:underline"
            >
              Manage →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="border rounded-xl p-4">
              <div className="flex items-center gap-2">
                <IndianRupee size={18} />
                <span className="text-gray-500">
                  Total Fees
                </span>
              </div>

              <p className="text-xl font-bold mt-2">
                {formatCurrency(
                  dashboard.fees.totalFees
                )}
              </p>
            </div>

            <div className="border rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-600">
                <WalletCards size={18} />
                <span>
                  Collected
                </span>
              </div>

              <p className="text-xl font-bold mt-2">
                {formatCurrency(
                  dashboard.fees.paidFees
                )}
              </p>
            </div>

            <div className="border rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-600">
                <IndianRupee size={18} />
                <span>
                  Pending
                </span>
              </div>

              <p className="text-xl font-bold mt-2">
                {formatCurrency(
                  dashboard.fees.pendingFees
                )}
              </p>
            </div>

            <div className="border rounded-xl p-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} />
                <span className="text-gray-500">
                  Collection
                </span>
              </div>

              <p className="text-xl font-bold mt-2">
                {feeCollectionPercentage === null
                  ? "Unavailable"
                  : `${feeCollectionPercentage}%`}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* INTELLIGENCE + NOTIFICATIONS */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <div className="bg-white rounded-2xl shadow-md p-6">

          <div className="flex items-center gap-3 mb-5">
            <div className="bg-purple-100 p-3 rounded-xl">
              <Brain
                className="text-purple-600"
                size={24}
              />
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                Intelligence
              </h2>

              <p className="text-gray-500">
                AUMNex academic intelligence
              </p>
            </div>
          </div>

          <div className="border rounded-xl p-5">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">
                  Students needing academic attention
                </p>

                <p className="text-3xl font-bold mt-2">
                  {dashboard.academicAttention}
                </p>
              </div>

              <AlertTriangle
                className="text-yellow-600"
                size={30}
              />
            </div>

            <p className="text-sm text-gray-500 mt-4">
              This count is based on existing result
              records such as FAIL, ATKT, and failed
              subjects. Attendance-based intelligence
              is not inferred when attendance data is
              unavailable.
            </p>

          </div>

          <Link
            href="/admin/Ai"
            className="mt-4 inline-flex items-center gap-2 text-purple-600 hover:underline"
          >
            Open Intelligence
            <ArrowRight size={17} />
          </Link>

        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">

          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">

              <div className="bg-blue-100 p-3 rounded-xl">
                <Bell
                  className="text-blue-600"
                  size={24}
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  Notifications
                </h2>

                <p className="text-gray-500">
                  Latest administrator notices
                </p>
              </div>

            </div>

            <Link
              href="/admin/notifications"
              className="text-blue-600 hover:underline"
            >
              Manage →
            </Link>
          </div>

          <div className="flex gap-6 mb-5">
            <div>
              <p className="text-gray-500 text-sm">
                Total
              </p>

              <p className="text-2xl font-bold">
                {dashboard.notifications.total}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                High Priority
              </p>

              <p className="text-2xl font-bold text-red-600">
                {dashboard.notifications.highPriority}
              </p>
            </div>
          </div>

          {dashboard.notifications.recent.length ===
          0 ? (
            <div className="border rounded-xl p-5 text-gray-500 text-center">
              No notifications found.
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.notifications.recent
                .slice(0, 4)
                .map((notification) => (
                  <div
                    key={notification.id}
                    className="border rounded-xl p-4"
                  >
                    <div className="flex justify-between gap-3">

                      <div>
                        <p className="font-semibold">
                          {notification.title}
                        </p>

                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>

                      <span
                        className={`text-xs px-2 py-1 rounded-full h-fit ${
                          notification.priority === "High"
                            ? "bg-red-100 text-red-700"
                            : notification.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {notification.priority ||
                          "General"}
                      </span>

                    </div>
                  </div>
                ))}
            </div>
          )}

        </div>

      </div>

      {/* UPCOMING TIMETABLE */}

      <div className="bg-white rounded-2xl shadow-md p-6">

        <div className="flex justify-between items-center mb-6">

          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-xl">
              <Clock
                className="text-green-600"
                size={24}
              />
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                Upcoming Timetable
              </h2>

              <p className="text-gray-500">
                Semester timetable preview
              </p>
            </div>
          </div>

          <Link
            href="/admin/timetable"
            className="text-blue-600 hover:underline"
          >
            Manage →
          </Link>

        </div>

        {dashboard.upcomingTimetable.length ===
        0 ? (
          <div className="border rounded-xl p-8 text-center text-gray-500">
            No upcoming timetable entries found
            for this semester.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

            {dashboard.upcomingTimetable.map(
              (item, index) => (
                <div
                  key={`${item.day}-${item.period}-${index}`}
                  className="border rounded-xl p-5 hover:bg-gray-50 transition"
                >

                  <div className="flex items-center justify-between">
                    <span className="font-semibold capitalize">
                      {item.dayLabel}
                    </span>

                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      Period {item.period}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mt-4">
                    {item.subject}
                  </h3>

                  <div className="text-sm text-gray-500 space-y-1 mt-3">
                    <p>
                      🕒 {item.time}
                    </p>

                    <p>
                      🏫 {item.room}
                    </p>

                    <p>
                      👨‍🏫 {item.faculty}
                    </p>
                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>

      {/* RECENT ATTENDANCE */}

      <div className="bg-white rounded-2xl shadow-md p-6">

        <div className="flex justify-between items-center mb-6">

          <div>
            <h2 className="text-2xl font-bold">
              Recent Attendance Sessions
            </h2>

            <p className="text-gray-500 mt-1">
              Latest recorded attendance activity
            </p>
          </div>

          <Link
            href="/admin/attendance/history"
            className="text-blue-600 hover:underline"
          >
            View All →
          </Link>

        </div>

        {dashboard.recentSessions.length ===
        0 ? (
          <div className="text-center py-12 text-gray-500">
            No recent attendance sessions.
          </div>
        ) : (
          <div className="space-y-4">

            {dashboard.recentSessions.map(
              (session) => (
                <div
                  key={session.id}
                  className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >

                  <div>
                    <h3 className="font-semibold">
                      {session.subject ||
                        "Subject unavailable"}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      {session.department ||
                        "Department unavailable"}
                      {" • "}
                      {session.semester ||
                        "Semester unavailable"}
                    </p>
                  </div>

                  <div className="flex gap-5 text-sm">

                    <div>
                      <p className="text-gray-500">
                        Present
                      </p>

                      <p className="font-bold text-green-600">
                        {session.present}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">
                        Absent
                      </p>

                      <p className="font-bold text-red-600">
                        {session.absent}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">
                        Date
                      </p>

                      <p className="font-semibold">
                        {session.date ||
                          "Date unavailable"}
                      </p>
                    </div>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>

      {/* QUICK ACTIONS */}

      <div className="bg-white rounded-2xl shadow-md p-6">

        <h2 className="text-2xl font-bold mb-6">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          {[
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
          ].map((item) => (
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

    </div>
  );
}