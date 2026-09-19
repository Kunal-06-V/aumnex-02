"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
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
  documentId: "",
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

  const router = useRouter();

  /* -----------------------------------------
     LOAD STUDENTS
  ----------------------------------------- */

  useEffect(() => {
    fetchStudents();
  }, []);

  /* -----------------------------------------
     SEARCH FILTER
  ----------------------------------------- */

  useEffect(() => {
    const text = search.trim().toLowerCase();

    setFiltered(
      students.filter((student) => {
        const name = String(
          student.name || ""
        ).toLowerCase();

        const rollNo = String(
          student.rollNo || ""
        ).toLowerCase();

        const prn = String(
          student.prn || ""
        ).toLowerCase();

        return (
          name.includes(text) ||
          rollNo.includes(text) ||
          prn.includes(text)
        );
      })
    );
  }, [search, students]);

  /* -----------------------------------------
     FETCH STUDENTS

     IMPORTANT:
     documentId = actual Firestore document ID
     id         = student/business ID stored
                  inside the document
  ----------------------------------------- */

  async function fetchStudents() {
    setLoading(true);

    try {
      const snapshot = await getDocs(
        collection(db, "students")
      );

      const data = snapshot.docs.map(
        (studentDoc) => ({
          ...studentDoc.data(),

          // REAL Firestore document ID
          documentId: studentDoc.id,
        })
      );

      data.sort((a, b) =>
        String(a.name || "").localeCompare(
          String(b.name || "")
        )
      );

      setStudents(data);
      setFiltered(data);
    } catch (err) {
      console.error(
        "FETCH STUDENTS ERROR:",
        err
      );

      toast.error(
        "Failed to load students."
      );
    } finally {
      setLoading(false);
    }
  }

  /* -----------------------------------------
     RESET FORM
  ----------------------------------------- */

  function resetForm() {
    setForm(emptyForm);
    setEditing(false);
    setShowForm(false);
  }

  /* -----------------------------------------
     OPEN ADD FORM
  ----------------------------------------- */

  function openAddForm() {
    setEditing(false);
    setForm(emptyForm);
    setShowForm(true);
  }

  /* -----------------------------------------
     INPUT HANDLER
  ----------------------------------------- */

  function handleInputChange(
    field,
    value
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  /* -----------------------------------------
     SAVE STUDENT
  ----------------------------------------- */

  async function handleSave() {
    /* -----------------------------------------
       1. REQUIRED FIELDS
    ----------------------------------------- */

    const requiredFields = [
      {
        key: "id",
        label: "Student ID",
      },
      {
        key: "name",
        label: "Student Name",
      },
      {
        key: "rollNo",
        label: "Roll No",
      },
      {
        key: "prn",
        label: "PRN",
      },
      {
        key: "department",
        label: "Department",
      },
      {
        key: "semester",
        label: "Semester",
      },
    ];

    const missingField =
      requiredFields.find(
        ({ key }) =>
          !String(
            form[key] ?? ""
          ).trim()
      );

    if (missingField) {
      toast.error(
        `${missingField.label} is required.`
      );
      return;
    }

    /* -----------------------------------------
       2. NORMALIZE VALUES
    ----------------------------------------- */

    const studentId =
      form.id.trim();

    const name =
      form.name.trim();

    const rollNo =
      form.rollNo.trim();

    const prn =
      form.prn.trim();

    const email =
      form.email.trim();

    const phone =
      form.phone.trim();

    const department =
      form.department.trim();

    const semester =
      form.semester.trim();

    /* -----------------------------------------
       3. EMAIL VALIDATION
    ----------------------------------------- */

    if (email) {
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        toast.error(
          "Please enter a valid email address."
        );
        return;
      }
    }

    /* -----------------------------------------
       4. PHONE VALIDATION
    ----------------------------------------- */

    if (phone) {
      const phoneRegex =
        /^[6-9]\d{9}$/;

      if (!phoneRegex.test(phone)) {
        toast.error(
          "Please enter a valid 10-digit Indian phone number."
        );
        return;
      }
    }

    /* -----------------------------------------
       5. DUPLICATE ROLL NO
    ----------------------------------------- */

    const normalizedRollNo =
      rollNo.toLowerCase();

    const duplicateRollNo =
      students.find((student) => {
        const existingRollNo =
          String(
            student.rollNo || ""
          )
            .trim()
            .toLowerCase();

        return (
          student.documentId !==
            form.documentId &&
          existingRollNo ===
            normalizedRollNo
        );
      });

    if (duplicateRollNo) {
      toast.error(
        `Roll No ${rollNo} is already assigned to another student.`
      );
      return;
    }

    /* -----------------------------------------
       6. DUPLICATE PRN
    ----------------------------------------- */

    const normalizedPrn =
      prn.toLowerCase();

    const duplicatePrn =
      students.find((student) => {
        const existingPrn =
          String(
            student.prn || ""
          )
            .trim()
            .toLowerCase();

        return (
          student.documentId !==
            form.documentId &&
          existingPrn ===
            normalizedPrn
        );
      });

    if (duplicatePrn) {
      toast.error(
        `PRN ${prn} is already assigned to another student.`
      );
      return;
    }

    /* -----------------------------------------
       7. STUDENT DATA
    ----------------------------------------- */

    const studentData = {
      id: studentId,
      name,
      rollNo,
      prn,
      email,
      phone,
      department,
      semester,
      updatedAt:
        new Date().toISOString(),
    };

    try {
      /* -----------------------------------------
         8. CHOOSE REAL FIRESTORE DOCUMENT ID
      ----------------------------------------- */

      const documentId = editing
        ? form.documentId
        : studentId;

      if (!documentId) {
        toast.error(
          "Invalid student document ID."
        );
        return;
      }

      const studentRef = doc(
        db,
        "students",
        documentId
      );

      /* -----------------------------------------
         9. EDIT
         
         merge:true preserves existing fields
         such as uid, role, division,
         attendancePercentage, nfcUid,
         fees data, etc.
      ----------------------------------------- */

      if (editing) {
        await setDoc(
          studentRef,
          studentData,
          {
            merge: true,
          }
        );

        toast.success(
          "Student updated successfully."
        );
      }

      /* -----------------------------------------
         10. CREATE
      ----------------------------------------- */

      else {
        await setDoc(
          studentRef,
          {
            ...studentData,

            role: "student",

            status: "Active",

            attendancePercentage: 0,

            overallCGPA: 0,

            totalFees: 0,

            feesPaid: 0,

            feesPending: 0,

            profileImage: "",

            nfcUid: "",

            createdAt:
              new Date().toISOString(),
          }
        );

        toast.success(
          "Student added successfully."
        );
      }

      resetForm();

      await fetchStudents();
    } catch (err) {
      console.error(
        "STUDENT SAVE ERROR:",
        err
      );

      console.error(
        "ERROR CODE:",
        err?.code
      );

      console.error(
        "ERROR MESSAGE:",
        err?.message
      );

      toast.error(
        err?.message ||
          "Failed to save student."
      );
    }
  }

  /* -----------------------------------------
     DELETE STUDENT
  ----------------------------------------- */

  async function handleDelete(
    documentId
  ) {
    if (!documentId) {
      toast.error(
        "Invalid student document ID."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this student?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const studentRef = doc(
        db,
        "students",
        documentId
      );

      /* -----------------------------------------
         VERIFY DOCUMENT EXISTS FIRST
      ----------------------------------------- */

      const beforeDelete =
        await getDoc(studentRef);

      if (!beforeDelete.exists()) {
        toast.error(
          "Student document was not found."
        );

        await fetchStudents();

        return;
      }

      /* -----------------------------------------
         DELETE
      ----------------------------------------- */

      await deleteDoc(studentRef);

      /* -----------------------------------------
         VERIFY DELETE
      ----------------------------------------- */

      const afterDelete =
        await getDoc(studentRef);

      if (afterDelete.exists()) {
        throw new Error(
          "Student delete verification failed."
        );
      }

      /* -----------------------------------------
         REMOVE FROM UI IMMEDIATELY
      ----------------------------------------- */

      setStudents((prev) =>
        prev.filter(
          (student) =>
            student.documentId !==
            documentId
        )
      );

      setFiltered((prev) =>
        prev.filter(
          (student) =>
            student.documentId !==
            documentId
        )
      );

      toast.success(
        "Student deleted successfully."
      );

      if (
        form.documentId ===
        documentId
      ) {
        resetForm();
      }

      /* -----------------------------------------
         FINAL REFRESH
      ----------------------------------------- */

      await fetchStudents();
    } catch (err) {
      console.error(
        "DELETE STUDENT ERROR:",
        err
      );

      console.error(
        "ERROR CODE:",
        err?.code
      );

      console.error(
        "ERROR MESSAGE:",
        err?.message
      );

      toast.error(
        err?.message ||
          "Failed to delete student."
      );
    }
  }

  /* -----------------------------------------
     EDIT STUDENT
  ----------------------------------------- */

  function handleEdit(student) {
    setEditing(true);
    setShowForm(true);

    setForm({
      documentId:
        student.documentId || "",

      id:
        student.id ||
        student.documentId ||
        "",

      name:
        student.name || "",

      rollNo:
        student.rollNo || "",

      prn:
        student.prn || "",

      email:
        student.email || "",

      phone:
        student.phone || "",

      department:
        student.department || "",

      semester:
        student.semester || "",
    });
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

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
          type="button"
          onClick={openAddForm}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center gap-2"
        >
          <Plus size={18} />
          Add Student
        </button>

      </div>

      {/* FORM */}

      {showForm && (
        <div className="bg-white rounded-2xl shadow-md p-6">

          <div className="flex justify-between mb-6">

            <h2 className="text-2xl font-bold">
              {editing
                ? "Edit Student"
                : "Add Student"}
            </h2>

            <button
              type="button"
              onClick={resetForm}
            >
              <X />
            </button>

          </div>

          <div className="grid md:grid-cols-2 gap-4">

            {/* STUDENT ID */}

            <input
              placeholder="Student ID"
              disabled={editing}
              value={form.id}
              onChange={(e) =>
                handleInputChange(
                  "id",
                  e.target.value
                )
              }
              className="border rounded-xl p-3 disabled:bg-gray-100 disabled:text-gray-500"
            />

            {/* NAME */}

            <input
              placeholder="Student Name"
              value={form.name}
              onChange={(e) =>
                handleInputChange(
                  "name",
                  e.target.value
                )
              }
              className="border rounded-xl p-3"
            />

            {/* ROLL NO */}

            <input
              placeholder="Roll No"
              value={form.rollNo}
              onChange={(e) =>
                handleInputChange(
                  "rollNo",
                  e.target.value
                )
              }
              className="border rounded-xl p-3"
            />

            {/* PRN */}

            <input
              placeholder="PRN"
              value={form.prn}
              onChange={(e) =>
                handleInputChange(
                  "prn",
                  e.target.value
                )
              }
              className="border rounded-xl p-3"
            />

            {/* EMAIL */}

            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                handleInputChange(
                  "email",
                  e.target.value
                )
              }
              className="border rounded-xl p-3"
            />

            {/* PHONE */}

            <input
              type="tel"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) =>
                handleInputChange(
                  "phone",
                  e.target.value
                )
              }
              className="border rounded-xl p-3"
            />

            {/* DEPARTMENT */}

            <input
              placeholder="Department"
              value={form.department}
              onChange={(e) =>
                handleInputChange(
                  "department",
                  e.target.value
                )
              }
              className="border rounded-xl p-3"
            />

            {/* SEMESTER */}

            <input
              placeholder="Semester"
              value={form.semester}
              onChange={(e) =>
                handleInputChange(
                  "semester",
                  e.target.value
                )
              }
              className="border rounded-xl p-3"
            />

          </div>

          <div className="mt-6 flex gap-3">

            <button
              type="button"
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
            >
              {editing
                ? "Update Student"
                : "Save Student"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-xl"
            >
              Cancel
            </button>

          </div>

        </div>
      )}

      {/* STUDENT LIST */}

      <div className="bg-white rounded-2xl shadow-md p-5">

        {/* SEARCH */}

        <div className="relative mb-6">

          <Search
            size={18}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search by Name, Roll No or PRN"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full border rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

        {/* LOADING */}

        {loading ? (

          <p className="text-center py-10">
            Loading students...
          </p>

        ) : filtered.length === 0 ? (

          <div className="text-center py-10">

            <Users
              size={48}
              className="mx-auto text-gray-400 mb-4"
            />

            <p>
              No students found.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-100">

                <tr>

                  <th className="text-left p-4">
                    Name
                  </th>

                  <th className="text-left p-4">
                    Roll No
                  </th>

                  <th className="text-left p-4">
                    PRN
                  </th>

                  <th className="text-left p-4">
                    Department
                  </th>

                  <th className="text-left p-4">
                    Semester
                  </th>

                  <th className="text-center p-4">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filtered.map(
                  (student) => (

                    <tr
                      key={
                        student.documentId
                      }
                      className="border-b hover:bg-gray-50"
                    >

                      <td className="p-4 font-medium">
                        {student.name ||
                          "—"}
                      </td>

                      <td className="p-4">
                        {student.rollNo ||
                          "—"}
                      </td>

                      <td className="p-4">
                        {student.prn ||
                          "—"}
                      </td>

                      <td className="p-4">
                        {student.department ||
                          "—"}
                      </td>

                      <td className="p-4">
                        {student.semester ||
                          "—"}
                      </td>

                      <td className="p-4">

                        <div className="flex justify-center gap-3">

                          {/* VIEW */}

                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/admin/students/${student.documentId}`
                              )
                            }
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium"
                          >
                            View
                          </button>

                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                student
                              )
                            }
                            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 p-2 rounded-lg"
                          >
                            <Pencil
                              size={18}
                            />
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                student.documentId
                              )
                            }
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg"
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