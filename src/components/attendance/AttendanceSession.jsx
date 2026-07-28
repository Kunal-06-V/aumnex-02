"use client";

import { useState } from "react";
import {
  CalendarDays,
  Building2,
  GraduationCap,
  BookOpen,
  Users,
} from "lucide-react";

export default function AttendanceSession({ onLoadStudents }) {
  const [session, setSession] = useState({
    date: new Date().toISOString().split("T")[0],
    department: "Computer Engineering",
    semester: "7",
    division: "A",
    subject: "",
  });

  function handleChange(e) {
    setSession({
      ...session,
      [e.target.name]: e.target.value,
    });
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">

      <div className="mb-8">

        <h2 className="text-2xl font-bold text-slate-800">
          Create Attendance Session
        </h2>

        <p className="text-gray-500 mt-2">
          Select class details and load students.
        </p>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        <div>
          <label className="text-sm font-medium text-gray-600">
            Date
          </label>

          <div className="relative mt-2">

            <CalendarDays
              className="absolute left-4 top-3 text-gray-400"
              size={20}
            />

            <input
              type="date"
              name="date"
              value={session.date}
              onChange={handleChange}
              className="w-full border rounded-xl py-3 pl-12 pr-4"
            />

          </div>

        </div>

        <div>

          <label className="text-sm font-medium text-gray-600">
            Department
          </label>

          <div className="relative mt-2">

            <Building2
              className="absolute left-4 top-3 text-gray-400"
              size={20}
            />

            <select
              name="department"
              value={session.department}
              onChange={handleChange}
              className="w-full border rounded-xl py-3 pl-12 pr-4"
            >

              <option>Computer Engineering</option>

            </select>

          </div>

        </div>

        <div>

          <label className="text-sm font-medium text-gray-600">
            Semester
          </label>

          <div className="relative mt-2">

            <GraduationCap
              className="absolute left-4 top-3 text-gray-400"
              size={20}
            />

            <select
              name="semester"
              value={session.semester}
              onChange={handleChange}
              className="w-full border rounded-xl py-3 pl-12 pr-4"
            >

              {[1,2,3,4,5,6,7,8].map((sem)=>(
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}

            </select>

          </div>

        </div>

        <div>

          <label className="text-sm font-medium text-gray-600">
            Division
          </label>

          <select
            name="division"
            value={session.division}
            onChange={handleChange}
            className="w-full border rounded-xl py-3 px-4 mt-2"
          >

            <option>A</option>
            <option>B</option>
            <option>C</option>

          </select>

        </div>

        <div>

          <label className="text-sm font-medium text-gray-600">
            Subject
          </label>

          <div className="relative mt-2">

            <BookOpen
              className="absolute left-4 top-3 text-gray-400"
              size={20}
            />

            <input
              placeholder="Java Programming"
              name="subject"
              value={session.subject}
              onChange={handleChange}
              className="w-full border rounded-xl py-3 pl-12 pr-4"
            />

          </div>

        </div>

      </div>

      <div className="mt-8 flex justify-end">

        <button
          onClick={() => onLoadStudents(session)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl flex items-center gap-3"
        >

          <Users size={20} />

          Load Students

        </button>

      </div>

    </div>
  );
}