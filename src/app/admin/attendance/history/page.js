"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Calendar,
  BookOpen,
  GraduationCap,
  Eye,
} from "lucide-react";

export default function AttendanceHistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "attendanceSessions"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSessions(data);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-lg">
        <h1 className="text-4xl font-bold">
          Attendance History
        </h1>

        <p className="mt-2 text-blue-100">
          View previous attendance sessions.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

        {loading ? (
          <div className="p-8 text-center">
            Loading...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No attendance sessions found.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr className="text-left">
                <th className="p-4">Date</th>
                <th className="p-4">Subject</th>
                <th className="p-4">Department</th>
                <th className="p-4">Semester</th>
                <th className="p-4">Division</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} />
                      {session.date}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <BookOpen size={18} />
                      {session.subject}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap size={18} />
                      {session.department}
                    </div>
                  </td>

                  <td className="p-4">
                    {session.semester}
                  </td>

                  <td className="p-4">
                    {session.division}
                  </td>

                  <td className="p-4 text-center">
                    <Link
                      href={`/admin/attendance/history/${session.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                      <Eye size={18} />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>
    </div>
  );
}