"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

export default function AttendanceChart({
  attendance,
}) {
  const percentage =
    attendance?.percentage ?? null;

  const presentLectures =
    attendance?.present ?? 0;

  const absentLectures =
    attendance?.absent ?? 0;

  const totalLectures =
    attendance?.total ?? 0;

  const hasAttendance =
    percentage !== null &&
    totalLectures > 0;

  const chartPercentage =
    hasAttendance ? percentage : 0;

  const data = [
    {
      name: "Present",
      value: chartPercentage,
    },
    {
      name: "Absent",
      value: hasAttendance
        ? Math.max(100 - chartPercentage, 0)
        : 100,
    },
  ];

  const COLORS = [
    "#2563EB",
    "#E5E7EB",
  ];

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
            {hasAttendance
              ? `${percentage}%`
              : "N/A"}
          </h2>

        </div>

      </div>

      <div className="grid md:grid-cols-2 gap-8 items-center">

        {/* CHART */}

        <div className="relative h-72">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <PieChart>

              <Pie
                data={data}
                dataKey="value"
                innerRadius={75}
                outerRadius={105}
                stroke="none"
              >

                {data.map(
                  (entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        COLORS[index]
                      }
                    />
                  )
                )}

              </Pie>

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center">

            <h2 className="text-4xl font-bold text-blue-600">
              {hasAttendance
                ? `${percentage}%`
                : "N/A"}
            </h2>

            <p className="text-gray-500">
              {hasAttendance
                ? "Present"
                : "No data"}
            </p>

          </div>

        </div>

        {/* STATISTICS */}

        <div className="space-y-4">

          <div className="bg-blue-50 rounded-xl p-4 flex justify-between">

            <span className="font-medium">
              Present Lectures
            </span>

            <span className="font-bold text-blue-700">
              {hasAttendance
                ? presentLectures
                : "—"}
            </span>

          </div>

          <div className="bg-red-50 rounded-xl p-4 flex justify-between">

            <span className="font-medium">
              Absent Lectures
            </span>

            <span className="font-bold text-red-600">
              {hasAttendance
                ? absentLectures
                : "—"}
            </span>

          </div>

          <div className="bg-green-50 rounded-xl p-4 flex justify-between">

            <span className="font-medium">
              Total Lectures
            </span>

            <span className="font-bold text-green-600">
              {hasAttendance
                ? totalLectures
                : "—"}
            </span>

          </div>

          <div className="bg-yellow-50 rounded-xl p-4 flex justify-between">

            <span className="font-medium">
              Attendance Status
            </span>

            <span
              className={`font-bold ${
                !hasAttendance
                  ? "text-gray-500"
                  : percentage >= 75
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {!hasAttendance
                ? "Unavailable"
                : percentage >= 75
                ? "Eligible"
                : "Short Attendance"}
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}