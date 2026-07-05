"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { CalendarDays, Clock } from "lucide-react";

import { db } from "@/lib/firebase";
import PageHeader from "@/components/PageHeader";

export default function StudentTimetable() {
  const [semester, setSemester] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimetable();
  }, []);

  async function fetchTimetable() {
    try {
      setLoading(true);

      const semRef = doc(db, "timetable", "semester4");
      const semSnap = await getDoc(semRef);

      if (!semSnap.exists()) {
        setSemester(null);
        setDays([]);
        return;
      }

      setSemester(semSnap.data());

      const daysRef = collection(db, "timetable", "semester4", "days");
      const daySnap = await getDocs(daysRef);

      const dayList = daySnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const order = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];

      dayList.sort(
        (a, b) => order.indexOf(a.id) - order.indexOf(b.id)
      );

      setDays(dayList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-300 rounded w-72"></div>

          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl h-44 shadow"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (!semester) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center">
          <h1 className="text-3xl font-bold">
            Timetable Not Available
          </h1>

          <p className="text-gray-500 mt-3">
            Timetable has not been uploaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">

      <PageHeader
        title="Class Timetable"
        subtitle="Weekly lecture schedule"
      />

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 flex items-center justify-between">

        <div>

          <p className="text-gray-500">
            Current Semester
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {semester.semester}
          </h2>

        </div>

        <CalendarDays
          size={55}
          className="text-blue-600"
        />

      </div>

      <div className="space-y-6">

        {days.map((day) => (

          <div
            key={day.id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >

            <div className="bg-slate-800 text-white px-6 py-4">

              <h2 className="text-xl font-bold capitalize">
                {day.id}
              </h2>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 p-6">

              {[
                day.period1,
                day.period2,
                day.period3,
                day.period4,
                day.period5,
                day.period6,
              ].map((lecture, index) => (

                <div
                  key={index}
                  className={`rounded-xl p-5 border transition hover:shadow-md ${
                    lecture === "Break"
                      ? "bg-yellow-50 border-yellow-300"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >

                  <div className="flex items-center justify-between mb-3">

                    <h3 className="font-semibold">
                      Period {index + 1}
                    </h3>

                    <Clock size={18} />

                  </div>

                  <p className="font-medium">

                    {lecture}

                  </p>

                </div>

              ))}

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}