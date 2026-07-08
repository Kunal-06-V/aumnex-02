"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  CalendarCheck,
} from "lucide-react";

const emptyForm = {
  id: "",
  studentName: "",
  rollNo: "",
  semester: "Semester 4",
  percentage: "",
  present: "",
  absent: "",
  status: "Good",
};

export default function AttendancePage() {

  const [attendance, setAttendance] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchAttendance();
  }, []);

  useEffect(() => {
    const text = search.toLowerCase();

    setFiltered(
      attendance.filter(
        (item) =>
          item.studentName?.toLowerCase().includes(text) ||
          item.rollNo?.toLowerCase().includes(text)
      )
    );
  }, [search, attendance]);

  async function fetchAttendance() {
    setLoading(true);

    try {
      const snapshot = await getDocs(
        collection(db, "attendance")
      );

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAttendance(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  function resetForm() {
    setEditing(false);
    setShowForm(false);
    setForm(emptyForm);
  }

  async function handleSave() {

    if (!form.id || !form.studentName) {
      alert("Student ID and Name are required.");
      return;
    }

    try {

      if (editing) {

        await updateDoc(doc(db, "attendance", form.id), {
          studentName: form.studentName,
          rollNo: form.rollNo,
          semester: form.semester,
          percentage: form.percentage,
          present: form.present,
          absent: form.absent,
          status: form.status,
        });

        alert("Attendance updated.");

      } else {

        await setDoc(
          doc(db, "attendance", form.id),
          form
        );

        alert("Attendance added.");

      }

      resetForm();
      fetchAttendance();

    } catch (err) {

      console.error(err);
      alert("Operation failed.");

    }
  }

  async function handleDelete(id) {

    if (!confirm("Delete this attendance record?")) return;

    try {

      await deleteDoc(doc(db, "attendance", id));
      fetchAttendance();

    } catch (err) {

      console.error(err);
      alert("Delete failed.");

    }

  }

  function handleEdit(item) {

    setEditing(true);
    setShowForm(true);

    setForm({
      id: item.id,
      studentName: item.studentName || "",
      rollNo: item.rollNo || "",
      semester: item.semester || "Semester 4",
      percentage: item.percentage || "",
      present: item.present || "",
      absent: item.absent || "",
      status: item.status || "Good",
    });

  }

  return (

    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-3xl font-bold">
            Manage Attendance
          </h1>

          <p className="text-gray-500">
            Add, edit and manage attendance records
          </p>

        </div>

        <button
          onClick={() => {
            setEditing(false);
            setForm(emptyForm);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center gap-2"
        >
          <Plus size={18} />
          Add Attendance
        </button>

      </div>

      {showForm && (

        <div className="bg-white rounded-2xl shadow-md p-6">

          <div className="flex justify-between mb-6">

            <h2 className="text-2xl font-bold">
              {editing ? "Edit Attendance" : "Add Attendance"}
            </h2>

            <button onClick={resetForm}>
              <X />
            </button>

          </div>

          <div className="grid md:grid-cols-2 gap-4">

            <input
              placeholder="Student ID"
              disabled={editing}
              value={form.id}
              onChange={(e) =>
                setForm({ ...form, id: e.target.value })
              }
              className="border rounded-xl p-3"
            />

            <input
              placeholder="Student Name"
              value={form.studentName}
              onChange={(e) =>
                setForm({
                  ...form,
                  studentName: e.target.value,
                })
              }
              className="border rounded-xl p-3"
            />

            <input
              placeholder="Roll No"
              value={form.rollNo}
              onChange={(e) =>
                setForm({
                  ...form,
                  rollNo: e.target.value,
                })
              }
              className="border rounded-xl p-3"
            />
                        <input
              placeholder="Percentage"
              value={form.percentage}
              onChange={(e) =>
                setForm({ ...form, percentage: e.target.value })
              }
              className="border rounded-xl p-3"
            />

            <input
              placeholder="Present Classes"
              value={form.present}
              onChange={(e) =>
                setForm({ ...form, present: e.target.value })
              }
              className="border rounded-xl p-3"
            />

            <input
              placeholder="Absent Classes"
              value={form.absent}
              onChange={(e) =>
                setForm({ ...form, absent: e.target.value })
              }
              className="border rounded-xl p-3"
            />

            <select
              value={form.semester}
              onChange={(e) =>
                setForm({ ...form, semester: e.target.value })
              }
              className="border rounded-xl p-3"
            >
              <option>Semester 1</option>
              <option>Semester 2</option>
              <option>Semester 3</option>
              <option>Semester 4</option>
              <option>Semester 5</option>
              <option>Semester 6</option>
              <option>Semester 7</option>
              <option>Semester 8</option>
            </select>

            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value })
              }
              className="border rounded-xl p-3 md:col-span-2"
            >
              <option>Excellent</option>
              <option>Good</option>
              <option>Average</option>
              <option>Poor</option>
            </select>

          </div>

          <div className="mt-6 flex gap-3">

            <button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
            >
              {editing ? "Update Attendance" : "Save Attendance"}
            </button>

            <button
              onClick={resetForm}
              className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-xl"
            >
              Cancel
            </button>

          </div>

        </div>

      )}

      <div className="bg-white rounded-2xl shadow-md p-5">

        <div className="relative mb-6">

          <Search
            size={18}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search by Student Name or Roll No"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

        {loading ? (

          <p className="text-center py-10">
            Loading Attendance...
          </p>

        ) : filtered.length === 0 ? (

          <div className="text-center py-10">

            <CalendarCheck
              size={48}
              className="mx-auto text-gray-400 mb-4"
            />

            <p>No Attendance Records Found.</p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-100">

                <tr>
                  <th className="text-left p-4">Student</th>
                  <th className="text-left p-4">Roll No</th>
                  <th className="text-left p-4">Semester</th>
                  <th className="text-left p-4">Present</th>
                  <th className="text-left p-4">Absent</th>
                  <th className="text-left p-4">%</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-center p-4">Actions</th>
                </tr>

              </thead>

              <tbody>

                {filtered.map((item) => (

                  <tr
                    key={item.id}
                    className="border-b hover:bg-gray-50"
                  >

                    <td className="p-4 font-medium">
                      {item.studentName}
                    </td>

                    <td className="p-4">
                      {item.rollNo}
                    </td>

                    <td className="p-4">
                      {item.semester}
                    </td>

                    <td className="p-4">
                      {item.present}
                    </td>

                    <td className="p-4">
                      {item.absent}
                    </td>

                    <td className="p-4">
                      {item.percentage}%
                    </td>

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          item.status === "Excellent"
                            ? "bg-green-100 text-green-700"
                            : item.status === "Good"
                            ? "bg-blue-100 text-blue-700"
                            : item.status === "Average"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status}
                      </span>

                    </td>

                    <td className="p-4">

                      <div className="flex justify-center gap-3">

                        <button
                          onClick={() => handleEdit(item)}
                          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 p-2 rounded-lg"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>

  );

}