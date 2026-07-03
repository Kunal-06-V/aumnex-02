"use client";

export default function NotificationPanel() {
  const notifications = [
    "📢 Mid Semester Exam starts on 20 July",
    "📚 Java assignment due tomorrow",
    "⚠️ Attendance must stay above 75%",
    "🎉 College Tech Fest next week",
  ];

  return (
<div className="bg-white rounded-2xl shadow-lg p-6 min-h-[420px]">      <h2 className="text-xl font-bold mb-4">
        🔔 Notifications
      </h2>

      <div className="space-y-3">
        {notifications.map((item, index) => (
          <div
            key={index}
            className="border-l-4 border-blue-600 bg-gray-50 p-3 rounded"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}