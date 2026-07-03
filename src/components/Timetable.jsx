"use client";

export default function Timetable() {
  const classes = [
    {
      time: "09:00 AM",
      subject: "Database Management System",
      room: "Lab 201",
    },
    {
      time: "11:00 AM",
      subject: "Java Programming",
      room: "Room 305",
    },
    {
      time: "02:00 PM",
      subject: "Artificial Intelligence",
      room: "Room 210",
    },
    {
      time: "04:00 PM",
      subject: "Software Engineering",
      room: "Room 108",
    },
  ];

  return (
<div className="bg-white rounded-2xl shadow-lg p-6 min-h-[420px]">      <h2 className="text-xl font-bold mb-4">
        📅 Today's Timetable
      </h2>

      <div className="space-y-4">
        {classes.map((item, index) => (
          <div
            key={index}
            className="flex justify-between border-b pb-2"
          >
            <div>
              <p className="font-semibold">{item.subject}</p>
              <p className="text-sm text-gray-500">{item.room}</p>
            </div>

            <span className="font-medium text-blue-600">
              {item.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}