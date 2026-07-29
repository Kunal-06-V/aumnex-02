"use client";

import { UserCircle2 } from "lucide-react";

export default function AttendanceTable({
  students,
  attendance,
  setAttendance,
  attendanceMethod,
  setAttendanceMethod,
  onSaveAttendance,
  saving,
}) {
  function updateStatus(uid, status, method = "Manual") {
    setAttendance((prev) => ({
      ...prev,
      [uid]: status,
    }));

    setAttendanceMethod((prev) => ({
      ...prev,
      [uid]: method,
    }));
  }

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 text-center">
        <UserCircle2
          size={60}
          className="mx-auto text-gray-300 mb-4"
        />

        <h2 className="text-2xl font-semibold text-gray-700">
          No Students Loaded
        </h2>

        <p className="text-gray-500 mt-2">
          Select Department, Semester and Division,
          then click <b>Load Students</b>.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">

      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold">
          Student Attendance
        </h2>
      </div>

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-gray-50">

            <tr>

              <th className="text-left px-6 py-4">
                Student
              </th>

              <th className="text-left px-6 py-4">
                Roll No
              </th>

              <th className="text-center px-6 py-4">
                Status
              </th>

              <th className="text-center px-6 py-4">
                Method
              </th>

              <th className="text-center px-6 py-4">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {students.map((student) => (

              <tr
                key={student.uid}
                className="border-b hover:bg-gray-50 transition"
              >

                <td className="px-6 py-5">

                  <div className="flex items-center gap-3">

                    <UserCircle2
                      className="text-gray-400"
                      size={40}
                    />

                    <div>

                      <p className="font-semibold">
                        {student.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        {student.email}
                      </p>

                    </div>

                  </div>

                </td>

                <td className="px-6 py-5 font-medium">
                  {student.rollNo}
                </td>

                <td className="text-center px-6 py-5">

                  {!attendance[student.uid] ? (

                    <span className="inline-flex rounded-full bg-gray-100 text-gray-600 px-4 py-1 text-sm font-semibold">
                      ⚪ Not Marked
                    </span>

                  ) : attendance[student.uid] === "Present" ? (

                    <span className="inline-flex rounded-full bg-green-100 text-green-700 px-4 py-1 text-sm font-semibold">
                      🟢 Present
                    </span>

                  ) : attendance[student.uid] === "Absent" ? (

                    <span className="inline-flex rounded-full bg-red-100 text-red-700 px-4 py-1 text-sm font-semibold">
                      🔴 Absent
                    </span>

                  ) : (

                    <span className="inline-flex rounded-full bg-yellow-100 text-yellow-700 px-4 py-1 text-sm font-semibold">
                      🟡 Leave
                    </span>

                  )}

                </td>

                <td className="text-center px-6 py-5">

                  {!attendanceMethod[student.uid] ? (

                    <span className="text-gray-400">
                      —
                    </span>

                  ) : attendanceMethod[student.uid] === "NFC" ? (

                    <span className="inline-flex rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-sm font-semibold">
                      📱 NFC
                    </span>

                  ) : (

                    <span className="inline-flex rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-sm font-semibold">
                      ✍ Manual
                    </span>

                  )}

                </td>

                <td className="px-6 py-5">

                  <div className="flex justify-center gap-2 flex-wrap">

                    <button
                      onClick={() =>
                        updateStatus(student.uid, "Present")
                      }
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition
                      ${
                        attendance[student.uid] === "Present"
                          ? "bg-green-600 text-white"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      Present
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(student.uid, "Absent")
                      }
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition
                      ${
                        attendance[student.uid] === "Absent"
                          ? "bg-red-600 text-white"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                    >
                      Absent
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(student.uid, "Leave")
                      }
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition
                      ${
                        attendance[student.uid] === "Leave"
                          ? "bg-yellow-500 text-white"
                          : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                      }`}
                    >
                      Leave
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      <div className="flex justify-end border-t p-6">

        <button
          onClick={onSaveAttendance}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-8 py-3 rounded-xl transition"
        >
          {saving ? "Saving..." : "Save Attendance"}
        </button>

      </div>

    </div>
  );
}