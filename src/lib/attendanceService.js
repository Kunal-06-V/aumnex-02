import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  increment,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";

import { db } from "./firebase";

export async function markAttendance(studentId) {
  // Get Student
  const studentRef = doc(db, "students", studentId);
  const studentSnap = await getDoc(studentRef);

  if (!studentSnap.exists()) {
    throw new Error("Student not found");
  }

  const student = studentSnap.data();

  // Get Current Attendance Session
  const sessionRef = doc(db, "attendanceSessions", "current");
  const sessionSnap = await getDoc(sessionRef);

  if (!sessionSnap.exists()) {
    throw new Error("Attendance session not found");
  }

  const session = sessionSnap.data();

  if (session.status !== "active") {
    throw new Error("Attendance session is not active");
  }

  // Prevent duplicate attendance
  const today = new Date().toDateString();

  if (
    student.lastAttendanceDate === today &&
    student.lastSubject === session.subject
  ) {
    throw new Error("Attendance already marked today");
  }

  // Save Attendance History
// Save Attendance History
await addDoc(collection(db, "attendanceHistory"), {
  studentId,
  studentName: student.name,
  rollNo: student.rollNo,
  subject: session.subject,
  semester: session.semester,
  division: session.division,
  faculty: session.faculty,
  room: session.room,
  status: "Present",
  createdAt: serverTimestamp(),
});

  // Update Student
  await updateDoc(studentRef, {
    attendance: increment(1),
    lastAttendanceDate: today,
    lastSubject: session.subject,
  });

  // Create Notification
 await addDoc(collection(db, "studentNotifications"), {
  studentId,
  studentName: student.name,
  title: "Attendance Marked",
  message: `${session.subject} attendance marked successfully.`,
  subject: session.subject,
  faculty: session.faculty,
  semester: session.semester,
  division: session.division,
  room: session.room,
  status: "Present",
  type: "attendance",
  read: false,
  createdAt: serverTimestamp(),
});
  return {
    success: true,
    student: student.name,
  };
}
export async function markAttendanceByUID(nfcUid) {
  const studentQuery = query(
    collection(db, "students"),
    where("nfcUid", "==", nfcUid)
  );

  const snapshot = await getDocs(studentQuery);

  if (snapshot.empty) {
    throw new Error("No student found for this NFC tag.");
  }

  const studentDoc = snapshot.docs[0];

  return await markAttendance(studentDoc.id);
}