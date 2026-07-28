"use client";

import { CalendarDays, GraduationCap, Building2, BookOpen, User, Search } from "lucide-react";

export default function AttendanceFilters() {
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">

      <div className="flex items-center gap-3 mb-6">

        <Search className="text-blue-600" size={24} />

        <div>

          <h2 className="text-2xl font-bold text-slate-800">
            Attendance Filters
          </h2>

          <p className="text-gray-500 text-sm">
            Select details to load students.
          </p>

        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        {/* Date */}

        <div>

          <label className="text-sm font-medium text-gray-600 mb-2 block">
            Date
          </label>

          <div className="relative">

            <CalendarDays
              className="absolute left-4 top-3 text-gray-400"
              size={20}
            />

            <input
              type="date"
              className="w-full border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

        </div>

        {/* Department */}

        <div>

          <label className="text-sm font-medium text-gray-600 mb-2 block">
            Department
          </label>

          <div className="relative">

            <Building2
              className="absolute left-4 top-3 text-gray-400"
              size={20}
            />

            <select className="w-full border border-gray-200 rounded-xl py-3 pl-12 pr-4">

              <option>Computer Engineering</option>

            </select>

          </div>

        </div>

        {/* Semester */}

        <div>

          <label className="text-sm font-medium text-gray-600 mb-2 block">
            Semester
          </label>

          <div className="relative">

            <GraduationCap
              className="absolute left-4 top-3 text-gray-400"
              size={20}
            />

            <select className="w-full border border-gray-200 rounded-xl py-3 pl-12 pr-4">

              <option>Semester 1</option>
              <option>Semester 2</option>
              <option>Semester 3</option>
              <option>Semester 4</option>
              <option>Semester 5</option>
              <option>Semester 6</option>
              <option>Semester 7</option>
              <option>Semester 8</option>

            </select>

          </div>

        </div>

        {/* Division */}

        <div>

          <label className="text-sm font-medium text-gray-600 mb-2 block">
            Division
          </label>

          <select className="w-full border border-gray-200 rounded-xl py-3 px-4">

            <option>A</option>
            <option>B</option>
            <option>C</option>

          </select>

        </div>

        {/* Subject */}

        <div>

          <label className="text-sm font-medium text-gray-600 mb-2 block">
            Subject
          </label>

          <div className="relative">

            <BookOpen
              className="absolute left-4 top-3 text-gray-400"
              size={20}
            />

            <input
              placeholder="Java Programming"
              className="w-full border border-gray-200 rounded-xl py-3 pl-12 pr-4"
            />

          </div>

        </div>

        {/* Faculty */}

        <div>

          <label className="text-sm font-medium text-gray-600 mb-2 block">
            Faculty
          </label>

          <div className="relative">

            <User
              className="absolute left-4 top-3 text-gray-400"
              size={20}
            />

            <input
              value="Administrator"
              readOnly
              className="w-full border border-gray-200 rounded-xl py-3 pl-12 pr-4 bg-gray-50"
            />

          </div>

        </div>

      </div>

      <div className="mt-8 flex justify-end">

        <button className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold">

          Load Students

        </button>

      </div>

    </div>
  );
}