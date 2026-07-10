"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
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

export default function StudentAttendance() {
  const [attendance, setAttendance] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  async function fetchAttendance() {
    try {
      setLoading(true);

      const attendanceRef = doc(
        db,
        "attendance",
        "student001"
      );

      const attendanceSnap = await getDoc(attendanceRef);

      if (!attendanceSnap.exists()) {
        setAttendance(null);
        setSubjects([]);
        return;
      }

      setAttendance(attendanceSnap.data());

      const subjectsRef = collection(
        db,
        "attendance",
        "student001",
        "subjects"
      );

      const subjectsSnap = await getDocs(subjectsRef);

      const list = subjectsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSubjects(list);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
  <div className="space-y-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-300 rounded w-64"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[1,2,3,4].map((i)=>(
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

    <PageHeader
      title="Attendance"
      subtitle="Monitor your attendance performance"
    />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

        {/* Overall */}

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

        {/* Present */}

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

        {/* Absent */}

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

        {/* Status */}

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

      {/* Progress */}

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
            className="h-full rounded-full bg-gradient-to-r from-green-500 to-blue-600 transition-all duration-700"
            style={{
              width: `${attendance.percentage}%`,
            }}
          />

        </div>

      </div>

      {/* Subject Table */}

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

              {subjects.map((subject)=>(

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
                        subject.status === "Excellent"
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