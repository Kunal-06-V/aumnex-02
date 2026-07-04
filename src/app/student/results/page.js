"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore"; import { db } from "@/lib/firebase";

export default function StudentResults() {
  const [semester, setSemester] = useState("Semester 4");
  const [result, setResult] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResult() {
      setResult(null);
      setSubjects([]);
      setLoading(true);
      try {
        const semesterNumber = semester.split(" ")[1];

        const docRef = doc(
          db,
          "results",
          `student001_sem${semesterNumber}`
        );
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setResult(docSnap.data());


        } else {
          setResult(null);
          setSubjects([]);
        }
        const subjectsRef = collection(
          db,
          "results",
          "student001_sem4",
          "subjects"
        );

        const subjectsSnap = await getDocs(subjectsRef);

        const subjectList = subjectsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSubjects(subjectList);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [semester]);
  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-blue-700">
          Loading Results...
        </h1>
      </div>
    );
  }
  if (!result) {
    return (
      <div className="p-8 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">
          Academic Results
        </h1>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <label className="block text-gray-700 font-medium mb-2">
              Select Semester
            </label>

            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full md:w-72 border rounded-lg p-3"
            >
              <option>Semester 1</option>
              <option>Semester 2</option>
              <option>Semester 3</option>
              <option>Semester 4</option>
              <option>Semester 5</option>
              <option>Semester 6</option>
              <option>Semester 7</option>
              <option>Semester 8</option>
            </select>
          </div>

          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold">
              No Results Available
            </h2>

            <p className="text-gray-600 mt-2">
              Results for <strong>{semester}</strong> have not been uploaded yet.
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="p-8 bg-gray-100 min-h-screen">

      <h1 className="text-3xl font-bold text-blue-700 mb-6">
        Academic Results
      </h1>

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <h2 className="text-2xl font-semibold mb-6">
          Semester Results
        </h2>

        <div className="mb-8">
          <label className="block text-gray-700 font-medium mb-2">
            Select Semester
          </label>

          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full md:w-72 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option>Semester 1</option>
            <option>Semester 2</option>
            <option>Semester 3</option>
            <option>Semester 4</option>
            <option>Semester 5</option>
            <option>Semester 6</option>
            <option>Semester 7</option>
            <option>Semester 8</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* SGPA Card */}
          <div className="bg-blue-600 text-white rounded-2xl shadow-lg p-6">
            <p className="text-lg font-medium">SGPA</p>

            <h2 className="text-4xl font-bold mt-2">
              {result?.sgpa}
            </h2>

            <p className="text-blue-100 mt-2">
              Semester Grade Point Average
            </p>
          </div>

          {/* CGPA Card */}
          <div className="bg-green-600 text-white rounded-2xl shadow-lg p-6">
            <p className="text-lg font-medium">CGPA</p>

            <h2 className="text-4xl font-bold mt-2">
              {result?.cgpa}
            </h2>

            <p className="text-green-100 mt-2">
              Cumulative Grade Point Average
            </p>
          </div>
          {/* Status Card */}
          <div className="bg-yellow-500 text-white rounded-2xl shadow-lg p-6">
            <p className="text-lg font-medium">Status</p>

            <h2 className="text-3xl font-bold mt-2">
              {result?.status}
            </h2>

            <p className="mt-2">
              Examination Result
            </p>
          </div>
          {/* Percentage Card */}
          <div className="bg-purple-600 text-white rounded-2xl shadow-lg p-6">
            <p className="text-lg font-medium">Percentage</p>

            <h2 className="text-3xl font-bold mt-2">
              {result?.percentage}%
            </h2>

            <p className="mt-2">
              Overall Percentage
            </p>
          </div>

        </div>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-4 text-left">Subject</th>
                  <th className="p-4">Internal</th>
                  <th className="p-4">External</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Grade</th>
                </tr>
              </thead>

              <tbody>

                {subjects.map((subject) => (
                  <tr key={subject.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{subject.name}</td>

                    <td className="text-center">
                      {subject.internal}
                    </td>

                    <td className="text-center">
                      {subject.external}
                    </td>

                    <td className="text-center font-semibold">
                      {subject.total}
                    </td>

                    <td className="text-center font-bold text-green-600">
                      {subject.grade}
                    </td>
                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>
      </div>

    </div>
  );
}