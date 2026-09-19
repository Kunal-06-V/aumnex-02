"use client";

import { useEffect, useMemo, useState } from "react";

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
  Plus,
  Pencil,
  Trash2,
  X,
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
  semester: "Semester 4",
  sgpa: "",
  cgpa: "",
  percentage: "",
  failedSubjects: 0,
  status: "",
};

const semesterOptions = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
];

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
    loadData();
  }, []);

  useEffect(() => {
    const text = search
      .toLowerCase()
      .trim();

    setFiltered(
      results.filter(
        (item) =>
          item.studentName
            ?.toLowerCase()
            .includes(text) ||
          item.rollNo
            ?.toLowerCase()
            .includes(text)
      )
    );
  }, [search, results]);

  async function loadData() {
    setLoading(true);

    try {
      const [studentsSnapshot, resultsSnapshot] =
        await Promise.all([
          getDocs(
            collection(db, "students")
          ),
          getDocs(
            collection(db, "results")
          ),
        ]);

      const studentList =
        studentsSnapshot.docs.map(
          (studentDoc) => ({
            id: studentDoc.id,
            ...studentDoc.data(),
          })
        );

      studentList.sort((a, b) =>
        (a.name || "").localeCompare(
          b.name || ""
        )
      );

      setStudents(studentList);

      const allResults = [];

      for (
        const resultDoc of
          resultsSnapshot.docs
      ) {
        const studentUid =
          resultDoc.id;

        const linkedStudent =
          studentList.find(
            (student) =>
              student.id ===
              studentUid
          );

        const semesterSnapshot =
          await getDocs(
            collection(
              db,
              "results",
              studentUid,
              "semesters"
            )
          );

        for (
          const semesterDoc of
            semesterSnapshot.docs
        ) {
          const data =
            semesterDoc.data();

          allResults.push({
            id: studentUid,

            semesterId:
              semesterDoc.id,

            /*
             * Student master is authoritative
             * for identity fields.
             */
            studentName:
              linkedStudent?.name ||
              data.studentName ||
              "",

            rollNo:
              linkedStudent?.rollNo ||
              data.rollNo ||
              "",

            department:
              linkedStudent?.department ||
              data.department ||
              "",

            semester:
              data.semester ||
              linkedStudent?.semester ||
              "",

            sgpa:
              data.sgpa ?? "",

            cgpa:
              data.cgpa ?? "",

            percentage:
              data.percentage ?? "",

            failedSubjects:
              data.failedSubjects ??
              0,

            status:
              data.status ||
              "",
          });
        }
      }

      setResults(
        allResults
      );

      setFiltered(
        allResults
      );
    } catch (error) {
      console.error(
        "Failed to load results:",
        error
      );

      toast.error(
        "Failed to load results."
      );
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    return {
      total:
        results.length,

      pass:
        results.filter(
          (r) =>
            r.status === "PASS"
        ).length,

      fail:
        results.filter(
          (r) =>
            r.status === "FAIL"
        ).length,

      atkt:
        results.filter(
          (r) =>
            r.status === "ATKT"
        ).length,
    };
  }, [results]);

  function resetForm() {
    setEditing(false);
    setShowForm(false);
    setForm(emptyForm);
  }

  function selectStudent(
    studentId
  ) {
    const student =
      students.find(
        (item) =>
          item.id ===
          studentId
      );

    if (!student) {
      return;
    }

    setForm({
      ...form,

      id:
        student.id,

      studentName:
        student.name || "",

      rollNo:
        student.rollNo || "",

      department:
        student.department ||
        "",

      semester:
        student.semester ||
        "Semester 4",
    });
  }

  function handleEdit(item) {
    /*
     * Always resolve identity fields
     * from the authoritative Student
     * record.
     */
    const student =
      students.find(
        (candidate) =>
          candidate.id ===
          item.id
      );

    setEditing(true);
    setShowForm(true);

    setForm({
      id:
        item.id,

      studentName:
        student?.name ||
        item.studentName ||
        "",

      rollNo:
        student?.rollNo ||
        item.rollNo ||
        "",

      department:
        student?.department ||
        item.department ||
        "",

      semester:
        item.semester ||
        student?.semester ||
        "Semester 4",

      sgpa:
        item.sgpa ?? "",

      cgpa:
        item.cgpa ?? "",

      percentage:
        item.percentage ?? "",

      failedSubjects:
        item.failedSubjects ??
        0,

      status:
        item.status || "",
    });
  }

  async function handleSave() {
    if (!form.id) {
      toast.error(
        "Select a student."
      );
      return;
    }

    if (!form.semester) {
      toast.error(
        "Select a semester."
      );
      return;
    }

    if (
      form.sgpa === "" ||
      form.cgpa === "" ||
      form.percentage === ""
    ) {
      toast.error(
        "Please enter SGPA, CGPA and Percentage."
      );
      return;
    }

    const sgpa =
      Number(form.sgpa);

    const cgpa =
      Number(form.cgpa);

    const percentage =
      Number(form.percentage);

    const failedSubjects =
      Number(
        form.failedSubjects
      ) || 0;

    if (
      !Number.isFinite(sgpa) ||
      sgpa < 0 ||
      sgpa > 10
    ) {
      toast.error(
        "SGPA must be between 0 and 10."
      );
      return;
    }

    if (
      !Number.isFinite(cgpa) ||
      cgpa < 0 ||
      cgpa > 10
    ) {
      toast.error(
        "CGPA must be between 0 and 10."
      );
      return;
    }

    if (
      !Number.isFinite(
        percentage
      ) ||
      percentage < 0 ||
      percentage > 100
    ) {
      toast.error(
        "Percentage must be between 0 and 100."
      );
      return;
    }

    if (
      !Number.isFinite(
        failedSubjects
      ) ||
      failedSubjects < 0
    ) {
      toast.error(
        "Failed Subjects must be a non-negative whole number."
      );
      return;
    }

    /*
     * Re-resolve the student before saving.
     * This prevents a stale Roll No from
     * being written back to the result.
     */
    const student =
      students.find(
        (candidate) =>
          candidate.id ===
          form.id
      );

    if (!student) {
      toast.error(
        "Student record not found."
      );
      return;
    }

    let status = "PASS";

    if (
      failedSubjects >= 3
    ) {
      status = "FAIL";
    } else if (
      failedSubjects > 0
    ) {
      status = "ATKT";
    }

    const semesterId =
      form.semester.replace(
        /\s+/g,
        ""
      );

    const data = {
      studentName:
        student.name || "",

      rollNo:
        student.rollNo || "",

      department:
        student.department || "",

      semester:
        form.semester,

      sgpa,

      cgpa,

      percentage,

      failedSubjects,

      status,
    };

    try {
      await setDoc(
        doc(
          db,
          "results",
          form.id,
          "semesters",
          semesterId
        ),
        data,
        {
          merge: true,
        }
      );

      toast.success(
        editing
          ? "Result updated successfully."
          : "Result added successfully."
      );

      resetForm();

      await loadData();
    } catch (error) {
      console.error(
        "Failed to save result:",
        error
      );

      toast.error(
        error?.message ||
          "Failed to save result."
      );
    }
  }

  async function handleDelete(
    item
  ) {
    const confirmed =
      window.confirm(
        `Delete ${item.semester} result for ${item.studentName}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(
        doc(
          db,
          "results",
          item.id,
          "semesters",
          item.semesterId
        )
      );

      toast.success(
        "Result deleted."
      );

      await loadData();
    } catch (error) {
      console.error(
        "Delete failed:",
        error
      );

      toast.error(
        "Delete failed."
      );
    }
  }

  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-3xl font-bold">
            Manage Results
          </h1>

          <p className="mt-2 text-gray-500">
            Add, update and manage student academic results
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
          Add Result
        </button>

      </div>

      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl bg-white p-6 shadow-md">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-gray-500">
                Total Results
              </p>

              <h2 className="mt-3 text-3xl font-bold">
                {stats.total}
              </h2>
            </div>

            <div className="rounded-xl bg-blue-100 p-4">
              <Users
                size={30}
                className="text-blue-600"
              />
            </div>

          </div>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow-md">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-gray-500">
                Pass
              </p>

              <h2 className="mt-3 text-3xl font-bold text-green-600">
                {stats.pass}
              </h2>
            </div>

            <div className="rounded-xl bg-green-100 p-4">
              <CheckCircle
                size={30}
                className="text-green-600"
              />
            </div>

          </div>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow-md">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-gray-500">
                Fail
              </p>

              <h2 className="mt-3 text-3xl font-bold text-red-600">
                {stats.fail}
              </h2>
            </div>

            <div className="rounded-xl bg-red-100 p-4">
              <XCircle
                size={30}
                className="text-red-600"
              />
            </div>

          </div>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow-md">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-gray-500">
                ATKT
              </p>

              <h2 className="mt-3 text-3xl font-bold text-yellow-600">
                {stats.atkt}
              </h2>
            </div>

            <div className="rounded-xl bg-yellow-100 p-4">
              <AlertTriangle
                size={30}
                className="text-yellow-600"
              />
            </div>

          </div>

        </div>

      </div>

      {/* SEARCH + FORM */}

      <div className="rounded-2xl bg-white p-6 shadow-md">

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
              setSearch(
                e.target.value
              )
            }
            className="w-full rounded-xl border py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

        {showForm && (
          <div className="mt-8 border-t pt-8">

            <div className="mb-6 flex items-center justify-between">

              <h2 className="text-2xl font-bold">
                {editing
                  ? "Edit Result"
                  : "Add Result"}
              </h2>

              <button
                type="button"
                onClick={
                  resetForm
                }
                className="text-gray-500 hover:text-red-500"
              >
                <X size={22} />
              </button>

            </div>

            <div className="grid gap-4 md:grid-cols-2">

              {/* STUDENT */}

              <select
                disabled={
                  editing
                }
                value={
                  form.id
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
                placeholder="Roll Number"
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

              {/* SEMESTER */}

              <select
                value={
                  form.semester
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    semester:
                      e.target
                        .value,
                  })
                }
                className="rounded-xl border p-3"
              >
                {semesterOptions.map(
                  (semester) => (
                    <option
                      key={
                        semester
                      }
                      value={
                        semester
                      }
                    >
                      {semester}
                    </option>
                  )
                )}
              </select>

              {/* SGPA */}

              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="SGPA"
                value={
                  form.sgpa
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    sgpa:
                      e.target
                        .value,
                  })
                }
                className="rounded-xl border p-3"
              />

              {/* CGPA */}

              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="CGPA"
                value={
                  form.cgpa
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    cgpa:
                      e.target
                        .value,
                  })
                }
                className="rounded-xl border p-3"
              />

              {/* PERCENTAGE */}

              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="Percentage"
                value={
                  form.percentage
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    percentage:
                      e.target
                        .value,
                  })
                }
                className="rounded-xl border p-3"
              />

              {/* FAILED SUBJECTS */}

              <input
                type="number"
                min="0"
                placeholder="Failed Subjects"
                value={
                  form.failedSubjects
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    failedSubjects:
                      Number(
                        e.target
                          .value
                      ) || 0,
                  })
                }
                className="rounded-xl border p-3"
              />

            </div>

            {/* AUTOMATIC STATUS */}

            <div className="mt-4 rounded-xl bg-gray-50 p-4">

              <p className="text-sm text-gray-500">
                Status is calculated automatically:
              </p>

              <p className="mt-1 text-sm text-green-600">
                0 failed subjects → PASS
              </p>

              <p className="text-sm text-yellow-600">
                1–2 failed subjects → ATKT
              </p>

              <p className="text-sm text-red-600">
                3+ failed subjects → FAIL
              </p>

            </div>

            <div className="mt-8 flex gap-3">

              <button
                type="button"
                onClick={
                  handleSave
                }
                className="rounded-xl bg-green-600 px-6 py-3 text-white hover:bg-green-700"
              >
                {editing
                  ? "Update Result"
                  : "Save Result"}
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

      </div>

      {/* RESULTS TABLE */}

      <div className="rounded-2xl bg-white p-6 shadow-md">

        <h2 className="mb-6 text-2xl font-bold">
          Student Results
        </h2>

        {loading ? (
          <div className="py-16 text-center text-gray-500">
            Loading Results...
          </div>
        ) : filtered.length ===
          0 ? (
          <div className="py-16 text-center text-gray-500">
            No Results Found
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr className="border-b">

                  <th className="py-4 text-left">
                    Name
                  </th>

                  <th className="py-4 text-left">
                    Roll No
                  </th>

                  <th className="py-4 text-left">
                    Department
                  </th>

                  <th className="py-4 text-left">
                    Semester
                  </th>

                  <th className="py-4 text-left">
                    SGPA
                  </th>

                  <th className="py-4 text-left">
                    CGPA
                  </th>

                  <th className="py-4 text-left">
                    Status
                  </th>

                  <th className="py-4 text-center">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filtered.map(
                  (item) => (

                    <tr
                      key={`${item.id}-${item.semesterId}`}
                      className="border-b hover:bg-gray-50"
                    >

                      <td className="py-4">
                        {
                          item.studentName
                        }
                      </td>

                      <td>
                        {
                          item.rollNo
                        }
                      </td>

                      <td>
                        {
                          item.department
                        }
                      </td>

                      <td>
                        {
                          item.semester
                        }
                      </td>

                      <td>
                        {
                          item.sgpa
                        }
                      </td>

                      <td>
                        {
                          item.cgpa
                        }
                      </td>

                      <td>

                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${
                            item.status ===
                            "PASS"
                              ? "bg-green-100 text-green-700"
                              : item.status ===
                                "FAIL"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {
                            item.status
                          }
                        </span>

                      </td>

                      <td>

                        <div className="flex justify-center gap-3">

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                item
                              )
                            }
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit Result"
                          >
                            <Pencil
                              size={18}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                item
                              )
                            }
                            className="text-red-600 hover:text-red-800"
                            title="Delete Result"
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