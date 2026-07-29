"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CheckCircle2,
  XCircle,
  Clock3,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter, useParams } from "next/navigation";
export default function AttendanceSessionDetails() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [session, setSession] = useState(null);
const [students, setStudents] = useState([]);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);

const [search, setSearch] = useState("");
const [filter, setFilter] = useState("All");

  useEffect(() => {
  if (!sessionId) return;

  const sessionRef = doc(db, "attendanceSessions", sessionId);

  const unsubscribeSession = onSnapshot(sessionRef, (snapshot) => {
    if (snapshot.exists()) {
      setSession(snapshot.data());
    }
  });

  const studentsRef = collection(
    db,
    "attendanceSessions",
    sessionId,
    "students"
  );

  const unsubscribeStudents = onSnapshot(studentsRef, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setStudents(data);
    setLoading(false);
  });

  return () => {
    unsubscribeSession();
    unsubscribeStudents();
  };
}, [sessionId]);

  
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

      toast.success("Attendance updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update attendance.");
    } finally {
      setSaving(false);
    }
  }
  async function deleteSession() {
  const confirmed = window.confirm(
    "Are you sure you want to delete this attendance session?"
  );

  if (!confirmed) return;

  try {
    // Get all student documents
    const studentsRef = collection(
      db,
      "attendanceSessions",
      sessionId,
      "students"
    );

    const snapshot = await getDocs(studentsRef);

    // Delete every student attendance document
    for (const studentDoc of snapshot.docs) {
      await deleteDoc(studentDoc.ref);
    }

    // Delete session document
    await deleteDoc(
      doc(db, "attendanceSessions", sessionId)
    );

    toast.success("Attendance session deleted successfully");

    router.push("/admin/attendance/history");

  } catch (error) {
    console.error(error);
    toast.error("Failed to delete attendance session.");
  }
}
function exportToExcel() {
  if (!session || students.length === 0) {
    toast.error("No attendance data available.");
    return;
  }

  const data = students.map((student, index) => ({
    "Sr No": index + 1,
    "Roll No": student.rollNo,
    Name: student.name,
    Status: student.status,
    Method: student.method || "Manual",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 15 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const file = new Blob([excelBuffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(
    file,
    `Attendance_${session.subject}_${session.semester}_${session.division}.xlsx`
  );

  toast.success("Excel exported successfully!");
}
function exportToPDF() {
  if (!session || students.length === 0) {
    toast.error("No attendance data available.");
    return;
  }

  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text("AUMNex", 105, 15, { align: "center" });

  doc.setFontSize(16);
  doc.text("Attendance Report", 105, 25, { align: "center" });

  // Session Information
  doc.setFontSize(11);

  doc.text(`Subject: ${session.subject}`, 14, 40);
  doc.text(`Semester: ${session.semester}`, 14, 48);
  doc.text(`Division: ${session.division}`, 14, 56);

  if (session.department) {
    doc.text(`Department: ${session.department}`, 14, 64);
  }

  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 72);

  // Summary
  doc.text(`Total Students: ${students.length}`, 130, 40);
  doc.text(`Present: ${present}`, 130, 48);
  doc.text(`Absent: ${absent}`, 130, 56);
  doc.text(`Leave: ${leave}`, 130, 64);

  autoTable(doc, {
    startY: 82,

    head: [["Sr", "Roll No", "Name", "Status", "Method"]],

    body: students.map((student, index) => [
      index + 1,
      student.rollNo,
      student.name,
      student.status,
      student.method || "Manual",
    ]),
  });

  doc.save(
    `Attendance_${session.subject}_${session.semester}_${session.division}.pdf`
  );

  toast.success("PDF exported successfully!");
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
       <div className="flex justify-between items-center p-6">

  <div className="flex gap-3">

    <button
      onClick={deleteSession}
      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold"
    >
      Delete Session
    </button>

    <button
      onClick={exportToExcel}
      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold"
    >
      Export Excel
    </button>
    <button
  onClick={exportToPDF}
  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold"
>
  Export PDF
</button>

  </div>

  <button
    onClick={saveChanges}
    disabled={saving}
    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
  >
    {saving ? "Saving..." : "Save Changes"}
  </button>

</div>
      </div>

    </div>
  );
}