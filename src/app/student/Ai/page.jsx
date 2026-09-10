"use client";

import { useEffect, useState } from "react";

import {
  Brain,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Loader2,
  Sparkles,
  BookOpen,
  Target,
} from "lucide-react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useStudent } from "@/context/StudentContext";

export default function StudentAIPage() {
  const { student } = useStudent();

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const [profile, setProfile] = useState(null);
  const [insight, setInsight] = useState(null);

  const [error, setError] = useState("");

  useEffect(() => {
    if (student?.uid) {
      loadStudentIntelligence();
    }
  }, [student]);

  async function loadStudentIntelligence() {
    try {
      setLoading(true);
      setError("");

      const sessionsSnapshot = await getDocs(
        collection(db, "attendanceSessions")
      );

      const attendance = {
        present: 0,
        absent: 0,
        leave: 0,
        total: 0,
        subjects: {},
        records: [],
      };

      for (const sessionDoc of sessionsSnapshot.docs) {
        if (sessionDoc.id === "current") {
          continue;
        }

        const sessionData = sessionDoc.data();

        /*
         * Only consider sessions belonging to the
         * student's current semester and division.
         */
        if (
          sessionData.semester !== student.semester ||
          sessionData.division !== student.division
        ) {
          continue;
        }

        const studentRef = collection(
          db,
          "attendanceSessions",
          sessionDoc.id,
          "students"
        );

        const studentAttendanceSnapshot =
          await getDocs(studentRef);

        const studentRecord =
          studentAttendanceSnapshot.docs.find(
            (recordDoc) => {
              const record = recordDoc.data();

              return (
                record.uid === student.uid ||
                recordDoc.id === student.uid
              );
            }
          );

        if (!studentRecord) {
          continue;
        }

        const record = studentRecord.data();

        const status = record.status;

        attendance.total++;

        if (status === "Present") {
          attendance.present++;
        } else if (status === "Absent") {
          attendance.absent++;
        } else if (status === "Leave") {
          attendance.leave++;
        }

        const subject =
          sessionData.subject?.trim() ||
          "Unknown";

        if (!attendance.subjects[subject]) {
          attendance.subjects[subject] = {
            present: 0,
            total: 0,
          };
        }

        attendance.subjects[subject].total++;

        if (status === "Present") {
          attendance.subjects[subject].present++;
        }

        attendance.records.push({
          date:
            sessionData.date ||
            "Unknown",
          status:
            status ||
            "Unknown",
          subject,
        });
      }

      const attendancePercentage =
        attendance.total === 0
          ? null
          : Math.round(
              (attendance.present /
                attendance.total) *
                100
            );

      const subjectList = Object.entries(
        attendance.subjects
      )
        .map(([subject, data]) => {
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
            present: data.present,
            total: data.total,
            percentage,
          };
        })
        .sort(
          (a, b) =>
            a.percentage -
            b.percentage
        );

      const weakestSubject =
        subjectList.length > 0
          ? subjectList[0]
          : null;

      let riskLevel = "LOW";

      if (
        attendancePercentage !== null
      ) {
        if (attendancePercentage < 60) {
          riskLevel = "HIGH";
        } else if (
          attendancePercentage < 75
        ) {
          riskLevel = "MEDIUM";
        }
      }

      const recentRecords =
        attendance.records.slice(-8);

      const recentPresent =
        recentRecords.filter(
          (item) =>
            item.status === "Present"
        ).length;

      const recentAttendance =
        recentRecords.length === 0
          ? "Not available"
          : `${recentPresent} of last ${recentRecords.length} sessions`;

      const academicScore =
        getAcademicScore(student);

      setProfile({
        attendancePercentage,
        present: attendance.present,
        absent: attendance.absent,
        leave: attendance.leave,
        total: attendance.total,
        subjects: subjectList,
        weakestSubject,
        recentAttendance,
        academicScore,
        riskLevel,
      });
    } catch (error) {
      console.error(
        "Student intelligence error:",
        error
      );

      setError(
        "Unable to load your intelligence data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function analyzeMyPerformance() {
    try {
      setAnalyzing(true);
      setError("");

      if (
        !profile ||
        profile.attendancePercentage === null
      ) {
        throw new Error(
          "There is not enough attendance data to generate an analysis yet."
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
              student?.name ||
              "Student",

            attendancePercentage:
              profile.attendancePercentage,

            academicScore:
              profile.academicScore,

            recentAttendance:
              profile.recentAttendance,

            weakestSubject:
              profile.weakestSubject
                ?.subject ||
              "Not available",

            weakestSubjectAttendance:
              profile.weakestSubject
                ?.percentage ??
              null,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "AI analysis failed."
        );
      }

      setInsight(result.data);
    } catch (error) {
      console.error(
        "Student AI analysis error:",
        error
      );

      setError(
        error.message ||
          "AI analysis failed."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2
            className="animate-spin"
            size={22}
          />

          Loading your AUMNex Intelligence...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-3xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Intelligence Unavailable
        </h1>

        <p className="text-gray-500 mt-2">
          {error ||
            "There is not enough academic data available yet."}
        </p>
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
                My AUMNex Intelligence
              </h1>

              <Sparkles size={22} />
            </div>

            <p className="text-blue-100 mt-2">
              Personalized academic insights based on
              your verified AUMNex data.
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

      {/* Health Summary */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">
              Academic Health
            </p>

            <h2 className="text-2xl font-bold text-slate-800 mt-1">
              {student?.name ||
                "Student"}
            </h2>

            <p className="text-gray-500 mt-1">
              {student?.semester ||
                "Semester"}{" "}
              • Division{" "}
              {student?.division ||
                "—"}
            </p>
          </div>

          <RiskBadge
            risk={profile.riskLevel}
          />
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Attendance"
          value={
            profile.attendancePercentage ===
            null
              ? "N/A"
              : `${profile.attendancePercentage}%`
          }
          icon={Target}
          iconClass="text-blue-600"
          bgClass="bg-blue-100"
        />

        <StatCard
          title="Present"
          value={profile.present}
          icon={CheckCircle}
          iconClass="text-green-600"
          bgClass="bg-green-100"
        />

        <StatCard
          title="Absent"
          value={profile.absent}
          icon={AlertTriangle}
          iconClass="text-red-600"
          bgClass="bg-red-100"
        />

        <StatCard
          title="Academic Score"
          value={
            profile.academicScore ===
            null
              ? "N/A"
              : `${profile.academicScore}%`
          }
          icon={TrendingUp}
          iconClass="text-purple-600"
          bgClass="bg-purple-100"
        />
      </div>

      {/* Attendance Goal */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Attendance Goal
            </h2>

            <p className="text-gray-500 mt-1">
              Minimum target: 75%
            </p>
          </div>

          <span className="font-bold text-blue-600">
            {profile.attendancePercentage ===
            null
              ? "N/A"
              : `${profile.attendancePercentage}%`}
          </span>
        </div>

        <div className="mt-5 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-green-500 to-blue-600 rounded-full"
            style={{
              width: `${Math.min(
                profile.attendancePercentage ||
                  0,
                100
              )}%`,
            }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>0%</span>
          <span>75% target</span>
          <span>100%</span>
        </div>

        {profile.attendancePercentage !==
          null &&
          profile.attendancePercentage <
            75 && (
            <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="font-semibold text-yellow-800">
                Attendance needs attention
              </p>

              <p className="text-sm text-yellow-700 mt-1">
                Your attendance is currently below
                the 75% target.
              </p>
            </div>
          )}
      </div>

      {/* Subject Performance */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center gap-3">
          <BookOpen
            size={22}
            className="text-blue-600"
          />

          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Subject Performance
            </h2>

            <p className="text-gray-500 mt-1">
              Attendance by subject
            </p>
          </div>
        </div>

        {profile.subjects.length ===
        0 ? (
          <div className="text-center py-10 text-gray-500">
            No subject attendance data available.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {profile.subjects.map(
              (subject) => (
                <div
                  key={subject.subject}
                  className="border border-gray-100 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {subject.subject}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        {subject.present} /{" "}
                        {subject.total} attended
                      </p>
                    </div>

                    <span
                      className={`font-bold ${
                        subject.percentage <
                        75
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {subject.percentage}%
                    </span>
                  </div>

                  <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{
                        width: `${subject.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* AI Analysis */}
      <div className="bg-white rounded-3xl shadow-lg border border-blue-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles
                size={20}
                className="text-blue-600"
              />

              <h2 className="text-xl font-bold text-slate-800">
                AUMNex AI Insight
              </h2>
            </div>

            <p className="text-gray-500 mt-1">
              Get a personalized explanation of
              your current academic situation.
            </p>
          </div>

          <button
            onClick={analyzeMyPerformance}
            disabled={
              analyzing ||
              profile.attendancePercentage ===
                null
            }
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-medium"
          >
            {analyzing ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Analyzing...
              </>
            ) : (
              <>
                <Brain size={18} />

                Analyze My Performance
              </>
            )}
          </button>
        </div>

        {!insight && (
          <div className="mt-6 bg-gray-50 rounded-2xl p-6 text-center">
            <Brain
              size={38}
              className="mx-auto text-gray-400"
            />

            <p className="font-medium text-slate-700 mt-3">
              Your AI insight will appear here.
            </p>

            <p className="text-sm text-gray-500 mt-1">
              AUMNex will analyze your verified
              attendance and academic context.
            </p>
          </div>
        )}

        {insight && (
          <div className="mt-6 space-y-6">
            <div className="bg-blue-50 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold text-slate-800">
                  AI Summary
                </h3>

                <RiskBadge
                  risk={insight.riskLevel}
                />
              </div>

              <p className="text-gray-700 mt-3 leading-relaxed">
                {insight.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-slate-800 mb-3">
                  Key Concerns
                </h3>

                <div className="space-y-2">
                  {(insight.concerns ||
                    []
                  ).map(
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
    </div>
  );
}

/* -------------------------------- */
/* Helpers */
/* -------------------------------- */

function getAcademicScore(
  student
) {
  const cgpa = Number(
    student?.overallCGPA
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

function RiskBadge({
  risk,
}) {
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