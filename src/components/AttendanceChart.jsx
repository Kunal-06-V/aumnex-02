"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

export default function AttendanceChart({ attendance }) {
  const percentage = attendance || 0;

  const totalLectures = 120; // Change later if you fetch from Firestore
  const presentLectures = Math.round(
    (percentage / 100) * totalLectures
  );
  const absentLectures =
    totalLectures - presentLectures;

  const data = [
    {
      name: "Present",
      value: percentage,
    },
    {
      name: "Absent",
      value: 100 - percentage,
    },
  ];

  const COLORS = ["#2563EB", "#E5E7EB"];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">

      <div className="flex justify-between items-center mb-6">

        <div>
          <h2 className="text-2xl font-bold">
            Attendance Overview
          </h2>

          <p className="text-gray-500">
            Overall attendance statistics
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-500">
            Attendance
          </p>

          <h2 className="text-3xl font-bold text-blue-600">
            {percentage}%
          </h2>
        </div>

      </div>

      <div className="grid md:grid-cols-2 gap-8 items-center">

        {/* Chart */}

        <div className="relative h-72">

          <ResponsiveContainer width="100%" height="100%">

            <PieChart>

              <Pie
                data={data}
                dataKey="value"
                innerRadius={75}
                outerRadius={105}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index]}
                  />
                ))}
              </Pie>

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center">

            <h2 className="text-4xl font-bold text-blue-600">
              {percentage}%
            </h2>

            <p className="text-gray-500">
              Present
            </p>

          </div>

        </div>

        {/* Statistics */}

        <div className="space-y-4">

          <div className="bg-blue-50 rounded-xl p-4 flex justify-between">

            <span className="font-medium">
              Present Lectures
            </span>

            <span className="font-bold text-blue-700">
              {presentLectures}
            </span>

          </div>

          <div className="bg-red-50 rounded-xl p-4 flex justify-between">

            <span className="font-medium">
              Absent Lectures
            </span>

            <span className="font-bold text-red-600">
              {absentLectures}
            </span>

          </div>

          <div className="bg-green-50 rounded-xl p-4 flex justify-between">

            <span className="font-medium">
              Total Lectures
            </span>

            <span className="font-bold text-green-600">
              {totalLectures}
            </span>

          </div>

          <div className="bg-yellow-50 rounded-xl p-4 flex justify-between">

            <span className="font-medium">
              Attendance Status
            </span>

            <span
              className={`font-bold ${
                percentage >= 75
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {percentage >= 75
                ? "Eligible"
                : "Short Attendance"}
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}