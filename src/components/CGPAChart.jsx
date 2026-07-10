"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

export default function CGPAChart({ cgpa }) {
  // Demo data (replace with Firestore later)
  const data = [
    { semester: "Sem 1", cgpa: 7.20 },
    { semester: "Sem 2", cgpa: 7.65 },
    { semester: "Sem 3", cgpa: 8.10 },
    { semester: "Sem 4", cgpa: cgpa || 8.35 },
  ];

  const highestCGPA = Math.max(...data.map((d) => d.cgpa));

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">

        <div>
          <h2 className="text-2xl font-bold">
            CGPA Progress
          </h2>

          <p className="text-gray-500">
            Semester-wise academic performance
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-500">
            Overall CGPA
          </p>

          <h2 className="text-3xl font-bold text-green-600">
            {cgpa}
          </h2>
        </div>

      </div>

      {/* Chart */}

      <div className="h-80">

        <ResponsiveContainer width="100%" height="100%">

          <BarChart data={data}>

            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis dataKey="semester" />

            <YAxis
              domain={[0, 10]}
            />

            <Tooltip />

            <Bar
              dataKey="cgpa"
              radius={[10, 10, 0, 0]}
            >

              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.cgpa === highestCGPA
                      ? "#16A34A"
                      : "#60A5FA"
                  }
                />
              ))}

            </Bar>

          </BarChart>

        </ResponsiveContainer>

      </div>

      {/* Summary Cards */}

      <div className="grid grid-cols-3 gap-4 mt-6">

        <div className="bg-green-50 rounded-xl p-4 text-center">

          <p className="text-sm text-gray-500">
            Overall CGPA
          </p>

          <h3 className="text-2xl font-bold text-green-600">
            {cgpa}
          </h3>

        </div>

        <div className="bg-blue-50 rounded-xl p-4 text-center">

          <p className="text-sm text-gray-500">
            Best Semester
          </p>

          <h3 className="text-xl font-bold text-blue-600">
            {
              data.find(
                (d) => d.cgpa === highestCGPA
              )?.semester
            }
          </h3>

        </div>

        <div className="bg-purple-50 rounded-xl p-4 text-center">

          <p className="text-sm text-gray-500">
            Highest CGPA
          </p>

          <h3 className="text-2xl font-bold text-purple-600">
            {highestCGPA}
          </h3>

        </div>

      </div>

    </div>
  );
}