"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import {
  User,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  LogOut,
  Lock,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";

export default function StudentSettings() {
  const router = useRouter();

  const [student, setStudent] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      const snap = await getDoc(
        doc(db, "students", "student001")
      );

      if (snap.exists()) {
        setStudent(snap.data());
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleLogout() {
    await signOut(auth);
    router.push("/");
  }
    return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-3xl mx-auto">

        {/* Header */}

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">

          <h1 className="text-3xl font-bold">
            Settings
          </h1>

          <p className="text-gray-500 mt-2">
            Manage your account and profile
          </p>

        </div>

        {/* Profile Card */}

        <div className="bg-white rounded-2xl shadow-lg p-8">

          <div className="flex flex-col items-center">

            <div className="w-28 h-28 rounded-full bg-blue-100 flex items-center justify-center">

              <User
                size={55}
                className="text-blue-600"
              />

            </div>

            <h2 className="text-2xl font-bold mt-4">
              {student?.name}
            </h2>

            <p className="text-gray-500">
              {student?.email}
            </p>

          </div>

          <div className="grid md:grid-cols-2 gap-5 mt-8">

            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
              <Mail className="text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <h3 className="font-semibold">
                  {student?.email}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
              <Phone className="text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <h3 className="font-semibold">
                  {student?.phone || "Not Available"}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
              <GraduationCap className="text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <h3 className="font-semibold">
                  {student?.department || "Computer Engineering"}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
              <BookOpen className="text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">Semester</p>
                <h3 className="font-semibold">
                  Semester {student?.semester}
                </h3>
              </div>
            </div>

          </div>

          {/* Action Buttons */}

          <div className="grid md:grid-cols-2 gap-4 mt-8">

            <button
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
            >
              <Lock size={18} />
              Change Password
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold"
            >
              <LogOut size={18} />
              Logout
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}