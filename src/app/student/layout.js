"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";

import StudentSidebar from "@/components/StudentSidebar";
import Topbar from "@/components/Topbar";

export default function StudentLayout({ children }) {
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          router.replace("/");
          return;
        }

        try {
          if (active) {
            setLoading(true);
            setAuthorized(false);
            setStudent(null);
          }

          /*
           * Student authorization is based on the
           * authenticated Firebase UID having a
           * corresponding student document.
           */
          const studentRef = doc(
            db,
            "students",
            user.uid
          );

          const studentSnap = await getDoc(
            studentRef
          );

          if (!studentSnap.exists()) {
            console.warn(
              "Student profile not found for authenticated user."
            );

            if (active) {
              setAuthorized(false);
              setStudent(null);
              setLoading(false);
            }

            router.replace("/");
            return;
          }

          const studentData = {
            uid: user.uid,
            ...studentSnap.data(),
          };

          if (active) {
            setStudent(studentData);
            setAuthorized(true);
            setLoading(false);
          }
        } catch (error) {
          console.error(
            "Student authorization error:",
            error
          );

          if (active) {
            setAuthorized(false);
            setStudent(null);
            setLoading(false);
          }

          router.replace("/");
        }
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  /*
   * Never render the student application
   * before authentication + authorization
   * has been verified.
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg px-8 py-6 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-gray-600 font-medium">
            Verifying student access...
          </p>
        </div>
      </div>
    );
  }

  /*
   * Extra protection in case the auth state changes
   * or authorization fails after loading.
   */
  if (!authorized || !student) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <StudentSidebar />

      <main className="ml-64 p-6">
        <Topbar student={student} />
        {children}
      </main>
    </div>
  );
}