"use client";

import { useState } from "react";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import toast from "react-hot-toast";


import AttendanceHeader from "@/components/attendance/AttendanceHeader";
import AttendanceStats from "@/components/attendance/AttendanceStats";
import AttendanceSession from "@/components/attendance/AttendanceSession";
import AttendanceTable from "@/components/attendance/AttendanceTable";

export default function AttendancePage() {
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [attendanceMethod, setAttendanceMethod] = useState({});
  const [saving, setSaving] = useState(false);


  async function handleLoadStudents(sessionData) {
  if (!sessionData.subject?.trim()) {
    toast.error("Please enter a subject.");
    return;
  }

  try {
    console.log("Selected Attendance Session:", sessionData);

    setSession(sessionData);

    /*
     * Load all students first.
     * Then normalize department / semester / division
     * before comparing them.
     *
     * This prevents students from being excluded because
     * of accidental whitespace or casing differences.
     */
    const studentsSnapshot = await getDocs(
      collection(db, "students")
    );

    const selectedDepartment = String(
      sessionData.department || ""
    )
      .trim()
      .toLowerCase();

    const selectedSemester = String(
      sessionData.semester || ""
    )
      .trim()
      .toLowerCase();

    const selectedDivision = String(
      sessionData.division || ""
    )
      .trim()
      .toLowerCase();

    console.log("Selected filters:", {
      department: selectedDepartment,
      semester: selectedSemester,
      division: selectedDivision,
    });

    const allStudents = studentsSnapshot.docs.map(
      (studentDoc) => ({
        uid: studentDoc.id,
        ...studentDoc.data(),
      })
    );

    console.log(
      "All students from Firestore:",
      allStudents
    );

    const matchingStudents =
      allStudents.filter((student) => {
        const studentDepartment = String(
          student.department || ""
        )
          .trim()
          .toLowerCase();

        const studentSemester = String(
          student.semester || ""
        )
          .trim()
          .toLowerCase();

        const studentDivision = String(
          student.division || ""
        )
          .trim()
          .toLowerCase();

        const matches =
          studentDepartment ===
            selectedDepartment &&
          studentSemester ===
            selectedSemester &&
          studentDivision ===
            selectedDivision;

        console.log(
          `Student: ${
            student.name || student.uid
          }`,
          {
            department:
              studentDepartment,
            semester:
              studentSemester,
            division:
              studentDivision,
            matches,
          }
        );

        return matches;
      });

    console.log(
      "Matching students:",
      matchingStudents
    );

    setStudents(
      matchingStudents
    );

    if (
      matchingStudents.length === 0
    ) {
      toast.error(
        "No students found for the selected department, semester and division."
      );
    } else {
      toast.success(
        `${matchingStudents.length} student(s) loaded.`
      );
    }
  } catch (error) {
    console.error(
      "Failed to load students:",
      error
    );

    toast.error(
      "Failed to load students."
    );
  }
}
async function handleSaveAttendance() {
  if (!session?.subject?.trim()) {
    toast.error(
      "Subject is required before saving attendance."
    );
    return;
  }

  if (!session) {
    toast.error("Load students first.");
    return;
  }

  if (students.length === 0) {
    toast.error("No students found.");
    return;
  }

  // Every student must be marked.
  if (
    Object.keys(attendance).length !==
    students.length
  ) {
    toast.error(
      "Please mark attendance for every student."
    );
    return;
  }

  const confirmSave = window.confirm(
    `Save attendance for ${session.subject}?`
  );

  if (!confirmSave) {
    return;
  }

  setSaving(true);

  try {
    const present = Object.values(
      attendance
    ).filter(
      (status) => status === "Present"
    ).length;

    const absent = Object.values(
      attendance
    ).filter(
      (status) => status === "Absent"
    ).length;

    const leave = Object.values(
      attendance
    ).filter(
      (status) => status === "Leave"
    ).length;

    const sessionId =
      crypto.randomUUID();

    /*
     * -----------------------------------------
     * 1. CREATE ATTENDANCE SESSION
     * -----------------------------------------
     */

    await setDoc(
      doc(
        db,
        "attendanceSessions",
        sessionId
      ),
      {
        sessionId,
        date: session.date,
        department:
          session.department,
        semester:
          session.semester,
        division:
          session.division,
        subject:
          session.subject,
        totalStudents:
          students.length,
        present,
        absent,
        leave,
        createdAt:
          serverTimestamp(),
      }
    );

    /*
     * -----------------------------------------
     * 2. CREATE SESSION STUDENT RECORDS
     * -----------------------------------------
     */

    const batch = writeBatch(
      db
    );

    for (const student of students) {
      const status =
        attendance[student.uid];

      /*
       * Session record
       */
      const sessionStudentRef =
        doc(
          db,
          "attendanceSessions",
          sessionId,
          "students",
          student.uid
        );

      batch.set(
        sessionStudentRef,
        {
          uid: student.uid,
          name:
            student.name || "",
          rollNo:
            student.rollNo || "",
          status,
          method:
            attendanceMethod[
              student.uid
            ] || "Manual",
          markedAt:
            serverTimestamp(),
        }
      );

      /*
       * ---------------------------------------
       * 3. CREATE HISTORICAL RECORD
       * ---------------------------------------
       *
       * Attendance History and Ask AUMNex
       * use this collection.
       */

      const historyId =
        `${sessionId}_${student.uid}`;

      const historyRef =
        doc(
          db,
          "attendanceHistory",
          historyId
        );

      batch.set(
        historyRef,
        {
          studentId:
            student.uid,

          studentUid:
            student.uid,

          studentName:
            student.name || "",

          rollNo:
            student.rollNo || "",

          department:
            student.department ||
            session.department ||
            "",

          semester:
            student.semester ||
            session.semester ||
            "",

          division:
            student.division ||
            session.division ||
            "",

          date:
            session.date,

          subject:
            session.subject,

          status,

          method:
            attendanceMethod[
              student.uid
            ] || "Manual",

          sessionId,

          markedAt:
            serverTimestamp(),

          createdAt:
            serverTimestamp(),
        }
      );
    }

    /*
     * -----------------------------------------
     * 4. SAVE EVERYTHING TO FIRESTORE
     * -----------------------------------------
     */

    await batch.commit();

    toast.success(
      "Attendance Saved Successfully"
    );

    /*
     * Reset UI
     */

    setAttendance({});
    setAttendanceMethod({});
    setStudents([]);
    setSession(null);

  } catch (error) {
    console.error(
      "Failed to save attendance:",
      error
    );

    toast.error(
      "Failed to save attendance."
    );
  } finally {
    setSaving(false);
  }
}

  return (
    <div className="space-y-8">

      <AttendanceHeader />

      <AttendanceStats attendance={attendance} />

      <AttendanceSession
        onLoadStudents={handleLoadStudents}
      />
      <AttendanceTable
        students={students}
        attendance={attendance}
        setAttendance={setAttendance}
        attendanceMethod={attendanceMethod}
        setAttendanceMethod={setAttendanceMethod}
        onSaveAttendance={handleSaveAttendance}
        saving={saving}
      />

    </div>
  );
}