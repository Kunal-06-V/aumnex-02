"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  CalendarDays,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";

const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const periods = [
  "period1",
  "period2",
  "period3",
  "period4",
  "period5",
  "period6",
];

export default function AdminTimetablePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedDay, setSelectedDay] = useState("monday");
  const [selectedSemester, setSelectedSemester] = useState("semester4");

  const [data, setData] = useState({});

  useEffect(() => {
  fetchTimetable();
}, [selectedSemester]);

  async function fetchTimetable() {
    try {
      setLoading(true);

      const timetable = {};

      for (const day of days) {

  const ref = doc(
    db,
    "timetable",
    selectedSemester,
    "days",
    day
  );

        const snap = await getDoc(ref);

        timetable[day] = snap.exists()
          ? snap.data()
          : {};
      }

      setData(timetable);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(period, field, value) {
    setData((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [period]: {
          ...prev[selectedDay][period],
          [field]: value,
        },
      },
    }));
  }

  async function saveDay() {
    try {
      setSaving(true);

      const ref = doc(
  db,
  "timetable",
  selectedSemester,
  "days",
  selectedDay
);

      await updateDoc(ref, data[selectedDay]);

      toast.success("Timetable updated successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save timetable.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
  return (
    <div className="flex justify-center items-center h-64 text-lg font-medium">
      Loading timetable...
    </div>
  );
}

  return (
    <div className="space-y-6">
<div className="flex justify-between items-center">

  <div>
    <h1 className="text-3xl font-bold">
      Manage Timetable
    </h1>

    <p className="text-gray-500">
      Edit timetable for the selected semester
    </p>
  </div>

  <div className="flex items-center gap-4">

    <select
      value={selectedSemester}
      onChange={(e) => setSelectedSemester(e.target.value)}
      className="border rounded-xl px-4 py-2"
    >
      <option value="semester1">Semester 1</option>
      <option value="semester2">Semester 2</option>
      <option value="semester3">Semester 3</option>
      <option value="semester4">Semester 4</option>
      <option value="semester5">Semester 5</option>
      <option value="semester6">Semester 6</option>
      <option value="semester7">Semester 7</option>
      <option value="semester8">Semester 8</option>
    </select>

    <button
      onClick={saveDay}
      disabled={saving}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2"
    >
      <Save size={18} />
      {saving ? "Saving..." : "Save Changes"}
    </button>

  </div>

</div>

      <div className="bg-white rounded-2xl shadow-md p-6">

        <div className="flex gap-3 flex-wrap mb-6">

          {days.map((day) => (

            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-5 py-2 rounded-xl capitalize ${
                selectedDay === day
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              {day}
            </button>

          ))}

        </div>

        <div className="space-y-5">

          {periods.map((period, index) => {

            const lecture =
              data[selectedDay]?.[period] || {};

            return (

              <div
                key={period}
                className="border rounded-2xl p-5"
              >

                <div className="flex items-center gap-3 mb-4">

                  <CalendarDays
                    size={20}
                    className="text-blue-600"
                  />

                  <h2 className="font-bold text-lg">
                    Period {index + 1}
                  </h2>

                </div>

                <div className="grid md:grid-cols-2 gap-4">                  <input
                    type="text"
                    placeholder="Subject"
                    value={lecture.subject || ""}
                    onChange={(e) =>
                      handleChange(
                        period,
                        "subject",
                        e.target.value
                      )
                    }
                    className="border rounded-xl p-3"
                  />

                  <input
                    type="text"
                    placeholder="Time"
                    value={lecture.time || ""}
                    onChange={(e) =>
                      handleChange(
                        period,
                        "time",
                        e.target.value
                      )
                    }
                    className="border rounded-xl p-3"
                  />

                  <input
                    type="text"
                    placeholder="Faculty"
                    value={lecture.faculty || ""}
                    onChange={(e) =>
                      handleChange(
                        period,
                        "faculty",
                        e.target.value
                      )
                    }
                    className="border rounded-xl p-3"
                  />

                  <input
                    type="text"
                    placeholder="Room"
                    value={lecture.room || ""}
                    onChange={(e) =>
                      handleChange(
                        period,
                        "room",
                        e.target.value
                      )
                    }
                    className="border rounded-xl p-3"
                  />

                  <select
                    value={lecture.type || "Theory"}
                    onChange={(e) =>
                      handleChange(
                        period,
                        "type",
                        e.target.value
                      )
                    }
                    className="border rounded-xl p-3 md:col-span-2"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Lab">Lab</option>
                    <option value="Break">Break</option>
                    <option value="Project">Project</option>
                    <option value="Training">Training</option>
                    <option value="Library">Library</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Sports">Sports</option>
                    <option value="Mentoring">Mentoring</option>
                  </select>

                </div>

              </div>

            );
          })}

        </div>

      </div>

    </div>
  );
}
                