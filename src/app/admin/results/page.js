"use client";

import { useEffect, useMemo, useState } from "react";

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
  GraduationCap,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

import toast from "react-hot-toast";

const emptyForm = {
  id: "",
  studentName: "",
  rollNo: "",
  department: "",
  semester: "",
  sgpa: "",
  cgpa: "",
  failedSubjects: 0,
  status: "",
};

export default function ResultsPage() {

  const [results, setResults] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchStudents();
    fetchResults();
  }, []);

  useEffect(() => {

    const text = search.toLowerCase();

    setFiltered(
      results.filter(
        (item) =>
          item.studentName?.toLowerCase().includes(text) ||
          item.rollNo?.toLowerCase().includes(text)
      )
    );

  }, [search, results]);

  async function fetchStudents() {

    try {

      const snapshot = await getDocs(
        collection(db, "students")
      );

      const data = snapshot.docs.map((student) => ({
        id: student.id,
        ...student.data(),
      }));

      data.sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setStudents(data);

    } catch (err) {

      console.error(err);
      toast.error("Failed to load students.");

    }

  }

  async function fetchResults() {

    setLoading(true);

    try {

      const snapshot = await getDocs(
        collection(db, "results")
      );

      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      setResults(data);
      setFiltered(data);

    } catch (err) {

      console.error(err);
      toast.error("Failed to load results.");

    }

    setLoading(false);

  }

  const stats = useMemo(() => {

    return {

      total: results.length,

      pass: results.filter(
        (r) => r.status === "PASS"
      ).length,

      fail: results.filter(
        (r) => r.status === "FAIL"
      ).length,

      atkt: results.filter(
        (r) => r.status === "ATKT"
      ).length,

    };

  }, [results]);
  function resetForm() {

  setEditing(false);
  setShowForm(false);
  setForm(emptyForm);

}

function selectStudent(studentId) {

  const student = students.find(
    (item) => item.id === studentId
  );

  if (!student) return;

 setForm({

  ...form,

  id: student.id,

  studentName: student.name,

  rollNo: student.rollNo,

  department:
    student.department || "",

  semester:
    student.semester || "",

  failedSubjects: 0,

  status: "",

});

}

async function handleSave() {

  if (!form.id) {
    toast.error("Select a student.");
    return;
  }

  // Calculate status automatically
  let status = "PASS";

  if (Number(form.failedSubjects) >= 3) {
    status = "FAIL";
  } else if (Number(form.failedSubjects) > 0) {
    status = "ATKT";
  }

  try {

    const data = {

      studentName: form.studentName,

      rollNo: form.rollNo,

      department: form.department,

      semester: form.semester,

      sgpa: Number(form.sgpa),

      cgpa: Number(form.cgpa),

      failedSubjects: Number(form.failedSubjects),

      status,

    };

    if (editing) {

      await updateDoc(
        doc(db, "results", form.id),
        data
      );

      toast.success("Result updated successfully.");

    } else {

      await setDoc(
        doc(db, "results", form.id),
        data
      );

      toast.success("Result added successfully.");

    }

    resetForm();
    fetchResults();

  } catch (err) {

    console.error(err);

    toast.error("Failed to save result.");

  }

}

async function handleDelete(id) {

  if (
    !confirm(
      "Delete this result?"
    )
  ) {
    return;
  }

  try {

    await deleteDoc(
      doc(db, "results", id)
    );

    toast.success(
      "Result deleted."
    );

    fetchResults();

  }

  catch (err) {

    console.error(err);

    toast.error(
      "Delete failed."
    );

  }

}

