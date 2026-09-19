"use client";

import { useEffect, useState } from "react";

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  CheckCircle2,
  XCircle,
  Clock3,
  ArrowLeft,
} from "lucide-react";

import toast from "react-hot-toast";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  useRouter,
  useParams,
} from "next/navigation";

export default function AttendanceSessionDetails() {
  const { sessionId } = useParams();
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notFound, setNotFound] =
    useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("All");

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    setLoading(true);
    setNotFound(false);
    setError("");

    const sessionRef = doc(
      db,
      "attendanceSessions",
      sessionId
    );

    const studentsRef = collection(
      db,
      "attendanceSessions",
      sessionId,
      "students"
    );

    const unsubscribeSession =
      onSnapshot(
        sessionRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            setSession(null);
            setStudents([]);
            setNotFound(true);
            setLoading(false);

            return;
          }

          setSession(
            snapshot.data()
          );

          setNotFound(false);
          setLoading(false);
        },
        (snapshotError) => {
          console.error(
            "Attendance session load error:",
            snapshotError
          );

          setSession(null);
          setStudents([]);
          setError(
            snapshotError?.message ||
              "Failed to load attendance session."
          );

          setLoading(false);
        }
      );

    const unsubscribeStudents =
      onSnapshot(
        studentsRef,
        (snapshot) => {
          const data =
            snapshot.docs.map(
              (studentDoc) => ({
                id: studentDoc.id,
                ...studentDoc.data(),
              })
            );

          setStudents(data);
        },
        (snapshotError) => {
          console.error(
            "Attendance students load error:",
            snapshotError
          );

          setStudents([]);

          if (!session) {
            setError(
              snapshotError?.message ||
                "Failed to load attendance students."
            );
          }
        }
      );

    return () => {
      unsubscribeSession();
      unsubscribeStudents();
    };
  }, [sessionId]);

  function updateStudentStatus(
    studentId,
    status
  ) {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? {
              ...student,
              status,
            }
          : student
      )
    );
  }

  async function saveChanges() {
    if (!session) {
      toast.error(
        "Attendance session not found."
      );
      return;
    }

    if (students.length === 0) {
      toast.error(
        "No attendance students found."
      );
      return;
    }

    const hasUnmarkedStudent =
      students.some(
        (student) =>
          ![
            "Present",
            "Absent",
            "Leave",
          ].includes(student.status)
      );

    if (hasUnmarkedStudent) {
      toast.error(
        "Please mark attendance for every student."
      );
      return;
    }

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

        await updateDoc(
          studentRef,
          {
            status:
              student.status,
            method:
              student.method ||
              "Manual",
          }
        );
      }

      toast.success(
        "Attendance updated successfully!"
      );
    } catch (error) {
      console.error(
        "Attendance save error:",
        error
      );

      toast.error(
        error?.message ||
          "Failed to update attendance."
      );
    } finally {
      setSaving(false);
    }
  }

