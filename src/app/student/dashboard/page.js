"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";

import ProfileCard from "@/components/ProfileCard";
import DashboardCard from "@/components/DashboardCard";
import AttendanceChart from "@/components/AttendanceChart";
import CGPAChart from "@/components/CGPAChart";
import Timetable from "@/components/Timetable";
import NotificationPanel from "@/components/NotificationPanel";
import QuickActions from "@/components/QuickActions";

export default function StudentDashboard() {
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
  <div className="bg-gray-100 min-h-screen">
        

        <p className="text-gray-600 mb-6">
          Logged in as: {student?.email}
        </p>

        {/* Row 1 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <ProfileCard student={student} />

          <div className="xl:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DashboardCard
                title="CGPA"
                value={student?.cgpa || "Loading..."}
                color="text-green-600"
              />

              <DashboardCard
                title="Attendance"
                value={
                  student ? `${student.attendance}%` : "Loading..."
                }
                color="text-blue-600"
              />

              <DashboardCard
                title="Semester"
                value={student?.semester || "Loading..."}
              />

              <DashboardCard
                title="Roll Number"
                value={student?.rollNo || "Loading..."}
              />
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
          <AttendanceChart attendance={student?.attendance} />

          <CGPAChart cgpa={student?.cgpa} />
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
          <Timetable />

          <NotificationPanel />
        </div>
        {/* Row 4 */}
       <div className="mt-8">
         <QuickActions />
       </div>
      
    </div>
  );
}