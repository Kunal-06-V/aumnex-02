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

  try {

    setSession(sessionData);

    const q = query(
      collection(db, "students"),

      where(
        "department",
        "==",
        sessionData.department
      ),

      where(
        "semester",
        "==",
        sessionData.semester
      ),

      where(
        "division",
        "==",
        sessionData.division
      )

    );

    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));

    console.log(data);

    setStudents(data);

  } catch (error) {

    console.error(error);

  }

}
async function handleSaveAttendance() {

  if (!session) {
    toast.error("Load students first.");
    return;
  }

  if (students.length === 0) {
    toast.error("No students found.");
    return;
  }

  // Every student must be marked
  if (Object.keys(attendance).length !== students.length) {
    toast.error("Please mark attendance for every student.");
    return;
  }

  const confirmSave = window.confirm(
    `Save attendance for ${session.subject}?`
  );

  if (!confirmSave) return;

  setSaving(true);

  try {

    const present = Object.values(attendance).filter(
      (s) => s === "Present"
    ).length;

    const absent = Object.values(attendance).filter(
      (s) => s === "Absent"
    ).length;

    const leave = Object.values(attendance).filter(
      (s) => s === "Leave"
    ).length;

    const sessionId = crypto.randomUUID();

    await setDoc(doc(db, "attendanceSessions", sessionId), {
      sessionId,
      date: session.date,
      department: session.department,
      semester: session.semester,
      division: session.division,
      subject: session.subject,
      totalStudents: students.length,
      present,
      absent,
      leave,
      createdAt: serverTimestamp(),
    });

    await Promise.all(
      students.map((student) =>
        setDoc(
          doc(
            db,
            "attendanceSessions",
            sessionId,
            "students",
            student.uid
          ),
          {
            uid: student.uid,
            name: student.name,
            rollNo: student.rollNo,
            status: attendance[student.uid],
            markedAt: serverTimestamp(),
          }
        )
      )
    );

    toast.success("Attendance Saved Successfully");

    setAttendance({});
    setStudents([]);
    setSession(null);

  } catch (error) {

    console.error(error);
    toast.error("Failed to save attendance.");

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