async function deleteSession() {
  if (!session) {
    toast.error(
      "Attendance session not found."
    );
    return;
  }

  const confirmed =
    window.confirm(
      "Are you sure you want to delete this attendance session?"
    );

  if (!confirmed) {
    return;
  }

  try {
    /*
     * 1. Delete student attendance
     *    subdocuments.
     */
    const studentsRef =
      collection(
        db,
        "attendanceSessions",
        sessionId,
        "students"
      );

    const studentsSnapshot =
      await getDocs(studentsRef);

    for (
      const studentDoc of
        studentsSnapshot.docs
    ) {
      await deleteDoc(
        studentDoc.ref
      );
    }

    /*
     * 2. Delete matching attendance
     *    history records.
     */
    const historyQuery =
      query(
        collection(
          db,
          "attendanceHistory"
        ),
        where(
          "sessionId",
          "==",
          sessionId
        )
      );

    const historySnapshot =
      await getDocs(
        historyQuery
      );

    for (
      const historyDoc of
        historySnapshot.docs
    ) {
      await deleteDoc(
        historyDoc.ref
      );
    }

    /*
     * 3. Delete the main session.
     */
    await deleteDoc(
      doc(
        db,
        "attendanceSessions",
        sessionId
      )
    );

    toast.success(
      "Attendance session and history deleted successfully."
    );

    router.push(
      "/admin/attendance/history"
    );
  } catch (error) {
    console.error(
      "Attendance session delete error:",
      error
    );

    toast.error(
      error?.message ||
        "Failed to delete attendance session."
    );
  }
}

  function exportToExcel() {
    if (
      !session ||
      students.length === 0
    ) {
      toast.error(
        "No attendance data available."
      );
      return;
    }

    const data =
      students.map(
        (student, index) => ({
          "Sr No":
            index + 1,
          "Roll No":
            student.rollNo ||
            "—",
          Name:
            student.name ||
            "—",
          Status:
            student.status ||
            "Not Marked",
          Method:
            student.method ||
            "Manual",
        })
      );

    const worksheet =
      XLSX.utils.json_to_sheet(
        data
      );

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Attendance"
    );

    const excelBuffer =
      XLSX.write(
        workbook,
        {
          bookType: "xlsx",
          type: "array",
        }
      );

    const file = new Blob(
      [excelBuffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    );

    saveAs(
      file,
      `Attendance_${session.subject}_${session.semester}_${session.division}.xlsx`
    );

    toast.success(
      "Excel exported successfully!"
    );
  }

  function exportToPDF() {
    if (
      !session ||
      students.length === 0
    ) {
      toast.error(
        "No attendance data available."
      );
      return;
    }

    const pdf =
      new jsPDF();

    pdf.setFontSize(20);

    pdf.text(
      "AUMNex",
      105,
      15,
      {
        align: "center",
      }
    );

    pdf.setFontSize(16);

    pdf.text(
      "Attendance Report",
      105,
      25,
      {
        align: "center",
      }
    );

    pdf.setFontSize(11);

    pdf.text(
      `Subject: ${session.subject || "—"}`,
      14,
      40
    );

    pdf.text(
      `Semester: ${session.semester || "—"}`,
      14,
      48
    );

    pdf.text(
      `Division: ${session.division || "—"}`,
      14,
      56
    );

    if (session.department) {
      pdf.text(
        `Department: ${session.department}`,
        14,
        64
      );
    }

    pdf.text(
      `Date: ${session.date || "—"}`,
      14,
      72
    );

    pdf.text(
      `Total Students: ${students.length}`,
      130,
      40
    );

    pdf.text(
      `Present: ${present}`,
      130,
      48
    );

    pdf.text(
      `Absent: ${absent}`,
      130,
      56
    );

    pdf.text(
      `Leave: ${leave}`,
      130,
      64
    );

    autoTable(pdf, {
      startY: 82,

      head: [
        [
          "Sr",
          "Roll No",
          "Name",
          "Status",
          "Method",
        ],
      ],

      body:
        students.map(
          (student, index) => [
            index + 1,
            student.rollNo ||
              "—",
            student.name ||
              "—",
            student.status ||
              "Not Marked",
            student.method ||
              "Manual",
          ]
        ),
    });

    pdf.save(
      `Attendance_${session.subject}_${session.semester}_${session.division}.pdf`
    );

    toast.success(
      "PDF exported successfully!"
    );
  }

  const present =
    students.filter(
      (student) =>
        student.status ===
        "Present"
    ).length;

  const absent =
    students.filter(
      (student) =>
        student.status ===
        "Absent"
    ).length;

  const leave =
    students.filter(
      (student) =>
        student.status ===
        "Leave"
    ).length;

  const filteredStudents =
    students.filter(
      (student) => {
        const query =
          search
            .trim()
            .toLowerCase();

        const matchesSearch =
          !query ||
          student.name
            ?.toLowerCase()
            .includes(query) ||
          student.rollNo
            ?.toLowerCase()
            .includes(query);

        const matchesFilter =
          filter === "All" ||
          student.status ===
            filter;

        return (
          matchesSearch &&
          matchesFilter
        );
      }
    );

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="rounded-2xl bg-white p-10 text-center shadow">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="text-gray-600">
            Loading attendance session...
          </p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="max-w-md rounded-3xl bg-white p-10 text-center shadow-lg">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle
              size={34}
              className="text-red-600"
            />
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            Attendance Session Not Found
          </h1>

          <p className="mt-3 text-gray-500">
            The attendance session you are trying to access does not exist or has been deleted.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/attendance/history"
              )
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            <ArrowLeft size={18} />
            Back to Attendance History
          </button>

        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="max-w-md rounded-3xl bg-white p-10 text-center shadow-lg">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle
              size={34}
              className="text-red-600"
            />
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            Unable to Load Attendance
          </h1>

          <p className="mt-3 text-gray-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/attendance/history"
              )
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            <ArrowLeft size={18} />
            Back to Attendance History
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="rounded-3xl bg-white p-6 shadow-lg">

        <h1 className="text-3xl font-bold">
          Attendance Details
        </h1>

        <p className="mt-2 text-gray-500">
          {session?.subject ||
            "Subject unavailable"}{" "}
          •{" "}
          {session?.semester ||
            "Semester unavailable"}{" "}
          • Division{" "}
          {session?.division ||
            "Division unavailable"}
        </p>

      </div>

      {/* SUMMARY */}

      <div className="grid gap-6 md:grid-cols-3">

        <div className="rounded-2xl bg-green-50 p-6">
          <CheckCircle2
            className="mb-3 text-green-600"
          />

          <h2 className="text-3xl font-bold">
            {present}
          </h2>

          <p>Present</p>
        </div>

        <div className="rounded-2xl bg-red-50 p-6">
          <XCircle
            className="mb-3 text-red-600"
          />

          <h2 className="text-3xl font-bold">
            {absent}
          </h2>

          <p>Absent</p>
        </div>

        <div className="rounded-2xl bg-yellow-50 p-6">
          <Clock3
            className="mb-3 text-yellow-600"
          />

          <h2 className="text-3xl font-bold">
            {leave}
          </h2>

          <p>Leave</p>
        </div>

      </div>

      {/* SEARCH / FILTER */}

      <div className="mb-6 rounded-3xl bg-white p-6 shadow-lg">

        <div className="flex flex-col gap-4 md:flex-row">

          <input
            type="text"
            placeholder="Search by Name or Roll No..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="flex-1 rounded-xl border px-4 py-3"
          />

          <select
            value={filter}
            onChange={(e) =>
              setFilter(
                e.target.value
              )
            }
            className="rounded-xl border px-4 py-3"
          >
            <option value="All">
              All
            </option>

            <option value="Present">
              Present
            </option>

            <option value="Absent">
              Absent
            </option>

            <option value="Leave">
              Leave
            </option>
          </select>

        </div>

      </div>

      {/* STUDENT TABLE */}

      <div className="overflow-hidden rounded-3xl bg-white shadow-lg">

        {students.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No student attendance records found.
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No students match your search/filter.
          </div>
        ) : (
          <table className="w-full">

            <thead className="bg-gray-100">

              <tr>

                <th className="p-4 text-left">
                  Roll No
                </th>

                <th className="p-4 text-left">
                  Student
                </th>

                <th className="p-4 text-left">
                  Status
                </th>

                <th className="p-4 text-left">
                  Method
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredStudents.map(
                (student) => (

                  <tr
                    key={
                      student.id
                    }
                    className="border-t hover:bg-gray-50"
                  >

                    <td className="p-4">
                      {student.rollNo ||
                        "—"}
                    </td>

                    <td className="p-4">
                      {student.name ||
                        "—"}
                    </td>

                    <td className="p-4">

                      <div className="flex gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            updateStudentStatus(
                              student.id,
                              "Present"
                            )
                          }
                          className={`rounded-lg px-3 py-1 text-sm text-white ${
                            student.status ===
                            "Present"
                              ? "bg-green-600"
                              : "bg-gray-400"
                          }`}
                        >
                          Present
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateStudentStatus(
                              student.id,
                              "Absent"
                            )
                          }
                          className={`rounded-lg px-3 py-1 text-sm text-white ${
                            student.status ===
                            "Absent"
                              ? "bg-red-600"
                              : "bg-gray-400"
                          }`}
                        >
                          Absent
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateStudentStatus(
                              student.id,
                              "Leave"
                            )
                          }
                          className={`rounded-lg px-3 py-1 text-sm text-white ${
                            student.status ===
                            "Leave"
                              ? "bg-yellow-500"
                              : "bg-gray-400"
                          }`}
                        >
                          Leave
                        </button>

                      </div>

                    </td>

                    <td className="p-4">
                      {student.method ||
                        "Manual"}
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>
        )}

        {/* ACTIONS */}

        {!notFound &&
          !error && (
            <div className="flex flex-col justify-between gap-4 p-6 sm:flex-row">

              <div className="flex flex-wrap gap-3">

                <button
                  type="button"
                  onClick={
                    deleteSession
                  }
                  className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
                >
                  Delete Session
                </button>

                <button
                  type="button"
                  onClick={
                    exportToExcel
                  }
                  className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
                >
                  Export Excel
                </button>

                <button
                  type="button"
                  onClick={
                    exportToPDF
                  }
                  className="rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
                >
                  Export PDF
                </button>

              </div>

              <button
                type="button"
                onClick={
                  saveChanges
                }
                disabled={
                  saving ||
                  students.length === 0
                }
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>
          )}

      </div>

    </div>
  );
}