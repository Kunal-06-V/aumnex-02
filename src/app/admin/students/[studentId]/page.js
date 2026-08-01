"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  GraduationCap,
  CalendarCheck,
} from "lucide-react";

export default function StudentProfile() {

  const { studentId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [student, setStudent] = useState(null);

  const [attendance, setAttendance] = useState({
    present: 0,
    absent: 0,
    leave: 0,
    percentage: 0,
  });

  const [recentAttendance, setRecentAttendance] = useState([]);

  useEffect(() => {
    loadStudent();
  }, []);

  async function loadStudent() {

    try {

      const studentRef = doc(
        db,
        "students",
        studentId
      );

      const studentSnap = await getDoc(studentRef);

      if (!studentSnap.exists()) {
        setLoading(false);
        return;
      }

      setStudent({
        id: studentSnap.id,
        ...studentSnap.data(),
      });

      let present = 0;
      let absent = 0;
      let leave = 0;

      const history = [];

      const sessionsSnap = await getDocs(
        collection(db, "attendanceSessions")
      );

      for (const sessionDoc of sessionsSnap.docs) {

        const session = sessionDoc.data();

        const attendanceRef = doc(
          db,
          "attendanceSessions",
          sessionDoc.id,
          "students",
          studentId
        );

        const attendanceSnap =
          await getDoc(attendanceRef);

        if (!attendanceSnap.exists()) {
          continue;
        }

        const data = attendanceSnap.data();

        if (data.status === "Present") {
          present++;
        }

        else if (data.status === "Absent") {
          absent++;
        }

        else {
          leave++;
        }

        history.push({
          id: sessionDoc.id,
          subject: session.subject,
          date: session.date,
          status: data.status,
        });

      }

      history.sort((a, b) =>
        b.date.localeCompare(a.date)
      );

      const total =
        present + absent + leave;

      const percentage =
        total === 0
          ? 0
          : Math.round(
              (present / total) * 100
            );

      setAttendance({
        present,
        absent,
        leave,
        percentage,
      });

      setRecentAttendance(
        history.slice(0, 5)
      );

    }

    catch (err) {

      console.error(err);

    }

    finally {

      setLoading(false);

    }

  }

  if (loading) {

    return (

      <div className="p-10 text-center">

        Loading Student...

      </div>

    );

  }

  if (!student) {

    return (

      <div className="p-10 text-center">

        Student Not Found

      </div>

    );

  }

  return (

    <div className="space-y-8">
          {/* Header */}

      <div className="flex items-center justify-between">

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={20} />
          Back
        </button>

      </div>

      {/* Student Profile */}

     <div className="flex items-center justify-between">

  <div className="flex items-center gap-6">

    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">

      <User
        size={40}
        className="text-blue-600"
      />

    </div>

    <div>

      <h1 className="text-3xl font-bold">
        {student.name}
      </h1>

      <p className="text-gray-500">
        Roll No : {student.rollNo}
      </p>

      <p className="text-gray-500">
        UID : {student.id}
      </p>

    </div>

  </div>

  <div className="flex gap-3">

    <button
      onClick={() =>
        router.push(`/admin/students?edit=${student.id}`)
      }
      className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg"
    >
      Edit
    </button>

    <button
      className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
    >
      Delete
    </button>

  </div>

</div>

      {/* Student Details + Attendance */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Student Information */}

        <div className="bg-white rounded-2xl shadow-md p-6">

          <h2 className="text-xl font-bold mb-6">

            Student Information

          </h2>

          <div className="space-y-5">

            <div className="flex items-center gap-3">

              <Mail
                size={20}
                className="text-blue-600"
              />

              <span>

                {student.email || "N/A"}

              </span>

            </div>

            <div className="flex items-center gap-3">

              <Phone
                size={20}
                className="text-green-600"
              />

              <span>

                {student.phone || "N/A"}

              </span>

            </div>

            <div className="flex items-center gap-3">

              <GraduationCap
                size={20}
                className="text-purple-600"
              />

              <span>

                {student.department}

                {" • "}

                Semester {student.semester}

              </span>

            </div>

            <div>

              <span className="font-semibold">

                Division :

              </span>

              {" "}

              {student.division}

            </div>

          </div>

        </div>

        {/* Attendance Summary */}

        <div className="bg-white rounded-2xl shadow-md p-6">

          <h2 className="text-xl font-bold mb-6">

            Attendance Summary

          </h2>

          <div className="grid grid-cols-2 gap-4">

            <div className="bg-green-50 rounded-xl p-5 text-center">

              <p className="text-gray-500">

                Present

              </p>

              <h3 className="text-3xl font-bold text-green-600 mt-2">

                {attendance.present}

              </h3>

            </div>

            <div className="bg-red-50 rounded-xl p-5 text-center">

              <p className="text-gray-500">

                Absent

              </p>

              <h3 className="text-3xl font-bold text-red-600 mt-2">

                {attendance.absent}

              </h3>

            </div>

            <div className="bg-yellow-50 rounded-xl p-5 text-center">

              <p className="text-gray-500">

                Leave

              </p>

              <h3 className="text-3xl font-bold text-yellow-600 mt-2">

                {attendance.leave}

              </h3>

            </div>

            <div className="bg-blue-50 rounded-xl p-5 text-center">

              <p className="text-gray-500">

                Attendance %

              </p>

              <h3 className="text-3xl font-bold text-blue-600 mt-2">

                {attendance.percentage}%

              </h3>

            </div>

          </div>

        </div>

      </div>

      {/* Recent Attendance */}

      <div className="bg-white rounded-2xl shadow-md p-6">

        <div className="flex items-center justify-between mb-6">

          <h2 className="text-xl font-bold">

            Recent Attendance

          </h2>

          <CalendarCheck
            size={22}
            className="text-blue-600"
          />

        </div>

        {recentAttendance.length === 0 ? (

          <div className="text-center py-8 text-gray-500">

            No Attendance Found

          </div>

        ) : (

          <div className="space-y-4">

            {recentAttendance.map((item) => (
                              <div
                key={item.id}
                className="border rounded-xl p-4 flex justify-between items-center"
              >

                <div>

                  <h3 className="font-semibold">

                    {item.subject}

                  </h3>

                  <p className="text-sm text-gray-500">

                    {item.date}

                  </p>

                </div>

                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    item.status === "Present"
                      ? "bg-green-100 text-green-700"
                      : item.status === "Absent"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {item.status}
                </span>

              </div>

            ))}

          </div>

        )}

      </div>
<div className="bg-white rounded-2xl shadow-md p-6">

  <h2 className="text-xl font-bold mb-6">
    Quick Actions
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

    <button
      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-4"
      onClick={() =>
        router.push(`/admin/attendance/history?student=${student.id}`)
      }
    >
      Attendance
    </button>

    <button
      className="bg-green-600 hover:bg-green-700 text-white rounded-xl py-4"
      onClick={() =>
        router.push(`/admin/results?student=${student.id}`)
      }
    >
      Results
    </button>

    <button
      className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl py-4"
      onClick={() =>
        router.push(`/admin/fees?student=${student.id}`)
      }
    >
      Fees
    </button>

    <button
      className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-4"
      onClick={() =>
        router.push(`/admin/timetable`)
      }
    >
      Timetable
    </button>

  </div>

</div>
    </div>

  );

}