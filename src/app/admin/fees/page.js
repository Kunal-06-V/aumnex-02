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
  IndianRupee,
} from "lucide-react";

const emptyForm = {
  id: "",
  studentName: "",
  rollNo: "",
  semester: "Semester 4",
  totalFees: "",
  paidFees: "",
  pendingFees: "",
  status: "Pending",
};

export default function FeesPage() {

  const [fees, setFees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchFees();
  }, []);

  useEffect(() => {

    const text = search.toLowerCase();

    setFiltered(
      fees.filter(
        (item) =>
          item.studentName?.toLowerCase().includes(text) ||
          item.rollNo?.toLowerCase().includes(text)
      )
    );

  }, [search, fees]);

  async function fetchFees() {

    setLoading(true);

    try {

      const snapshot = await getDocs(
        collection(db, "fees")
      );

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setFees(data);
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
        const total = Number(form.totalFees);
const paid = Number(form.paidFees);

const pending = total - paid;

const percentagePaid =
  total > 0 ? Math.round((paid / total) * 100) : 0;

      if (editing) {

     await updateDoc(doc(db, "fees", form.id), {
  studentName: form.studentName,
  rollNo: form.rollNo,
  semester: form.semester,
  totalFees: form.totalFees,
  paidFees: form.paidFees,
  pendingFees: pending.toString(),
  percentagePaid,
  status: form.status,
});

        alert("Fees updated.");

      } else {

       await setDoc(
  doc(db, "fees", form.id),
  {
    ...form,
    pendingFees: pending.toString(),
    percentagePaid,
  }
);

        alert("Fees record added.");

      }

      resetForm();
      fetchFees();

    } catch (err) {

      console.error(err);
      alert("Operation failed.");

    }

  }

  async function handleDelete(id) {

    if (!confirm("Delete this fees record?")) return;

    try {

      await deleteDoc(doc(db, "fees", id));

      fetchFees();

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
      totalFees: item.totalFees || "",
      paidFees: item.paidFees || "",
      pendingFees: item.pendingFees || "",
      status: item.status || "Pending",
    });

  }

  return (

    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-3xl font-bold">
            Manage Fees
          </h1>

          <p className="text-gray-500">
            Add, edit and manage student fee records
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
          Add Fees
        </button>

      </div>

      {showForm && (

        <div className="bg-white rounded-2xl shadow-md p-6">

          <div className="flex justify-between mb-6">

            <h2 className="text-2xl font-bold">
              {editing ? "Edit Fees" : "Add Fees"}
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
              className="border rounded-xl p-3"/>

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
              placeholder="Total Fees"
              value={form.totalFees}
              onChange={(e) =>
                setForm({ ...form, totalFees: e.target.value })
              }
              className="border rounded-xl p-3"
            />

            <input
              placeholder="Paid Fees"
              value={form.paidFees}
              onChange={(e) =>
                setForm({ ...form, paidFees: e.target.value })
              }
              className="border rounded-xl p-3"
            />

            <input
              placeholder="Pending Fees"
              value={form.pendingFees}
              onChange={(e) =>
                setForm({ ...form, pendingFees: e.target.value })
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
              <option>Paid</option>
              <option>Partial</option>
              <option>Pending</option>
            </select>

          </div>

          <div className="mt-6 flex gap-3">

            <button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
            >
              {editing ? "Update Fees" : "Save Fees"}
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
            Loading Fees...
          </p>

        ) : filtered.length === 0 ? (

          <div className="text-center py-10">

            <IndianRupee
              size={48}
              className="mx-auto text-gray-400 mb-4"
            />

            <p>No Fee Records Found.</p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-100">

                <tr>
                  <th className="text-left p-4">Student</th>
                  <th className="text-left p-4">Roll No</th>
                  <th className="text-left p-4">Semester</th>
                  <th className="text-left p-4">Total</th>
                  <th className="text-left p-4">Paid</th>
                  <th className="text-left p-4">Pending</th>
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
                      ₹{item.totalFees}
                    </td>

                    <td className="p-4">
                      ₹{item.paidFees}
                    </td>

                    <td className="p-4">
                      ₹{item.pendingFees}
                    </td>

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          item.status === "Paid"
                            ? "bg-green-100 text-green-700"
                            : item.status === "Partial"
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