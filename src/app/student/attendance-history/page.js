"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
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

        const list = [];

        const sessionsSnapshot = await getDocs(
          collection(db, "attendanceSessions")
        );

        for (const sessionDoc of sessionsSnapshot.docs) {

          const session = sessionDoc.data();

          const studentsSnapshot = await getDocs(
            collection(
              db,
              "attendanceSessions",
              sessionDoc.id,
              "students"
            )
          );

          studentsSnapshot.forEach((doc) => {

            const data = doc.data();

            if (data.uid !== student.uid) return;

            list.push({
              id: sessionDoc.id,
              date: session.date,
              subject: session.subject,
              status: data.status,
            });

          });

        }

        list.sort((a, b) =>
          b.date.localeCompare(a.date)
        );

        setHistory(list);

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);

      }

    }

    loadHistory();

  }, [student]);

  if (loading) {
    return (
      <h1 className="text-xl">
        Loading...
      </h1>
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

            {history.map((item) => (

              <tr
                key={item.id}
                className="border-b"
              >

                <td className="p-4">
                  {item.date}
                </td>

                <td className="p-4">
                  {item.subject}
                </td>

                <td className="text-center">

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      item.status === "Present"
                        ? "bg-green-100 text-green-700"
                        : item.status === "Absent"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {item.status}
                  </span>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}