"use client";

import { useState } from "react";

import {
  CalendarDays,
  Building2,
  GraduationCap,
  BookOpen,
  Users,
  Loader2,
} from "lucide-react";

import {
  collection,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import toast from "react-hot-toast";

export default function AttendanceSession({
  onLoadStudents,
}) {
  function getLocalDate() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
      now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const [session, setSession] =
    useState({
      date: getLocalDate(),
      department:
        "Computer Engineering",
      semester: "Semester 4",
      division: "A",
      subject: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [loadedStudents, setLoadedStudents] =
    useState([]);

  function handleChange(e) {
    setSession((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.value,
    }));
  }

  async function handleLoadStudents() {
    /* ---------------------------------------
       REQUIRED FIELD VALIDATION
    --------------------------------------- */

    if (!session.date?.trim()) {
      toast.error(
        "Date is required."
      );
      return;
    }

    if (
      !session.department?.trim()
    ) {
      toast.error(
        "Department is required."
      );
      return;
    }

    if (
      !session.semester?.trim()
    ) {
      toast.error(
        "Semester is required."
      );
      return;
    }

    if (
      !session.division?.trim()
    ) {
      toast.error(
        "Division is required."
      );
      return;
    }

    if (
      !session.subject?.trim()
    ) {
      toast.error(
        "Subject is required."
      );
      return;
    }

    try {
      setLoading(true);

      /* ---------------------------------------
         LOAD ALL STUDENTS
      --------------------------------------- */

      const studentsSnapshot =
        await getDocs(
          collection(
            db,
            "students"
          )
        );

      const rawStudents =
        studentsSnapshot.docs.map(
          (studentDoc) => ({
            id: studentDoc.id,
            ...studentDoc.data(),
          })
        );

      /* ---------------------------------------
         NORMALIZE VALUES
      --------------------------------------- */

      const selectedDepartment =
        session.department
          .trim()
          .toLowerCase();

      const selectedSemester =
        session.semester
          .trim()
          .toLowerCase();

      const selectedDivision =
        session.division
          .trim()
          .toLowerCase();

      /* ---------------------------------------
         MATCH STUDENTS
      --------------------------------------- */

      const matchingStudents =
        rawStudents.filter(
          (student) => {
            const department =
              String(
                student.department ||
                  ""
              )
                .trim()
                .toLowerCase();

            const semester =
              String(
                student.semester ||
                  ""
              )
                .trim()
                .toLowerCase();

            const division =
              String(
                student.division ||
                  ""
              )
                .trim()
                .toLowerCase();

            return (
              department ===
                selectedDepartment &&
              semester ===
                selectedSemester &&
              division ===
                selectedDivision
            );
          }
        );

      if (
        matchingStudents.length === 0
      ) {
        toast.error(
          "No students found for the selected Department, Semester and Division."
        );

        setLoadedStudents([]);

        return;
      }

      /* ---------------------------------------
         DUPLICATE SESSION PROTECTION

         Same:
         Date + Department + Semester
         + Division + Subject
      --------------------------------------- */

      const sessionsSnapshot =
        await getDocs(
          collection(
            db,
            "attendanceSessions"
          )
        );

      const duplicateSession =
        sessionsSnapshot.docs.find(
          (sessionDoc) => {
            if (
              sessionDoc.id ===
              "current"
            ) {
              return false;
            }

            const existing =
              sessionDoc.data();

            return (
              String(
                existing.date ||
                  ""
              )
                .trim() ===
                session.date.trim() &&
              String(
                existing.department ||
                  ""
              )
                .trim()
                .toLowerCase() ===
                selectedDepartment &&
              String(
                existing.semester ||
                  ""
              )
                .trim()
                .toLowerCase() ===
                selectedSemester &&
              String(
                existing.division ||
                  ""
              )
                .trim()
                .toLowerCase() ===
                selectedDivision &&
              String(
                existing.subject ||
                  ""
              )
                .trim()
                .toLowerCase() ===
                session.subject
                  .trim()
                  .toLowerCase()
            );
          }
        );

      if (duplicateSession) {
        toast.error(
          "An attendance session already exists for this date, semester, division and subject."
        );

        setLoadedStudents([]);

        return;
      }

      /* ---------------------------------------
         CREATE SESSION ID
      --------------------------------------- */

      const sessionId =
        crypto.randomUUID();

      const sessionRef = doc(
        db,
        "attendanceSessions",
        sessionId
      );

      /* ---------------------------------------
         CREATE SESSION
      --------------------------------------- */

      await setDoc(
        sessionRef,
        {
          date:
            session.date.trim(),

          department:
            session.department.trim(),

          semester:
            session.semester.trim(),

          division:
            session.division.trim(),

          subject:
            session.subject.trim(),

          present: 0,
          absent: 0,
          leave: 0,

          total:
            matchingStudents.length,

          status: "active",

          createdAt:
            new Date(),
        }
      );

      /* ---------------------------------------
         CREATE STUDENT ATTENDANCE RECORDS
      --------------------------------------- */

      const preparedStudents =
        [];

      for (
        const student of matchingStudents
      ) {
        const studentUid =
          student.uid ||
          student.id;

        const studentRef =
          doc(
            db,
            "attendanceSessions",
            sessionId,
            "students",
            studentUid
          );

        const studentAttendance =
          {
            uid: studentUid,

            studentUid,

            studentId:
              student.id,

            name:
              student.name || "",

            rollNo:
              student.rollNo || "",

            department:
              student.department ||
              "",

            semester:
              student.semester || "",

            division:
              student.division || "",

            status: "Absent",

            method: "Manual",

            date:
              session.date.trim(),

            subject:
              session.subject.trim(),

            sessionId,

            markedAt: null,

            createdAt:
              new Date(),
          };

        await setDoc(
          studentRef,
          studentAttendance
        );

        preparedStudents.push({
          id: studentUid,
          ...studentAttendance,
        });
      }

      setLoadedStudents(
        preparedStudents
      );

      /* ---------------------------------------
         INFORM PARENT
      --------------------------------------- */

      if (
        typeof onLoadStudents ===
        "function"
      ) {
        onLoadStudents({
          id: sessionId,
          ...session,
          students:
            preparedStudents,
        });
      }

      toast.success(
        `Attendance session created. ${preparedStudents.length} students loaded.`
      );
    } catch (error) {
      console.error(
        "ATTENDANCE SESSION ERROR:",
        error
      );

      console.error(
        "ERROR CODE:",
        error?.code
      );

      console.error(
        "ERROR MESSAGE:",
        error?.message
      );

      toast.error(
        error?.message ||
          "Failed to create attendance session."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">

      {/* HEADER */}

      <div className="mb-8">

        <h2 className="text-2xl font-bold text-slate-800">
          Create Attendance Session
        </h2>

        <p className="text-gray-500 mt-2">
          Select class details and load students.
        </p>

      </div>

      {/* FORM */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* DATE */}

        <div>

          <label
            htmlFor="date"
            className="text-sm font-medium text-gray-600"
          >
            Date
          </label>

          <div className="relative mt-2">

            <CalendarDays
              className="absolute left-4 top-3 text-gray-400"
              size={20}
            />

            <input
              id="date"
              type="date"
              name="date"
              value={session.date}
              onChange={handleChange}
              className="w-full border rounded-xl py-3 pl-12 pr-4"
            />

          </div>

        </div>

        {/* DEPARTMENT */}

        <div>

          <label
            htmlFor="department"
            className="text-sm font-medium text-gray-600"
          >
            Department
          </label>

          <div className="relative mt-2">

            <Building2
              className="absolute left-4 top-3 text-gray-400"
              size={20}
            />

            <select
              id="department"
              name="department"
              value={session.department}
              onChange={handleChange}
              className="w-full border rounded-xl py-3 pl-12 pr-4"
            >

              <option value="Computer Engineering">
                Computer Engineering
              </option>

            </select>

          </div>

        </div>

        {/* SEMESTER */}

        <div>

          <label
            htmlFor="semester"
            className="text-sm font-medium text-gray-600"
          >
            Semester
          </label>

          <div className="relative mt-2">

            <GraduationCap
              className="absolute left-4 top-3 text-gray-400"
              size={20}
            />

            <select
              id="semester"
              name="semester"
              value={session.semester}
              onChange={handleChange}
              className="w-full border rounded-xl py-3 pl-12 pr-4"
            >

              {[
                1, 2, 3, 4,
                5, 6, 7, 8,
              ].map(
                (sem) => (

                  <option
                    key={sem}
                    value={`Semester ${sem}`}
                  >
                    Semester {sem}
                  </option>

                )
              )}

            </select>

          </div>

        </div>

        {/* DIVISION */}

        <div>

          <label
            htmlFor="division"
            className="text-sm font-medium text-gray-600"
          >
            Division
          </label>

          <select
            id="division"
            name="division"
            value={session.division}
            onChange={handleChange}
            className="w-full border rounded-xl py-3 px-4 mt-2"
          >

            <option value="A">
              A
            </option>

            <option value="B">
              B
            </option>

            <option value="C">
              C
            </option>

          </select>

        </div>

        {/* SUBJECT */}

        <div>

          <label
            htmlFor="subject"
            className="text-sm font-medium text-gray-600"
          >
            Subject
          </label>

          <div className="relative mt-2">

            <BookOpen
              className="absolute left-4 top-3 text-gray-400"
              size={20}
            />

            <input
              id="subject"
              type="text"
              placeholder="Java Programming"
              name="subject"
              value={session.subject}
              onChange={handleChange}
              className="w-full border rounded-xl py-3 pl-12 pr-4"
            />

          </div>

        </div>

      </div>

      {/* BUTTON */}

      <div className="mt-8 flex justify-end">

        <button
          type="button"
          onClick={
            handleLoadStudents
          }
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-xl flex items-center gap-3"
        >

          {loading ? (
            <>
              <Loader2
                size={20}
                className="animate-spin"
              />

              Creating Session...
            </>
          ) : (
            <>
              <Users size={20} />

              Load Students
            </>
          )}

        </button>

      </div>

      {/* LOADED STUDENTS */}

      {loadedStudents.length >
        0 && (

        <div className="mt-8">

          <div className="flex items-center justify-between mb-4">

            <h3 className="text-xl font-bold text-slate-800">
              Loaded Students
            </h3>

            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
              {loadedStudents.length} Students
            </span>

          </div>

          <div className="overflow-x-auto border rounded-2xl">

            <table className="w-full">

              <thead className="bg-gray-50">

                <tr>

                  <th className="text-left p-4">
                    Roll No
                  </th>

                  <th className="text-left p-4">
                    Name
                  </th>

                  <th className="text-left p-4">
                    Semester
                  </th>

                  <th className="text-left p-4">
                    Division
                  </th>

                  <th className="text-left p-4">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {loadedStudents.map(
                  (student) => (

                    <tr
                      key={
                        student.id
                      }
                      className="border-t"
                    >

                      <td className="p-4">
                        {student.rollNo ||
                          "—"}
                      </td>

                      <td className="p-4">
                        {student.name ||
                          "—"}
                      </td>

                      <td className="p-4">
                        {student.semester ||
                          "—"}
                      </td>

                      <td className="p-4">
                        {student.division ||
                          "—"}
                      </td>

                      <td className="p-4">

                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                          {student.status}
                        </span>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      )}

    </div>
  );
}