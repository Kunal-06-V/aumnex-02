"use client";

import { useState, useEffect } from "react";
import {
  Smartphone,
  PlayCircle,
  Square,
  User,
  CheckCircle,
  BookOpen,
  GraduationCap,
  Users,
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { markAttendanceByUID } from "@/lib/attendanceService";

export default function NFCReaderPage() {
  const [running, setRunning] = useState(false);
  const [lastStudent, setLastStudent] = useState(null);

  const [subject, setSubject] = useState("Cloud Computing");
  const [semester, setSemester] = useState("Semester 4");
  const [division, setDivision] = useState("A");

  useEffect(() => {
    initializeSession();
  }, []);

  async function initializeSession() {
    const sessionRef = doc(db, "attendanceSessions", "current");

    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      await setDoc(sessionRef, {
        subject: "Not Selected",
        faculty: "Not Selected",
        semester: "Not Selected",
        division: "Not Selected",
        room: "Not Selected",
        status: "inactive",
        startTime: null,
        createdAt: new Date(),
      });

      console.log("Attendance session created.");
    } else {
      console.log("Attendance session already exists.");
    }
  }

 async function startAttendance() {
  setRunning(true);

  try {
    const sessionId = crypto.randomUUID();

    const now = new Date();

    const date = now.toISOString().split("T")[0];

    await setDoc(
      doc(db, "attendanceSessions", "current"),
      {
        sessionId,
        date,

        subject,
        semester,
        division,

        faculty: "Prof. Patil",
        room: "A-203",

        status: "active",

        present: 0,

        createdAt: now,
        startTime: now,
      }
    );

    toast.success("Attendance session started.");
  } catch (error) {
    console.error("Error:", error);
    toast.error(error.message);
    setRunning(false);
  }
}
  async function stopAttendance() {
    setRunning(false);

    try {
      await setDoc(
        doc(db, "attendanceSessions", "current"),
        {
          status: "inactive",
        },
        { merge: true }
      );

      console.log("Attendance Stopped");
    } catch (error) {
      console.error(error);
    }
  }

  // Demo scan
  async function simulateScan() {
    if (!running) {
      toast.error("Start attendance first.");
      return;
    }

    try {
      // Temporary test NFC UID.
      // Later this value will come directly from the NFC reader.
const nfcUid = "53591D6AA20001";
      const result = await markAttendanceByUID(nfcUid);

      setLastStudent({
        name: result.student,
        rollNo: result.rollNo,
        semester: result.semester,
        division: result.division,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "Present",
      });

      toast.success("Attendance marked successfully.");
    } catch (error) {
      console.error("NFC attendance error:", error);
      toast.error(error.message);
    }
  }
  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-6xl mx-auto">

        {/* Header */}

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">

          <h1 className="text-3xl font-bold">
            NFC Attendance Reader
          </h1>

          <p className="text-gray-500 mt-2">
            Teacher Attendance Control Panel
          </p>

        </div>

        {/* Controls */}

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">

          <div className="grid md:grid-cols-3 gap-5">

            <div>
              <label className="font-medium block mb-2">
                Subject
              </label>

              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border rounded-xl p-3"
              >
                <option>Cloud Computing</option>
                <option>Java Programming</option>
                <option>Data Structures</option>
                <option>Operating System</option>
              </select>
            </div>

            <div>
              <label className="font-medium block mb-2">
                Semester
              </label>

              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full border rounded-xl p-3"
              >
                <option>Semester 4</option>
                <option>Semester 5</option>
                <option>Semester 6</option>
                <option>Semester 7</option>
              </select>
            </div>

            <div>
              <label className="font-medium block mb-2">
                Division
              </label>

              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full border rounded-xl p-3"
              >
                <option>A</option>
                <option>B</option>
                <option>C</option>
              </select>
            </div>

          </div>

          <div className="flex flex-wrap gap-4 mt-6">

            <button
              onClick={startAttendance}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl flex items-center gap-2"
            >
              <PlayCircle size={20} />
              Start Attendance
            </button>

            <button
              onClick={stopAttendance}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl flex items-center gap-2"
            >
              <Square size={20} />
              Stop Attendance
            </button>

            {/* Demo button - replace with NFC reader later */}
            <button
              onClick={simulateScan}
              disabled={!running}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl"
            >
              Simulate NFC Scan
            </button>

          </div>

        </div>

        {/* Reader Status */}

        <div className="grid lg:grid-cols-2 gap-6">

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">

            <div className="bg-blue-100 rounded-full w-32 h-32 mx-auto flex items-center justify-center">

              <Smartphone
                size={70}
                className={`text-blue-600 ${running ? "animate-pulse" : ""
                  }`}
              />

            </div>

            <h2 className="text-2xl font-bold mt-6">
              {running
                ? "Waiting for NFC Card..."
                : "Attendance Stopped"}
            </h2>

            <p className="text-gray-500 mt-2">
              {running
                ? "Tap a student NFC card on the reader."
                : "Click Start Attendance to begin."}
            </p>

          </div>

          {/* Last Student */}

          <div className="bg-white rounded-2xl shadow-lg p-8">

            <h2 className="text-2xl font-bold mb-6">
              Last Scanned Student
            </h2>

            {lastStudent ? (

              <div className="space-y-5">

                <div className="flex items-center gap-3">
                  <User className="text-blue-600" />
                  <div>
                    <p className="text-gray-500 text-sm">Name</p>
                    <h3 className="font-bold">
                      {lastStudent.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <GraduationCap className="text-green-600" />
                  <div>
                    <p className="text-gray-500 text-sm">
                      Roll Number
                    </p>
                    <h3 className="font-bold">
                      {lastStudent.rollNo}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <BookOpen className="text-purple-600" />
                  <div>
                    <p className="text-gray-500 text-sm">
                      Subject
                    </p>
                    <h3 className="font-bold">
                      {subject}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="text-orange-600" />
                  <div>
                    <p className="text-gray-500 text-sm">
                      Division
                    </p>
                    <h3 className="font-bold">
                      {lastStudent.division}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <GraduationCap className="text-indigo-600" />

                  <div>
                    <p className="text-gray-500 text-sm">
                      Semester
                    </p>

                    <h3 className="font-bold">
                      {lastStudent.semester}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-600" />
                  <div>
                    <p className="text-gray-500 text-sm">
                      Status
                    </p>
                    <h3 className="font-bold text-green-600">
                      {lastStudent.status}
                    </h3>
                  </div>
                </div>

                <div className="bg-green-100 rounded-xl p-4 text-center">

                  <h3 className="text-lg font-bold text-green-700">
                    Attendance Marked Successfully
                  </h3>

                  <p className="text-green-600 mt-1">
                    {lastStudent.time}
                  </p>

                </div>

              </div>

            ) : (

              <div className="text-center text-gray-500 py-20">
                No student scanned yet.
              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}