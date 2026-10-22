"use client";

import { useEffect, useState } from "react";

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  writeBatch,
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
  Users,
  Building2,
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
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  /*
   * This is now the complete class roster.
   *
   * New sessions contain every active student
   * from the selected department + semester + division.
   */
  const [students, setStudents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [notFound, setNotFound] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("All");

  // ============================================================
  // LOAD SESSION + ROSTER
  // ============================================================

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    setLoading(true);
    setNotFound(false);
    setError("");

    const sessionRef =
      doc(
        db,
        "attendanceSessions",
        sessionId
      );

    const rosterRef =
      collection(
        db,
        "attendanceSessions",
        sessionId,
        "roster"
      );

    /*
     * Legacy fallback:
     *
     * Older sessions were created before the roster
     * model existed. If their roster is empty,
     * we temporarily read the old students collection
     * so old attendance history does not disappear.
     */
    const oldStudentsRef =
      collection(
        db,
        "attendanceSessions",
        sessionId,
        "students"
      );

    let latestSession = null;

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

          const sessionData =
            snapshot.data();

          latestSession =
            sessionData;

          setSession(
            sessionData
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

    const unsubscribeRoster =
      onSnapshot(
        rosterRef,
        async (rosterSnapshot) => {
          /*
           * NEW SESSION:
           * use the complete roster.
           */
          if (!rosterSnapshot.empty) {
            const data =
              rosterSnapshot.docs
                .map(
                  (studentDoc) => ({
                    id:
                      studentDoc.id,
                    ...studentDoc.data(),
                  })
                )
                .sort(
                  (a, b) =>
                    String(
                      a.rollNo || ""
                    ).localeCompare(
                      String(
                        b.rollNo || ""
                      ),
                      undefined,
                      {
                        numeric: true,
                        sensitivity:
                          "base",
                      }
                    )
                );

            setStudents(data);

            return;
          }

          /*
           * LEGACY SESSION FALLBACK
           */
          try {
            const oldSnapshot =
              await getDocs(
                oldStudentsRef
              );

            const oldData =
              oldSnapshot.docs
                .map(
                  (studentDoc) => ({
                    id:
                      studentDoc.id,
                    ...studentDoc.data(),
                  })
                )
                .sort(
                  (a, b) =>
                    String(
                      a.rollNo || ""
                    ).localeCompare(
                      String(
                        b.rollNo || ""
                      ),
                      undefined,
                      {
                        numeric: true,
                        sensitivity:
                          "base",
                      }
                    )
                );

            setStudents(oldData);
          } catch (fallbackError) {
            console.error(
              "Legacy attendance fallback error:",
              fallbackError
            );

            setStudents([]);
          }
        },
        (snapshotError) => {
          console.error(
            "Attendance roster load error:",
            snapshotError
          );

          setStudents([]);

          if (!latestSession) {
            setError(
              snapshotError?.message ||
              "Failed to load attendance roster."
            );
          }
        }
      );

    return () => {
      unsubscribeSession();
      unsubscribeRoster();
    };
  }, [sessionId]);
 useEffect(() => {
  if (session?.status !== "active") {
    return;
  }

  const timerId = setInterval(() => {
    setCurrentTime(Date.now());
  }, 1000);

  return () => clearInterval(timerId);
}, [session?.status]);
  // ============================================================
  // UPDATE LOCAL STATUS
  // ============================================================

  function updateStudentStatus(
    studentId,
    status
  ) {
    setStudents(
      (previous) =>
        previous.map(
          (student) =>
            student.id ===
              studentId
              ? {
                ...student,
                status,
                method:
                  status ===
                    "Present"
                    ? student.method ===
                      "NFC"
                      ? "NFC"
                      : "Manual"
                    : "Manual",
              }
              : student
        )
    );
  }

  // ============================================================
  // COUNTS
  // ============================================================

  const totalStudents =
    students.length;

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

  // ============================================================
  // SAVE CHANGES
  // ============================================================

  async function saveChanges() {
    if (!session) {
      toast.error(
        "Attendance session not found."
      );

      return;
    }

    if (
      students.length === 0
    ) {
      toast.error(
        "No attendance roster found."
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
          ].includes(
            student.status
          )
      );

    if (
      hasUnmarkedStudent
    ) {
      toast.error(
        "Please mark attendance for every student."
      );

      return;
    }

    try {
      setSaving(true);

      const batch =
        writeBatch(db);

      /*
       * Update every roster student.
       */
      for (
        const student of
        students
      ) {
        const studentRef =
          doc(
            db,
            "attendanceSessions",
            sessionId,
            "roster",
            student.id
          );

        batch.set(
          studentRef,
          {
            status:
              student.status,

            method:
              student.method ||
              (
                student.status ===
                  "Present"
                  ? "Manual"
                  : "Manual"
              ),

            updatedAt:
              new Date(),
          },
          {
            merge: true,
          }
        );
      }

      /*
       * Keep session summary fields
       * synchronized with the roster.
       */
      const sessionRef =
        doc(
          db,
          "attendanceSessions",
          sessionId
        );

      batch.set(
        sessionRef,
        {
          totalStudents,

          present,

          absent,

          leave,

          updatedAt:
            new Date(),
        },
        {
          merge: true,
        }
      );

      await batch.commit();

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

  // ============================================================
  // DELETE SESSION
  // ============================================================

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
      // ---------------------------------------------------------
      // 1. DELETE ROSTER
      // ---------------------------------------------------------

      const rosterRef =
        collection(
          db,
          "attendanceSessions",
          sessionId,
          "roster"
        );

      const rosterSnapshot =
        await getDocs(
          rosterRef
        );

      for (
        const studentDoc of
        rosterSnapshot.docs
      ) {
        await deleteDoc(
          studentDoc.ref
        );
      }

      // ---------------------------------------------------------
      // 2. DELETE STUDENT ATTENDANCE
      // ---------------------------------------------------------

      const studentsRef =
        collection(
          db,
          "attendanceSessions",
          sessionId,
          "students"
        );

      const studentsSnapshot =
        await getDocs(
          studentsRef
        );

      for (
        const studentDoc of
        studentsSnapshot.docs
      ) {
        await deleteDoc(
          studentDoc.ref
        );
      }

      // ---------------------------------------------------------
      // 3. DELETE MATCHING ATTENDANCE HISTORY
      // ---------------------------------------------------------

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

      // ---------------------------------------------------------
      // 4. DELETE SESSION
      // ---------------------------------------------------------

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

  // ============================================================
  // EXPORT EXCEL
  // ============================================================

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

          Department:
            student.department ||
            session.department ||
            "—",

          Semester:
            student.semester ||
            session.semester ||
            "—",

          Division:
            student.division ||
            session.division ||
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
      { wch: 28 },
      { wch: 15 },
      { wch: 12 },
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

    const file =
      new Blob(
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

  // ============================================================
  // EXPORT PDF
  // ============================================================

  async function exportToPDF() {
    if (!session || !sessionId) {
      toast.error("Attendance session not found.");
      return;
    }

    try {
      // Read the latest roster directly from Firestore.
      const rosterRef = collection(
        db,
        "attendanceSessions",
        sessionId,
        "roster"
      );

      const rosterSnapshot = await getDocs(rosterRef);

      let exportStudents = rosterSnapshot.docs.map(
        (studentDoc) => ({
          id: studentDoc.id,
          ...studentDoc.data(),
        })
      );

      // Keep compatibility with sessions created before
      // the roster collection was introduced.
      if (rosterSnapshot.empty) {
        const legacyRef = collection(
          db,
          "attendanceSessions",
          sessionId,
          "students"
        );

        const legacySnapshot = await getDocs(legacyRef);

        exportStudents = legacySnapshot.docs.map(
          (studentDoc) => ({
            id: studentDoc.id,
            ...studentDoc.data(),
          })
        );
      }

      if (exportStudents.length === 0) {
        toast.error("No attendance data available.");
        return;
      }

      // Calculate every total from the same data
      // that will appear in the PDF.
      const total = exportStudents.length;

      const presentCount = exportStudents.filter(
        (student) => student.status === "Present"
      ).length;

      const absentCount = exportStudents.filter(
        (student) => student.status === "Absent"
      ).length;

      const leaveCount = exportStudents.filter(
        (student) => student.status === "Leave"
      ).length;

      const pdf = new jsPDF();

      pdf.setFontSize(20);
      pdf.text("AUMNex", 105, 15, {
        align: "center",
      });

      pdf.setFontSize(16);
      pdf.text("Attendance Report", 105, 25, {
        align: "center",
      });

      pdf.setFontSize(11);

      pdf.text(
        `Department: ${session.department || "—"}`,
        14,
        40
      );

      pdf.text(
        `Subject: ${session.subject || "—"}`,
        14,
        48
      );

      pdf.text(
        `Semester: ${session.semester || "—"}`,
        14,
        56
      );

      pdf.text(
        `Division: ${session.division || "—"}`,
        14,
        64
      );

      pdf.text(
        `Date: ${session.date || "—"}`,
        14,
        72
      );

      pdf.text(`Total Students: ${total}`, 130, 40);
      pdf.text(`Present: ${presentCount}`, 130, 48);
      pdf.text(`Absent: ${absentCount}`, 130, 56);
      pdf.text(`Leave: ${leaveCount}`, 130, 64);

      autoTable(pdf, {
        startY: 82,

        head: [[
          "Sr",
          "Roll No",
          "Name",
          "Department",
          "Status",
          "Method",
        ]],

        body: exportStudents.map((student, index) => {
          const storedMethod = String(
            student.method || ""
          ).trim();

          // Preserve NFC explicitly rather than letting
          // an empty method silently become Manual.
          const method =
            storedMethod.toUpperCase() === "NFC"
              ? "NFC"
              : storedMethod || "Manual";

          return [
            index + 1,
            student.rollNo || "—",
            student.name || "—",
            student.department || session.department || "—",
            student.status || "Not Marked",
            method,
          ];
        }),
      });

      pdf.save(
        `Attendance_${session.subject}_${session.semester}_${session.division}.pdf`
      );

      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("PDF export error:", error);

      toast.error(
        error?.message || "Failed to export PDF."
      );
    }
  }

  // ============================================================
  // FILTERED STUDENTS
  // ============================================================

  const filteredStudents =
    students.filter(
      (student) => {
        const queryText =
          search
            .trim()
            .toLowerCase();

        const name =
          String(
            student.name ||
            ""
          ).toLowerCase();

        const rollNo =
          String(
            student.rollNo ||
            ""
          ).toLowerCase();

        const matchesSearch =
          !queryText ||
          name.includes(
            queryText
          ) ||
          rollNo.includes(
            queryText
          );

        const matchesFilter =
          filter ===
          "All" ||
          student.status ===
          filter;

        return (
          matchesSearch &&
          matchesFilter
        );
      }
    );

  // ============================================================
  // LOADING
  // ============================================================

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

  // ============================================================
  // NOT FOUND
  // ============================================================

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
            <ArrowLeft
              size={18}
            />

            Back to Attendance History
          </button>

        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

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
            <ArrowLeft
              size={18}
            />

            Back to Attendance History
          </button>

        </div>
      </div>
    );
  }
  // ============================================================
  // SESSION TIMING HELPERS
  // ============================================================

  function toSafeDate(value) {
    if (!value) {
      return null;
    }

    const date =
      typeof value.toDate === "function"
        ? value.toDate()
        : value instanceof Date
          ? value
          : new Date(value);

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }

  function formatSessionDateTime(value) {
    const date = toSafeDate(value);

    if (!date) {
      return "Not recorded";
    }

    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  const sessionStartedAt =
    toSafeDate(session?.startedAt) ||
    toSafeDate(session?.startTime) ||
    toSafeDate(session?.createdAt);

  const sessionEndedAt =
    toSafeDate(session?.endedAt) ||
    toSafeDate(session?.endTime);

  const sessionDurationSeconds =
    session?.durationSeconds !== undefined &&
      session?.durationSeconds !== null &&
      Number.isFinite(Number(session.durationSeconds))
      ? Number(session.durationSeconds)
      : sessionStartedAt && sessionEndedAt
        ? Math.max(
          0,
          Math.floor(
            (sessionEndedAt.getTime() -
              sessionStartedAt.getTime()) /
            1000
          )
        )
        : null;
const liveSessionDurationSeconds =
  session?.status === "active" && sessionStartedAt
    ? Math.max(
        0,
        Math.floor(
          (currentTime - sessionStartedAt.getTime()) / 1000
        )
      )
    : null;

const displayedSessionDurationSeconds =
  sessionDurationSeconds !== null
    ? sessionDurationSeconds
    : liveSessionDurationSeconds;
  function formatSessionDuration(seconds) {
    const totalSeconds = Math.max(
      0,
      Math.floor(Number(seconds))
    );

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );
    const remainingSeconds = totalSeconds % 60;

    const parts = [];

    if (hours > 0) {
      parts.push(`${hours}h`);
    }

    if (minutes > 0) {
      parts.push(`${minutes}m`);
    }

    if (remainingSeconds > 0 || parts.length === 0) {
      parts.push(`${remainingSeconds}s`);
    }

    return parts.join(" ");
  }
  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="rounded-3xl bg-white p-6 shadow-lg">

        <h1 className="text-3xl font-bold">
          Attendance Details
        </h1>

        <p className="mt-2 text-gray-500">
          {session?.department ||
            "Department unavailable"}

          {" • "}

          {session?.subject ||
            "Subject unavailable"}

          {" • "}

          {session?.semester ||
            "Semester unavailable"}

          {" • Division "}

          {session?.division ||
            "Division unavailable"}
        </p>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">

          <span className="inline-flex items-center gap-2">
            <Building2
              size={16}
            />

            Faculty:
            {" "}
            {session?.faculty ||
              "—"}
          </span>

          <span className="inline-flex items-center gap-2">
            <Building2
              size={16}
            />

            Room:
            {" "}
            {session?.room ||
              "—"}
          </span>

        </div>
      </div>
      {/* ======================================================
          SESSION TIMING
      ======================================================= */}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Session Timing
        </h2>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Started At
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {sessionStartedAt
                ? formatSessionDateTime(sessionStartedAt)
                : "Not recorded"}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">
              Ended At
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {sessionEndedAt
                ? formatSessionDateTime(sessionEndedAt)
                : session?.status === "active"
                  ? "In progress"
                  : "Not recorded"}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">
              Total Duration
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {displayedSessionDurationSeconds !== null
  ? formatSessionDuration(
      displayedSessionDurationSeconds
    )
  : session?.status === "active"
    ? "Waiting for start time"
    : "Not recorded"}
            </p>
          </div>
        </div>
      </div>
      {/* ======================================================
          SUMMARY
      ======================================================= */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl bg-blue-50 p-6">
          <Users
            className="mb-3 text-blue-600"
          />

          <h2 className="text-3xl font-bold text-gray-900">
            {totalStudents}
          </h2>

          <p className="mt-1 text-sm font-medium text-gray-700">
  Total Students
</p>
        </div>

        <div className="rounded-2xl bg-green-50 p-6">
          <CheckCircle2
            className="mb-3 text-green-600"
          />

          <h2 className="text-3xl font-bold text-green-900">
  {present}
</h2>

          <p className="mt-1 text-sm font-medium text-gray-700">
            Present
          </p>
        </div>

        <div className="rounded-2xl bg-red-50 p-6">
          <XCircle
            className="mb-3 text-red-600"
          />

          <h2 className="text-3xl font-bold text-red-900">
            {absent}
          </h2>

         <p className="mt-1 text-sm font-medium text-gray-700">
  Absent
</p>
        </div>

        <div className="rounded-2xl bg-yellow-50 p-6">
          <Clock3
            className="mb-3 text-yellow-600"
          />

          <h2 className="text-3xl font-bold text-yellow-900">
            {leave}
          </h2>

          <p className="mt-1 text-sm font-medium text-gray-700">
  Leave
</p>
        </div>

      </div>

      {/* ======================================================
          SEARCH / FILTER
      ======================================================= */}

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

      {/* ======================================================
          STUDENT TABLE
      ======================================================= */}

      <div className="overflow-hidden rounded-3xl bg-white shadow-lg">

        {students.length === 0 ? (
          <div className="p-10 text-center text-gray-500">

            <Users
              size={48}
              className="mx-auto mb-4 text-gray-300"
            />

            <p className="font-medium">
              No student roster found.
            </p>

            <p className="mt-2 text-sm">
              New attendance sessions will create the full class roster automatically.
            </p>

          </div>
        ) : filteredStudents.length ===
          0 ? (
          <div className="p-10 text-center text-gray-500">
            No students match your search/filter.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-225px">

              <thead className="bg-gray-100">

                <tr>

                  <th className="p-4 text-left">
                    Roll No
                  </th>

                  <th className="p-4 text-left">
                    Student
                  </th>

                  <th className="p-4 text-left">
                    Department
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
                        {student.department ||
                          session?.department ||
                          "—"}
                      </td>

                      <td className="p-4">

                        <div className="flex flex-wrap gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              updateStudentStatus(
                                student.id,
                                "Present"
                              )
                            }
                            className={`rounded-lg px-3 py-1 text-sm text-white ${student.status ===
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
                            className={`rounded-lg px-3 py-1 text-sm text-white ${student.status ===
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
                            className={`rounded-lg px-3 py-1 text-sm text-white ${student.status ===
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
          </div>
        )}

        {/* ====================================================
            ACTIONS
        ===================================================== */}

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
                  students.length ===
                  0
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