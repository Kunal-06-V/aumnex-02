"use client";

import { useEffect, useState } from "react";
import {
  Smartphone,
  CheckCircle,
  User,
  Calendar,
  Clock,
  BookOpen,
  MapPin,
} from "lucide-react";

export default function NFCAttendancePage() {
  const [loading, setLoading] = useState(false);
  const [marked, setMarked] = useState(false);

  // Demo data (replace with Firestore later)
  const student = {
    name: "Kunal Vijay Varal",
    rollNo: "CSE23045",
  };

  const lecture = {
    subject: "Cloud Computing",
    faculty: "Prof. Patil",
    room: "A-203",
  };

  const today = new Date();

  const currentDate = today.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const currentTime = today.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  async function handleScan() {
    setLoading(true);

    // Fake NFC scan
    setTimeout(() => {
      setLoading(false);
      setMarked(true);
    }, 2000);
  }
    return (
    <div className="min-h-screen bg-slate-100 p-6">

      <div className="max-w-3xl mx-auto">

        {/* Header */}

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">

          <div className="flex items-center gap-4">

            <div className="bg-blue-100 p-4 rounded-full">
              <Smartphone
                size={36}
                className="text-blue-600"
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                NFC Attendance
              </h1>

              <p className="text-gray-500">
                Tap your Smart Student ID to mark attendance
              </p>
            </div>

          </div>

        </div>

        {/* Student Card */}

        <div className="bg-white rounded-2xl shadow-lg p-8">

          <div className="grid md:grid-cols-2 gap-8">

            {/* Left */}

            <div className="space-y-5">

              <div className="flex items-center gap-3">
                <User className="text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">
                    Student Name
                  </p>
                  <h2 className="font-bold text-lg">
                    {student.name}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <BookOpen className="text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">
                    Roll Number
                  </p>
                  <h2 className="font-bold">
                    {student.rollNo}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <BookOpen className="text-purple-600" />
                <div>
                  <p className="text-sm text-gray-500">
                    Subject
                  </p>
                  <h2 className="font-bold">
                    {lecture.subject}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="text-red-600" />
                <div>
                  <p className="text-sm text-gray-500">
                    Classroom
                  </p>
                  <h2 className="font-bold">
                    {lecture.room}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="text-orange-600" />
                <div>
                  <p className="text-sm text-gray-500">
                    Date
                  </p>
                  <h2 className="font-bold">
                    {currentDate}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="text-cyan-600" />
                <div>
                  <p className="text-sm text-gray-500">
                    Time
                  </p>
                  <h2 className="font-bold">
                    {currentTime}
                  </h2>
                </div>
              </div>

            </div>

            {/* Right */}

            <div className="flex flex-col items-center justify-center">

              {!marked ? (
                <>
                  <div className="bg-blue-100 rounded-full p-8 mb-6 animate-pulse">
                    <Smartphone
                      size={80}
                      className="text-blue-600"
                    />
                  </div>

                  <button
                    onClick={handleScan}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition disabled:opacity-50"
                  >
                    {loading
                      ? "Scanning..."
                      : "Scan NFC Card"}
                  </button>

                  <p className="text-gray-500 mt-5 text-center">
                    Hold your Smart NFC Student ID
                    near the reader.
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle
                    size={100}
                    className="text-green-600 mb-6"
                  />

                  <h2 className="text-3xl font-bold text-green-600">
                    Attendance Marked
                  </h2>

                  <p className="text-gray-500 mt-3 text-center">
                    Your attendance has been
                    recorded successfully.
                  </p>

                  <div className="mt-6 bg-green-100 text-green-700 px-6 py-3 rounded-full font-semibold">
                    Present
                  </div>
                </>
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}