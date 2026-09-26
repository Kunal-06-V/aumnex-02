import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  adminDb,
} from "./firebaseAdmin";

function normalizeNfcUid(value) {
  return String(value || "")
    .trim()
    .replace(/[\s:-]/g, "")
    .toUpperCase();
}

function normalizeMatchValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export async function markNfcAttendance(
  rawNfcUid
) {
  const nfcUid =
    normalizeNfcUid(rawNfcUid);

  // ==========================================================
  // 1. VALIDATE NFC UID
  // ==========================================================

  if (!nfcUid) {
    const error = new Error(
      "NFC UID is required."
    );

    error.code =
      "INVALID_NFC_UID";

    throw error;
  }

  if (
    !/^[0-9A-F]+$/.test(nfcUid) ||
    nfcUid.length < 8 ||
    nfcUid.length > 32
  ) {
    const error = new Error(
      "Invalid NFC UID format."
    );

    error.code =
      "INVALID_NFC_UID";

    throw error;
  }

  // ==========================================================
  // 2. FIND STUDENT
  // ==========================================================

  const studentSnapshot =
    await adminDb
      .collection("students")
      .where(
        "nfcUid",
        "==",
        nfcUid
      )
      .limit(2)
      .get();

  if (studentSnapshot.empty) {
    const error = new Error(
      "No student found for this NFC tag."
    );

    error.code =
      "STUDENT_NOT_FOUND";

    throw error;
  }

  if (studentSnapshot.size > 1) {
    const error = new Error(
      "This NFC UID is assigned to more than one student."
    );

    error.code =
      "NFC_UID_DUPLICATE";

    throw error;
  }

  const studentDoc =
    studentSnapshot.docs[0];

  const studentRef =
    studentDoc.ref;

  const student =
    studentDoc.data();

  // ==========================================================
  // 3. CHECK STUDENT ACCOUNT BEFORE TRANSACTION
  // ==========================================================

  if (
    student.role &&
    student.role !== "student"
  ) {
    const error = new Error(
      "This NFC card is not assigned to a student account."
    );

    error.code =
      "STUDENT_INACTIVE";

    throw error;
  }

  if (
    student.status !==
    "Active"
  ) {
    const error = new Error(
      "This student's account is not active."
    );

    error.code =
      "STUDENT_INACTIVE";

    throw error;
  }

  // ==========================================================
  // 4. CURRENT LIVE SESSION
  // ==========================================================

  const sessionRef =
    adminDb
      .collection(
        "attendanceSessions"
      )
      .doc("current");

  // ==========================================================
  // 5. CURRENT LIVE ATTENDANCE
  // ==========================================================

  const currentAttendanceRef =
    sessionRef
      .collection("students")
      .doc(studentDoc.id);

  // ==========================================================
  // 6. CURRENT LIVE ROSTER
  // ==========================================================

  const currentRosterRef =
    sessionRef
      .collection("roster")
      .doc(studentDoc.id);

  // ==========================================================
  // 7. HISTORY + NOTIFICATION
  // ==========================================================

  const historyRef =
    adminDb
      .collection(
        "attendanceHistory"
      )
      .doc();

  const notificationRef =
    adminDb
      .collection(
        "studentNotifications"
      )
      .doc();

  // ==========================================================
  // 8. TRANSACTION
  // ==========================================================

  const result =
    await adminDb.runTransaction(
      async (transaction) => {

        // ------------------------------------------------------
        // READ CURRENT SESSION
        // ------------------------------------------------------

        const sessionSnap =
          await transaction.get(
            sessionRef
          );

        // ------------------------------------------------------
        // READ CURRENT LIVE ATTENDANCE
        // ------------------------------------------------------

        const currentAttendanceSnap =
          await transaction.get(
            currentAttendanceRef
          );

        // ------------------------------------------------------
        // READ CURRENT ROSTER
        // ------------------------------------------------------

        const currentRosterSnap =
          await transaction.get(
            currentRosterRef
          );

        // ------------------------------------------------------
        // READ STUDENT AGAIN INSIDE TRANSACTION
        // ------------------------------------------------------

        const studentSnap =
          await transaction.get(
            studentRef
          );

        // ------------------------------------------------------
        // SESSION MUST EXIST
        // ------------------------------------------------------

        if (
          !sessionSnap.exists
        ) {
          const error = new Error(
            "Attendance session not found."
          );

          error.code =
            "SESSION_NOT_FOUND";

          throw error;
        }

        // ------------------------------------------------------
        // STUDENT MUST STILL EXIST
        // ------------------------------------------------------

        if (
          !studentSnap.exists
        ) {
          const error = new Error(
            "Student record no longer exists."
          );

          error.code =
            "STUDENT_NOT_FOUND";

          throw error;
        }

        const session =
          sessionSnap.data();

        const currentStudent =
          studentSnap.data();

        // ------------------------------------------------------
        // STUDENT STATUS RECHECK
        // ------------------------------------------------------

        if (
          currentStudent.status !==
          "Active"
        ) {
          const error = new Error(
            "This student's account is not active."
          );

          error.code =
            "STUDENT_INACTIVE";

          throw error;
        }

        // ------------------------------------------------------
        // SESSION ACTIVE?
        // ------------------------------------------------------

        if (
          session.status !==
          "active"
        ) {
          const error = new Error(
            "Attendance session is not active."
          );

          error.code =
            "SESSION_NOT_ACTIVE";

          throw error;
        }

        // ------------------------------------------------------
        // CANONICAL SESSION ID
        // ------------------------------------------------------

        const activeSessionId =
          session.activeSessionId ||
          session.sessionId;

        if (!activeSessionId) {
          const error = new Error(
            "Active attendance session ID is missing."
          );

          error.code =
            "SESSION_ID_MISSING";

          throw error;
        }

        // ------------------------------------------------------
        // REQUIRED SESSION CONFIGURATION
        // ------------------------------------------------------

        const requiredFields = [
          "department",
          "subject",
          "semester",
          "division",
          "faculty",
          "room",
        ];

        const missingFields =
          requiredFields.filter(
            (field) =>
              !String(
                session[field] || ""
              ).trim()
          );

        if (
          missingFields.length > 0
        ) {
          const error = new Error(
            `Attendance session is incomplete. Missing: ${missingFields.join(
              ", "
            )}.`
          );

          error.code =
            "SESSION_CONFIG_INVALID";

          throw error;
        }

        // ------------------------------------------------------
        // HISTORICAL SESSION
        // ------------------------------------------------------

        const historicalSessionRef =
          adminDb
            .collection(
              "attendanceSessions"
            )
            .doc(
              activeSessionId
            );

        const historicalAttendanceRef =
          historicalSessionRef
            .collection(
              "students"
            )
            .doc(
              studentDoc.id
            );

        const historicalRosterRef =
          historicalSessionRef
            .collection(
              "roster"
            )
            .doc(
              studentDoc.id
            );

        const historicalSessionSnap =
          await transaction.get(
            historicalSessionRef
          );

        const historicalAttendanceSnap =
          await transaction.get(
            historicalAttendanceRef
          );

        const historicalRosterSnap =
          await transaction.get(
            historicalRosterRef
          );

        // ------------------------------------------------------
        // HISTORICAL SESSION MUST EXIST
        // ------------------------------------------------------

        if (
          !historicalSessionSnap.exists
        ) {
          const error = new Error(
            "Historical attendance session not found."
          );

          error.code =
            "SESSION_NOT_FOUND";

          throw error;
        }

        const historicalSession =
          historicalSessionSnap.data();

        // ------------------------------------------------------
        // HISTORICAL SESSION ID MUST MATCH
        // ------------------------------------------------------

        if (
          historicalSession.sessionId !==
          activeSessionId
        ) {
          const error = new Error(
            "Attendance session identity mismatch."
          );

          error.code =
            "SESSION_MISMATCH";

          throw error;
        }

        // ------------------------------------------------------
        // HISTORICAL SESSION MUST BE ACTIVE
        // ------------------------------------------------------

        if (
          historicalSession.status !==
          "active"
        ) {
          const error = new Error(
            "Historical attendance session is not active."
          );

          error.code =
            "SESSION_NOT_ACTIVE";

          throw error;
        }

        // ------------------------------------------------------
        // STUDENT CLASS SECURITY
        // ------------------------------------------------------

        const studentDepartment =
          normalizeMatchValue(
            currentStudent.department
          );

        const sessionDepartment =
          normalizeMatchValue(
            session.department
          );

        const studentSemester =
          normalizeMatchValue(
            currentStudent.semester
          );

        const sessionSemester =
          normalizeMatchValue(
            session.semester
          );

        const studentDivision =
          normalizeMatchValue(
            currentStudent.division
          );

        const sessionDivision =
          normalizeMatchValue(
            session.division
          );

        if (
          studentDepartment !==
            sessionDepartment ||
          studentSemester !==
            sessionSemester ||
          studentDivision !==
            sessionDivision
        ) {
          const error = new Error(
            `Student belongs to ${currentStudent.department}, ${currentStudent.semester}, Division ${currentStudent.division}. Current session is ${session.department}, ${session.semester}, Division ${session.division}.`
          );

          error.code =
            "SESSION_MISMATCH";

          throw error;
        }

        // ------------------------------------------------------
        // DUPLICATE CHECK — LIVE ATTENDANCE
        // ------------------------------------------------------

        if (
          currentAttendanceSnap.exists &&
          currentAttendanceSnap
            .data()
            .sessionId ===
            activeSessionId
        ) {
          const error = new Error(
            "Attendance already marked for this student in the current session."
          );

          error.code =
            "ALREADY_MARKED";

          throw error;
        }

        // ------------------------------------------------------
        // DUPLICATE CHECK — HISTORICAL ATTENDANCE
        // ------------------------------------------------------

        if (
          historicalAttendanceSnap.exists &&
          historicalAttendanceSnap
            .data()
            .sessionId ===
            activeSessionId
        ) {
          const error = new Error(
            "Attendance already marked for this student in the current session."
          );

          error.code =
            "ALREADY_MARKED";

          throw error;
        }

        // ------------------------------------------------------
        // DUPLICATE CHECK — ROSTER
        //
        // This protects against a case where a manual
        // attendance change already marked this student
        // Present before their NFC scan.
        // ------------------------------------------------------

        if (
          currentRosterSnap.exists &&
          currentRosterSnap.data()
            .status ===
            "Present"
        ) {
          const error = new Error(
            "Attendance already marked for this student in the current session."
          );

          error.code =
            "ALREADY_MARKED";

          throw error;
        }

        if (
          historicalRosterSnap.exists &&
          historicalRosterSnap.data()
            .status ===
            "Present"
        ) {
          const error = new Error(
            "Attendance already marked for this student in the current session."
          );

          error.code =
            "ALREADY_MARKED";

          throw error;
        }

        // ------------------------------------------------------
        // PREVIOUS ROSTER STATUS
        // ------------------------------------------------------

        const previousRosterStatus =
          currentRosterSnap.exists
            ? currentRosterSnap.data()
                .status
            : null;

        // ======================================================
        // COUNTER CHANGES
        // ======================================================

        let presentIncrement = 1;
        let absentIncrement = 0;
        let leaveIncrement = 0;

        if (
          previousRosterStatus ===
          "Absent"
        ) {
          absentIncrement = -1;
        }

        if (
          previousRosterStatus ===
          "Leave"
        ) {
          leaveIncrement = -1;
        }

        // ======================================================
        // SERVER TIMESTAMP
        // ======================================================

        const markedAt =
          FieldValue.serverTimestamp();

        // ======================================================
        // WRITE 1 — LIVE CURRENT SESSION
        // ======================================================

        transaction.set(
          currentAttendanceRef,
          {
            uid:
              studentDoc.id,

            name:
              currentStudent.name,

            rollNo:
              currentStudent.rollNo,

            department:
              currentStudent.department ||
              session.department,

            status:
              "Present",

            method:
              "NFC",

            nfcUid,

            sessionId:
              activeSessionId,

            subject:
              session.subject,

            semester:
              session.semester,

            division:
              session.division,

            faculty:
              session.faculty,

            room:
              session.room,

            markedAt,
          }
        );

        // ======================================================
        // WRITE 2 — HISTORICAL SESSION
        // ======================================================

        transaction.set(
          historicalAttendanceRef,
          {
            uid:
              studentDoc.id,

            name:
              currentStudent.name,

            rollNo:
              currentStudent.rollNo,

            department:
              currentStudent.department ||
              session.department,

            status:
              "Present",

            method:
              "NFC",

            nfcUid,

            sessionId:
              activeSessionId,

            subject:
              session.subject,

            semester:
              session.semester,

            division:
              session.division,

            faculty:
              session.faculty,

            room:
              session.room,

            markedAt,
          }
        );

        // ======================================================
        // WRITE 3 — LIVE ROSTER
        // ======================================================

        const liveRosterData = {
          studentId:
            studentDoc.id,

          uid:
            studentDoc.id,

          name:
            currentStudent.name ||
            "Unknown",

          rollNo:
            currentStudent.rollNo ||
            "",

          department:
            currentStudent.department ||
            session.department,

          semester:
            currentStudent.semester ||
            session.semester,

          division:
            currentStudent.division ||
            session.division,

          nfcUid,

          status:
            "Present",

          method:
            "NFC",

          sessionId:
            activeSessionId,

          markedAt,

          updatedAt:
            new Date(),
        };

        transaction.set(
          currentRosterRef,
          liveRosterData,
          {
            merge: true,
          }
        );

        // ======================================================
        // WRITE 4 — HISTORICAL ROSTER
        // ======================================================

        const historicalRosterData = {
          studentId:
            studentDoc.id,

          uid:
            studentDoc.id,

          name:
            currentStudent.name ||
            "Unknown",

          rollNo:
            currentStudent.rollNo ||
            "",

          department:
            currentStudent.department ||
            session.department,

          semester:
            currentStudent.semester ||
            session.semester,

          division:
            currentStudent.division ||
            session.division,

          nfcUid,

          status:
            "Present",

          method:
            "NFC",

          sessionId:
            activeSessionId,

          markedAt,

          updatedAt:
            new Date(),
        };

        transaction.set(
          historicalRosterRef,
          historicalRosterData,
          {
            merge: true,
          }
        );

        // ======================================================
        // WRITE 5 — LIVE SESSION COUNTERS
        // ======================================================

        transaction.update(
          sessionRef,
          {
            present:
              FieldValue.increment(
                presentIncrement
              ),

            absent:
              FieldValue.increment(
                absentIncrement
              ),

            leave:
              FieldValue.increment(
                leaveIncrement
              ),

            updatedAt:
              new Date(),
          }
        );

        // ======================================================
        // WRITE 6 — HISTORICAL COUNTERS
        // ======================================================

        transaction.update(
          historicalSessionRef,
          {
            present:
              FieldValue.increment(
                presentIncrement
              ),

            absent:
              FieldValue.increment(
                absentIncrement
              ),

            leave:
              FieldValue.increment(
                leaveIncrement
              ),

            updatedAt:
              new Date(),
          }
        );

        // ======================================================
        // WRITE 7 — STUDENT SUMMARY
        // ======================================================

        transaction.update(
          studentRef,
          {
            attendance:
              FieldValue.increment(
                1
              ),

            lastAttendanceDate:
              session.date ||
              new Date()
                .toISOString()
                .split("T")[0],

            lastSubject:
              session.subject,

            lastAttendanceSessionId:
              activeSessionId,

            lastAttendanceMethod:
              "NFC",
          }
        );

        // ======================================================
        // WRITE 8 — ATTENDANCE HISTORY
        // ======================================================

        transaction.set(
          historyRef,
          {
            studentId:
              studentDoc.id,

            studentName:
              currentStudent.name,

            rollNo:
              currentStudent.rollNo,

            department:
              currentStudent.department ||
              session.department,

            subject:
              session.subject,

            semester:
              session.semester,

            division:
              session.division,

            faculty:
              session.faculty,

            room:
              session.room,

            status:
              "Present",

            method:
              "NFC",

            nfcUid,

            sessionId:
              activeSessionId,

            date:
              session.date ||
              "",

            createdAt:
              markedAt,
          }
        );

        // ======================================================
        // WRITE 9 — STUDENT NOTIFICATION
        // ======================================================

        transaction.set(
          notificationRef,
          {
            studentId:
              studentDoc.id,

            studentName:
              currentStudent.name,

            title:
              "Attendance Marked",

            message:
              `${session.subject} attendance marked successfully via NFC.`,

            department:
              currentStudent.department ||
              session.department,

            subject:
              session.subject,

            faculty:
              session.faculty,

            semester:
              session.semester,

            division:
              session.division,

            room:
              session.room,

            status:
              "Present",

            method:
              "NFC",

            nfcUid,

            type:
              "attendance",

            sessionId:
              activeSessionId,

            read:
              false,

            createdAt:
              markedAt,
          }
        );

        // ======================================================
        // RESPONSE
        // ======================================================

        return {
          success: true,

          student: {
            uid:
              studentDoc.id,

            name:
              currentStudent.name,

            rollNo:
              currentStudent.rollNo,

            department:
              currentStudent.department ||
              session.department,

            semester:
              currentStudent.semester,

            division:
              currentStudent.division,

            nfcUid,
          },

          department:
            session.department,

          subject:
            session.subject,

          semester:
            session.semester,

          division:
            session.division,

          faculty:
            session.faculty,

          room:
            session.room,

          method:
            "NFC",

          sessionId:
            activeSessionId,
        };
      }
    );

  return result;
}