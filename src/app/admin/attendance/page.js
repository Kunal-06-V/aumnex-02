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

  setSaving(true);

  try {

    const sessionId = crypto.randomUUID();

    await setDoc(doc(db, "attendanceSessions", sessionId), {
      sessionId,
      date: session.date,
      department: session.department,
      semester: session.semester,
      division: session.division,
      subject: session.subject,
      createdAt: serverTimestamp(),
    });

    for (const student of students) {

      await setDoc(
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
          status: attendance[student.uid] || "Absent",
          markedAt: serverTimestamp(),
        }
      );

    }

    toast.success("Attendance Saved Successfully");

    setAttendance({});

  } catch (error) {

    console.error(error);

    toast.error("Failed to save attendance.");

  }

  setSaving(false);

}

  return (
    <div className="space-y-8">

      <AttendanceHeader />

      <AttendanceStats />

      <AttendanceSession
        onLoadStudents={handleLoadStudents}
      />
      <AttendanceTable
  students={students}
  attendance={attendance}
  setAttendance={setAttendance}
  onSaveAttendance={handleSaveAttendance}
  saving={saving}
/>

    </div>
  );
}