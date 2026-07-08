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
  GraduationCap,
} from "lucide-react";

const emptyForm = {
  id: "",
  studentName: "",
  rollNo: "",
  semester: "Semester 4",
  sgpa: "",
  cgpa: "",
  status: "PASS",
};

export default function ResultsPage() {

  const [results, setResults] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
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

  async function fetchResults() {

    setLoading(true);

    try {

      const snapshot = await getDocs(
        collection(db, "results")
      );

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setResults(data);
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

        await updateDoc(doc(db, "results", form.id), {
          studentName: form.studentName,
          rollNo: form.rollNo,
          semester: form.semester,
          sgpa: form.sgpa,
          cgpa: form.cgpa,
          status: form.status,
        });

        alert("Result updated.");

      } else {

        await setDoc(
          doc(db, "results", form.id),
          form
        );

        alert("Result added.");

      }

      resetForm();
      fetchResults();

    } catch (err) {

      console.error(err);
      alert("Operation failed.");

    }

  }

  async function handleDelete(id) {

    if (!confirm("Delete this result?")) return;

    try {

      await deleteDoc(doc(db, "results", id));

      fetchResults();

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
      sgpa: item.sgpa || "",
      cgpa: item.cgpa || "",
      status: item.status || "PASS",
    });

  }

  return (

    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-3xl font-bold">
            Manage Results
          </h1>

          <p className="text-gray-500">
            Add, edit and manage student results
          </p>

        </div>

        <button
          onClick={()=>{
            setEditing(false);
            setForm(emptyForm);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center gap-2"
        >
          <Plus size={18}/>
          Add Result
        </button>

      </div>

      {showForm && (

        <div className="bg-white rounded-2xl shadow-md p-6">

          <div className="flex justify-between mb-6">

            <h2 className="text-2xl font-bold">
              {editing ? "Edit Result" : "Add Result"}
            </h2>

            <button onClick={resetForm}>
              <X/>
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
              value={form.studentName}
              onChange={(e)=>
                setForm({...form,studentName:e.target.value})
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
              placeholder="SGPA"
              value={form.sgpa}
              onChange={(e) =>
                setForm({ ...form, sgpa: e.target.value })
              }
              className="border rounded-xl p-3"
            />

            <input
              placeholder="CGPA"
              value={form.cgpa}
              onChange={(e) =>
                setForm({ ...form, cgpa: e.target.value })
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
              className="border rounded-xl p-3"
            >
              <option>PASS</option>
              <option>FAIL</option>
              <option>ATKT</option>
            </select>

          </div>

          <div className="mt-6 flex gap-3">

            <button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
            >
              {editing ? "Update Result" : "Save Result"}
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
            Loading Results...
          </p>

        ) : filtered.length === 0 ? (

          <div className="text-center py-10">

            <GraduationCap
              size={48}
              className="mx-auto text-gray-400 mb-4"
            />

            <p>No Results Found.</p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-100">

                <tr>
                  <th className="text-left p-4">Student</th>
                  <th className="text-left p-4">Roll No</th>
                  <th className="text-left p-4">Semester</th>
                  <th className="text-left p-4">SGPA</th>
                  <th className="text-left p-4">CGPA</th>
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
                      {item.sgpa}
                    </td>

                    <td className="p-4">
                      {item.cgpa}
                    </td>

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
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