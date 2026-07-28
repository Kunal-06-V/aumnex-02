"use client";

import { UserCircle2 } from "lucide-react";

export default function AttendanceTable({
  students,
  attendance,
  setAttendance,
  onSaveAttendance,
  saving,
}) {
  function updateStatus(uid, status) {
    setAttendance((prev) => ({
      ...prev,
      [uid]: status,
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

      <table className="w-full">

        <thead className="bg-gray-50">

          <tr>

            <th className="text-left px-6 py-4">
              Student
            </th>

            <th className="text-left px-6 py-4">
              Roll No
            </th>

            <th className="text-center px-6 py-4">
              Present
            </th>

            <th className="text-center px-6 py-4">
              Absent
            </th>

            <th className="text-center px-6 py-4">
              Leave
            </th>

          </tr>

        </thead>

        <tbody>

          {students.map((student) => (

            <tr
              key={student.uid}
              className="border-b hover:bg-gray-50"
            >

              <td className="px-6 py-5">

                <div className="flex items-center gap-3">

                  <UserCircle2
                    className="text-gray-400"
                    size={38}
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

              <td className="px-6 py-5">
                {student.rollNo}
              </td>

              {["Present", "Absent", "Leave"].map((status) => (

                <td
                  key={status}
                  className="text-center"
                >

                  <input
                    type="radio"
                    name={student.uid}
                    checked={attendance[student.uid] === status}
                    onChange={() =>
                      updateStatus(student.uid, status)
                    }
                  />

                </td>

              ))}

            </tr>

          ))}

        </tbody>

      </table>
<div className="flex justify-end p-6 border-t">

  <button
  onClick={onSaveAttendance}
  disabled={saving}
  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-8 py-3 rounded-xl"
>
  {saving ? "Saving..." : "Save Attendance"}
</button>

</div>
    </div>
  );
}