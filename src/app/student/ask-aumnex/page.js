"use client";

import { useEffect, useState } from "react";

import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import {
  Brain,
  Send,
  Sparkles,
  User,
  BookOpen,
  CalendarDays,
  Loader2,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";

export default function AskAumnexPage() {
  const [user, setUser] = useState(null);

  const [studentData, setStudentData] = useState(null);
  const [attendanceData, setAttendanceData] =
    useState(null);
  const [academicData, setAcademicData] =
    useState(null);
  const [timetableData, setTimetableData] =
    useState(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);

  const [loadingData, setLoadingData] =
    useState(true);

  const [asking, setAsking] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);

        if (currentUser) {
          loadAumnexData(currentUser.uid);
        } else {
          setLoadingData(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  async function loadAumnexData(uid) {
    try {
      setLoadingData(true);
      setError("");

      // --------------------------------
      // STUDENT
      // --------------------------------

      const studentRef = doc(
        db,
        "students",
        uid
      );

      const studentSnap =
        await getDoc(studentRef);

      if (!studentSnap.exists()) {
        throw new Error(
          "Student record not found."
        );
      }

      const student = {
        uid,
        ...studentSnap.data(),
      };

      setStudentData(student);

      // --------------------------------
      // ACADEMIC RESULT
      // --------------------------------

      let academicResult = null;

      const semesterId =
        (student.semester || "")
          .replace(/\s+/g, "");

      if (semesterId) {
        const academicRef = doc(
          db,
          "results",
          uid,
          "semesters",
          semesterId
        );

        const academicSnap =
          await getDoc(academicRef);

        if (academicSnap.exists()) {
          academicResult =
            academicSnap.data();
        }
      }

      // --------------------------------
      // SUBJECT RESULTS
      // --------------------------------

      let subjects = [];

      // Primary path:
      // results/{uid}/semesters/{semester}/subjects
      if (semesterId) {
        const semesterSubjectsSnapshot =
          await getDocs(
            collection(
              db,
              "results",
              uid,
              "semesters",
              semesterId,
              "subjects"
            )
          );

        subjects =
          semesterSubjectsSnapshot.docs.map(
            (subjectDoc) => ({
              id: subjectDoc.id,
              ...subjectDoc.data(),
            })
          );
      }

      // Fallback path:
      // results/{uid}/subjects
      if (subjects.length === 0) {
        const rootSubjectsSnapshot =
          await getDocs(
            collection(
              db,
              "results",
              uid,
              "subjects"
            )
          );

        subjects =
          rootSubjectsSnapshot.docs.map(
            (subjectDoc) => ({
              id: subjectDoc.id,
              ...subjectDoc.data(),
            })
          );
      }

      if (academicResult) {
        academicResult = {
          ...academicResult,
          subjects,
        };
      } else if (subjects.length > 0) {
        academicResult = {
          subjects,
        };
      }

      setAcademicData(academicResult);

      console.log(
        "Ask AUMNex subjects loaded:",
        subjects
      );

      // --------------------------------
      // ATTENDANCE
      // --------------------------------

      const attendance = {
        present: 0,
        absent: 0,
        leave: 0,
        total: 0,
        subjects: {},
      };

      const sessionsSnapshot =
        await getDocs(
          collection(
            db,
            "attendanceSessions"
          )
        );

      for (const sessionDoc of sessionsSnapshot.docs) {
        if (sessionDoc.id === "current") {
          continue;
        }

        const sessionData =
          sessionDoc.data();

        const semesterMatches =
          !sessionData.semester ||
          sessionData.semester ===
            student.semester;

        const divisionMatches =
          !sessionData.division ||
          sessionData.division ===
            student.division;

        if (
          !semesterMatches ||
          !divisionMatches
        ) {
          continue;
        }

        const studentAttendanceRef =
          collection(
            db,
            "attendanceSessions",
            sessionDoc.id,
            "students"
          );

        const studentAttendanceSnapshot =
          await getDocs(
            studentAttendanceRef
          );

        const studentRecord =
          studentAttendanceSnapshot.docs.find(
            (recordDoc) => {
              const record =
                recordDoc.data();

              return (
                record.uid === uid ||
                recordDoc.id === uid ||
                record.rollNo ===
                  student.rollNo
              );
            }
          );

        if (!studentRecord) {
          continue;
        }

        const record =
          studentRecord.data();

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

        attendance.subjects[
          subject
        ].total++;

        if (status === "Present") {
          attendance.subjects[
            subject
          ].present++;
        }
      }

      const attendancePercentage =
        attendance.total === 0
          ? null
          : Number(
              (
                (attendance.present /
                  attendance.total) *
                100
              ).toFixed(1)
            );

      const subjectAttendance =
        Object.entries(
          attendance.subjects
        ).map(([subject, data]) => ({
          subject,
          present: data.present,
          total: data.total,
          percentage:
            data.total === 0
              ? null
              : Number(
                  (
                    (data.present /
                      data.total) *
                    100
                  ).toFixed(1)
                ),
        }));

      setAttendanceData({
        present: attendance.present,
        absent: attendance.absent,
        leave: attendance.leave,
        total: attendance.total,
        percentage:
          attendancePercentage,
        subjects: subjectAttendance,
      });

      // --------------------------------
      // TIMETABLE
      // --------------------------------

      let timetable = null;

      if (student.semester) {
        const timetableSemester =
          student.semester
            .toLowerCase()
            .replace(/\s+/g, "");

        const daysSnapshot =
          await getDocs(
            collection(
              db,
              "timetable",
              timetableSemester,
              "days"
            )
          );

        const days = {};

        daysSnapshot.docs.forEach(
          (dayDoc) => {
            days[dayDoc.id] =
              dayDoc.data();
          }
        );

        timetable = {
          semester: student.semester,
          days,
        };
      }

      setTimetableData(timetable);
    } catch (error) {
      console.error(
        "Ask AUMNex data error:",
        error
      );

      setError(
        "Unable to load your AUMNex data."
      );
    } finally {
      setLoadingData(false);
    }
  }

  async function askAumnex() {
    const trimmedQuestion =
      question.trim();

    if (!trimmedQuestion) {
      setError(
        "Please enter a question."
      );
      return;
    }

    if (!studentData) {
      setError(
        "Student data is not available yet."
      );
      return;
    }

    try {
      setAsking(true);
      setError("");
      setAnswer(null);

      const response =
        await fetch("/api/ai/ask", {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            question: trimmedQuestion,

            student: {
              uid: studentData.uid,
              name:
                studentData.name || "",
              rollNo:
                studentData.rollNo || "",
              semester:
                studentData.semester || "",
              division:
                studentData.division || "",
              department:
                studentData.department || "",
            },

            attendance: attendanceData,

            academic: academicData,

            timetable: timetableData,
          }),
        });

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Ask AUMNex failed."
        );
      }

      setAnswer(result.data);
    } catch (error) {
      console.error(
        "Ask AUMNex error:",
        error
      );

      setError(
        error.message ||
          "Unable to answer your question."
      );
    } finally {
      setAsking(false);
    }
  }

  function handleQuestionKeyDown(e) {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();
      askAumnex();
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2
            size={22}
            className="animate-spin"
          />
          Loading Ask AUMNex...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-3xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-red-600">
          Student not authenticated
        </h1>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-linear-to-r from-slate-900 to-blue-900 text-white rounded-3xl p-8 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="bg-white/10 p-3 rounded-2xl">
            <Brain size={34} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">
                Ask AUMNex
              </h1>

              <Sparkles size={22} />
            </div>

            <p className="text-blue-100 mt-2">
              Ask questions about your verified
              academic, attendance and timetable
              data.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-md p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Try asking
        </h2>

        <div className="flex flex-wrap gap-3">
          {[
            "What is my CGPA?",
            "What is my attendance?",
            "Which subject is weakest?",
            "How is my academic performance?",
            "What classes do I have on Monday?",
          ].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() =>
                setQuestion(item)
              }
              className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-md p-6">
        <label
          htmlFor="ask-aumnex-question"
          className="block font-semibold text-slate-800 mb-3"
        >
          Your Question
        </label>

        <textarea
          id="ask-aumnex-question"
          name="question"
          rows={4}
          value={question}
          onChange={(e) =>
            setQuestion(e.target.value)
          }
          onKeyDown={
            handleQuestionKeyDown
          }
          placeholder="Ask something about your AUMNex data..."
          className="w-full border rounded-2xl p-4 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={askAumnex}
            disabled={
              asking ||
              !question.trim()
            }
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl flex items-center gap-2"
          >
            {asking ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Thinking...
              </>
            ) : (
              <>
                <Send size={18} />
                Ask AUMNex
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
          {error}
        </div>
      )}

      {answer && (
        <div className="bg-white rounded-3xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Brain
                size={22}
                className="text-blue-600"
              />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                AUMNex Answer
              </h2>

              <p className="text-gray-500 text-sm">
                Based on your verified AUMNex data
              </p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-5">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {answer.answer}
            </p>
          </div>

          {answer.dataUsed?.length > 0 && (
            <div className="mt-5">
              <p className="font-semibold text-slate-800 mb-2">
                Data used
              </p>

              <div className="flex flex-wrap gap-2">
                {answer.dataUsed.map(
                  (item, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm"
                    >
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl shadow-md p-5">
          <div className="flex items-center gap-3">
            <User className="text-blue-600" />

            <div>
              <p className="text-gray-500 text-sm">
                Student
              </p>

              <p className="font-semibold">
                {studentData?.name ||
                  "Unavailable"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5">
          <div className="flex items-center gap-3">
            <BookOpen className="text-green-600" />

            <div>
              <p className="text-gray-500 text-sm">
                Academic Data
              </p>

              <p className="font-semibold">
                {academicData
                  ? academicData.subjects?.length
                    ? `${academicData.subjects.length} Subjects Available`
                    : "Available"
                  : "Unavailable"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-purple-600" />

            <div>
              <p className="text-gray-500 text-sm">
                Timetable Data
              </p>

              <p className="font-semibold">
                {timetableData
                  ? "Available"
                  : "Unavailable"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}