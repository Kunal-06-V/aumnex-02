"use client";

import { useEffect, useState } from "react";
import {
  Brain,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function AdminAIPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzingUid, setAnalyzingUid] = useState(null);
  const [insight, setInsight] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadIntelligenceData();
  }, []);

  async function loadIntelligenceData() {
    try {
      setLoading(true);
      setError("");

      const [studentsSnapshot, sessionsSnapshot] =
        await Promise.all([
          getDocs(collection(db, "students")),
          getDocs(collection(db, "attendanceSessions")),
        ]);

      const rawStudents = studentsSnapshot.docs.map(
        (studentDoc) => ({
          uid: studentDoc.id,
          ...studentDoc.data(),
        })
      );

      /*
       * Build attendance statistics from the actual
       * attendanceSessions/{sessionId}/students/{uid}
       * records.
       */
      const attendanceMap = {};

      for (const sessionDoc of sessionsSnapshot.docs) {
        /*
         * Skip the temporary NFC "current" document.
         * Historical sessions are the ones we use for
         * academic attendance calculations.
         */
        if (sessionDoc.id === "current") {
          continue;
        }

      const sessionData = sessionDoc.data();

try {
  const sessionStudentsSnapshot =
    await getDocs(
      collection(
        db,
        "attendanceSessions",
        sessionDoc.id,
        "students"
      )
    );

          for (const studentRecord of sessionStudentsSnapshot.docs) {
            const studentData =
              studentRecord.data();

            const uid =
              studentData.uid || studentRecord.id;
            const matchingStudent = rawStudents.find(
  (student) => student.uid === uid
);

if (!matchingStudent) {
  continue;
}

if (
  sessionData.semester !== matchingStudent.semester ||
  sessionData.division !== matchingStudent.division
) {
  continue;
}
            if (!attendanceMap[uid]) {
              attendanceMap[uid] = {
                present: 0,
                absent: 0,
                leave: 0,
                total: 0,
                subjects: {},
                recent: [],
              };
            }

            const record =
              attendanceMap[uid];

            const status =
              studentData.status;

            record.total++;

            if (status === "Present") {
              record.present++;
            } else if (status === "Absent") {
              record.absent++;
            } else if (status === "Leave") {
              record.leave++;
            }

            const subject =
              sessionData.subject?.trim() ||
              "Unknown";

            if (!record.subjects[subject]) {
              record.subjects[subject] = {
                present: 0,
                total: 0,
              };
            }

            record.subjects[subject].total++;

            if (status === "Present") {
              record.subjects[subject].present++;
            }

            record.recent.push({
              date:
                sessionData.date ||
                "Unknown",
              status:
                status || "Unknown",
              subject,
            });
          }
        } catch (sessionStudentError) {
          console.error(
            "Failed to read session students:",
            sessionDoc.id,
            sessionStudentError
          );
        }
      }

      const enrichedStudents =
        rawStudents.map((student) => {
          const attendance =
            attendanceMap[student.uid];

          const present =
            attendance?.present || 0;

          const absent =
            attendance?.absent || 0;

          const leave =
            attendance?.leave || 0;

          const total =
            attendance?.total || 0;

          const attendancePercentage =
            total === 0
              ? null
              : Math.round(
                  (present / total) * 100
                );

          const academicScore =
            getAcademicScore(student);

          const riskLevel =
            calculateRisk(
              attendancePercentage,
              academicScore
            );

          const weakestSubject =
            getWeakestSubject(
              attendance?.subjects
            );

          const recentAttendance =
            getRecentAttendance(
              attendance?.recent
            );

          return {
            ...student,

            calculatedAttendance:
              attendancePercentage,

            present,

            absent,

            leave,

            totalAttendanceSessions:
              total,

            academicScore,

            riskLevel,

            weakestSubject:
              weakestSubject?.subject ||
              null,

            weakestSubjectAttendance:
              weakestSubject?.percentage ??
              null,

            recentAttendance,
          };
        });

      setStudents(enrichedStudents);
    } catch (loadError) {
      console.error(
        "Failed to load intelligence data:",
        loadError
      );

      setError(
        "Unable to load AUMNex intelligence data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function analyzeStudent(student) {
    try {
      setAnalyzingUid(student.uid);
      setInsight(null);
      setError("");

      if (
        student.calculatedAttendance ===
        null
      ) {
        throw new Error(
          "This student does not have enough attendance data for analysis."
        );
      }

      const response = await fetch(
        "/api/ai",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            studentName:
              student.name ||
              "Student",

            attendancePercentage:
              student.calculatedAttendance,

            academicScore:
              student.academicScore,

            recentAttendance:
              student.recentAttendance ||
              "Not available",

            weakestSubject:
              student.weakestSubject ||
              "Not available",

            weakestSubjectAttendance:
              student.weakestSubjectAttendance,
          }),
        }
      );

     const result =
  await response.json();

console.log("AUMNex AI RESULT:", result);

if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "AI analysis failed."
        );
      }

      setInsight({
        student,
        ...result.data,
      });
    } catch (analysisError) {
      console.error(
        "AI analysis error:",
        analysisError
      );

      setError(
        analysisError.message ||
          "AI analysis failed."
      );
    } finally {
      setAnalyzingUid(null);
    }
  }

  const highRisk =
    students.filter(
      (student) =>
        student.riskLevel === "HIGH"
    );

  const mediumRisk =
    students.filter(
      (student) =>
        student.riskLevel === "MEDIUM"
    );

  const lowRisk =
    students.filter(
      (student) =>
        student.riskLevel === "LOW"
    );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2
            className="animate-spin"
            size={22}
          />
          Loading AUMNex Intelligence...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-linear-to-r from-slate-900 to-blue-900 text-white rounded-3xl p-8 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="bg-white/10 p-3 rounded-2xl">
            <Brain size={34} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">
                AUMNex Intelligence
              </h1>

              <Sparkles size={22} />
            </div>

            <p className="text-blue-100 mt-2">
              Academic risk analysis using
              verified AUMNex data.
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
          {error}
        </div>
      )}

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={students.length}
          icon={Users}
          iconClass="text-blue-600"
          bgClass="bg-blue-100"
        />

        <StatCard
          title="High Risk"
          value={highRisk.length}
          icon={AlertTriangle}
          iconClass="text-red-600"
          bgClass="bg-red-100"
        />

        <StatCard
          title="Medium Risk"
          value={mediumRisk.length}
          icon={TrendingUp}
          iconClass="text-yellow-600"
          bgClass="bg-yellow-100"
        />

        <StatCard
          title="Low Risk"
          value={lowRisk.length}
          icon={CheckCircle}
          iconClass="text-green-600"
          bgClass="bg-green-100"
        />
      </div>

      {/* Explanation */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-slate-800">
          AUMNex Intelligence Method
        </h2>

        <p className="text-gray-500 mt-2">
          AUMNex calculates attendance from the
          actual attendance session records.
          Gemini is then used to explain verified
          metrics and generate practical
          recommendations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <InfoCard
            title="Verified Attendance"
            text="Attendance is calculated from saved session records."
          />

          <InfoCard
            title="Academic Performance"
            text="Academic data is used only when it exists."
          />

          <InfoCard
            title="AI Explanation"
            text="Gemini explains the verified student situation."
          />
        </div>
      </div>

      {/* Student Intelligence */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            Student Intelligence
          </h2>

          <p className="text-gray-500 mt-1">
            Analyze individual students using
            verified attendance and academic data.
          </p>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No students found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="py-4 px-3">
                    Student
                  </th>

                  <th className="py-4 px-3">
                    Roll No
                  </th>

                  <th className="py-4 px-3">
                    Attendance
                  </th>

                  <th className="py-4 px-3">
                    Academic
                  </th>

                  <th className="py-4 px-3">
                    Risk
                  </th>

                  <th className="py-4 px-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {students.map(
                  (student) => (
                    <tr
                      key={student.uid}
                      className="border-b last:border-b-0"
                    >
                      <td className="py-4 px-3">
                        <div className="font-medium text-slate-800">
                          {student.name ||
                            "Unnamed Student"}
                        </div>

                        <div className="text-sm text-gray-500">
                          {student.email ||
                            "No email"}
                        </div>
                      </td>

                      <td className="py-4 px-3">
                        {student.rollNo ||
                          "—"}
                      </td>

                      <td className="py-4 px-3">
                        {student.calculatedAttendance ===
                        null
                          ? "N/A"
                          : `${student.calculatedAttendance}%`}
                      </td>

                      <td className="py-4 px-3">
                        {student.academicScore ===
                        null
                          ? "N/A"
                          : `${student.academicScore}%`}
                      </td>

                      <td className="py-4 px-3">
                        <RiskBadge
                          risk={
                            student.riskLevel
                          }
                        />
                      </td>

                      <td className="py-4 px-3 text-right">
                        <button
                          onClick={() =>
                            analyzeStudent(
                              student
                            )
                          }
                          disabled={
                            analyzingUid !==
                              null ||
                            student.calculatedAttendance ===
                              null
                          }
                          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-medium"
                        >
                          {analyzingUid ===
                          student.uid ? (
                            <>
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Brain
                                size={16}
                              />
                              Analyze
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Result */}
      {insight && (
        <div className="bg-white rounded-3xl shadow-lg border border-blue-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">
                AI Analysis
              </p>

              <h2 className="text-2xl font-bold text-slate-800 mt-1">
                {insight.student?.name ||
                  "Selected Student"}
              </h2>
            </div>

            <RiskBadge
              risk={insight.riskLevel}
            />
          </div>

          <div className="mt-6 bg-blue-50 rounded-2xl p-5">
            <h3 className="font-semibold text-slate-800">
              Summary
            </h3>

            <p className="text-gray-700 mt-2 leading-relaxed">
              {insight.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">
                Key Concerns
              </h3>

              <div className="space-y-2">
                {(insight.concerns ||
                  []).map(
                  (item, index) => (
                    <div
                      key={index}
                      className="flex gap-3 bg-red-50 rounded-xl p-3"
                    >
                      <AlertTriangle
                        size={18}
                        className="text-red-600 mt-0.5 shrink-0"
                      />

                      <span className="text-sm text-gray-700">
                        {item}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 mb-3">
                Recommendations
              </h3>

              <div className="space-y-2">
                {(
                  insight.recommendations ||
                  []
                ).map(
                  (item, index) => (
                    <div
                      key={index}
                      className="flex gap-3 bg-green-50 rounded-xl p-3"
                    >
                      <CheckCircle
                        size={18}
                        className="text-green-600 mt-0.5 shrink-0"
                      />

                      <span className="text-sm text-gray-700">
                        {item}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- */
/* Helpers */
/* ----------------------------- */

function getAcademicScore(student) {
  const cgpa = Number(
    student.overallCGPA
  );

  if (
    !Number.isFinite(cgpa) ||
    cgpa <= 0
  ) {
    return null;
  }

  return Math.round(
    Math.min(
      Math.max((cgpa / 10) * 100, 0),
      100
    )
  );
}

function calculateRisk(
  attendancePercentage,
  academicScore
) {
  /*
   * Missing data does not count as zero.
   */

  if (
    attendancePercentage === null &&
    academicScore === null
  ) {
    return "LOW";
  }

  if (
    attendancePercentage !== null &&
    attendancePercentage < 60
  ) {
    return "HIGH";
  }

  if (
    academicScore !== null &&
    academicScore < 50
  ) {
    return "HIGH";
  }

  if (
    attendancePercentage !== null &&
    attendancePercentage < 75
  ) {
    return "MEDIUM";
  }

  if (
    academicScore !== null &&
    academicScore < 65
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

function getWeakestSubject(
  subjects
) {
  if (!subjects) {
    return null;
  }

  const entries =
    Object.entries(subjects);

  if (entries.length === 0) {
    return null;
  }

  const calculated =
    entries.map(
      ([subject, data]) => {
        const percentage =
          data.total === 0
            ? 0
            : Math.round(
                (data.present /
                  data.total) *
                  100
              );

        return {
          subject,
          percentage,
        };
      }
    );

  return calculated.sort(
    (a, b) =>
      a.percentage -
      b.percentage
  )[0];
}

function getRecentAttendance(
  records
) {
  if (
    !records ||
    records.length === 0
  ) {
    return "Not available";
  }

  const recent =
    records.slice(-8);

  const present =
    recent.filter(
      (record) =>
        record.status === "Present"
    ).length;

  return `${present} of last ${recent.length} sessions`;
}

/* ----------------------------- */
/* UI Components */
/* ----------------------------- */

function StatCard({
  title,
  value,
  icon: Icon,
  iconClass,
  bgClass,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <h2 className="text-3xl font-bold text-slate-800 mt-2">
            {value}
          </h2>
        </div>

        <div
          className={`${bgClass} p-3 rounded-xl`}
        >
          <Icon
            size={26}
            className={iconClass}
          />
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  text,
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <h3 className="font-semibold text-slate-800">
        {title}
      </h3>

      <p className="text-sm text-gray-500 mt-2">
        {text}
      </p>
    </div>
  );
}

function RiskBadge({ risk }) {
  const styles = {
    HIGH: "bg-red-100 text-red-700",
    MEDIUM:
      "bg-yellow-100 text-yellow-700",
    LOW: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
        styles[risk] ||
        "bg-gray-100 text-gray-700"
      }`}
    >
      {risk}
    </span>
  );
}