function handleEdit(item) {

  setEditing(true);

  setShowForm(true);

 setForm({
  id: item.id,
  studentName: item.studentName,
  rollNo: item.rollNo,
  department: item.department || "",
  semester: item.semester || "",
  sgpa: item.sgpa || "",
  cgpa: item.cgpa || "",
  failedSubjects: item.failedSubjects ?? 0,
});

}
return (

  <div className="space-y-8">

    {/* Header */}

    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

      <div>

        <h1 className="text-3xl font-bold">
          Manage Results
        </h1>

        <p className="text-gray-500 mt-2">
          Add, update and manage student academic results
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

        Add Result

      </button>

    </div>

    {/* Statistics */}

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

      <div className="bg-white rounded-2xl shadow-md p-6">

        <div className="flex justify-between items-center">

          <div>

            <p className="text-gray-500">
              Total Results
            </p>

            <h2 className="text-3xl font-bold mt-3">
              {stats.total}
            </h2>

          </div>

          <div className="bg-blue-100 p-4 rounded-xl">

            <Users
              size={30}
              className="text-blue-600"
            />

          </div>

        </div>

      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">

        <div className="flex justify-between items-center">

          <div>

            <p className="text-gray-500">
              Pass
            </p>

            <h2 className="text-3xl font-bold mt-3 text-green-600">
              {stats.pass}
            </h2>

          </div>

          <div className="bg-green-100 p-4 rounded-xl">

            <CheckCircle
              size={30}
              className="text-green-600"
            />

          </div>

        </div>

      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">

        <div className="flex justify-between items-center">

          <div>

            <p className="text-gray-500">
              Fail
            </p>

            <h2 className="text-3xl font-bold mt-3 text-red-600">
              {stats.fail}
            </h2>

          </div>

          <div className="bg-red-100 p-4 rounded-xl">

            <XCircle
              size={30}
              className="text-red-600"
            />

          </div>

        </div>

      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">

        <div className="flex justify-between items-center">

          <div>

            <p className="text-gray-500">
              ATKT
            </p>

            <h2 className="text-3xl font-bold mt-3 text-yellow-600">
              {stats.atkt}
            </h2>

          </div>

          <div className="bg-yellow-100 p-4 rounded-xl">

            <AlertTriangle
              size={30}
              className="text-yellow-600"
            />

          </div>

        </div>

      </div>

    </div>

    {/* Search */}

    <div className="bg-white rounded-2xl shadow-md p-6">

      <div className="relative">

        <Search
          size={18}
          className="absolute left-3 top-3 text-gray-400"
        />

        <input
          type="text"
          placeholder="Search by Student Name or Roll No"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full border rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
        />

      </div>
            {showForm && (

        <div className="mt-8 border-t pt-8">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-2xl font-bold">

              {editing ? "Edit Result" : "Add Result"}

            </h2>

            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-red-500"
            >
              <X size={22} />
            </button>

          </div>

          <div className="grid md:grid-cols-2 gap-4">

            {/* Student */}

            <select
              disabled={editing}
              value={form.id}
              onChange={(e) =>
                selectStudent(e.target.value)
              }
              className="border rounded-xl p-3"
            >

              <option value="">
                Select Student
              </option>

              {students.map((student) => (

                <option
                  key={student.id}
                  value={student.id}
                >

                  {student.name} ({student.rollNo})

                </option>

              ))}

            </select>

            <input
              value={form.studentName}
              readOnly
              placeholder="Student Name"
              className="border rounded-xl p-3 bg-gray-100"
            />

            <input
              value={form.rollNo}
              readOnly
              placeholder="Roll Number"
              className="border rounded-xl p-3 bg-gray-100"
            />

            <input
              value={form.department}
              readOnly
              placeholder="Department"
              className="border rounded-xl p-3 bg-gray-100"
            />

            <input
              value={form.semester}
              readOnly
              placeholder="Semester"
              className="border rounded-xl p-3 bg-gray-100"
            />

            <input
              placeholder="SGPA"
              value={form.sgpa}
              onChange={(e) =>
                setForm({
                  ...form,
                  sgpa: e.target.value,
                })
              }
              className="border rounded-xl p-3"
            />

            <input
              placeholder="CGPA"
              value={form.cgpa}
              onChange={(e) =>
                setForm({
                  ...form,
                  cgpa: e.target.value,
                })
              }
              className="border rounded-xl p-3"
            />

            <input
  type="number"
  min="0"
  placeholder="Failed Subjects"
  value={form.failedSubjects || 0}
  onChange={(e) =>
    setForm({
      ...form,
      failedSubjects: Number(e.target.value),
    })
  }
  className="border rounded-xl p-3"
/>

          </div>

          <div className="flex gap-3 mt-8">

            <button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
            >

              {editing
                ? "Update Result"
                : "Save Result"}

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

    </div>
        {/* Results Table */}

    <div className="bg-white rounded-2xl shadow-md p-6">

      <h2 className="text-2xl font-bold mb-6">

        Student Results

      </h2>

      {loading ? (

        <div className="py-16 text-center text-gray-500">

          Loading Results...

        </div>

      ) : filtered.length === 0 ? (

        <div className="py-16 text-center text-gray-500">

          No Results Found

        </div>

      ) : (

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="border-b">

                <th className="text-left py-4">
                  Name
                </th>

                <th className="text-left py-4">
                  Roll No
                </th>

                <th className="text-left py-4">
                  Department
                </th>

                <th className="text-left py-4">
                  Semester
                </th>

                <th className="text-left py-4">
                  SGPA
                </th>

                <th className="text-left py-4">
                  CGPA
                </th>

                <th className="text-left py-4">
                  Status
                </th>

                <th className="text-center py-4">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filtered.map((item) => (

                <tr
                  key={item.id}
                  className="border-b hover:bg-gray-50"
                >

                  <td className="py-4">

                    {item.studentName}

                  </td>

                  <td>

                    {item.rollNo}

                  </td>

                  <td>

                    {item.department}

                  </td>

                  <td>

                    {item.semester}

                  </td>

                  <td>

                    {item.sgpa}

                  </td>

                  <td>

                    {item.cgpa}

                  </td>

                  <td>

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        item.status === "PASS"
                          ? "bg-green-100 text-green-700"
                          : item.status === "FAIL"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >

                      {item.status}

                    </span>

                  </td>

                  <td>

                    <div className="flex justify-center gap-3">

                      <button
                        onClick={() =>
                          handleEdit(item)
                        }
                        className="text-blue-600 hover:text-blue-800"
                      >

                        <Pencil size={18} />

                      </button>

                      <button
                        onClick={() =>
                          handleDelete(item.id)
                        }
                        className="text-red-600 hover:text-red-800"
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