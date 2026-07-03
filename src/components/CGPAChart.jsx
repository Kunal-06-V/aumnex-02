"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function CGPAChart({ cgpa }) {
  const data = [
    {
      semester: "Sem 4",
      cgpa: cgpa || 0,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">
        CGPA Progress
      </h2>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="semester" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Bar
              dataKey="cgpa"
              fill="#16A34A"
              radius={[10, 10, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}