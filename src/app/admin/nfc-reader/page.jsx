"use client";

import { useEffect, useState } from "react";

import {
  Smartphone,
  PlayCircle,
  Square,
  User,
  CheckCircle,
  BookOpen,
  GraduationCap,
  Users,
  Building2,
  Loader2,
  RefreshCw,
  Radio,
  UserX,
  Clock3,
} from "lucide-react";

import {
  collection,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

export default function NFCReaderPage() {
  // =========================================================
  // SESSION STATE
  // =========================================================

  const [running, setRunning] = useState(false);

  const [activeSessionId, setActiveSessionId] =
    useState("");

  const [department, setDepartment] =
    useState("");

  const [subject, setSubject] =
    useState("");

  const [faculty, setFaculty] =
    useState("");

  const [semester, setSemester] =
    useState("");

  const [division, setDivision] =
    useState("");

  const [room, setRoom] =
    useState("");

  // =========================================================
  // MASTER DATA
  // =========================================================

  const [departments, setDepartments] =
    useState([]);

  const [subjects, setSubjects] =
    useState([]);

  const [faculties, setFaculties] =
    useState([]);

  const [rooms, setRooms] =
    useState([]);

  const [semesters, setSemesters] =
    useState([]);

  const [divisions, setDivisions] =
    useState([]);

  // =========================================================
  // UI STATE
  // =========================================================

  const [loadingOptions, setLoadingOptions] =
    useState(true);

  const [optionsError, setOptionsError] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  const [lastStudent, setLastStudent] =
    useState(null);

  const [stats, setStats] = useState({
    totalStudents: 0,
    present: 0,
    absent: 0,
    leave: 0,
  });

  // =========================================================
  // HELPERS
  // =========================================================

  function textValue(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return "";
    }

    return String(value).trim();
  }

  function getDisplayValue(
    data,
    fallbackId,
    type
  ) {
    if (!data) {
      return fallbackId;
    }

    if (type === "subject") {
      return (
        textValue(data.name) ||
        textValue(data.subjectName) ||
        textValue(data.subject) ||
        textValue(data.title) ||
        textValue(data.code) ||
        fallbackId
      );
    }

    if (type === "faculty") {
      return (
        textValue(data.name) ||
        textValue(data.facultyName) ||
        textValue(data.fullName) ||
        textValue(data.title) ||
        fallbackId
      );
    }

    if (type === "room") {
      return (
        textValue(data.roomNumber) ||
        textValue(data.roomName) ||
        textValue(data.name) ||
        textValue(data.room) ||
        textValue(data.number) ||
        fallbackId
      );
    }

    return (
      textValue(data.name) ||
      textValue(data.title) ||
      textValue(data.value) ||
      fallbackId
    );
  }

  function getMillis(value) {
    if (!value) {
      return 0;
    }

    if (
      typeof value.toMillis === "function"
    ) {
      return value.toMillis();
    }

    if (
      typeof value.toDate === "function"
    ) {
      return value.toDate().getTime();
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? 0
      : date.getTime();
  }

  function getIndiaDate() {
    return new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).format(new Date());
  }

  function getIndiaTimeKey() {
    return new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }
    )
      .format(new Date())
      .replace(/:/g, "");
  }

  function formatTime(value) {
    const millis = getMillis(value);

    if (!millis) {
      return "";
    }

    return new Date(
      millis
    ).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      }
    );
  }

  function normalizeMatchValue(value) {
    return textValue(value)
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function createSafeSlug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function createHistoricalSessionId() {
    const date =
      getIndiaDate().replace(
        /-/g,
        ""
      );

    const time =
      getIndiaTimeKey();

    const departmentPart =
      createSafeSlug(
        department
      ) || "department";

    const subjectPart =
      createSafeSlug(subject) ||
      "subject";

    const semesterPart =
      createSafeSlug(semester) ||
      "semester";

    const divisionPart =
      createSafeSlug(division) ||
      "division";

    const uniquePart =
      crypto
        .randomUUID()
        .slice(0, 8);

    return [
      date,
      time,
      departmentPart,
      subjectPart,
      semesterPart,
      divisionPart,
      uniquePart,
    ].join("_");
  }

  function calculateRosterStats(
    roster
  ) {
    const totalStudents =
      roster.length;

    const present =
      roster.filter(
        (student) =>
          student.status ===
          "Present"
      ).length;

    const leave =
      roster.filter(
        (student) =>
          student.status ===
          "Leave"
      ).length;

    const absent =
      roster.filter(
        (student) =>
          student.status ===
          "Absent"
      ).length;

    return {
      totalStudents,
      present,
      absent,
      leave,
    };
  }

  // =========================================================
  // CLEAR LIVE CURRENT RECORDS
  // =========================================================

  async function clearCurrentCollection(
    collectionName
  ) {
    const recordsRef =
      collection(
        db,
        "attendanceSessions",
        "current",
        collectionName
      );

    const snapshot =
      await getDocs(
        recordsRef
      );

    if (snapshot.empty) {
      return;
    }

    const batch =
      writeBatch(db);

    snapshot.docs.forEach(
      (recordDoc) => {
        batch.delete(
          recordDoc.ref
        );
      }
    );

    await batch.commit();
  }

  async function clearCurrentAttendanceRecords() {
    await clearCurrentCollection(
      "students"
    );

    await clearCurrentCollection(
      "roster"
    );

    setLastStudent(null);

    setStats({
      totalStudents: 0,
      present: 0,
      absent: 0,
      leave: 0,
    });
  }

  // =========================================================
  // LOAD MASTER DATA
  // =========================================================

  async function loadOptions() {
    try {
      setLoadingOptions(true);
      setOptionsError("");

      // -------------------------------------------------------
      // DEPARTMENTS
      // -------------------------------------------------------

      const departmentSnap =
        await getDocs(
          collection(
            db,
            "departments"
          )
        );

      const loadedDepartments =
        departmentSnap.docs
          .map(
            (item) => {
              const data =
                item.data();

              const label =
                textValue(
                  data.name
                ) ||
                textValue(
                  data.departmentName
                ) ||
                textValue(
                  data.title
                ) ||
                item.id;

              return {
                id: item.id,
                value: label,
                label,
              };
            }
          )
          .filter(
            (item) =>
              item.value
          )
          .sort(
            (a, b) =>
              a.label.localeCompare(
                b.label
              )
          );

      setDepartments(
        loadedDepartments
      );

      // -------------------------------------------------------
      // ACADEMIC SETTINGS
      // -------------------------------------------------------

      const academicRef =
        doc(
          db,
          "academicSettings",
          "master"
        );

      const academicSnap =
        await getDoc(
          academicRef
        );

      if (
        !academicSnap.exists()
      ) {
        throw new Error(
          "Academic master data was not found."
        );
      }

      const academicData =
        academicSnap.data();

      const loadedSemesters =
        Array.isArray(
          academicData.semesters
        )
          ? academicData.semesters
              .filter(
                (item) =>
                  item &&
                  item.active !==
                    false
              )
              .sort(
                (a, b) =>
                  Number(
                    a.number || 0
                  ) -
                  Number(
                    b.number || 0
                  )
              )
              .map((item) => {
                const value =
                  textValue(
                    item.name
                  ) ||
                  `Semester ${item.number}`;

                return {
                  id:
                    item.id ||
                    `semester${item.number}`,
                  value,
                  label: value,
                  number:
                    item.number,
                };
              })
          : [];

      const loadedDivisions =
        Array.isArray(
          academicData.divisions
        )
          ? academicData.divisions
              .filter(
                (item) =>
                  item &&
                  item.active !==
                    false
              )
              .map((item) => {
                const value =
                  textValue(
                    item.id
                  ) ||
                  textValue(
                    item.value
                  ) ||
                  textValue(
                    item.name
                  );

                return {
                  id: value,
                  value,
                  label:
                    textValue(
                      item.name
                    ) ||
                    `Division ${value}`,
                };
              })
          : [];

      setSemesters(
        loadedSemesters
      );

      setDivisions(
        loadedDivisions
      );

      // -------------------------------------------------------
      // SUBJECTS
      // -------------------------------------------------------

      const subjectSnap =
        await getDocs(
          collection(
            db,
            "subjects"
          )
        );

      const loadedSubjects =
        subjectSnap.docs
          .map((item) => {
            const data =
              item.data();

            const label =
              getDisplayValue(
                data,
                item.id,
                "subject"
              );

            return {
              id: item.id,
              value: label,
              label,
              ...data,
            };
          })
          .filter(
            (item) =>
              item.active !==
              false
          );

      setSubjects(
        loadedSubjects
      );

      // -------------------------------------------------------
      // FACULTY
      // -------------------------------------------------------

      const facultySnap =
        await getDocs(
          collection(
            db,
            "faculty"
          )
        );

      const loadedFaculty =
        facultySnap.docs
          .map((item) => {
            const data =
              item.data();

            const label =
              getDisplayValue(
                data,
                item.id,
                "faculty"
              );

            return {
              id: item.id,
              value: label,
              label,
              ...data,
            };
          })
          .filter(
            (item) =>
              item.active !==
              false
          );

      setFaculties(
        loadedFaculty
      );

      // -------------------------------------------------------
      // ROOMS
      // -------------------------------------------------------

      const roomSnap =
        await getDocs(
          collection(
            db,
            "rooms"
          )
        );

      const loadedRooms =
        roomSnap.docs
          .map((item) => {
            const data =
              item.data();

            const label =
              getDisplayValue(
                data,
                item.id,
                "room"
              );

            return {
              id: item.id,
              value: label,
              label,
              ...data,
            };
          })
          .filter(
            (item) =>
              item.active !==
              false
          );

      setRooms(
        loadedRooms
      );
    } catch (error) {
      console.error(
        "Failed to load NFC master data:",
        error
      );

      const message =
        error?.message ||
        "Failed to load NFC reader data.";

      setOptionsError(
        message
      );

      toast.error(
        message
      );
    } finally {
      setLoadingOptions(
        false
      );
    }
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadOptions();
  }, []);

  // =========================================================
  // LIVE CURRENT SESSION LISTENER
  // =========================================================

  useEffect(() => {
    const currentRef =
      doc(
        db,
        "attendanceSessions",
        "current"
      );

    const unsubscribe =
      onSnapshot(
        currentRef,
        (snapshot) => {
          if (
            !snapshot.exists()
          ) {
            setRunning(false);
            setActiveSessionId("");
            setDepartment("");
            setSubject("");
            setFaculty("");
            setSemester("");
            setDivision("");
            setRoom("");

            return;
          }

          const current =
            snapshot.data();

          const isActive =
            current.status ===
            "active";

          setRunning(
            isActive
          );

          setActiveSessionId(
            current.activeSessionId ||
              current.sessionId ||
              ""
          );

          if (
            current.department
          ) {
            setDepartment(
              current.department
            );
          }

          if (
            current.subject
          ) {
            setSubject(
              current.subject
            );
          }

          if (
            current.faculty
          ) {
            setFaculty(
              current.faculty
            );
          }

          if (
            current.semester
          ) {
            setSemester(
              current.semester
            );
          }

          if (
            current.division
          ) {
            setDivision(
              current.division
            );
          }

          if (
            current.room
          ) {
            setRoom(
              current.room
            );
          }

          if (
            !isActive
          ) {
            setLastStudent(
              null
            );
          }

          if (
            Number.isFinite(
              Number(
                current.totalStudents
              )
            )
          ) {
            setStats({
              totalStudents:
                Number(
                  current.totalStudents
                ),
              present:
                Number(
                  current.present || 0
                ),
              absent:
                Number(
                  current.absent || 0
                ),
              leave:
                Number(
                  current.leave || 0
                ),
            });
          }
        },
        (error) => {
          console.error(
            "Current session listener error:",
            error
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  // =========================================================
  // REAL-TIME CURRENT ROSTER
  // =========================================================

  useEffect(() => {
    const rosterRef =
      collection(
        db,
        "attendanceSessions",
        "current",
        "roster"
      );

    const unsubscribe =
      onSnapshot(
        rosterRef,
        (snapshot) => {
          const roster =
            snapshot.docs.map(
              (studentDoc) => ({
                id:
                  studentDoc.id,
                ...studentDoc.data(),
              })
            );

          if (
            roster.length > 0
          ) {
            setStats(
              calculateRosterStats(
                roster
              )
            );
          }
        },
        (error) => {
          console.error(
            "Live roster listener error:",
            error
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  // =========================================================
  // REAL-TIME CURRENT NFC STUDENT
  // =========================================================

  useEffect(() => {
    const studentsRef =
      collection(
        db,
        "attendanceSessions",
        "current",
        "students"
      );

    const unsubscribe =
      onSnapshot(
        studentsRef,
        (snapshot) => {
          if (
            snapshot.empty
          ) {
            setLastStudent(
              null
            );
            return;
          }

          const students =
            snapshot.docs
              .map(
                (studentDoc) => ({
                  id:
                    studentDoc.id,
                  ...studentDoc.data(),
                })
              )
              .sort(
                (a, b) =>
                  getMillis(
                    b.markedAt
                  ) -
                  getMillis(
                    a.markedAt
                  )
              );

          const latest =
            students[0];

          setLastStudent({
            name:
              latest.name ||
              "Unknown",

            rollNo:
              latest.rollNo ||
              "Unknown",

            department:
              latest.department ||
              department ||
              "Unknown",

            subject:
              latest.subject ||
              subject ||
              "Unknown",

            semester:
              latest.semester ||
              semester ||
              "Unknown",

            division:
              latest.division ||
              division ||
              "Unknown",

            room:
              latest.room ||
              room ||
              "Unknown",

            status:
              latest.status ||
              "Unknown",

            time:
              formatTime(
                latest.markedAt
              ),

            uid:
              latest.uid ||
              latest.id,

            sessionId:
              latest.sessionId ||
              "",
          });
        },
        (error) => {
          console.error(
            "Live NFC listener error:",
            error
          );
        }
      );

    return () =>
      unsubscribe();
  }, [
    department,
    subject,
    semester,
    division,
    room,
  ]);

  // =========================================================
  // START ATTENDANCE
  // =========================================================

  async function startAttendance() {
    if (running) {
      toast.error(
        "An attendance session is already active."
      );

      return;
    }

    if (!department) {
      toast.error(
        "Select a department first."
      );

      return;
    }

    if (!subject) {
      toast.error(
        "Select a subject first."
      );

      return;
    }

    if (!faculty) {
      toast.error(
        "Select a faculty member first."
      );

      return;
    }

    if (!semester) {
      toast.error(
        "Select a semester first."
      );

      return;
    }

    if (!division) {
      toast.error(
        "Select a division first."
      );

      return;
    }

    if (!room) {
      toast.error(
        "Select a room first."
      );

      return;
    }

    try {
      setRefreshing(
        true
      );

      // -------------------------------------------------------
      // CLEAR OLD LIVE SESSION DATA
      // -------------------------------------------------------

      await clearCurrentAttendanceRecords();

      // -------------------------------------------------------
      // LOAD ALL STUDENTS
      // -------------------------------------------------------

      const studentSnapshot =
        await getDocs(
          collection(
            db,
            "students"
          )
        );

      const normalizedDepartment =
        normalizeMatchValue(
          department
        );

      const normalizedSemester =
        normalizeMatchValue(
          semester
        );

      const normalizedDivision =
        normalizeMatchValue(
          division
        );

      const classStudents =
        studentSnapshot.docs
          .map((studentDoc) => ({
            documentId:
              studentDoc.id,
            ...studentDoc.data(),
          }))
          .filter((student) => {
            const studentDepartment =
              normalizeMatchValue(
                student.department
              );

            const studentSemester =
              normalizeMatchValue(
                student.semester
              );

            const studentDivision =
              normalizeMatchValue(
                student.division
              );

            return (
              student.status ===
                "Active" &&
              (
                !student.role ||
                student.role ===
                  "student"
              ) &&
              studentDepartment ===
                normalizedDepartment &&
              studentSemester ===
                normalizedSemester &&
              studentDivision ===
                normalizedDivision
            );
          })
          .sort((a, b) =>
            String(
              a.rollNo ||
                ""
            ).localeCompare(
              String(
                b.rollNo ||
                  ""
              ),
              undefined,
              {
                numeric: true,
                sensitivity:
                  "base",
              }
            )
          );

      if (
        classStudents.length ===
        0
      ) {
        throw new Error(
          `No active students found for ${department} • ${semester} • Division ${division}.`
        );
      }

      // -------------------------------------------------------
      // CREATE SESSION
      // -------------------------------------------------------

      const sessionId =
        createHistoricalSessionId();

      const now =
        new Date();

      const historicalRef =
        doc(
          db,
          "attendanceSessions",
          sessionId
        );

      const currentRef =
        doc(
          db,
          "attendanceSessions",
          "current"
        );

      const totalStudents =
        classStudents.length;

      const present = 0;
      const absent =
        totalStudents;
      const leave = 0;

      const batch =
        writeBatch(db);

      // -------------------------------------------------------
      // CANONICAL HISTORICAL SESSION
      // -------------------------------------------------------

      batch.set(
        historicalRef,
        {
          sessionId,

          date:
            getIndiaDate(),

          department,

          subject,

          faculty,

          semester,

          division,

          room,

          status:
            "active",

          attendanceMethod:
            "NFC",

          totalStudents,

          present,

          absent,

          leave,

          createdAt:
            now,

          startTime:
            now,

          updatedAt:
            now,
        }
      );

      // -------------------------------------------------------
      // LIVE SESSION POINTER
      // -------------------------------------------------------

      batch.set(
        currentRef,
        {
          sessionId,

          activeSessionId:
            sessionId,

          date:
            getIndiaDate(),

          department,

          subject,

          faculty,

          semester,

          division,

          room,

          status:
            "active",

          attendanceMethod:
            "NFC",

          totalStudents,

          present,

          absent,

          leave,

          createdAt:
            now,

          startTime:
            now,

          updatedAt:
            now,
        }
      );

      // -------------------------------------------------------
      // CREATE COMPLETE CLASS ROSTER
      // -------------------------------------------------------

      for (
        const student of
          classStudents
      ) {
        const rosterData = {
          studentId:
            student.documentId,

          uid:
            student.uid ||
            student.documentId,

          name:
            student.name ||
            "Unknown",

          rollNo:
            student.rollNo ||
            "",

          department:
            student.department ||
            department,

          semester:
            student.semester ||
            semester,

          division:
            student.division ||
            division,

          nfcUid:
            student.nfcUid ||
            "",

          status:
            "Absent",

          method:
            "Not Marked",

          sessionId,

          createdAt:
            now,

          updatedAt:
            now,
        };

        const currentRosterCollection =
  collection(
    currentRef,
    "roster"
  );

const historicalRosterCollection =
  collection(
    historicalRef,
    "roster"
  );

const currentRosterRef =
  doc(
    currentRosterCollection,
    student.documentId
  );

const historicalRosterRef =
  doc(
    historicalRosterCollection,
    student.documentId
  );

        batch.set(
          currentRosterRef,
          rosterData
        );

        batch.set(
          historicalRosterRef,
          rosterData
        );
      }

      await batch.commit();

      // -------------------------------------------------------
      // UPDATE UI
      // -------------------------------------------------------

      setActiveSessionId(
        sessionId
      );

      setStats({
        totalStudents,
        present: 0,
        absent: totalStudents,
        leave: 0,
      });

      setLastStudent(
        null
      );

      setRunning(
        true
      );

      toast.success(
        `Attendance session started for ${totalStudents} students.`
      );
    } catch (error) {
      console.error(
        "Start attendance error:",
        error
      );

      const message =
        error?.message ||
        "Failed to start attendance.";

      toast.error(
        message
      );
    } finally {
      setRefreshing(
        false
      );
    }
  }

  // =========================================================
  // STOP ATTENDANCE
  // =========================================================

  async function stopAttendance() {
    if (!running) {
      toast.error(
        "No attendance session is active."
      );

      return;
    }

    try {
      setRefreshing(
        true
      );

      const currentRef =
        doc(
          db,
          "attendanceSessions",
          "current"
        );

      const currentSnap =
        await getDoc(
          currentRef
        );

      if (
        !currentSnap.exists()
      ) {
        throw new Error(
          "Current attendance session was not found."
        );
      }

      const current =
        currentSnap.data();

      const sessionId =
        current.activeSessionId ||
        current.sessionId ||
        activeSessionId;

      if (!sessionId) {
        throw new Error(
          "Active session ID is missing."
        );
      }

      const historicalRef =
        doc(
          db,
          "attendanceSessions",
          sessionId
        );

      const historicalRosterRef =
        collection(
          db,
          "attendanceSessions",
          sessionId,
          "roster"
        );

      const rosterSnapshot =
        await getDocs(
          historicalRosterRef
        );

      const roster =
        rosterSnapshot.docs.map(
          (studentDoc) => ({
            id:
              studentDoc.id,
            ...studentDoc.data(),
          })
        );

      const finalStats =
        calculateRosterStats(
          roster
        );

      const now =
        new Date();

      const batch =
        writeBatch(db);

      // -------------------------------------------------------
      // CLOSE HISTORICAL SESSION
      // -------------------------------------------------------

      batch.set(
        historicalRef,
        {
          status:
            "inactive",

          endTime:
            now,

          totalStudents:
            finalStats.totalStudents,

          present:
            finalStats.present,

          absent:
            finalStats.absent,

          leave:
            finalStats.leave,

          updatedAt:
            now,
        },
        {
          merge: true,
        }
      );

      // -------------------------------------------------------
      // CLOSE LIVE POINTER
      // -------------------------------------------------------

      batch.set(
        currentRef,
        {
          status:
            "inactive",

          activeSessionId:
            null,

          endTime:
            now,

          totalStudents:
            finalStats.totalStudents,

          present:
            finalStats.present,

          absent:
            finalStats.absent,

          leave:
            finalStats.leave,

          updatedAt:
            now,
        },
        {
          merge: true,
        }
      );

      await batch.commit();

      // -------------------------------------------------------
      // CLEAR LIVE CURRENT DATA
      // -------------------------------------------------------

      await clearCurrentAttendanceRecords();

      setRunning(
        false
      );

      setActiveSessionId(
        ""
      );

      setLastStudent(
        null
      );

      setStats(
        finalStats
      );

      toast.success(
        "Attendance session stopped."
      );
    } catch (error) {
      console.error(
        "Stop attendance error:",
        error
      );

      toast.error(
        error?.message ||
        "Failed to stop attendance."
      );
    } finally {
      setRefreshing(
        false
      );
    }
  }

  // =========================================================
  // REFRESH OPTIONS
  // =========================================================

  async function refreshOptions() {
    await loadOptions();

    toast.success(
      "Attendance options refreshed."
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* ===================================================
            HEADER
        ==================================================== */}

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <h1 className="text-3xl font-bold">
                NFC Attendance Reader
              </h1>

              <p className="text-gray-500 mt-2">
                Teacher Attendance Control Panel
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  running
                    ? "bg-green-500 animate-pulse"
                    : "bg-gray-400"
                }`}
              />

              <span className="font-medium">
                {running
                  ? "Attendance Active"
                  : "Attendance Stopped"}
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================
            LOADING
        ==================================================== */}

        {loadingOptions && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 flex items-center gap-3">
            <Loader2
              className="animate-spin"
              size={20}
            />

            <span>
              Loading attendance options...
            </span>
          </div>
        )}

        {/* ===================================================
            ERROR
        ==================================================== */}

        {optionsError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 mb-6">
            <p className="font-semibold">
              {optionsError}
            </p>

            <button
              onClick={
                refreshOptions
              }
              disabled={
                loadingOptions ||
                refreshing
              }
              className="mt-4 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl"
            >
              <RefreshCw
                size={17}
              />
              Retry
            </button>
          </div>
        )}

        {/* ===================================================
            ATTENDANCE SESSION
        ==================================================== */}

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">
                Attendance Session
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Configure the live class before scanning student NFC cards.
              </p>
            </div>

            <button
              onClick={
                refreshOptions
              }
              disabled={
                loadingOptions ||
                refreshing ||
                running
              }
              className="inline-flex items-center gap-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 px-4 py-2 rounded-xl"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">

            {/* DEPARTMENT */}

            <div>
              <label className="font-medium block mb-2">
                Department
              </label>

              <select
                value={department}
                onChange={(e) =>
                  setDepartment(
                    e.target.value
                  )
                }
                disabled={
                  running ||
                  loadingOptions
                }
                className="w-full border rounded-xl p-3 bg-white disabled:bg-gray-100"
              >
                <option value="">
                  Select Department
                </option>

                {departments.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={
                        item.value
                      }
                    >
                      {item.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* SUBJECT */}

            <div>
              <label className="font-medium block mb-2">
                Subject
              </label>

              <select
                value={subject}
                onChange={(e) =>
                  setSubject(
                    e.target.value
                  )
                }
                disabled={
                  running ||
                  loadingOptions
                }
                className="w-full border rounded-xl p-3 bg-white disabled:bg-gray-100"
              >
                <option value="">
                  Select Subject
                </option>

                {subjects.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={
                        item.value
                      }
                    >
                      {item.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* FACULTY */}

            <div>
              <label className="font-medium block mb-2">
                Faculty
              </label>

              <select
                value={faculty}
                onChange={(e) =>
                  setFaculty(
                    e.target.value
                  )
                }
                disabled={
                  running ||
                  loadingOptions
                }
                className="w-full border rounded-xl p-3 bg-white disabled:bg-gray-100"
              >
                <option value="">
                  Select Faculty
                </option>

                {faculties.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={
                        item.value
                      }
                    >
                      {item.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* ROOM */}

            <div>
              <label className="font-medium block mb-2">
                Room
              </label>

              <select
                value={room}
                onChange={(e) =>
                  setRoom(
                    e.target.value
                  )
                }
                disabled={
                  running ||
                  loadingOptions
                }
                className="w-full border rounded-xl p-3 bg-white disabled:bg-gray-100"
              >
                <option value="">
                  Select Room
                </option>

                {rooms.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={
                        item.value
                      }
                    >
                      {item.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* SEMESTER */}

            <div>
              <label className="font-medium block mb-2">
                Semester
              </label>

              <select
                value={semester}
                onChange={(e) =>
                  setSemester(
                    e.target.value
                  )
                }
                disabled={
                  running ||
                  loadingOptions
                }
                className="w-full border rounded-xl p-3 bg-white disabled:bg-gray-100"
              >
                <option value="">
                  Select Semester
                </option>

                {semesters.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={
                        item.value
                      }
                    >
                      {item.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* DIVISION */}

            <div>
              <label className="font-medium block mb-2">
                Division
              </label>

              <select
                value={division}
                onChange={(e) =>
                  setDivision(
                    e.target.value
                  )
                }
                disabled={
                  running ||
                  loadingOptions
                }
                className="w-full border rounded-xl p-3 bg-white disabled:bg-gray-100"
              >
                <option value="">
                  Select Division
                </option>

                {divisions.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={
                        item.value
                      }
                    >
                      {item.label}
                    </option>
                  )
                )}
              </select>
            </div>

          </div>

          {/* ACTIONS */}

          <div className="flex flex-wrap gap-4 mt-6">

            <button
              onClick={
                startAttendance
              }
              disabled={
                running ||
                loadingOptions ||
                refreshing
              }
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl flex items-center gap-2"
            >
              <PlayCircle
                size={20}
              />

              Start Attendance
            </button>

            <button
              onClick={
                stopAttendance
              }
              disabled={
                !running ||
                refreshing
              }
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl flex items-center gap-2"
            >
              <Square
                size={20}
              />

              Stop Attendance
            </button>
          </div>

          {/* ACTIVE SESSION INFORMATION */}

          {running &&
            activeSessionId && (
              <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4">

                <p className="text-blue-700 font-semibold">
                  Active Session
                </p>

                <p className="text-blue-600 text-sm mt-1 break-all">
                  {activeSessionId}
                </p>

                <div className="mt-2 text-sm text-blue-700">
                  <span className="font-semibold">
                    Class:
                  </span>{" "}
                  {department} •{" "}
                  {semester} • Division{" "}
                  {division}
                </div>

              </div>
            )}
        </div>

        {/* ===================================================
            SESSION SUMMARY
        ==================================================== */}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <Users
              className="mb-3 text-blue-600"
              size={28}
            />

            <p className="text-gray-500 text-sm">
              Total Students
            </p>

            <h2 className="text-3xl font-bold mt-1">
              {stats.totalStudents}
            </h2>
          </div>

          <div className="bg-green-50 rounded-2xl shadow-lg p-6">
            <CheckCircle
              className="mb-3 text-green-600"
              size={28}
            />

            <p className="text-gray-500 text-sm">
              Present
            </p>

            <h2 className="text-3xl font-bold mt-1 text-green-700">
              {stats.present}
            </h2>
          </div>

          <div className="bg-red-50 rounded-2xl shadow-lg p-6">
            <UserX
              className="mb-3 text-red-600"
              size={28}
            />

            <p className="text-gray-500 text-sm">
              Absent
            </p>

            <h2 className="text-3xl font-bold mt-1 text-red-700">
              {stats.absent}
            </h2>
          </div>

          <div className="bg-yellow-50 rounded-2xl shadow-lg p-6">
            <Clock3
              className="mb-3 text-yellow-600"
              size={28}
            />

            <p className="text-gray-500 text-sm">
              Leave
            </p>

            <h2 className="text-3xl font-bold mt-1 text-yellow-700">
              {stats.leave}
            </h2>
          </div>

        </div>

        {/* ===================================================
            NFC STATUS + LAST STUDENT
        ==================================================== */}

        <div className="grid lg:grid-cols-2 gap-6">

          {/* PHYSICAL NFC STATUS */}

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">

            <div className="bg-blue-100 rounded-full w-32 h-32 mx-auto flex items-center justify-center">

              <Smartphone
                size={70}
                className={`text-blue-600 ${
                  running
                    ? "animate-pulse"
                    : ""
                }`}
              />

            </div>

            <div className="flex items-center justify-center gap-2 mt-6">

              <Radio
                size={20}
                className={
                  running
                    ? "text-green-600"
                    : "text-gray-400"
                }
              />

              <h2 className="text-2xl font-bold">
                {running
                  ? "Waiting for NFC Card..."
                  : "Attendance Stopped"}
              </h2>

            </div>

            <p className="text-gray-500 mt-2">
              {running
                ? "Open the AUMNex NFC Reader app on the Moto G84 and tap a student NFC card."
                : "Configure the session and click Start Attendance."}
            </p>

            {running && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-700 font-semibold">
                  Physical NFC reader is ready
                </p>

                <p className="text-green-600 text-sm mt-1">
                  No browser simulation is used.
                </p>
              </div>
            )}
          </div>

          {/* LAST STUDENT */}

          <div className="bg-white rounded-2xl shadow-lg p-8">

            <h2 className="text-2xl font-bold mb-6">
              Last Scanned Student
            </h2>

            {lastStudent ? (
              <div className="space-y-5">

                <div className="flex items-center gap-3">
                  <User
                    className="text-blue-600"
                  />

                  <div>
                    <p className="text-gray-500 text-sm">
                      Name
                    </p>

                    <h3 className="font-bold">
                      {lastStudent.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <GraduationCap
                    className="text-green-600"
                  />

                  <div>
                    <p className="text-gray-500 text-sm">
                      Roll Number
                    </p>

                    <h3 className="font-bold">
                      {lastStudent.rollNo}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building2
                    className="text-slate-600"
                  />

                  <div>
                    <p className="text-gray-500 text-sm">
                      Department
                    </p>

                    <h3 className="font-bold">
                      {lastStudent.department}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <BookOpen
                    className="text-purple-600"
                  />

                  <div>
                    <p className="text-gray-500 text-sm">
                      Subject
                    </p>

                    <h3 className="font-bold">
                      {lastStudent.subject}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users
                    className="text-orange-600"
                  />

                  <div>
                    <p className="text-gray-500 text-sm">
                      Division
                    </p>

                    <h3 className="font-bold">
                      {lastStudent.division}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <GraduationCap
                    className="text-indigo-600"
                  />

                  <div>
                    <p className="text-gray-500 text-sm">
                      Semester
                    </p>

                    <h3 className="font-bold">
                      {lastStudent.semester}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building2
                    className="text-slate-600"
                  />

                  <div>
                    <p className="text-gray-500 text-sm">
                      Room
                    </p>

                    <h3 className="font-bold">
                      {lastStudent.room}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CheckCircle
                    className="text-green-600"
                  />

                  <div>
                    <p className="text-gray-500 text-sm">
                      Status
                    </p>

                    <h3 className="font-bold text-green-600">
                      {lastStudent.status}
                    </h3>
                  </div>
                </div>

                <div className="bg-green-100 rounded-xl p-4 text-center">
                  <h3 className="text-lg font-bold text-green-700">
                    Attendance Marked Successfully
                  </h3>

                  <p className="text-green-600 mt-1">
                    {lastStudent.time ||
                      "Time unavailable"}
                  </p>
                </div>

              </div>
            ) : (
              <div className="text-center text-gray-500 py-20">

                <Radio
                  size={48}
                  className="mx-auto mb-4 text-gray-300"
                />

                <p>
                  No student scanned yet.
                </p>

                <p className="text-sm mt-2">
                  Start attendance and scan a physical NFC card.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}