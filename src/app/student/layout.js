"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";

import StudentSidebar from "@/components/StudentSidebar";
import Topbar from "@/components/Topbar";

export default function StudentLayout({ children }) {
  const [student, setStudent] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      try {
        const docRef = doc(db, "students", "student001");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setStudent(docSnap.data());
        }
      } catch (error) {
        console.error(error);
      }
    });

    return () => unsubscribe();
  }, [router]);

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