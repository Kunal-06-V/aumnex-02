"use client";

import { useState } from "react";

import {
  collection,
  getDocs,
  doc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  ShieldCheck,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Users,
  CalendarCheck,
  GraduationCap,
  WalletCards,
  CalendarDays,
} from "lucide-react";

const semesters = [
  "semester1",
  "semester2",
  "semester3",
  "semester4",
  "semester5",
  "semester6",
  "semester7",
  "semester8",
];

const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const periods = [
  "period1",
  "period2",
  "period3",
  "period4",
  "period5",
  "period6",
];

const validAttendanceStatuses = [
  "Present",
  "Absent",
  "Leave",
];

function addIssue(
  list,
  type,
  area,
  message,
  detail = ""
) {
  list.push({
    type,
    area,
    message,
    detail,
  });
}

function numberValue(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function expectedFeeStatus(
  totalFees,
  paidFees
) {
  if (totalFees <= 0) {
    return null;
  }

  if (paidFees >= totalFees) {
    return "Paid";
  }

  if (paidFees > 0) {
    return "Partial";
  }

  return "Pending";
}

export default function DataIntegrityAuditPage() {
  const [loading, setLoading] = useState(false);

  const [lastRun, setLastRun] = useState(null);

  const [audit, setAudit] = useState(null);

  async function runAudit() {
    try {
      setLoading(true);

      const issues = [];
      const warnings = [];
      const passed = [];

      /* -----------------------------------------
         STUDENTS
      ----------------------------------------- */

      const studentsSnapshot =
        await getDocs(
          collection(db, "students")
        );

      const students =
        studentsSnapshot.docs.map(
          (studentDoc) => ({
            id: studentDoc.id,
            ...studentDoc.data(),
          })
        );

      const rollMap = new Map();

      for (const student of students) {
        const missingFields = [];

        if (!student.name?.trim()) {
          missingFields.push("name");
        }

        if (!student.rollNo?.trim()) {
          missingFields.push("rollNo");
        }

        if (!student.department?.trim()) {
          missingFields.push("department");
        }

        if (!student.semester?.trim()) {
          missingFields.push("semester");
        }

        if (!student.division?.trim()) {
          missingFields.push("division");
        }

        if (missingFields.length > 0) {
          addIssue(
            issues,
            "error",
            "Students",
            `Student ${student.id} is missing required fields.`,
            missingFields.join(", ")
          );
        }

        if (student.rollNo) {
          if (!rollMap.has(student.rollNo)) {
            rollMap.set(
              student.rollNo,
              []
            );
          }

          rollMap
            .get(student.rollNo)
            .push(student.id);
        }
      }

      for (const [
        rollNo,
        ids,
      ] of rollMap.entries()) {
        if (ids.length > 1) {
          addIssue(
            warnings,
            "warning",
            "Students",
            `Duplicate roll number detected: ${rollNo}`,
            ids.join(", ")
          );
        }
      }

      if (
        students.length > 0 &&
        !issues.some(
          (item) =>
            item.area === "Students"
        )
      ) {
        passed.push(
          `Students: ${students.length} records passed required-field validation.`
        );
      }

      /* -----------------------------------------
         ATTENDANCE
      ----------------------------------------- */

      const attendanceSnapshot =
        await getDocs(
          collection(
            db,
            "attendanceSessions"
          )
        );

      let historicalSessionCount = 0;
      let attendanceRecordCount = 0;

      /*
       * NEW:
       * Track actual historical attendance
       * student-by-student so that we can compare
       * it with students/{uid}.attendancePercentage.
       */
      const attendanceByStudent =
        new Map();

      for (const sessionDoc of attendanceSnapshot.docs) {
        if (sessionDoc.id === "current") {
          continue;
        }

        historicalSessionCount++;

        const session =
          sessionDoc.data();

        const missingSessionFields = [];

        if (!session.date) {
          missingSessionFields.push(
            "date"
          );
        }

        if (!session.semester) {
          missingSessionFields.push(
            "semester"
          );
        }

        if (!session.division) {
          missingSessionFields.push(
            "division"
          );
        }

        if (!session.subject) {
          missingSessionFields.push(
            "subject"
          );
        }

        if (missingSessionFields.length > 0) {
          addIssue(
            warnings,
            "warning",
            "Attendance",
            `Session ${sessionDoc.id} is missing session metadata.`,
            missingSessionFields.join(
              ", "
            )
          );
        }

        const studentsRef =
          collection(
            db,
            "attendanceSessions",
            sessionDoc.id,
            "students"
          );

        const attendanceStudentsSnapshot =
          await getDocs(
            studentsRef
          );

        const sessionStudentIds =
          new Set();

        for (const studentDoc of attendanceStudentsSnapshot.docs) {
          attendanceRecordCount++;

          const record =
            studentDoc.data();

          const recordUid =
            record.uid ||
            studentDoc.id;

          /*
           * NEW:
           * Aggregate attendance for each
           * actual student.
           */
          if (
            !attendanceByStudent.has(
              recordUid
            )
          ) {
            attendanceByStudent.set(
              recordUid,
              {
                present: 0,
                absent: 0,
                leave: 0,
                total: 0,
              }
            );
          }

          const studentAttendance =
            attendanceByStudent.get(
              recordUid
            );

          studentAttendance.total++;

          if (record.status === "Present") {
            studentAttendance.present++;
          } else if (
            record.status === "Absent"
          ) {
            studentAttendance.absent++;
          } else if (
            record.status === "Leave"
          ) {
            studentAttendance.leave++;
          }

          /*
           * Existing duplicate check.
           */
          if (
            sessionStudentIds.has(
              recordUid
            )
          ) {
            addIssue(
              issues,
              "error",
              "Attendance",
              `Duplicate attendance record in session ${sessionDoc.id}.`,
              recordUid
            );
          }

          sessionStudentIds.add(
            recordUid
          );

          /*
           * Existing status validation.
           */
          if (
            !validAttendanceStatuses.includes(
              record.status
            )
          ) {
            addIssue(
              issues,
              "error",
              "Attendance",
              `Invalid attendance status in session ${sessionDoc.id}.`,
              `${recordUid}: ${
                record.status || "missing"
              }`
            );
          }

          /*
           * Existing student existence check.
           */
          if (
            !studentsSnapshot.docs.find(
              (studentDoc) =>
                studentDoc.id ===
                recordUid
            )
          ) {
            addIssue(
              warnings,
              "warning",
              "Attendance",
              "Attendance record references an unknown student.",
              `${sessionDoc.id} → ${recordUid}`
            );
          }

          /*
           * Existing UID consistency check.
           */
          if (
            record.uid &&
            record.uid !==
              studentDoc.id
          ) {
            addIssue(
              warnings,
              "warning",
              "Attendance",
              "Attendance UID differs from attendance document ID.",
              `${sessionDoc.id} → doc:${studentDoc.id}, uid:${record.uid}`
            );
          }
        }
      }

      /*
       * Existing temporary-session check.
       */
      if (
        attendanceSnapshot.docs.some(
          (item) =>
            item.id === "current"
        )
      ) {
        passed.push(
          'Attendance: temporary "current" session is excluded from historical auditing.'
        );
      } else {
        passed.push(
          'Attendance: no temporary "current" session was found.'
        );
      }

      /*
       * Existing general attendance validation.
       */
      if (
        historicalSessionCount > 0 &&
        !issues.some(
          (item) =>
            item.area === "Attendance"
        )
      ) {
        passed.push(
          `Attendance: ${historicalSessionCount} historical sessions and ${attendanceRecordCount} attendance records passed status validation.`
        );
      }

      /* -----------------------------------------
         NEW:
         STUDENT ATTENDANCE CONSISTENCY
      ----------------------------------------- */

      for (const student of students) {
        const storedAttendance =
          numberValue(
            student.attendancePercentage
          );

        const actualAttendance =
          attendanceByStudent.get(
            student.id
          );

        /*
         * No stored attendance and no
         * attendance history:
         *
         * There is simply no attendance
         * information to compare.
         */
        if (
          (storedAttendance === null ||
            storedAttendance === 0) &&
          !actualAttendance
        ) {
          continue;
        }

        /*
         * Stored attendance exists but
         * historical attendance is absent.
         *
         * This is the important case for
         * Kunal's current data.
         */
        if (
          storedAttendance !== null &&
          storedAttendance > 0 &&
          !actualAttendance
        ) {
          addIssue(
            warnings,
            "warning",
            "Attendance",
            `Student ${
              student.name ||
              student.id
            } has stored attendance but no historical attendance records.`,
            `Stored attendance: ${storedAttendance}%`
          );

          continue;
        }

        /*
         * There is no useful historical
         * attendance to calculate.
         */
        if (
          !actualAttendance ||
          actualAttendance.total === 0
        ) {
          continue;
        }

        const calculatedAttendance =
          Number(
            (
              (actualAttendance.present /
                actualAttendance.total) *
              100
            ).toFixed(1)
          );

        /*
         * Allow a small 1 percentage-point
         * tolerance for rounding.
         */
        if (
          storedAttendance !== null &&
          Math.abs(
            storedAttendance -
              calculatedAttendance
          ) > 1
        ) {
          addIssue(
            warnings,
            "warning",
            "Attendance",
            `Attendance percentage mismatch for ${
              student.name ||
              student.id
            }.`,
            `Stored: ${storedAttendance}% | Calculated: ${calculatedAttendance}% | Records: ${actualAttendance.total}`
          );
        }
      }

      /* -----------------------------------------
         RESULTS
      ----------------------------------------- */

      const resultsSnapshot =
        await getDocs(
          collection(db, "results")
        );

      let resultCount = 0;

      let resultStudentCount =
        resultsSnapshot.size;

      for (
        const resultDoc of
          resultsSnapshot.docs
      ) {
        const semesterSnapshot =
          await getDocs(
            collection(
              db,
              "results",
              resultDoc.id,
              "semesters"
            )
          );

        for (
          const semesterDoc of
            semesterSnapshot.docs
        ) {
          resultCount++;

          const result =
            semesterDoc.data();

          const missingFields = [];

          if (
            !result.studentName?.trim()
          ) {
            missingFields.push(
              "studentName"
            );
          }

          if (
            !result.rollNo?.trim()
          ) {
            missingFields.push(
              "rollNo"
            );
          }

          if (
            !result.semester?.trim()
          ) {
            missingFields.push(
              "semester"
            );
          }

          if (
            result.sgpa ===
              undefined ||
            result.sgpa === null
          ) {
            missingFields.push(
              "sgpa"
            );
          }

          if (
            result.cgpa ===
              undefined ||
            result.cgpa === null
          ) {
            missingFields.push(
              "cgpa"
            );
          }

          if (
            result.percentage ===
              undefined ||
            result.percentage === null
          ) {
            missingFields.push(
              "percentage"
            );
          }

          if (
            !result.status?.trim()
          ) {
            missingFields.push(
              "status"
            );
          }

          if (
            missingFields.length > 0
          ) {
            addIssue(
              issues,
              "error",
              "Results",
              `Result ${resultDoc.id}/${semesterDoc.id} is missing required fields.`,
              missingFields.join(
                ", "
              )
            );
          }

          const failedSubjects =
            numberValue(
              result.failedSubjects
            );

          const actualStatus =
            failedSubjects ===
            null
              ? null
              : failedSubjects >=
                3
              ? "FAIL"
              : failedSubjects > 0
              ? "ATKT"
              : "PASS";

          if (
            actualStatus &&
            result.status !==
              actualStatus
          ) {
            addIssue(
              issues,
              "error",
              "Results",
              `Result status mismatch for ${resultDoc.id}/${semesterDoc.id}.`,
              `Stored: ${
                result.status ||
                "missing"
              } | Expected: ${actualStatus}`
            );
          }

          const sgpa =
            numberValue(
              result.sgpa
            );

          const cgpa =
            numberValue(
              result.cgpa
            );

          const percentage =
            numberValue(
              result.percentage
            );

          if (
            sgpa !== null &&
            (sgpa < 0 ||
              sgpa > 10)
          ) {
            addIssue(
              issues,
              "error",
              "Results",
              `Invalid SGPA in ${resultDoc.id}/${semesterDoc.id}.`,
              String(result.sgpa)
            );
          }

          if (
            cgpa !== null &&
            (cgpa < 0 ||
              cgpa > 10)
          ) {
            addIssue(
              issues,
              "error",
              "Results",
              `Invalid CGPA in ${resultDoc.id}/${semesterDoc.id}.`,
              String(result.cgpa)
            );
          }

          if (
            percentage !== null &&
            (percentage < 0 ||
              percentage > 100)
          ) {
            addIssue(
              issues,
              "error",
              "Results",
              `Invalid percentage in ${resultDoc.id}/${semesterDoc.id}.`,
              String(
                result.percentage
              )
            );
          }
        }
      }

      if (
        resultStudentCount > 0 &&
        resultCount > 0 &&
        !issues.some(
          (item) =>
            item.area === "Results"
        )
      ) {
        passed.push(
          `Results: ${resultCount} semester result records passed validation.`
        );
      }

      /* -----------------------------------------
         FEES
      ----------------------------------------- */

      const feesSnapshot =
        await getDocs(
          collection(db, "fees")
        );

      for (
        const feeDoc of
          feesSnapshot.docs
      ) {
        const fee =
          feeDoc.data();

        const total =
          numberValue(
            fee.totalFees
          );

        const paid =
          numberValue(
            fee.paidFees
          );

        const pending =
          numberValue(
            fee.pendingFees
          );

        if (
          total === null ||
          paid === null ||
          pending === null
        ) {
          addIssue(
            issues,
            "error",
            "Fees",
            `Fee record ${feeDoc.id} contains invalid numeric values.`,
            "totalFees / paidFees / pendingFees"
          );

          continue;
        }

        const expectedPending =
          Math.max(
            total - paid,
            0
          );

        if (
          Math.round(
            pending * 100
          ) !==
          Math.round(
            expectedPending * 100
          )
        ) {
          addIssue(
            issues,
            "error",
            "Fees",
            `Pending fee mismatch for record ${feeDoc.id}.`,
            `Stored: ${pending} | Expected: ${expectedPending}`
          );
        }

        const expectedStatus =
          expectedFeeStatus(
            total,
            paid
          );

        if (
          expectedStatus &&
          fee.status !==
            expectedStatus
        ) {
          addIssue(
            issues,
            "error",
            "Fees",
            `Fee status mismatch for record ${feeDoc.id}.`,
            `Stored: ${
              fee.status ||
              "missing"
            } | Expected: ${expectedStatus}`
          );
        }

        if (
          paid < 0 ||
          pending < 0 ||
          total < 0
        ) {
          addIssue(
            issues,
            "error",
            "Fees",
            `Negative fee value detected for record ${feeDoc.id}.`,
            `Total: ${total} | Paid: ${paid} | Pending: ${pending}`
          );
        }

        if (
          paid > total
        ) {
          addIssue(
            warnings,
            "warning",
            "Fees",
            `Paid amount exceeds total fees for record ${feeDoc.id}.`,
            `Total: ${total} | Paid: ${paid}`
          );
        }
      }

      if (
        feesSnapshot.size > 0 &&
        !issues.some(
          (item) =>
            item.area === "Fees"
        )
      ) {
        passed.push(
          `Fees: ${feesSnapshot.size} records passed amount and status consistency checks.`
        );
      }

      /* -----------------------------------------
         TIMETABLE
      ----------------------------------------- */

      let timetableDayCount = 0;
      let timetablePeriodCount = 0;

      for (
        const semester of semesters
      ) {
        for (
          const day of days
        ) {
          const daySnapshot =
            await getDocs(
              collection(
                db,
                "timetable",
                semester,
                "days"
              )
            );

          const dayDoc =
            daySnapshot.docs.find(
              (item) =>
                item.id === day
            );

          if (!dayDoc) {
            continue;
          }

          timetableDayCount++;

          const dayData =
            dayDoc.data();

          for (
            const period of periods
          ) {
            const lecture =
              dayData?.[period];

            if (!lecture) {
              continue;
            }

            timetablePeriodCount++;

            const type =
              lecture.type ||
              "Theory";

            if (
              type === "Break"
            ) {
              if (
                !lecture.time?.trim()
              ) {
                addIssue(
                  warnings,
                  "warning",
                  "Timetable",
                  `${semester}/${day}/${period} break has no time.`,
                  ""
                );
              }

              continue;
            }

            const missingFields = [];

            if (
              !lecture.subject?.trim()
            ) {
              missingFields.push(
                "subject"
              );
            }

            if (
              !lecture.time?.trim()
            ) {
              missingFields.push(
                "time"
              );
            }

            if (
              !lecture.faculty?.trim()
            ) {
              missingFields.push(
                "faculty"
              );
            }

            if (
              !lecture.room?.trim()
            ) {
              missingFields.push(
                "room"
              );
            }

            if (
              missingFields.length >
              0
            ) {
              addIssue(
                warnings,
                "warning",
                "Timetable",
                `${semester}/${day}/${period} is incomplete.`,
                missingFields.join(
                  ", "
                )
              );
            }
          }
        }
      }

      if (
        timetablePeriodCount > 0
      ) {
        passed.push(
          `Timetable: ${timetableDayCount} populated day documents and ${timetablePeriodCount} timetable periods inspected.`
        );
      } else {
        warnings.push({
          type: "warning",
          area: "Timetable",
          message:
            "No timetable periods were found during the audit.",
          detail:
            "This may simply mean timetable data has not been populated for the selected semesters.",
        });
      }

      /* -----------------------------------------
         FINAL SUMMARY
      ----------------------------------------- */

      const errorCount =
        issues.length;

      const warningCount =
        warnings.length;

      const passedCount =
        passed.length;

      let overallStatus =
        "PASSED";

      if (
        errorCount > 0
      ) {
        overallStatus =
          "ISSUES FOUND";
      } else if (
        warningCount > 0
      ) {
        overallStatus =
          "PASSED WITH WARNINGS";
      }

      setAudit({
        overallStatus,
        errorCount,
        warningCount,
        passedCount,
        issues,
        warnings,
        passed,
        records: {
          students:
            students.length,
          attendanceSessions:
            historicalSessionCount,
          attendanceRecords:
            attendanceRecordCount,
          resultStudents:
            resultStudentCount,
          resultRecords:
            resultCount,
          feeRecords:
            feesSnapshot.size,
        },
      });

      setLastRun(
        new Date()
      );
    } catch (error) {
      console.error(
        "Data integrity audit failed:",
        error
      );

      setAudit({
        overallStatus:
          "AUDIT FAILED",
        errorCount: 1,
        warningCount: 0,
        passedCount: 0,
        issues: [
          {
            type: "error",
            area: "Audit",
            message:
              "The audit could not be completed.",
            detail:
              error?.message ||
              "Unknown error",
          },
        ],
        warnings: [],
        passed: [],
        records: {},
      });

      setLastRun(
        new Date()
      );
    } finally {
      setLoading(false);
    }
  }

  function statusClasses(
    status
  ) {
    if (
      status === "PASSED"
    ) {
      return "bg-green-100 text-green-700 border-green-200";
    }

    if (
      status ===
      "PASSED WITH WARNINGS"
    ) {
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }

    return "bg-red-100 text-red-700 border-red-200";
  }

  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>

          <div className="flex items-center gap-3">

            <div className="bg-blue-100 p-3 rounded-xl">

              <ShieldCheck
                size={28}
                className="text-blue-600"
              />

            </div>

            <h1 className="text-3xl font-bold">
              Data Integrity Audit
            </h1>

          </div>

          <p className="text-gray-500 mt-3">
            Read-only validation of
            AUMNex data consistency.
          </p>

          {lastRun && (
            <p className="text-sm text-gray-400 mt-1">
              Last audit:{" "}
              {lastRun.toLocaleString()}
            </p>
          )}

        </div>

        <button
          onClick={runAudit}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2"
        >

          <RefreshCw
            size={18}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          {loading
            ? "Running Audit..."
            : "Run Integrity Audit"}

        </button>

      </div>

      {/* INTRO */}

      {!audit &&
        !loading && (
          <div className="bg-white rounded-2xl shadow-md p-8">

            <div className="flex items-start gap-4">

              <div className="bg-green-100 p-3 rounded-xl">

                <ShieldCheck
                  size={24}
                  className="text-green-600"
                />

              </div>

              <div>

                <h2 className="text-xl font-bold">
                  Read-only audit
                </h2>

                <p className="text-gray-500 mt-2">
                  This audit checks existing
                  students, attendance,
                  results, fees and timetable
                  records. It does not modify
                  Firestore data.
                </p>

              </div>

            </div>

          </div>
        )}

      {/* SUMMARY */}

      {audit && (
        <>

          <div
            className={`rounded-2xl border p-6 ${statusClasses(
              audit.overallStatus
            )}`}
          >

            <div className="flex items-center justify-between gap-4">

              <div>

                <p className="text-sm font-medium">
                  Overall Audit Status
                </p>

                <h2 className="text-2xl font-bold mt-1">
                  {audit.overallStatus}
                </h2>

              </div>

              {audit.overallStatus ===
              "PASSED" ? (
                <CheckCircle size={34} />
              ) : audit.overallStatus ===
                "PASSED WITH WARNINGS" ? (
                <AlertTriangle
                  size={34}
                />
              ) : (
                <XCircle
                  size={34}
                />
              )}

            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="bg-white rounded-2xl shadow-md p-6">

              <div className="flex items-center gap-3">

                <div className="bg-green-100 p-3 rounded-xl">

                  <CheckCircle
                    className="text-green-600"
                    size={22}
                  />

                </div>

                <div>

                  <p className="text-gray-500 text-sm">
                    Passed Checks
                  </p>

                  <p className="text-3xl font-bold">
                    {audit.passedCount}
                  </p>

                </div>

              </div>

            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">

              <div className="flex items-center gap-3">

                <div className="bg-yellow-100 p-3 rounded-xl">

                  <AlertTriangle
                    className="text-yellow-600"
                    size={22}
                  />

                </div>

                <div>

                  <p className="text-gray-500 text-sm">
                    Warnings
                  </p>

                  <p className="text-3xl font-bold">
                    {audit.warningCount}
                  </p>

                </div>

              </div>

            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">

              <div className="flex items-center gap-3">

                <div className="bg-red-100 p-3 rounded-xl">

                  <XCircle
                    className="text-red-600"
                    size={22}
                  />

                </div>

                <div>

                  <p className="text-gray-500 text-sm">
                    Errors
                  </p>

                  <p className="text-3xl font-bold">
                    {audit.errorCount}
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* RECORD COUNTS */}

          <div className="bg-white rounded-2xl shadow-md p-6">

            <h2 className="text-2xl font-bold mb-6">
              Audited Records
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">

              <div className="border rounded-xl p-4">

                <Users
                  size={20}
                  className="text-blue-600"
                />

                <p className="text-gray-500 text-sm mt-2">
                  Students
                </p>

                <p className="text-2xl font-bold">
                  {audit.records.students ??
                    0}
                </p>

              </div>

              <div className="border rounded-xl p-4">

                <CalendarCheck
                  size={20}
                  className="text-green-600"
                />

                <p className="text-gray-500 text-sm mt-2">
                  Attendance Sessions
                </p>

                <p className="text-2xl font-bold">
                  {audit.records
                    .attendanceSessions ??
                    0}
                </p>

              </div>

              <div className="border rounded-xl p-4">

                <CalendarCheck
                  size={20}
                  className="text-orange-600"
                />

                <p className="text-gray-500 text-sm mt-2">
                  Attendance Records
                </p>

                <p className="text-2xl font-bold">
                  {audit.records
                    .attendanceRecords ??
                    0}
                </p>

              </div>

              <div className="border rounded-xl p-4">

                <GraduationCap
                  size={20}
                  className="text-purple-600"
                />

                <p className="text-gray-500 text-sm mt-2">
                  Result Records
                </p>

                <p className="text-2xl font-bold">
                  {audit.records
                    .resultRecords ??
                    0}
                </p>

              </div>

              <div className="border rounded-xl p-4">

                <WalletCards
                  size={20}
                  className="text-red-600"
                />

                <p className="text-gray-500 text-sm mt-2">
                  Fee Records
                </p>

                <p className="text-2xl font-bold">
                  {audit.records
                    .feeRecords ??
                    0}
                </p>

              </div>

              <div className="border rounded-xl p-4">

                <CalendarDays
                  size={20}
                  className="text-blue-600"
                />

                <p className="text-gray-500 text-sm mt-2">
                  Result Students
                </p>

                <p className="text-2xl font-bold">
                  {audit.records
                    .resultStudents ??
                    0}
                </p>

              </div>

            </div>

          </div>

          {/* ERRORS */}

          {audit.issues.length >
            0 && (
            <div className="bg-white rounded-2xl shadow-md p-6">

              <div className="flex items-center gap-3 mb-6">

                <XCircle
                  className="text-red-600"
                  size={24}
                />

                <h2 className="text-2xl font-bold">
                  Errors
                </h2>

              </div>

              <div className="space-y-3">

                {audit.issues.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={`error-${index}`}
                      className="border border-red-200 bg-red-50 rounded-xl p-4"
                    >

                      <p className="font-semibold text-red-800">
                        {item.area}
                      </p>

                      <p className="text-red-700 mt-1">
                        {item.message}
                      </p>

                      {item.detail && (
                        <p className="text-sm text-red-600 mt-1">
                          {item.detail}
                        </p>
                      )}

                    </div>
                  )
                )}

              </div>

            </div>
          )}

          {/* WARNINGS */}

          {audit.warnings.length >
            0 && (
            <div className="bg-white rounded-2xl shadow-md p-6">

              <div className="flex items-center gap-3 mb-6">

                <AlertTriangle
                  className="text-yellow-600"
                  size={24}
                />

                <h2 className="text-2xl font-bold">
                  Warnings
                </h2>

              </div>

              <div className="space-y-3">

                {audit.warnings.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={`warning-${index}`}
                      className="border border-yellow-200 bg-yellow-50 rounded-xl p-4"
                    >

                      <p className="font-semibold text-yellow-800">
                        {item.area}
                      </p>

                      <p className="text-yellow-700 mt-1">
                        {item.message}
                      </p>

                      {item.detail && (
                        <p className="text-sm text-yellow-600 mt-1">
                          {item.detail}
                        </p>
                      )}

                    </div>
                  )
                )}

              </div>

            </div>
          )}

          {/* PASSED */}

          {audit.passed.length >
            0 && (
            <div className="bg-white rounded-2xl shadow-md p-6">

              <div className="flex items-center gap-3 mb-6">

                <CheckCircle
                  className="text-green-600"
                  size={24}
                />

                <h2 className="text-2xl font-bold">
                  Passed Checks
                </h2>

              </div>

              <div className="space-y-3">

                {audit.passed.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={`passed-${index}`}
                      className="border border-green-200 bg-green-50 rounded-xl p-4 flex items-start gap-3"
                    >

                      <CheckCircle
                        className="text-green-600 mt-0.5"
                        size={18}
                      />

                      <p className="text-green-800">
                        {item}
                      </p>

                    </div>
                  )
                )}

              </div>

            </div>
          )}

        </>
      )}

    </div>
  );
}