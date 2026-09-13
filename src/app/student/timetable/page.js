"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  CalendarDays,
  Clock,
  User,
  MapPin,
  ArrowLeft,
} from "lucide-react";

import { db } from "@/lib/firebase";
import PageHeader from "@/components/PageHeader";
import { useRouter } from "next/navigation";

export default function StudentTimetable() {
  const router = useRouter();
  const [semester, setSemester] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const unsubscribe = onAuthStateChanged(
    auth,
    (user) => {
      if (user) {
        fetchTimetable(user);
      } else {
        setSemester(null);
        setDays([]);
        setLoading(false);
      }
    }
  );

  return () => unsubscribe();
}, []);

 async function fetchTimetable(user) {
  try {
    console.log("User:", user);

      const studentRef = doc(
        db,
        "students",
        user.uid
      );

      const studentSnap = await getDoc(studentRef);

      console.log("Student exists:", studentSnap.exists());

      if (!studentSnap.exists()) {
        console.log("Student document NOT found");
        return;
      }

      const student = studentSnap.data();

   const semesterId = student.semester
  .toLowerCase()
  .replace(/\s+/g, "");

console.log("Semester:", student.semester);
console.log("Semester ID:", semesterId);


    const semRef = doc(
  db,
  "timetable",
  semesterId
);
      const semSnap = await getDoc(semRef);
      console.log("Semester exists:", semSnap.exists());

      if (!semSnap.exists()) {
        setSemester(null);
        setDays([]);
        return;
      }

      setSemester(semSnap.data());

     const daysRef = collection(
  db,
  "timetable",
  semesterId,
  "days"
);

      const snap = await getDocs(daysRef);

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      const order = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];

      data.sort(
        (a, b) => order.indexOf(a.id) - order.indexOf(b.id)
      );

      setDays(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function badge(type) {
    switch (type) {
      case "Lab":
        return "bg-green-100 text-green-700";
      case "Break":
        return "bg-yellow-100 text-yellow-700";
      case "Project":
        return "bg-purple-100 text-purple-700";
      case "Training":
        return "bg-pink-100 text-pink-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!semester) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center">
          <h1 className="text-3xl font-bold">
            Timetable Not Available
          </h1>

          <p className="text-gray-500 mt-3">
            Timetable has not been uploaded yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <PageHeader
        title="Class Timetable"
        subtitle="Weekly lecture schedule"
      />

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 flex justify-between items-center">

        <div>
          <p className="text-gray-500">
            Current Semester
          </p>

          <h2 className="text-3xl font-bold">
            {semester.semester}
          </h2>
        </div>

        <CalendarDays
          size={50}
          className="text-blue-600"
        />

      </div>

      <div className="space-y-8">

        {days.map((day) => (

          <div
            key={day.id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >

            <div className="bg-slate-800 text-white px-6 py-4">

              <h2 className="text-2xl font-bold capitalize">
                {day.id}
              </h2>

            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 p-6">

              {[
                day.period1,
                day.period2,
                day.period3,
                day.period4,
                day.period5,
                day.period6,
              ].map((lecture = {}, index) => (

                <div
                  key={index}
                  className="rounded-xl border bg-white shadow-sm hover:shadow-lg transition p-5"
                >

                  <div className="flex justify-between items-center">

                    <h3 className="font-bold">
                      Period {index + 1}
                    </h3>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${badge(lecture.type || "Theory")}`}
                    >
                      {lecture.type || "Theory"}
                    </span>

                  </div>

                  <h4 className="text-xl font-bold mt-4">
                    {lecture.subject || "-"}
                  </h4>

                  <div className="space-y-2 mt-5 text-sm text-gray-600">

                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      {lecture.time || "-"}
                    </div>

                    <div className="flex items-center gap-2">
                      <User size={16} />
                      {lecture.faculty || "-"}
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      {lecture.room || "-"}
                    </div>

                  </div>

                </div>

              ))}

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}