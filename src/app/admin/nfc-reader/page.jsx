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
} from "lucide-react";

import {
  collection,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

export default function NFCReaderPage() {
  const [running, setRunning] = useState(false);

  const [lastStudent, setLastStudent] = useState(null);

  const [subject, setSubject] = useState("");
  const [faculty, setFaculty] = useState("");
  const [semester, setSemester] = useState("");
  const [division, setDivision] = useState("");
  const [room, setRoom] = useState("");

  const [subjects, setSubjects] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [divisions, setDivisions] = useState([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  const [refreshing, setRefreshing] = useState(false);

  /*
   * Convert Firestore values into safe display strings.
   */
  function textValue(value) {
    if (value === undefined || value === null) {
      return "";
    }

    return String(value).trim();
  }

  /*
   * Pick a useful display value even if the existing
   * Firestore collections use slightly different field names.
   */
  function getDisplayValue(data, fallbackId, type) {
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

  /*
   * Convert a Firestore timestamp/date/string into milliseconds.
   */
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

  /*
   * India local date.
   */
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

  /*
   * Format Firestore timestamp for UI.
   */
  function formatTime(value) {
    const millis = getMillis(value);

    if (!millis) {
      return "";
    }

    return new Date(millis).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      }
    );
  }

  /*
   * -----------------------------------------
   * LOAD FORM OPTIONS
   * -----------------------------------------
   */
  async function loadOptions() {
    try {
      setLoadingOptions(true);
      setOptionsError("");

      const [
        subjectsSnapshot,
        facultySnapshot,
        roomsSnapshot,
        studentsSnapshot,
      ] = await Promise.all([
        getDocs(collection(db, "subjects")),
        getDocs(collection(db, "faculty")),
        getDocs(collection(db, "rooms")),
        getDocs(collection(db, "students")),
      ]);

      /*
       * SUBJECTS
       */
      const subjectList = subjectsSnapshot.docs
        .map((item) => {
          const data = item.data();

          return {
            id: item.id,
            label: getDisplayValue(
              data,
              item.id,
              "subject"
            ),
          };
        })
        .filter((item) => item.label)
        .sort((a, b) =>
          a.label.localeCompare(b.label)
        );

      /*
       * FACULTY
       */
      const facultyList = facultySnapshot.docs
        .map((item) => {
          const data = item.data();

          return {
            id: item.id,
            label: getDisplayValue(
              data,
              item.id,
              "faculty"
            ),
          };
        })
        .filter((item) => item.label)
        .sort((a, b) =>
          a.label.localeCompare(b.label)
        );

      /*
       * ROOMS
       */
      const roomList = roomsSnapshot.docs
        .map((item) => {
          const data = item.data();

          return {
            id: item.id,
            label: getDisplayValue(
              data,
              item.id,
              "room"
            ),
          };
        })
        .filter((item) => item.label)
        .sort((a, b) =>
          a.label.localeCompare(b.label)
        );

      /*
       * SEMESTERS
       */
      const semesterSet = new Set();

      /*
       * DIVISIONS
       */
      const divisionSet = new Set();

      studentsSnapshot.docs.forEach(
        (studentDoc) => {
          const data = studentDoc.data();

          const studentSemester =
            textValue(data.semester);

          const studentDivision =
            textValue(data.division);

          if (studentSemester) {
            semesterSet.add(studentSemester);
          }

          if (studentDivision) {
            divisionSet.add(studentDivision);
          }
        }
      );

      const semesterList = Array.from(
        semesterSet
      ).sort((a, b) =>
        a.localeCompare(b, undefined, {
          numeric: true,
        })
      );

      const divisionList = Array.from(
        divisionSet
      ).sort((a, b) =>
        a.localeCompare(b)
      );

      setSubjects(subjectList);
      setFaculties(facultyList);
      setRooms(roomList);
      setSemesters(semesterList);
      setDivisions(divisionList);

      /*
       * Keep the currently active session values
       * when the page is refreshed.
       */
      const currentRef = doc(
        db,
        "attendanceSessions",
        "current"
      );

      const currentSnapshot =
        await getDoc(currentRef);

      if (currentSnapshot.exists()) {
        const current =
          currentSnapshot.data();

        setSubject(
          textValue(current.subject)
        );

        setFaculty(
          textValue(current.faculty)
        );

        setSemester(
          textValue(current.semester)
        );

        setDivision(
          textValue(current.division)
        );

        setRoom(
          textValue(current.room)
        );

        setRunning(
          current.status === "active"
        );
      } else {
        /*
         * Select the first real Firestore option
         * only when nothing has previously been set.
         */
        if (
          !subject &&
          subjectList.length > 0
        ) {
          setSubject(subjectList[0].label);
        }

        if (
          !faculty &&
          facultyList.length > 0
        ) {
          setFaculty(facultyList[0].label);
        }

        if (
          !room &&
          roomList.length > 0
        ) {
          setRoom(roomList[0].label);
        }

        if (
          !semester &&
          semesterList.length > 0
        ) {
          setSemester(semesterList[0]);
        }

        if (
          !division &&
          divisionList.length > 0
        ) {
          setDivision(divisionList[0]);
        }

        await setDoc(currentRef, {
          subject: "",
          faculty: "",
          semester: "",
          division: "",
          room: "",
          status: "inactive",
          sessionId: null,
          date: null,
          startTime: null,
          createdAt: new Date(),
          present: 0,
        });
      }
    } catch (error) {
      console.error(
        "Failed to load NFC options:",
        error
      );

      setOptionsError(
        "Unable to load attendance options from Firestore."
      );
    } finally {
      setLoadingOptions(false);
    }
  }

  /*
   * -----------------------------------------
   * INITIAL LOAD
   * -----------------------------------------
   */
  useEffect(() => {
    loadOptions();
  }, []);

  /*
   * -----------------------------------------
   * REAL-TIME CURRENT SESSION STUDENTS
   * -----------------------------------------
   *
   * This replaces the old browser-based
   * "Simulate NFC Scan" button.
   *
   * The Moto G84 writes the attendance through
   * /api/nfc, and this page listens to Firestore.
   */
  useEffect(() => {
    const studentsRef = collection(
      db,
      "attendanceSessions",
      "current",
      "students"
    );

    const unsubscribe = onSnapshot(
      studentsRef,
      (snapshot) => {
        if (snapshot.empty) {
          setLastStudent(null);
          return;
        }

        const students = snapshot.docs
          .map((studentDoc) => ({
            id: studentDoc.id,
            ...studentDoc.data(),
          }))
          .sort((a, b) => {
            return (
              getMillis(b.markedAt) -
              getMillis(a.markedAt)
            );
          });

        const latest = students[0];

        setLastStudent({
          name:
            latest.name || "Unknown",
          rollNo:
            latest.rollNo || "Unknown",
          semester:
            latest.semester ||
            semester ||
            "Unknown",
          division:
            latest.division ||
            division ||
            "Unknown",
          subject:
            subject ||
            "Unknown",
          status:
            latest.status || "Unknown",
          time:
            formatTime(latest.markedAt),
          uid:
            latest.uid || latest.id,
          sessionId:
            latest.sessionId || "",
        });
      },
      (error) => {
        console.error(
          "Live NFC listener error:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, [subject, semester, division]);

  /*
   * -----------------------------------------
   * START ATTENDANCE
   * -----------------------------------------
   */
  async function startAttendance() {
    if (running) {
      toast.error(
        "An attendance session is already active."
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
      setRefreshing(true);

      const sessionId =
        crypto.randomUUID();

      const now = new Date();

      const date =
        getIndiaDate();

      await setDoc(
        doc(
          db,
          "attendanceSessions",
          "current"
        ),
        {
          sessionId,
          date,
          subject,
          semester,
          division,
          faculty,
          room,
          status: "active",
          present: 0,
          createdAt: now,
          startTime: now,
        }
      );

      setLastStudent(null);
      setRunning(true);

      toast.success(
        "Attendance session started."
      );
    } catch (error) {
      console.error(
        "Start attendance error:",
        error
      );

      toast.error(
        error.message ||
          "Failed to start attendance."
      );
    } finally {
      setRefreshing(false);
    }
  }

  /*
   * -----------------------------------------
   * STOP ATTENDANCE
   * -----------------------------------------
   */
  async function stopAttendance() {
    if (!running) {
      toast.error(
        "No attendance session is active."
      );
      return;
    }

    try {
      setRefreshing(true);

      await setDoc(
        doc(
          db,
          "attendanceSessions",
          "current"
        ),
        {
          status: "inactive",
        },
        {
          merge: true,
        }
      );

      setRunning(false);

      toast.success(
        "Attendance session stopped."
      );
    } catch (error) {
      console.error(
        "Stop attendance error:",
        error
      );

      toast.error(
        error.message ||
          "Failed to stop attendance."
      );
    } finally {
      setRefreshing(false);
    }
  }

  /*
   * -----------------------------------------
   * REFRESH OPTIONS
   * -----------------------------------------
   */
  async function refreshOptions() {
    await loadOptions();

    toast.success(
      "Attendance options refreshed."
    );
  }

  /*
   * -----------------------------------------
   * RENDER
   * -----------------------------------------
   */
  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-6xl mx-auto">

        {/* HEADER */}

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

        {/* LOADING / ERROR */}

        {loadingOptions && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 flex items-center gap-3">

            <Loader2
              className="animate-spin"
              size={20}
            />

            Loading attendance options...

          </div>
        )}

        {optionsError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 mb-6">

            <p className="font-semibold">
              {optionsError}
            </p>

            <button
              onClick={refreshOptions}
              className="mt-4 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl"
            >
              <RefreshCw size={17} />
              Retry
            </button>

          </div>
        )}

        {/* CONTROLS */}

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">

          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-xl font-bold">
                Attendance Session
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Configure the live class before scanning
                student NFC cards.
              </p>
            </div>

            <button
              onClick={refreshOptions}
              disabled={loadingOptions || refreshing}
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

            {/* SUBJECT */}

            <div>

              <label className="font-medium block mb-2">
                Subject
              </label>

              <select
                value={subject}
                onChange={(e) =>
                  setSubject(e.target.value)
                }
                disabled={running}
                className="w-full border rounded-xl p-3 bg-white disabled:bg-gray-100"
              >
                <option value="">
                  Select Subject
                </option>

                {subjects.map((item) => (
                  <option
                    key={item.id}
                    value={item.label}
                  >
                    {item.label}
                  </option>
                ))}
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
                  setFaculty(e.target.value)
                }
                disabled={running}
                className="w-full border rounded-xl p-3 bg-white disabled:bg-gray-100"
              >
                <option value="">
                  Select Faculty
                </option>

                {faculties.map((item) => (
                  <option
                    key={item.id}
                    value={item.label}
                  >
                    {item.label}
                  </option>
                ))}
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
                  setRoom(e.target.value)
                }
                disabled={running}
                className="w-full border rounded-xl p-3 bg-white disabled:bg-gray-100"
              >
                <option value="">
                  Select Room
                </option>

                {rooms.map((item) => (
                  <option
                    key={item.id}
                    value={item.label}
                  >
                    {item.label}
                  </option>
                ))}
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
                  setSemester(e.target.value)
                }
                disabled={running}
                className="w-full border rounded-xl p-3 bg-white disabled:bg-gray-100"
              >
                <option value="">
                  Select Semester
                </option>

                {semesters.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
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
                  setDivision(e.target.value)
                }
                disabled={running}
                className="w-full border rounded-xl p-3 bg-white disabled:bg-gray-100"
              >
                <option value="">
                  Select Division
                </option>

                {divisions.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>

            </div>

          </div>

          {/* ACTIONS */}

          <div className="flex flex-wrap gap-4 mt-6">

            <button
              onClick={startAttendance}
              disabled={
                running ||
                loadingOptions ||
                refreshing
              }
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl flex items-center gap-2"
            >
              <PlayCircle size={20} />
              Start Attendance
            </button>

            <button
              onClick={stopAttendance}
              disabled={
                !running ||
                refreshing
              }
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl flex items-center gap-2"
            >
              <Square size={20} />
              Stop Attendance
            </button>

          </div>

        </div>

        {/* PHYSICAL NFC STATUS */}

        <div className="grid lg:grid-cols-2 gap-6">

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

                  <User className="text-blue-600" />

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

                  <GraduationCap className="text-green-600" />

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

                  <BookOpen className="text-purple-600" />

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

                  <Users className="text-orange-600" />

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

                  <GraduationCap className="text-indigo-600" />

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

                  <Building2 className="text-slate-600" />

                  <div>

                    <p className="text-gray-500 text-sm">
                      Room
                    </p>

                    <h3 className="font-bold">
                      {room || "—"}
                    </h3>

                  </div>

                </div>

                <div className="flex items-center gap-3">

                  <CheckCircle className="text-green-600" />

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
                    {lastStudent.time || "Time unavailable"}
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