"use client";

import { useEffect, useState } from "react";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
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

  const [dashboardData, setDashboardData] =
    useState({
      attendance: {
        present: 0,
        absent: 0,
        leave: 0,
        total: 0,
        percentage: null,
      },
      cgpa: null,
      resultAvailable: false,
      attendanceAvailable: false,
      loading: true,
    });

  useEffect(() => {
    if (!student?.uid) {
      return;
    }

    loadDashboardData();
  }, [student]);

  async function loadDashboardData() {
    try {
      setDashboardData((prev) => ({
        ...prev,
        loading: true,
      }));

      /* -----------------------------------------
         CURRENT SEMESTER RESULT
      ----------------------------------------- */

      let cgpa = null;
      let resultAvailable = false;

      const semesterId = String(
        student.semester || ""
      ).replace(/\s+/g, "");

      if (semesterId) {
        const resultRef = doc(
          db,
          "results",
          student.uid,
          "semesters",
          semesterId
        );

        const resultSnap =
          await getDoc(resultRef);

        if (resultSnap.exists()) {
          const result =
            resultSnap.data();

          const resultCgpa =
            Number(result.cgpa);

          if (
            Number.isFinite(
              resultCgpa
            ) &&
            resultCgpa >= 0 &&
            resultCgpa <= 10
          ) {
            cgpa = resultCgpa;
            resultAvailable = true;
          }
        }
      }

      /* -----------------------------------------
         VERIFIED ATTENDANCE
      ----------------------------------------- */

      let present = 0;
      let absent = 0;
      let leave = 0;
      let total = 0;

      if (
        student.semester &&
        student.division
      ) {
        const sessionsQuery =
          query(
            collection(
              db,
              "attendanceSessions"
            ),
            where(
              "semester",
              "==",
              student.semester
            ),
            where(
              "division",
              "==",
              student.division
            )
          );

        const sessionsSnapshot =
          await getDocs(
            sessionsQuery
          );

        for (
          const sessionDoc of
            sessionsSnapshot.docs
        ) {
          /*
           * "current" is the temporary
           * live NFC session.
           */
          if (
            sessionDoc.id ===
            "current"
          ) {
            continue;
          }

          const studentAttendanceRef =
            doc(
              db,
              "attendanceSessions",
              sessionDoc.id,
              "students",
              student.uid
            );

          const studentAttendanceSnap =
            await getDoc(
              studentAttendanceRef
            );

          if (
            !studentAttendanceSnap.exists()
          ) {
            continue;
          }

          const record =
            studentAttendanceSnap.data();

          /*
           * Defensive UID validation.
           */
          if (
            record.uid &&
            record.uid !==
              student.uid
          ) {
            continue;
          }

          const status =
            record.status;

          if (
            status === "Present"
          ) {
            present++;
            total++;
          } else if (
            status === "Absent"
          ) {
            absent++;
            total++;
          } else if (
            status === "Leave"
          ) {
            leave++;
            total++;
          }
        }
      }

      const percentage =
        total > 0
          ? Number(
              (
                (present / total) *
                100
              ).toFixed(1)
            )
          : null;

      const attendance = {
        present,
        absent,
        leave,
        total,
        percentage,
      };

      setDashboardData({
        attendance,
        cgpa,
        resultAvailable,
        attendanceAvailable:
          total > 0,
        loading: false,
      });
    } catch (error) {
      console.error(
        "Student dashboard data error:",
        error
      );

      setDashboardData({
        attendance: {
          present: 0,
          absent: 0,
          leave: 0,
          total: 0,
          percentage: null,
        },
        cgpa: null,
        resultAvailable: false,
        attendanceAvailable: false,
        loading: false,
      });
    }
  }

  /* -----------------------------------------
     LOADING
  ----------------------------------------- */

  if (
    loading ||
    dashboardData.loading
  ) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">

        <div className="animate-pulse space-y-6">

          <div className="h-10 w-72 bg-gray-300 rounded" />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

            {[1, 2, 3, 4].map(
              (i) => (
                <div
                  key={i}
                  className="h-36 bg-white rounded-2xl shadow"
                />
              )
            )}

          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            <div className="h-80 bg-white rounded-2xl shadow" />

            <div className="h-80 bg-white rounded-2xl shadow" />

          </div>

        </div>

      </div>
    );
  }

  /* -----------------------------------------
     STUDENT NOT FOUND
  ----------------------------------------- */

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

  const attendanceValue =
    dashboardData.attendanceAvailable
      ? `${dashboardData.attendance.percentage}%`
      : "Unavailable";

  const cgpaValue =
    dashboardData.resultAvailable
      ? dashboardData.cgpa
      : "Unavailable";

  return (
    <div className="bg-gray-100 min-h-screen p-6">

      {/* HEADER */}

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

      {/* ROW 1 */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <ProfileCard
          student={student}
        />

        <div className="xl:col-span-2">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <DashboardCard
              title="Overall CGPA"
              value={cgpaValue}
              color="text-green-600"
            />

            <DashboardCard
              title="Overall Attendance"
              value={attendanceValue}
              color="text-blue-600"
            />

            <DashboardCard
              title="Active Semester"
              value={
                student.semester ||
                "Unavailable"
              }
              color="text-purple-600"
            />

            <DashboardCard
              title="Roll Number"
              value={
                student.rollNo ||
                "Unavailable"
              }
              color="text-orange-600"
            />

          </div>

        </div>

      </div>

      {/* ROW 2 */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">

        <AttendanceChart
          attendance={
            dashboardData.attendance
          }
        />

        <CGPAChart
          cgpa={
            dashboardData.cgpa
          }
        />

      </div>

      {/* ROW 3 */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">

        <Timetable />

        <NotificationPanel />

      </div>

      {/* ROW 4 */}

      <div className="mt-8">

        <QuickActions />

      </div>

    </div>
  );
}