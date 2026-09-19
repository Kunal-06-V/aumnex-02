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

import toast from "react-hot-toast";

const emptyForm = {
  id: "",
  studentUid: "",
  studentName: "",
  rollNo: "",
  department: "",
  semester: "",
  totalFees: "",
  paidFees: "",
  pendingFees: "",
  dueDate: "",
  status: "Pending",
};

export default function FeesPage() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [form, setForm] =
    useState(emptyForm);

  useEffect(() => {
    fetchStudents();
    fetchFees();
  }, []);

  useEffect(() => {
    const text =
      search.toLowerCase().trim();

    setFiltered(
      fees.filter(
        (item) =>
          item.studentName
            ?.toLowerCase()
            .includes(text) ||
          item.rollNo
            ?.toLowerCase()
            .includes(text)
      )
    );
  }, [search, fees]);

  async function fetchStudents() {
    try {
      const snapshot =
        await getDocs(
          collection(db, "students")
        );

      const data =
        snapshot.docs.map(
          (studentDoc) => ({
            id: studentDoc.id,
            ...studentDoc.data(),
          })
        );

      data.sort((a, b) =>
        (a.name || "").localeCompare(
          b.name || ""
        )
      );

      setStudents(data);
    } catch (err) {
      console.error(
        "Failed to load students:",
        err
      );

      toast.error(
        "Failed to load students."
      );
    }
  }

  async function fetchFees() {
    setLoading(true);

    try {
      const snapshot =
        await getDocs(
          collection(db, "fees")
        );

      const rawFees =
        snapshot.docs.map(
          (feeDoc) => ({
            id: feeDoc.id,
            ...feeDoc.data(),
          })
        );

      /*
       * Resolve student identity from the
       * authoritative Students collection.
       *
       * Priority:
       * 1. fee.studentUid
       * 2. fee.id if it matches a student
       *
       * The displayed Roll No is therefore
       * not trusted from stale fee data.
       */

      const normalizedFees =
        rawFees.map((fee) => {
          const linkedStudent =
            students.find(
              (student) =>
                student.id ===
                  fee.studentUid ||
                student.id === fee.id
            );

          if (!linkedStudent) {
            return fee;
          }

          return {
            ...fee,

            studentUid:
              linkedStudent.id,

            studentName:
              linkedStudent.name ||
              fee.studentName ||
              "",

            rollNo:
              linkedStudent.rollNo ||
              fee.rollNo ||
              "",

            department:
              linkedStudent.department ||
              fee.department ||
              "",

            semester:
              linkedStudent.semester ||
              fee.semester ||
              "",
          };
        });

      setFees(
        normalizedFees
      );

      setFiltered(
        normalizedFees
      );
    } catch (err) {
      console.error(
        "Failed to load fees:",
        err
      );

      toast.error(
        "Failed to load fee records."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditing(false);
    setShowForm(false);
    setForm(emptyForm);
  }

  function selectStudent(studentUid) {
    const student =
      students.find(
        (item) =>
          item.id === studentUid
      );

    if (!student) {
      return;
    }

    setForm((prev) => ({
      ...prev,

      studentUid:
        student.id,

      id:
        prev.id || student.id,

      studentName:
        student.name || "",

      rollNo:
        student.rollNo || "",

      department:
        student.department || "",

      semester:
        student.semester || "",
    }));
  }

  async function handleSave() {
    if (
      !form.studentUid ||
      !form.studentName
    ) {
      toast.error(
        "Student is required."
      );
      return;
    }

    try {
      const total =
        Number(form.totalFees);

      const paid =
        Number(form.paidFees);

      if (
        !Number.isFinite(total) ||
        total <= 0
      ) {
        toast.error(
          "Total fees must be greater than 0."
        );
        return;
      }

      if (
        !Number.isFinite(paid) ||
        paid < 0
      ) {
        toast.error(
          "Paid fees cannot be negative."
        );
        return;
      }

      if (paid > total) {
        toast.error(
          "Paid fees cannot exceed total fees."
        );
        return;
      }

      const pending =
        total - paid;

      const percentagePaid =
        Math.round(
          (paid / total) * 100
        );

      const status =
        pending === 0
          ? "Paid"
          : paid === 0
            ? "Pending"
            : "Partial";

      const data = {
        studentUid:
          form.studentUid,

        studentName:
          form.studentName,

        rollNo:
          form.rollNo,

        department:
          form.department,

        semester:
          form.semester,

        totalFees:
          total,

        paidFees:
          paid,

        pendingFees:
          pending,

        dueDate:
          form.dueDate || "",

        percentagePaid,

        status,
      };

      if (editing) {
        await updateDoc(
          doc(
            db,
            "fees",
            form.id
          ),
          data
        );

        toast.success(
          "Fees updated successfully."
        );
      } else {
        await setDoc(
          doc(
            db,
            "fees",
            form.id ||
              form.studentUid
          ),
          data
        );

        toast.success(
          "Fees record added successfully."
        );
      }

      resetForm();
      await fetchFees();
    } catch (err) {
      console.error(
        "Failed to save fee record:",
        err
      );

      toast.error(
        err?.message ||
          "Failed to save fee record."
      );
    }
  }

  async function handleDelete(id) {
    if (
      !confirm(
        "Delete this fees record?"
      )
    ) {
      return;
    }

    try {
      await deleteDoc(
        doc(db, "fees", id)
      );

      toast.success(
        "Fee record deleted successfully."
      );

      await fetchFees();
    } catch (err) {
      console.error(
        "Failed to delete fee record:",
        err
      );

      toast.error(
        "Failed to delete fee record."
      );
    }
  }

  function handleEdit(item) {
    /*
     * Resolve the authoritative Student
     * before opening the edit form.
     */

    const linkedStudent =
      students.find(
        (student) =>
          student.id ===
            item.studentUid ||
          student.id === item.id
      );

    setEditing(true);
    setShowForm(true);

    setForm({
      id: item.id,

      studentUid:
        linkedStudent?.id ||
        item.studentUid ||
        "",

      studentName:
        linkedStudent?.name ||
        item.studentName ||
        "",

      rollNo:
        linkedStudent?.rollNo ||
        item.rollNo ||
        "",

      department:
        linkedStudent?.department ||
        item.department ||
        "",

      semester:
        linkedStudent?.semester ||
        item.semester ||
        "",

      totalFees:
        item.totalFees ??
        "",

      paidFees:
        item.paidFees ??
        "",

      pendingFees:
        item.pendingFees ??
        "",

      dueDate:
        item.dueDate ||
        "",

      status:
        item.status ||
        "Pending",
    });
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold">
            Manage Fees
          </h1>

          <p className="text-gray-500">
            Add, edit and manage student fee records
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setForm(
              emptyForm
            );
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Fees
        </button>

      </div>

      {/* FORM */}

      {showForm && (
        <div className="rounded-2xl bg-white p-6 shadow-md">

          <div className="mb-6 flex justify-between">

            <h2 className="text-2xl font-bold">
              {editing
                ? "Edit Fees"
                : "Add Fees"}
            </h2>

            <button
              type="button"
              onClick={
                resetForm
              }
              className="text-gray-500 hover:text-red-500"
            >
              <X />
            </button>

          </div>

          <div className="grid gap-4 md:grid-cols-2">

            {/* STUDENT */}

            <select
              disabled={editing}
              value={
                form.studentUid
              }
              onChange={(e) =>
                selectStudent(
                  e.target.value
                )
              }
              className="rounded-xl border p-3"
            >
              <option value="">
                Select Student
              </option>

              {students.map(
                (student) => (
                  <option
                    key={
                      student.id
                    }
                    value={
                      student.id
                    }
                  >
                    {student.name} (
                    {student.rollNo}
                    )
                  </option>
                )
              )}

            </select>

            {/* NAME */}

            <input
              value={
                form.studentName
              }
              readOnly
              placeholder="Student Name"
              className="rounded-xl border bg-gray-100 p-3"
            />

            {/* ROLL NO */}

            <input
              value={
                form.rollNo
              }
              readOnly
              placeholder="Roll No"
              className="rounded-xl border bg-gray-100 p-3"
            />

            {/* DEPARTMENT */}

            <input
              value={
                form.department
              }
              readOnly
              placeholder="Department"
              className="rounded-xl border bg-gray-100 p-3"
            />

            {/* TOTAL */}

            <input
              type="number"
              min="1"
              placeholder="Total Fees"
              value={
                form.totalFees
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  totalFees:
                    e.target
                      .value,
                })
              }
              className="rounded-xl border p-3"
            />

            {/* PAID */}

            <input
              type="number"
              min="0"
              placeholder="Paid Fees"
              value={
                form.paidFees
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  paidFees:
                    e.target
                      .value,
                })
              }
              className="rounded-xl border p-3"
            />

            {/* PENDING */}

            <input
              value={Math.max(
                Number(
                  form.totalFees ||
                    0
                ) -
                  Number(
                    form.paidFees ||
                      0
                  ),
                0
              )}
              readOnly
              placeholder="Pending Fees"
              className="rounded-xl border bg-gray-100 p-3"
            />

            {/* SEMESTER */}

            <input
              value={
                form.semester
              }
              readOnly
              placeholder="Semester"
              className="rounded-xl border bg-gray-100 p-3"
            />

            {/* STATUS */}

            <input
              readOnly
              value={
                Number(
                  form.totalFees ||
                    0
                ) === 0
                  ? "Pending"
                  : Number(
                        form.totalFees
                      ) -
                      Number(
                        form.paidFees
                      ) ===
                    0
                    ? "Paid"
                    : "Partial"
              }
              className="rounded-xl border bg-gray-100 p-3 md:col-span-2"
            />

          </div>

          <div className="mt-6 flex gap-3">

            <button
              type="button"
              onClick={
                handleSave
              }
              className="rounded-xl bg-green-600 px-6 py-3 text-white hover:bg-green-700"
            >
              {editing
                ? "Update Fees"
                : "Save Fees"}
            </button>

            <button
              type="button"
              onClick={
                resetForm
              }
              className="rounded-xl bg-gray-300 px-6 py-3 hover:bg-gray-400"
            >
              Cancel
            </button>

          </div>

        </div>
      )}

      {/* TABLE */}

      <div className="rounded-2xl bg-white p-5 shadow-md">

        <div className="relative mb-6">

          <Search
            size={18}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search by Student Name or Roll No"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="w-full rounded-xl border py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

        {loading ? (
          <p className="py-10 text-center">
            Loading Fees...
          </p>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center">

            <IndianRupee
              size={48}
              className="mx-auto mb-4 text-gray-400"
            />

            <p>
              No Fee Records Found.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-100">

                <tr>

                  <th className="p-4 text-left">
                    Student
                  </th>

                  <th className="p-4 text-left">
                    Roll No
                  </th>

                  <th className="p-4 text-left">
                    Semester
                  </th>

                  <th className="p-4 text-left">
                    Total
                  </th>

                  <th className="p-4 text-left">
                    Paid
                  </th>

                  <th className="p-4 text-left">
                    Pending
                  </th>

                  <th className="p-4 text-left">
                    Status
                  </th>

                  <th className="p-4 text-center">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filtered.map(
                  (item) => (

                    <tr
                      key={
                        item.id
                      }
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
                        ₹
                        {
                          item.totalFees
                        }
                      </td>

                      <td className="p-4">
                        ₹
                        {
                          item.paidFees
                        }
                      </td>

                      <td className="p-4">
                        ₹
                        {
                          item.pendingFees
                        }
                      </td>

                      <td className="p-4">

                        <span
                          className={`rounded-full px-3 py-1 text-sm ${
                            item.status ===
                            "Paid"
                              ? "bg-green-100 text-green-700"
                              : item.status ===
                                "Partial"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {
                            item.status
                          }
                        </span>

                      </td>

                      <td className="p-4">

                        <div className="flex justify-center gap-3">

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                item
                              )
                            }
                            className="rounded-lg bg-yellow-100 p-2 text-yellow-700 hover:bg-yellow-200"
                            title="Edit Fees"
                          >
                            <Pencil
                              size={18}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                item.id
                              )
                            }
                            className="rounded-lg bg-red-100 p-2 text-red-700 hover:bg-red-200"
                            title="Delete Fees"
                          >
                            <Trash2
                              size={18}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}