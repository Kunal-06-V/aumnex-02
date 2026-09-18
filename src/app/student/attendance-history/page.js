"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useStudent } from "@/context/StudentContext";

export default function AttendanceHistory() {
  const { student } = useStudent();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student?.uid) {
      setLoading(false);
      return;
    }

    async function loadHistory() {
      try {
        setLoading(true);

        /*
         * Read historical attendance belonging only
         * to the authenticated student.
         */
        const attendanceQuery = query(
          collection(db, "attendanceHistory"),
          where("studentId", "==", student.uid)
        );

        const snapshot = await getDocs(
          attendanceQuery
        );

        const list = snapshot.docs.map(
          (attendanceDoc) => {
            const data =
              attendanceDoc.data();

            let date = data.date || "";

            /*
             * Some older records may not have a
             * normal date field, so use createdAt.
             */
            if (
              !date &&
              data.createdAt &&
              typeof data.createdAt.toDate ===
                "function"
            ) {
              date = data.createdAt
                .toDate()
                .toISOString()
                .split("T")[0];
            }

            return {
              id: attendanceDoc.id,
              date,
              subject:
                data.subject || "Unknown",
              status:
                data.status || "Unknown",
              faculty:
                data.faculty || "",
              room:
                data.room || "",
            };
          }
        );

        /*
         * Newest attendance first.
         */
        list.sort((a, b) => {
          return String(b.date).localeCompare(
            String(a.date)
          );
        });

        setHistory(list);

        console.log(
          "[Attendance History] UID:",
          student.uid
        );

        console.log(
          "[Attendance History] Record count:",
          list.length
        );

        console.log(
          "[Attendance History] Records:",
          list
        );
      } catch (error) {
        console.error(
          "[Attendance History] Error:",
          error
        );

        setHistory([]);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [student]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          Attendance History
        </h1>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          Loading attendance history...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Attendance History
        </h1>

        <p className="text-gray-500">
          View your complete attendance history.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="p-4 text-left">
                  Date
                </th>

                <th className="p-4 text-left">
                  Subject
                </th>

                <th className="p-4 text-center">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="p-10 text-center text-gray-500"
                  >
                    No attendance history
                    available.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-4">
                      {item.date || "Unknown"}
                    </td>

                    <td className="p-4">
                      {item.subject}
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          item.status ===
                          "Present"
                            ? "bg-green-100 text-green-700"
                            : item.status ===
                              "Absent"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}