"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  collection,
  getDocs,
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
  CheckCircle2,
  Clock3,
  UserX,
  Nfc,
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
  division: "",
  status: "Pending",
  nfcUid: "",
};

export default function StudentsPage() {
  const router = useRouter();

  // ============================================================
  // DATA
  // ============================================================

  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [divisions, setDivisions] = useState([]);

  // ============================================================
  // UI STATE
  // ============================================================

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] =
    useState(emptyForm);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadPageData();
  }, []);

  // ============================================================
  // SEARCH
  // ============================================================

  useEffect(() => {
    const text =
      search.trim().toLowerCase();

    setFiltered(
      students.filter((student) => {
        const fields = [
          student.name,
          student.rollNo,
          student.prn,
          student.email,
          student.phone,
          student.department,
          student.semester,
          student.division,
          student.status,
        ];

        return fields.some((field) =>
          String(field || "")
            .toLowerCase()
            .includes(text)
        );
      })
    );
  }, [search, students]);

  // ============================================================
  // LOAD EVERYTHING
  // ============================================================

  async function loadPageData() {
    setLoading(true);

    try {
      await Promise.all([
        fetchStudents(),
        fetchDepartments(),
        fetchAcademicSettings(),
      ]);
    } catch (error) {
      console.error(
        "STUDENT PAGE LOAD ERROR:",
        error
      );

      toast.error(
        "Failed to load student management data."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // FETCH STUDENTS
  // ============================================================

  async function fetchStudents() {
    const snapshot =
      await getDocs(
        collection(db, "students")
      );

    const data =
      snapshot.docs.map(
        (studentDoc) => ({
          ...studentDoc.data(),

          // Real Firestore document ID.
          documentId: studentDoc.id,
        })
      );

    data.sort((a, b) =>
      String(
        a.name || ""
      ).localeCompare(
        String(b.name || "")
      )
    );

    setStudents(data);
    setFiltered(data);
  }

  // ============================================================
  // FETCH DEPARTMENTS
  // ============================================================

  async function fetchDepartments() {
    const snapshot =
      await getDocs(
        collection(
          db,
          "departments"
        )
      );

    const data =
      snapshot.docs.map(
        (departmentDoc) => {
          const item =
            departmentDoc.data();

          const value =
            item.name ||
            item.departmentName ||
            item.title ||
            departmentDoc.id;

          return {
            id: departmentDoc.id,
            value: String(value).trim(),
          };
        }
      );

    setDepartments(data);
  }

  // ============================================================
  // FETCH ACADEMIC MASTER DATA
  // ============================================================

  async function fetchAcademicSettings() {
    const settingsRef =
      doc(
        db,
        "academicSettings",
        "master"
      );

    const settingsSnap =
      await getDocs(
        collection(
          db,
          "academicSettings"
        )
      );

    // Prefer the actual "master" document.
    const masterDoc =
      settingsSnap.docs.find(
        (item) =>
          item.id === "master"
      );

    if (!masterDoc) {
      setSemesters([]);
      setDivisions([]);
      return;
    }

    const data =
      masterDoc.data();

    const loadedSemesters =
      Array.isArray(
        data.semesters
      )
        ? data.semesters
            .filter(
              (item) =>
                item &&
                item.active !== false
            )
            .sort(
              (a, b) =>
                Number(a.number || 0) -
                Number(b.number || 0)
            )
            .map((item) => ({
              id:
                item.id ||
                `semester${item.number}`,
              name:
                item.name ||
                `Semester ${item.number}`,
              number:
                item.number,
            }))
        : [];

    const loadedDivisions =
      Array.isArray(
        data.divisions
      )
        ? data.divisions
            .filter(
              (item) =>
                item &&
                item.active !== false
            )
            .map((item) => ({
              id:
                item.id ||
                item.value,
              name:
                item.name ||
                `Division ${item.id || item.value}`,
            }))
        : [];

    setSemesters(
      loadedSemesters
    );

    setDivisions(
      loadedDivisions
    );
  }

  // ============================================================
  // RESET
  // ============================================================

  function resetForm() {
    setForm(emptyForm);
    setEditing(false);
    setShowForm(false);
  }

  // ============================================================
  // ADD
  // ============================================================

  function openAddForm() {
    setEditing(false);

    setForm({
      ...emptyForm,
      status: "Active",
    });

    setShowForm(true);
  }

  // ============================================================
  // EDIT
  // ============================================================

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

      division:
        student.division || "",

      status:
        student.status || "Pending",

      nfcUid:
        student.nfcUid || "",
    });
  }

  // ============================================================
  // INPUT
  // ============================================================

  function handleInputChange(
    field,
    value
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // ============================================================
  // SAVE
  // ============================================================

  async function handleSave() {
    const documentId =
      form.documentId ||
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

    const division =
      form.division.trim();

    const status =
      form.status.trim();

    const nfcUid =
      form.nfcUid.trim();

    // ----------------------------------------------------------
    // BASIC VALIDATION
    // ----------------------------------------------------------

    if (!documentId) {
      toast.error(
        "Student document ID is required."
      );
      return;
    }

    if (!name) {
      toast.error(
        "Student name is required."
      );
      return;
    }

    // ----------------------------------------------------------
    // ACTIVE ACCOUNT VALIDATION
    // ----------------------------------------------------------

    if (status === "Active") {
      if (!rollNo) {
        toast.error(
          "Roll No is required before activating a student."
        );
        return;
      }

      if (!prn) {
        toast.error(
          "PRN is required before activating a student."
        );
        return;
      }

      if (!department) {
        toast.error(
          "Department is required before activating a student."
        );
        return;
      }

      if (!semester) {
        toast.error(
          "Semester is required before activating a student."
        );
        return;
      }

      if (!division) {
        toast.error(
          "Division is required before activating a student."
        );
        return;
      }
    }

    // ----------------------------------------------------------
    // EMAIL
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // PHONE
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // DUPLICATE ROLL NUMBER
    // ----------------------------------------------------------

    const duplicateRollNo =
      students.find(
        (student) =>
          student.documentId !==
            form.documentId &&
          String(
            student.rollNo || ""
          )
            .trim()
            .toLowerCase() ===
            rollNo.toLowerCase() &&
          rollNo !== ""
      );

    if (duplicateRollNo) {
      toast.error(
        `Roll No ${rollNo} is already assigned.`
      );
      return;
    }

    // ----------------------------------------------------------
    // DUPLICATE PRN
    // ----------------------------------------------------------

    const duplicatePrn =
      students.find(
        (student) =>
          student.documentId !==
            form.documentId &&
          String(
            student.prn || ""
          )
            .trim()
            .toLowerCase() ===
            prn.toLowerCase() &&
          prn !== ""
      );

    if (duplicatePrn) {
      toast.error(
        `PRN ${prn} is already assigned.`
      );
      return;
    }

    // ----------------------------------------------------------
    // DUPLICATE NFC UID
    // ----------------------------------------------------------

    const normalizedNfc =
      nfcUid.toUpperCase();

    const duplicateNfc =
      students.find(
        (student) =>
          student.documentId !==
            form.documentId &&
          normalizedNfc !== "" &&
          String(
            student.nfcUid || ""
          )
            .trim()
            .toUpperCase() ===
            normalizedNfc
      );

    if (duplicateNfc) {
      toast.error(
        "This NFC UID is already assigned to another student."
      );
      return;
    }

    // ----------------------------------------------------------
    // STUDENT DATA
    // ----------------------------------------------------------

    const existingStudent =
      students.find(
        (student) =>
          student.documentId ===
          documentId
      );

    const studentData = {
      ...existingStudent,

      id:
        form.id.trim() ||
        documentId,

      uid:
        existingStudent?.uid ||
        documentId,

      name,
      rollNo,
      prn,
      email,
      phone,

      department,
      semester,
      division,

      role:
        existingStudent?.role ||
        "student",

      status:

        status ||
        "Pending",

      nfcUid:
        normalizedNfc,

      updatedAt:
        new Date().toISOString(),
    };

    // ----------------------------------------------------------
    // SAVE STUDENT
    // ----------------------------------------------------------

    try {
      const studentRef =
        doc(
          db,
          "students",
          documentId
        );

      await setDoc(
        studentRef,
        studentData,
        {
          merge: true,
        }
      );

      // --------------------------------------------------------
      // KEEP CENTRAL USER PROFILE IN SYNC
      // --------------------------------------------------------

      if (existingStudent) {
        const userRef =
          doc(
            db,
            "users",
            documentId
          );

        await setDoc(
          userRef,
          {
            uid:
              existingStudent.uid ||
              documentId,

            email,

            name,

            phone,

            role:
              "student",

            status,

            updatedAt:
              new Date().toISOString(),
          },
          {
            merge: true,
          }
        );
      }

      toast.success(
        editing
          ? "Student profile updated successfully."
          : "Student added successfully."
      );

      resetForm();

      await fetchStudents();
    } catch (error) {
      console.error(
        "SAVE STUDENT ERROR:",
        error
      );

      toast.error(
        error?.message ||
          "Failed to save student."
      );
    }
  }

  // ============================================================
  // DELETE
  // ============================================================

  async function handleDelete(
    documentId
  ) {
    if (!documentId) {
      toast.error(
        "Invalid student document."
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
      await deleteDoc(
        doc(
          db,
          "students",
          documentId
        )
      );

      setStudents((previous) =>
        previous.filter(
          (student) =>
            student.documentId !==
            documentId
        )
      );

      setFiltered((previous) =>
        previous.filter(
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
    } catch (error) {
      console.error(
        "DELETE STUDENT ERROR:",
        error
      );

      toast.error(
        error?.message ||
          "Failed to delete student."
      );
    }
  }

  // ============================================================
  // STATUS BADGE
  // ============================================================

  function StatusBadge({
    status,
  }) {
    if (status === "Active") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          <CheckCircle2
            size={13}
          />
          Active
        </span>
      );
    }

    if (status === "Inactive") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          <UserX
            size={13}
          />
          Inactive
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        <Clock3
          size={13}
        />
        Pending
      </span>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          <h1 className="text-3xl font-bold">
            Student Management
          </h1>

          <p className="mt-1 text-gray-500">
            Approve accounts and manage student academic profiles.
          </p>

        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus
            size={18}
          />
          Add Student
        </button>

      </div>

      {/* ======================================================
          FORM
      ======================================================= */}

      {showForm && (
        <div className="rounded-2xl bg-white p-6 shadow-md">

          <div className="mb-6 flex items-center justify-between">

            <div>

              <h2 className="text-2xl font-bold">
                {editing
                  ? "Edit Student"
                  : "Add Student"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Complete the academic profile before activation.
              </p>

            </div>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              <X
                size={20}
              />
            </button>

          </div>

          <div className="grid gap-4 md:grid-cols-2">

            {/* DOCUMENT ID */}

            <div>

              <label className="mb-2 block text-sm font-medium">
                Student Document ID
              </label>

              <input
                value={
                  form.documentId ||
                  form.id
                }
                disabled
                className="w-full rounded-xl border border-gray-300 bg-gray-100 p-3 text-gray-500"
              />

            </div>

            {/* NAME */}

            <div>

              <label className="mb-2 block text-sm font-medium">
                Student Name
              </label>

              <input
                value={form.name}
                onChange={(event) =>
                  handleInputChange(
                    "name",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-300 p-3"
                placeholder="Student full name"
              />

            </div>

            {/* ROLL */}

            <div>

              <label className="mb-2 block text-sm font-medium">
                Roll No
              </label>

              <input
                value={form.rollNo}
                onChange={(event) =>
                  handleInputChange(
                    "rollNo",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-300 p-3"
                placeholder="22CSXXX"
              />

            </div>

            {/* PRN */}

            <div>

              <label className="mb-2 block text-sm font-medium">
                PRN
              </label>

              <input
                value={form.prn}
                onChange={(event) =>
                  handleInputChange(
                    "prn",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-300 p-3"
                placeholder="Student PRN"
              />

            </div>

            {/* EMAIL */}

            <div>

              <label className="mb-2 block text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  handleInputChange(
                    "email",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-300 p-3"
                placeholder="student@example.com"
              />

            </div>

            {/* PHONE */}

            <div>

              <label className="mb-2 block text-sm font-medium">
                Phone
              </label>

              <input
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  handleInputChange(
                    "phone",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-300 p-3"
                placeholder="10-digit phone number"
              />

            </div>

            {/* DEPARTMENT */}

            <div>

              <label className="mb-2 block text-sm font-medium">
                Department
              </label>

              {departments.length > 0 ? (
                <select
                  value={
                    form.department
                  }
                  onChange={(event) =>
                    handleInputChange(
                      "department",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white p-3"
                >

                  <option value="">
                    Select Department
                  </option>

                  {departments.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.value}
                      >
                        {item.value}
                      </option>
                    )
                  )}

                </select>
              ) : (
                <input
                  value={
                    form.department
                  }
                  onChange={(event) =>
                    handleInputChange(
                      "department",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 p-3"
                  placeholder="Department"
                />
              )}

            </div>

            {/* SEMESTER */}

            <div>

              <label className="mb-2 block text-sm font-medium">
                Semester
              </label>

              <select
                value={form.semester}
                onChange={(event) =>
                  handleInputChange(
                    "semester",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-300 bg-white p-3"
              >

                <option value="">
                  Select Semester
                </option>

                {semesters.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.name}
                    >
                      {item.name}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* DIVISION */}

            <div>

              <label className="mb-2 block text-sm font-medium">
                Division
              </label>

              <select
                value={form.division}
                onChange={(event) =>
                  handleInputChange(
                    "division",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-300 bg-white p-3"
              >

                <option value="">
                  Select Division
                </option>

                {divisions.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* STATUS */}

            <div>

              <label className="mb-2 block text-sm font-medium">
                Account Status
              </label>

              <select
                value={form.status}
                onChange={(event) =>
                  handleInputChange(
                    "status",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-300 bg-white p-3"
              >

                <option value="Pending">
                  Pending
                </option>

                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>

              </select>

            </div>

            {/* NFC */}

            <div>

              <label className="mb-2 block text-sm font-medium">
                NFC UID
              </label>

              <div className="relative">

                <Nfc
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  value={form.nfcUid}
                  onChange={(event) =>
                    handleInputChange(
                      "nfcUid",
                      event.target.value.toUpperCase()
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 p-3 pl-10"
                  placeholder="NFC UID"
                />

              </div>

              <p className="mt-1 text-xs text-gray-400">
                Leave blank until an NFC card is assigned.
              </p>

            </div>

          </div>

          {/* ACTIONS */}

          <div className="mt-6 flex flex-wrap gap-3">

            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-green-600 px-6 py-3 font-medium text-white transition hover:bg-green-700"
            >
              {editing
                ? "Save Student"
                : "Create Student"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl bg-gray-200 px-6 py-3 font-medium text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>

          </div>

        </div>
      )}

      {/* ======================================================
          SEARCH
      ======================================================= */}

      <div className="rounded-2xl bg-white p-5 shadow-md">

        <div className="relative">

          <Search
            size={18}
            className="absolute left-3 top-3.5 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search by name, roll no, PRN, email or status"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

      </div>

      {/* ======================================================
          TABLE
      ======================================================= */}

      <div className="rounded-2xl bg-white p-5 shadow-md">

        {loading ? (
          <div className="py-12 text-center text-gray-500">
            Loading students...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">

            <Users
              size={48}
              className="mx-auto mb-4 text-gray-300"
            />

            <p className="font-medium">
              No students found.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-275">

              <thead className="bg-gray-100">

                <tr>

                  <th className="p-4 text-left">
                    Name
                  </th>

                  <th className="p-4 text-left">
                    Roll No
                  </th>

                  <th className="p-4 text-left">
                    Department
                  </th>

                  <th className="p-4 text-left">
                    Semester
                  </th>

                  <th className="p-4 text-left">
                    Division
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
                  (student) => (
                    <tr
                      key={
                        student.documentId
                      }
                      className="border-b transition hover:bg-gray-50"
                    >

                      <td className="p-4">

                        <div className="font-semibold">
                          {student.name ||
                            "—"}
                        </div>

                        <div className="text-xs text-gray-500">
                          {student.email ||
                            "No email"}
                        </div>

                      </td>

                      <td className="p-4">
                        {student.rollNo ||
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
                        {student.division ||
                          "—"}
                      </td>

                      <td className="p-4">
                        <StatusBadge
                          status={
                            student.status ||
                            "Pending"
                          }
                        />
                      </td>

                      <td className="p-4">

                        <div className="flex justify-center gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/admin/students/${student.documentId}`
                              )
                            }
                            className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                student
                              )
                            }
                            className="rounded-lg bg-yellow-100 p-2 text-yellow-700 hover:bg-yellow-200"
                          >
                            <Pencil
                              size={17}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                student.documentId
                              )
                            }
                            className="rounded-lg bg-red-100 p-2 text-red-700 hover:bg-red-200"
                          >
                            <Trash2
                              size={17}
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