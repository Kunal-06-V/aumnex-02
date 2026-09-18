"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDoc,
  getDocs,
  doc,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import { auth, db } from "@/lib/firebase";

import { ArrowLeft } from "lucide-react";

import { useRouter } from "next/navigation";

const semesterOptions = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
];

function normalizeSemester(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export default function StudentResults() {
  const router = useRouter();

  const [studentUid, setStudentUid] =
    useState(null);

  const [semester, setSemester] =
    useState("Semester 4");

  const [result, setResult] =
    useState(null);

  const [subjects, setSubjects] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingSemester, setLoadingSemester] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            console.log(
              "[Student Results] Auth UID:",
              user.uid
            );

            console.log(
              "[Student Results] Auth email:",
              user.email
            );

            setStudentUid(user.uid);
          } else {
            setStudentUid(null);
            setLoading(false);
          }
        }
      );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchResult() {
      if (!studentUid) {
        return;
      }

      setLoadingSemester(true);
      setResult(null);
      setSubjects([]);
      setError("");

      try {
        /*
         * =====================================================
         * STEP 1
         * Normalize selected semester.
         *
         * "Semester 4" -> "Semester4"
         * =====================================================
         */

        const requestedSemesterId =
          semester.replace(/\s+/g, "");

        console.log(
          "[Student Results] Requested semester:",
          semester
        );

        console.log(
          "[Student Results] Normalized semester:",
          requestedSemesterId
        );

        /*
         * =====================================================
         * STEP 2
         * Try the exact document first.
         * =====================================================
         */

        const exactResultRef = doc(
          db,
          "results",
          studentUid,
          "semesters",
          requestedSemesterId
        );

        const exactResultSnap =
          await getDoc(
            exactResultRef
          );

        console.log(
          "[Student Results] Exact document:",
          `results/${studentUid}/semesters/${requestedSemesterId}`
        );

        console.log(
          "[Student Results] Exact document exists:",
          exactResultSnap.exists()
        );

        let resultSnap =
          exactResultSnap;

        let actualSemesterId =
          requestedSemesterId;

        /*
         * =====================================================
         * STEP 3
         * Compatibility fallback.
         *
         * If the exact ID is not present, load only this
         * student's semester documents and find a matching
         * semester using normalization.
         * =====================================================
         */

        if (!exactResultSnap.exists()) {
          console.log(
            "[Student Results] Exact result not found. Checking student's semester documents..."
          );

          const semestersRef =
            collection(
              db,
              "results",
              studentUid,
              "semesters"
            );

          const semesterSnapshot =
            await getDocs(
              semestersRef
            );

          console.log(
            "[Student Results] Available semester IDs:",
            semesterSnapshot.docs.map(
              (semesterDoc) =>
                semesterDoc.id
            )
          );

          const matchingSemester =
            semesterSnapshot.docs.find(
              (semesterDoc) =>
                normalizeSemester(
                  semesterDoc.id
                ) ===
                  normalizeSemester(
                    requestedSemesterId
                  ) ||
                normalizeSemester(
                  semesterDoc.data()
                    ?.semester
                ) ===
                  normalizeSemester(
                    semester
                  )
            );

          if (matchingSemester) {
            resultSnap =
              matchingSemester;

            actualSemesterId =
              matchingSemester.id;

            console.log(
              "[Student Results] Matching semester found:",
              actualSemesterId
            );
          }
        }

        /*
         * =====================================================
         * STEP 4
         * No result found.
         * =====================================================
         */

        if (!resultSnap.exists()) {
          console.log(
            "[Student Results] No result document found for selected semester."
          );

          setResult(null);
          setSubjects([]);
          return;
        }

        /*
         * =====================================================
         * STEP 5
         * Load result document.
         * =====================================================
         */

        const resultData =
          resultSnap.data();

        console.log(
          "[Student Results] Result data:",
          resultData
        );

        setResult(resultData);

        /*
         * =====================================================
         * STEP 6
         * Load subject-wise marks from the actual
         * semester document that was found.
         * =====================================================
         */

        const subjectsRef =
          collection(
            db,
            "results",
            studentUid,
            "semesters",
            actualSemesterId,
            "subjects"
          );

        const subjectsSnap =
          await getDocs(
            subjectsRef
          );

        console.log(
          "[Student Results] Subject count:",
          subjectsSnap.size
        );

        const subjectList =
          subjectsSnap.docs.map(
            (subjectDoc) => ({
              id: subjectDoc.id,
              ...subjectDoc.data(),
            })
          );

        setSubjects(
          subjectList
        );
      } catch (error) {
        console.error(
          "[Student Results] Firestore error:",
          error
        );

        setResult(null);
        setSubjects([]);

        setError(
          error?.message ||
            "Unable to load results."
        );
      } finally {
        setLoadingSemester(false);
        setLoading(false);
      }
    }

    fetchResult();
  }, [studentUid, semester]);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-blue-700">
          Loading Results...
        </h1>
      </div>
    );
  }

  if (!studentUid) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-red-600">
          Student not authenticated
        </h1>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Back */}

      <button
        onClick={() =>
          router.back()
        }
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      {/* Heading */}

      <h1 className="text-3xl font-bold text-blue-700">
        Academic Results
      </h1>

      <div className="bg-white rounded-2xl shadow-lg p-8">

        {/* Header */}

        <h2 className="text-2xl font-semibold mb-6">
          Semester Results
        </h2>

        {/* Semester */}

        <div className="mb-8">

          <label
            htmlFor="semester"
            className="block text-gray-700 font-medium mb-2"
          >
            Select Semester
          </label>

          <select
            id="semester"
            value={semester}
            onChange={(e) =>
              setSemester(
                e.target.value
              )
            }
            className="w-full md:w-72 border rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {semesterOptions.map(
              (option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              )
            )}
          </select>

        </div>

        {/* Loading */}

        {loadingSemester ? (
          <div className="text-center py-12">

            <h2 className="text-xl font-semibold text-gray-700">
              Loading {semester}...
            </h2>

          </div>

        ) : error ? (

          <div className="text-center py-12">

            <h2 className="text-2xl font-semibold text-red-600">
              Unable to Load Results
            </h2>

            <p className="text-gray-600 mt-3">
              {error}
            </p>

            <p className="text-sm text-gray-400 mt-3">
              Check the browser console for the
              exact Firebase error.
            </p>

          </div>

        ) : !result ? (

          <div className="text-center py-12">

            <h2 className="text-2xl font-semibold">
              No Results Available
            </h2>

            <p className="text-gray-600 mt-2">
              Your result for{" "}
              <strong>
                {semester}
              </strong>{" "}
              has not been uploaded yet.
            </p>

          </div>

        ) : (
          <>

            {/* Result Cards */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

              <div className="bg-blue-600 text-white rounded-2xl shadow-lg p-6">

                <p className="text-lg font-medium">
                  SGPA
                </p>

                <h2 className="text-4xl font-bold mt-2">
                  {result.sgpa ??
                    "N/A"}
                </h2>

                <p className="text-blue-100 mt-2">
                  Semester Grade Point Average
                </p>

              </div>

              <div className="bg-green-600 text-white rounded-2xl shadow-lg p-6">

                <p className="text-lg font-medium">
                  CGPA
                </p>

                <h2 className="text-4xl font-bold mt-2">
                  {result.cgpa ??
                    "N/A"}
                </h2>

                <p className="text-green-100 mt-2">
                  Cumulative Grade Point Average
                </p>

              </div>

              <div className="bg-yellow-500 text-white rounded-2xl shadow-lg p-6">

                <p className="text-lg font-medium">
                  Status
                </p>

                <h2 className="text-3xl font-bold mt-2">
                  {result.status ??
                    "N/A"}
                </h2>

                <p className="mt-2">
                  Examination Result
                </p>

              </div>

              <div className="bg-purple-600 text-white rounded-2xl shadow-lg p-6">

                <p className="text-lg font-medium">
                  Percentage
                </p>

                <h2 className="text-3xl font-bold mt-2">
                  {result.percentage !=
                  null
                    ? `${result.percentage}%`
                    : "N/A"}
                </h2>

                <p className="mt-2">
                  Overall Percentage
                </p>

              </div>

            </div>

            {/* Academic Summary */}

            <div className="border rounded-2xl p-6">

              <h3 className="text-xl font-semibold mb-4">
                Academic Summary
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm">
                    Student
                  </p>

                  <p className="font-semibold mt-1">
                    {result.studentName ??
                      "N/A"}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm">
                    Roll No
                  </p>

                  <p className="font-semibold mt-1">
                    {result.rollNo ??
                      "N/A"}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm">
                    Failed Subjects
                  </p>

                  <p className="font-semibold mt-1">
                    {result.failedSubjects ??
                      0}
                  </p>
                </div>

              </div>

            </div>

            {/* Subject-wise Marks */}

            <div className="mt-8 bg-white rounded-2xl shadow-lg overflow-hidden border">

              <div className="p-6">

                <h3 className="text-xl font-semibold">
                  Subject-wise Marks
                </h3>

              </div>

              {subjects.length ===
              0 ? (
                <div className="px-6 pb-6 text-gray-500">
                  No subject marks available.
                </div>
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full">

                    <thead className="bg-blue-600 text-white">

                      <tr>

                        <th className="p-4 text-left">
                          Subject
                        </th>

                        <th className="p-4 text-center">
                          Marks
                        </th>

                        <th className="p-4 text-center">
                          Grade
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {subjects.map(
                        (subject) => (
                          <tr
                            key={
                              subject.id
                            }
                            className="border-b hover:bg-gray-50"
                          >

                            <td className="p-4">
                              {subject.subject ||
                                subject.name ||
                                "Unknown Subject"}
                            </td>

                            <td className="p-4 text-center font-semibold">
                              {subject.marks ??
                                "N/A"}
                            </td>

                            <td className="p-4 text-center font-bold text-green-600">
                              {subject.grade ??
                                "N/A"}
                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </div>

          </>
        )}

      </div>
    </div>
  );
}