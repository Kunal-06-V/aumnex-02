"use client";

import { useEffect, useState } from "react";

import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

import {
  UserCheck,
  UserX,
  CalendarDays,
  BadgeCheck,
} from "lucide-react";

import { db } from "@/lib/firebase";
import PageHeader from "@/components/PageHeader";
import { useStudent } from "@/context/StudentContext";

export default function StudentAttendance() {
  const { student } = useStudent();

  const [attendance, setAttendance] = useState({
    percentage: 0,
    present: 0,
    absent: 0,
    leave: 0,
    total: 0,
    status: "Poor",
  });

  const [subjects, setSubjects] = useState([]);

  const [todayAttendance, setTodayAttendance] =
    useState({
      found: false,
      subject: "",
      status: "",
      date: "",
      time: "",
    });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student?.uid) {
      setLoading(false);
      return;
    }

    async function loadAttendance() {
      try {
        setLoading(true);

        let present = 0;
        let absent = 0;
        let leave = 0;

        const today = new Date()
          .toISOString()
          .split("T")[0];

        const subjectMap = {};

        /*
         * Read attendance session metadata.
         *
         * We intentionally do NOT read the entire
         * students subcollection anymore.
         */
        const sessionsSnapshot =
          await getDocs(
            collection(db, "attendanceSessions")
          );

        for (const sessionDoc of sessionsSnapshot.docs) {
          /*
           * "current" is the temporary live NFC
           * session. It is not historical attendance.
           */
          if (sessionDoc.id === "current") {
            continue;
          }

          const session = sessionDoc.data();

          /*
           * Read only this student's attendance
           * document for this session.
           *
           * Attendance documents use the student's
           * Firebase Auth UID as the document ID.
           */
          const studentAttendanceRef = doc(
            db,
            "attendanceSessions",
            sessionDoc.id,
            "students",
            student.uid
          );

          const studentAttendanceSnap =
            await getDoc(studentAttendanceRef);

          if (!studentAttendanceSnap.exists()) {
            continue;
          }

          const data =
            studentAttendanceSnap.data();

          /*
           * Extra identity validation.
           */
          if (
            data.uid &&
            data.uid !== student.uid
          ) {
            continue;
          }

          /*
           * Today's attendance
           */
          if (session.date === today) {
            setTodayAttendance({
              found: true,
              subject:
                session.subject || "Unknown",
              status: data.status || "Unknown",
              date: session.date,
              time: data.markedAt
                ? data.markedAt
                    .toDate()
                    .toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                : "",
            });
          }

          /*
           * Overall attendance
           */
          if (data.status === "Present") {
            present++;
          } else if (
            data.status === "Absent"
          ) {
            absent++;
          } else if (
            data.status === "Leave"
          ) {
            leave++;
          }

          /*
           * Subject-wise attendance
           */
          const subject =
            session.subject || "Unknown";

          if (!subjectMap[subject]) {
            subjectMap[subject] = {
              id: subject,
              subject,
              present: 0,
              total: 0,
            };
          }

          subjectMap[subject].total++;

          if (data.status === "Present") {
            subjectMap[subject].present++;
          }
        }

        const total =
          present + absent + leave;

        const percentage =
          total === 0
            ? 0
            : Math.round(
                (present / total) * 100
              );

        const subjectList =
          Object.values(subjectMap).map(
            (item) => {
              const percent =
                item.total === 0
                  ? 0
                  : Math.round(
                      (item.present /
                        item.total) *
                        100
                    );

              return {
                ...item,
                percentage: percent,
                status:
                  percent >= 90
                    ? "Excellent"
                    : percent >= 75
                    ? "Good"
                    : "Poor",
              };
            }
          );

        setAttendance({
          percentage,
          present,
          absent,
          leave,
          total,
          status:
            percentage >= 90
              ? "Excellent"
              : percentage >= 75
              ? "Good"
              : "Poor",
        });

        setSubjects(subjectList);
      } catch (error) {
        console.error(
          "Student attendance error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadAttendance();
  }, [student]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-300 rounded w-64"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white h-40 rounded-2xl shadow"
              />
            ))}
          </div>

          <div className="bg-white rounded-2xl h-96 shadow"></div>
        </div>
      </div>
    );
  }

  if (!attendance) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center">
          <h1 className="text-3xl font-bold">
            Attendance Not Available
          </h1>

          <p className="text-gray-500 mt-3">
            Attendance has not been uploaded yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <PageHeader
          title="Attendance"
          subtitle="Monitor your attendance performance"
        />

        <a
          href="/student/attendance-history"
          className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition font-medium"
        >
          View Full History →
        </a>

      </div>

      {/* TODAY */}

      <div className="bg-white rounded-2xl shadow-lg p-6">

        <h2 className="text-xl font-semibold mb-4">
          Today's Attendance
        </h2>

        {todayAttendance.found ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

            <div>
              <p className="text-gray-500 text-sm">
                Date
              </p>

              <p className="font-semibold mt-1">
                {todayAttendance.date}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Subject
              </p>

              <p className="font-semibold mt-1">
                {todayAttendance.subject}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Status
              </p>

              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${
                  todayAttendance.status ===
                  "Present"
                    ? "bg-green-100 text-green-700"
                    : todayAttendance.status ===
                      "Absent"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {todayAttendance.status}
              </span>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Marked At
              </p>

              <p className="font-semibold mt-1">
                {todayAttendance.time || "--"}
              </p>
            </div>

          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-lg font-semibold text-gray-700">
              Attendance Not Marked Yet
            </p>

            <p className="text-gray-500 mt-2">
              Your attendance has not been recorded
              for today.
            </p>
          </div>
        )}

      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center">

            <div>
              <p className="text-gray-500">
                Overall Attendance
              </p>

              <h2 className="text-4xl font-bold mt-3">
                {attendance.percentage}%
              </h2>
            </div>

            <div className="bg-blue-100 p-4 rounded-xl">
              <CalendarDays
                className="text-blue-600"
                size={32}
              />
            </div>

          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center">

            <div>
              <p className="text-gray-500">
                Present
              </p>

              <h2 className="text-4xl font-bold text-green-600 mt-3">
                {attendance.present}
              </h2>
            </div>

            <div className="bg-green-100 p-4 rounded-xl">
              <UserCheck
                className="text-green-600"
                size={32}
              />
            </div>

          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center">

            <div>
              <p className="text-gray-500">
                Absent
              </p>

              <h2 className="text-4xl font-bold text-red-600 mt-3">
                {attendance.absent}
              </h2>
            </div>

            <div className="bg-red-100 p-4 rounded-xl">
              <UserX
                className="text-red-600"
                size={32}
              />
            </div>

          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center">

            <div>
              <p className="text-gray-500">
                Status
              </p>

              <h2 className="text-2xl font-bold text-blue-600 mt-3">
                {attendance.status}
              </h2>
            </div>

            <div className="bg-yellow-100 p-4 rounded-xl">
              <BadgeCheck
                className="text-yellow-600"
                size={32}
              />
            </div>

          </div>
        </div>

      </div>

      {/* PROGRESS */}

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">

        <div className="flex justify-between mb-4">

          <h2 className="text-xl font-semibold">
            Attendance Progress
          </h2>

          <span className="font-bold text-blue-600">
            {attendance.percentage}%
          </span>

        </div>

        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">

          <div
          className="h-full rounded-full bg-linear-to-r from-green-500 to-blue-600 transition-all duration-700"
            style={{
              width: `${attendance.percentage}%`,
            }}
          />

        </div>

      </div>

      {/* SUBJECT TABLE */}

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

        <div className="p-6 border-b">

          <h2 className="text-2xl font-semibold">
            Subject Wise Attendance
          </h2>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-slate-800 text-white">

              <tr>

                <th className="p-4 text-left">
                  Subject
                </th>

                <th className="p-4 text-center">
                  Present
                </th>

                <th className="p-4 text-center">
                  Total
                </th>

                <th className="p-4 text-center">
                  %
                </th>

                <th className="p-4 text-center">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {subjects.map((subject) => (

                <tr
                  key={subject.id}
                  className="border-b hover:bg-gray-50"
                >

                  <td className="p-4 font-medium">
                    {subject.subject}
                  </td>

                  <td className="text-center">
                    {subject.present}
                  </td>

                  <td className="text-center">
                    {subject.total}
                  </td>

                  <td className="text-center font-semibold text-blue-600">
                    {subject.percentage}%
                  </td>

                  <td className="text-center">

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        subject.status ===
                        "Excellent"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {subject.status}
                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}