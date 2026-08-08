"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Hash,
  CalendarDays,
  MapPin,
  Pencil,
  AlertTriangle,
} from "lucide-react";

import PageHeader from "@/components/PageHeader";

export default function StudentProfile() {
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          router.push("/");
          return;
        }

        const studentRef = doc(
          db,
          "students",
          user.uid
        );

        const studentSnap = await getDoc(studentRef);

        if (studentSnap.exists()) {
          setStudent(studentSnap.data());
        } else {
          setStudent(null);
        }
      } catch (error) {
        console.error("Failed to load student profile:", error);
        setStudent(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="space-y-6">

        <PageHeader
          title="Student Profile"
          subtitle="View your personal and academic information"
        />

        <div className="bg-white rounded-2xl shadow-lg p-8 animate-pulse">

          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-gray-200" />

            <div className="space-y-3">
              <div className="h-6 bg-gray-200 rounded w-48" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item}>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-5 bg-gray-200 rounded w-40" />
              </div>
            ))}
          </div>

        </div>
      </div>
    );
  }

  // =========================
  // PROFILE NOT FOUND
  // =========================

  if (!student) {
    return (
      <div className="space-y-6">

        <PageHeader
          title="Student Profile"
          subtitle="View your personal and academic information"
        />

        <div className="flex justify-center items-center min-h-[50vh]">

          <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md">

            <AlertTriangle
              size={55}
              className="mx-auto text-yellow-500 mb-5"
            />

            <h1 className="text-2xl font-bold text-slate-800">
              Profile Not Found
            </h1>

            <p className="text-gray-500 mt-3">
              Your student profile could not be found.
              Please contact the administration.
            </p>

          </div>

        </div>
      </div>
    );
  }

  // =========================
  // PROFILE
  // =========================

  const firstLetter =
    student.name?.charAt(0)?.toUpperCase() || "S";

  return (
    <div className="space-y-6">

      <PageHeader
        title="Student Profile"
        subtitle="View your personal and academic information"
      />

      {/* PROFILE HEADER */}

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          <div className="flex items-center gap-6">

            <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-bold">
              {firstLetter}
            </div>

            <div>

              <h2 className="text-3xl font-bold text-slate-800">
                {student.name || "Student"}
              </h2>

              <p className="text-gray-500 mt-1">
                {student.department || "Department not available"}
              </p>

              <p className="text-sm text-gray-400 mt-1">
                {student.semester || "Semester not available"}
              </p>

            </div>

          </div>

          <button
            onClick={() =>
              router.push("/student/profile/edit")
            }
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition"
          >
            <Pencil size={18} />
            Edit Profile
          </button>

        </div>

      </div>

      {/* ACADEMIC INFORMATION */}

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <div className="flex items-center gap-3 mb-6">

          <GraduationCap
            size={25}
            className="text-blue-600"
          />

          <h2 className="text-2xl font-semibold">
            Academic Information
          </h2>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <ProfileField
            icon={<Mail size={18} />}
            label="Email"
            value={student.email}
          />

          <ProfileField
            icon={<Hash size={18} />}
            label="Roll Number"
            value={student.rollNo}
          />

          <ProfileField
            icon={<GraduationCap size={18} />}
            label="Department"
            value={student.department}
          />

          <ProfileField
            icon={<GraduationCap size={18} />}
            label="Semester"
            value={student.semester}
          />

          <ProfileField
            icon={<Hash size={18} />}
            label="Division"
            value={student.division}
          />

          <ProfileField
            icon={<GraduationCap size={18} />}
            label="Batch"
            value={student.batch}
          />

          <ProfileField
            label="CGPA"
            value={student.cgpa}
          />

          <ProfileField
            label="Attendance"
            value={
              student.attendance !== undefined
                ? `${student.attendance}%`
                : null
            }
          />

        </div>

      </div>

      {/* PERSONAL INFORMATION */}

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <div className="flex items-center gap-3 mb-6">

          <User
            size={25}
            className="text-blue-600"
          />

          <h2 className="text-2xl font-semibold">
            Personal Information
          </h2>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <ProfileField
            icon={<Phone size={18} />}
            label="Phone"
            value={student.phone}
          />

          <ProfileField
            icon={<CalendarDays size={18} />}
            label="Date of Birth"
            value={student.dob}
          />

          <div className="md:col-span-2">

            <ProfileField
              icon={<MapPin size={18} />}
              label="Address"
              value={student.address}
            />

          </div>

        </div>

      </div>

    </div>
  );
}

// =========================
// REUSABLE FIELD COMPONENT
// =========================

function ProfileField({
  label,
  value,
  icon,
}) {
  return (
    <div>

      <div className="flex items-center gap-2 text-gray-500 mb-1">

        {icon}

        <p className="text-sm">
          {label}
        </p>

      </div>

      <p className="font-semibold text-slate-800">
        {value || "Not Added"}
      </p>

    </div>
  );
}