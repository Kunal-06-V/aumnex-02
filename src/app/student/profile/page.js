"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function StudentProfile() {
  const [student, setStudent] = useState(null);
const router = useRouter();
  useEffect(() => {
    async function fetchStudent() {
      const docRef = doc(db, "students", "student001");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setStudent(docSnap.data());
      }
    }

    fetchStudent();
  }, []);

  if (!student) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-blue-700">
          Loading...
        </h1>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">
        Student Profile
      </h1>

      <div className="bg-white rounded-2xl shadow-lg p-8">

        {/* Header */}
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-bold">
            {student.name?.charAt(0)}
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              {student.name}
            </h2>

            <p className="text-gray-500">
              {student.department}
            </p>
          </div>
        </div>

        {/* Academic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-semibold">{student.email}</p>
          </div>

          <div>
            <p className="text-gray-500">Roll Number</p>
            <p className="font-semibold">{student.rollNo}</p>
          </div>

          <div>
            <p className="text-gray-500">Semester</p>
            <p className="font-semibold">{student.semester}</p>
          </div>

          <div>
            <p className="text-gray-500">CGPA</p>
            <p className="font-semibold">{student.cgpa}</p>
          </div>

          <div>
            <p className="text-gray-500">Attendance</p>
            <p className="font-semibold">{student.attendance}%</p>
          </div>

        </div>

        {/* Personal Information */}
        <div className="border-t mt-8 pt-8">
          <h3 className="text-xl font-semibold mb-6">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-semibold">
                {student.phone || "Not Added"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Division</p>
              <p className="font-semibold">
                {student.division || "Not Added"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Batch</p>
              <p className="font-semibold">
                {student.batch || "Not Added"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Date of Birth</p>
              <p className="font-semibold">
                {student.dob || "Not Added"}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-gray-500">Address</p>
              <p className="font-semibold">
                {student.address || "Not Added"}
              </p>
            </div>

          </div>
        </div>

        {/* Edit Button */}
        <div className="mt-8 flex justify-end">
          <button
             onClick={() => router.push("/student/profile/edit")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition">
            Edit Profile
           </button>
        </div>

      </div>
    </div>
  );
}