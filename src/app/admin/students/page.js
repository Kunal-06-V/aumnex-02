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
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const emptyForm = {
  id: "",
  name: "",
  rollNo: "",
  prn: "",
  email: "",
  phone: "",
  department: "",
  semester: "",
};

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const text = search.toLowerCase();

    setFiltered(
      students.filter(
        (student) =>
          student.name?.toLowerCase().includes(text) ||
          student.rollNo?.toLowerCase().includes(text) ||
          student.prn?.toLowerCase().includes(text)
      )
    );
  }, [search, students]);

  async function fetchStudents() {
    setLoading(true);

    try {
      const snapshot = await getDocs(collection(db, "students"));

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setStudents(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditing(false);
    setShowForm(false);
  }

  async function handleSave() {
    if (!form.id || !form.name) {
     toast.error("Student ID and Name are required.");
      return;
    }

    try {
      if (editing) {
        await updateDoc(doc(db, "students", form.id), {
          name: form.name,
          rollNo: form.rollNo,
          prn: form.prn,
          email: form.email,
          phone: form.phone,
          department: form.department,
          semester: form.semester,
        });

        toast.success("Student updated successfully.");
      } else {
        await setDoc(doc(db, "students", form.id), form);

        toast.success("Student added successfully.");
      }

      resetForm();
      fetchStudents();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save student.");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this student?")) return;

    try {
      await deleteDoc(doc(db, "students", id));

      fetchStudents();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete student.");
    }
  }

  function handleEdit(student) {
    setEditing(true);
    setShowForm(true);

    setForm({
      id: student.id,
      name: student.name || "",
      rollNo: student.rollNo || "",
      prn: student.prn || "",
      email: student.email || "",
      phone: student.phone || "",
      department: student.department || "",
      semester: student.semester || "",
    });
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-3xl font-bold">
            Manage Students
          </h1>

          <p className="text-gray-500">
            Add, edit and delete students
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
          Add Student
        </button>

      </div>

      {showForm && (

        <div className="bg-white rounded-2xl shadow-md p-6">

          <div className="flex justify-between mb-6">

            <h2 className="text-2xl font-bold">
              {editing ? "Edit Student" : "Add Student"}
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
              onChange={(e)=>
                setForm({...form,id:e.target.value})
              }
              className="border rounded-xl p-3"
            />

            <input
              placeholder="Student Name"
              value={form.name}
              onChange={(e)=>
                setForm({...form,name:e.target.value})
              }
              className="border rounded-xl p-3"
            />

            <input
              placeholder="Roll No"
              value={form.rollNo}
              onChange={(e)=>
                setForm({...form,rollNo:e.target.value})
              }
              className="border rounded-xl p-3"
            />

            <input
              placeholder="PRN"
              value={form.prn}
              onChange={(e)=>
                setForm({...form,prn:e.target.value})
              }
              className="border rounded-xl p-3"
            />

            <input
              placeholder="Email"
              value={form.email}
              onChange={(e)=>
                setForm({...form,email:e.target.value})
              }
              className="border rounded-xl p-3"
            />

            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e)=>
                setForm({...form,phone:e.target.value})
              }
              className="border rounded-xl p-3"
            />
                        <input
              placeholder="Department"
              value={form.department}
              onChange={(e) =>
                setForm({ ...form, department: e.target.value })
              }
              className="border rounded-xl p-3"
            />

            <input
              placeholder="Semester"
              value={form.semester}
              onChange={(e) =>
                setForm({ ...form, semester: e.target.value })
              }
              className="border rounded-xl p-3"
            />

          </div>

          <div className="mt-6 flex gap-3">

            <button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
            >
              {editing ? "Update Student" : "Save Student"}
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
            placeholder="Search by Name, Roll No or PRN"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

        {loading ? (
          <p className="text-center py-10">Loading students...</p>
        ) : filtered.length === 0 ? (

          <div className="text-center py-10">

            <Users
              size={48}
              className="mx-auto text-gray-400 mb-4"
            />

            <p>No students found.</p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-100">

                <tr>

                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Roll No</th>
                  <th className="text-left p-4">PRN</th>
                  <th className="text-left p-4">Department</th>
                  <th className="text-left p-4">Semester</th>
                  <th className="text-center p-4">Actions</th>

                </tr>

              </thead>

              <tbody>

                {filtered.map((student) => (

                  <tr
                    key={student.id}
                    className="border-b hover:bg-gray-50"
                  >

                    <td className="p-4 font-medium">
                      {student.name}
                    </td>

                    <td className="p-4">
                      {student.rollNo}
                    </td>

                    <td className="p-4">
                      {student.prn}
                    </td>

                    <td className="p-4">
                      {student.department}
                    </td>

                    <td className="p-4">
                      {student.semester}
                    </td>

                    <td className="p-4">

                      <div className="flex justify-center gap-3">

                        <button
                          onClick={() => handleEdit(student)}
                          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 p-2 rounded-lg"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          onClick={() => handleDelete(student.id)}
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