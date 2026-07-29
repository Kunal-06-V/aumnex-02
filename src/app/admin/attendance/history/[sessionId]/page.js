"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CheckCircle2,
  XCircle,
  Clock3,
} from "lucide-react";

export default function AttendanceSessionDetails() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
const [students, setStudents] = useState([]);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);

const [search, setSearch] = useState("");
const [filter, setFilter] = useState("All");

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  async function loadSession() {
    try {
      // Load session details
      const sessionRef = doc(db, "attendanceSessions", sessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (sessionSnap.exists()) {
        setSession(sessionSnap.data());
      }

      // Load students
      const studentsRef = collection(
        db,
        "attendanceSessions",
        sessionId,
        "students"
      );

      const studentSnap = await getDocs(studentsRef);

      const data = studentSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  function updateStudentStatus(studentId, status) {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, status }
          : student
      )
    );
  }
  async function saveChanges() {
    try {
      setSaving(true);

      for (const student of students) {
        const studentRef = doc(
          db,
          "attendanceSessions",
          sessionId,
          "students",
          student.id
        );

        await updateDoc(studentRef, {
          status: student.status,
        });
      }

      alert("Attendance updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update attendance.");
    } finally {
      setSaving(false);
    }
  }

  const present = students.filter(
    (s) => s.status === "Present"
  ).length;

  const absent = students.filter(
    (s) => s.status === "Absent"
  ).length;

  const leave = students.filter(
    (s) => s.status === "Leave"
  ).length;
  const filteredStudents = students.filter((student) => {
  const matchesSearch =
    student.name
      ?.toLowerCase()
      .includes(search.toLowerCase()) ||
    student.rollNo
      ?.toLowerCase()
      .includes(search.toLowerCase());

  const matchesFilter =
    filter === "All" || student.status === filter;

  return matchesSearch && matchesFilter;
});

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">

      <div className="bg-white rounded-3xl shadow-lg p-6">

        <h1 className="text-3xl font-bold">
          Attendance Details
        </h1>

        <p className="text-gray-500 mt-2">
          {session?.subject} • Semester {session?.semester} • Division {session?.division}
        </p>

      </div>

      <div className="grid md:grid-cols-3 gap-6">

        <div className="bg-green-50 rounded-2xl p-6">
          <CheckCircle2 className="text-green-600 mb-3" />
          <h2 className="text-3xl font-bold">{present}</h2>
          <p>Present</p>
        </div>

        <div className="bg-red-50 rounded-2xl p-6">
          <XCircle className="text-red-600 mb-3" />
          <h2 className="text-3xl font-bold">{absent}</h2>
          <p>Absent</p>
        </div>

        <div className="bg-yellow-50 rounded-2xl p-6">
          <Clock3 className="text-yellow-600 mb-3" />
          <h2 className="text-3xl font-bold">{leave}</h2>
          <p>Leave</p>
        </div>

      </div>
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">

  <div className="flex flex-col md:flex-row gap-4">

    <input
      type="text"
      placeholder="Search by Name or Roll No..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="flex-1 border rounded-xl px-4 py-3"
    />

    <select
      value={filter}
      onChange={(e) => setFilter(e.target.value)}
      className="border rounded-xl px-4 py-3"
    >
      <option>All</option>
      <option>Present</option>
      <option>Absent</option>
      <option>Leave</option>
    </select>

  </div>

</div>
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

        <table className="w-full">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Roll No</th>
              <th className="p-4 text-left">Student</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Method</th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.map((student) => (
              <tr
                key={student.id}
                className="border-t hover:bg-gray-50"
              >
                <td className="p-4">{student.rollNo}</td>

                <td className="p-4">{student.name}</td>

                <td className="p-4">
                  <div className="flex gap-2">

                    <button
                      onClick={() =>
                        updateStudentStatus(student.id, "Present")
                      }
                      className={`px-3 py-1 rounded-lg text-white text-sm ${student.status === "Present"
                          ? "bg-green-600"
                          : "bg-gray-400"
                        }`}
                    >
                      Present
                    </button>

                    <button
                      onClick={() =>
                        updateStudentStatus(student.id, "Absent")
                      }
                      className={`px-3 py-1 rounded-lg text-white text-sm ${student.status === "Absent"
                          ? "bg-red-600"
                          : "bg-gray-400"
                        }`}
                    >
                      Absent
                    </button>

                    <button
                      onClick={() =>
                        updateStudentStatus(student.id, "Leave")
                      }
                      className={`px-3 py-1 rounded-lg text-white text-sm ${student.status === "Leave"
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                        }`}
                    >
                      Leave
                    </button>

                  </div>
                </td>

                <td className="p-4">
                  {student.method || "Manual"}
                </td>
              </tr>
            ))}
          </tbody>

        </table>
        <div className="flex justify-end p-6">
          <button
            onClick={saveChanges}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

    </div>
  );
}