import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin";

export async function markNfcAttendance(nfcUid) {
  if (!nfcUid) {
    throw new Error("NFC UID is required.");
  }

  // --------------------------------------------------
  // 1. Find student using NFC UID
  // --------------------------------------------------

  const studentSnapshot = await adminDb
    .collection("students")
    .where("nfcUid", "==", nfcUid)
    .limit(1)
    .get();

  if (studentSnapshot.empty) {
    const error = new Error("No student found for this NFC tag.");
    error.code = "STUDENT_NOT_FOUND";
    throw error;
  }

  const studentDoc = studentSnapshot.docs[0];
  const studentRef = studentDoc.ref;
  const student = studentDoc.data();

  // --------------------------------------------------
  // 2. Get the current attendance session
  // --------------------------------------------------

  const sessionRef = adminDb
    .collection("attendanceSessions")
    .doc("current");

  // --------------------------------------------------
  // 3. References used for this student's attendance
  // --------------------------------------------------

  const attendanceRef = sessionRef
    .collection("students")
    .doc(studentDoc.id);

  const historyRef = adminDb
    .collection("attendanceHistory")
    .doc();

  const notificationRef = adminDb
    .collection("studentNotifications")
    .doc();

  // --------------------------------------------------
  // 4. Run everything inside a Firestore transaction
  // --------------------------------------------------

  const result = await adminDb.runTransaction(async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    const attendanceSnap = await transaction.get(attendanceRef);
    const studentSnap = await transaction.get(studentRef);

    if (!sessionSnap.exists) {
      const error = new Error(
        "Attendance session not found."
      );
      error.code = "SESSION_NOT_FOUND";
      throw error;
    }

    if (!studentSnap.exists) {
      const error = new Error(
        "Student record no longer exists."
      );
      error.code = "STUDENT_NOT_FOUND";
      throw error;
    }

    const session = sessionSnap.data();
    const currentStudent = studentSnap.data();

    // ------------------------------------------------
    // 5. Make sure attendance is currently active
    // ------------------------------------------------

    if (session.status !== "active") {
      const error = new Error(
        "Attendance session is not active."
      );
      error.code = "SESSION_NOT_ACTIVE";
      throw error;
    }

    // ------------------------------------------------
    // 6. Make sure the session has a unique sessionId
    // ------------------------------------------------

    if (!session.sessionId) {
      const error = new Error(
        "Attendance session is missing a session ID."
      );
      error.code = "SESSION_ID_MISSING";
      throw error;
    }

    // ------------------------------------------------
    // 7. Check semester and division
    // ------------------------------------------------

    if (
      currentStudent.semester !== session.semester ||
      currentStudent.division !== session.division
    ) {
      const error = new Error(
        `Student belongs to ${currentStudent.semester}, Division ${currentStudent.division}. ` +
        `Current session is ${session.semester}, Division ${session.division}.`
      );

      error.code = "SESSION_MISMATCH";
      throw error;
    }

    // ------------------------------------------------
    // 8. Prevent duplicate attendance in same session
    // ------------------------------------------------

    if (
      attendanceSnap.exists &&
      attendanceSnap.data().sessionId === session.sessionId
    ) {
      const error = new Error(
        "Attendance already marked for this student in the current session."
      );

      error.code = "ALREADY_MARKED";
      throw error;
    }

    // ------------------------------------------------
    // 9. Current timestamp
    // ------------------------------------------------

    const markedAt = FieldValue.serverTimestamp();

    // ------------------------------------------------
    // 10. Mark student inside current session
    // ------------------------------------------------

    transaction.set(
      attendanceRef,
      {
        uid: studentDoc.id,
        name: currentStudent.name,
        rollNo: currentStudent.rollNo,
        status: "Present",
        sessionId: session.sessionId,
        markedAt,
      }
    );

    // ------------------------------------------------
    // 11. Update session present count
    // ------------------------------------------------

    transaction.update(sessionRef, {
      present: FieldValue.increment(1),
    });

    // ------------------------------------------------
    // 12. Update student's attendance count
    // ------------------------------------------------

    transaction.update(studentRef, {
      attendance: FieldValue.increment(1),
      lastAttendanceDate: new Date().toDateString(),
      lastSubject: session.subject,
      lastAttendanceSessionId: session.sessionId,
    });

    // ------------------------------------------------
    // 13. Create attendance history
    // ------------------------------------------------

    transaction.set(historyRef, {
      studentId: studentDoc.id,
      studentName: currentStudent.name,
      rollNo: currentStudent.rollNo,

      subject: session.subject,
      semester: session.semester,
      division: session.division,

      faculty: session.faculty || "",
      room: session.room || "",

      status: "Present",

      sessionId: session.sessionId,

      createdAt: markedAt,
    });

    // ------------------------------------------------
    // 14. Create student notification
    // ------------------------------------------------

    transaction.set(notificationRef, {
      studentId: studentDoc.id,
      studentName: currentStudent.name,

      title: "Attendance Marked",

      message:
        `${session.subject} attendance marked successfully.`,

      subject: session.subject,
      faculty: session.faculty || "",
      semester: session.semester,
      division: session.division,
      room: session.room || "",

      status: "Present",
      type: "attendance",

      sessionId: session.sessionId,

      read: false,

      createdAt: markedAt,
    });

  return {
  success: true,

  student: {
    uid: studentDoc.id,
    name: currentStudent.name,
    rollNo: currentStudent.rollNo,
    semester: currentStudent.semester,
    division: currentStudent.division,
    nfcUid: currentStudent.nfcUid,
  },

  subject: session.subject,

  sessionId: session.sessionId,
};
  });

  return result;
}