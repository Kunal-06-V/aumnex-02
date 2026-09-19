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
  Bell,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const emptyForm = {
  id: "",
  title: "",
  message: "",
  type: "General",
  priority: "Medium",
  date: "",

  department: "Computer Engineering",
  semester: "Semester 4",
  division: "A",

  target: "Students",

  createdAt: "",
  createdBy: "",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const text = search.toLowerCase();

    setFiltered(
      notifications.filter(
        (item) =>
          item.title?.toLowerCase().includes(text) ||
          item.type?.toLowerCase().includes(text) ||
          item.priority?.toLowerCase().includes(text)
      )
    );
  }, [search, notifications]);

  async function fetchNotifications() {
    setLoading(true);

    try {
      const snapshot = await getDocs(
        collection(db, "notifications")
      );

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setNotifications(data);
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
  const requiredFields = [
    { key: "id", label: "Notification ID" },
    { key: "title", label: "Title" },
    { key: "message", label: "Message" },
    { key: "date", label: "Date" },
    { key: "department", label: "Department" },
    { key: "semester", label: "Semester" },
    { key: "division", label: "Division" },
    { key: "target", label: "Target" },
  ];

  const missingField = requiredFields.find(
    ({ key }) =>
      !String(form[key] ?? "").trim()
  );

  if (missingField) {
    toast.error(
      `${missingField.label} is required.`
    );
    return;
  }

  const validTargets = [
    "Students",
    "Faculty",
    "Everyone",
  ];

  if (!validTargets.includes(form.target)) {
    toast.error(
      "Please select a valid notification target."
    );
    return;
  }

  const validTypes = [
    "General",
    "Exam",
    "Fees",
    "Holiday",
    "Event",
  ];

  if (!validTypes.includes(form.type)) {
    toast.error(
      "Please select a valid notification type."
    );
    return;
  }

  const validPriorities = [
    "High",
    "Medium",
    "Low",
  ];

  if (!validPriorities.includes(form.priority)) {
    toast.error(
      "Please select a valid notification priority."
    );
    return;
  }

  const notificationData = {
    title: form.title.trim(),
    message: form.message.trim(),
    type: form.type,
    priority: form.priority,
    date: form.date,
    department: form.department.trim(),
    semester: form.semester.trim(),
    division: form.division.trim(),
    target: form.target.trim(),
    updatedAt: new Date().toISOString(),
  };

  try {
    if (editing) {
      await setDoc(
        doc(db, "notifications", form.id),
        notificationData,
        { merge: true }
      );

      toast.success(
        "Notification updated successfully."
      );
    } else {
      const existingNotification =
        notifications.find(
          (item) =>
            item.id === form.id.trim()
        );

      if (existingNotification) {
        toast.error(
          "A notification with this ID already exists."
        );
        return;
      }

      await setDoc(
        doc(
          db,
          "notifications",
          form.id.trim()
        ),
        {
          ...notificationData,
          id: form.id.trim(),
          createdAt: new Date().toISOString(),
          createdBy: "Administrator",
        }
      );

      toast.success(
        "Notification added successfully."
      );
    }

    resetForm();
    await fetchNotifications();
  } catch (err) {
    console.error(
      "NOTIFICATION SAVE ERROR:",
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
        "Failed to save notification."
    );
  }
}

  async function handleDelete(id) {
    if (!confirm("Delete this notification?")) return;

    try {
      await deleteDoc(doc(db, "notifications", id));
      fetchNotifications();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete notification.");
    }
  }

  function handleEdit(item) {
    setEditing(true);
    setShowForm(true);

    setForm({
      id: item.id,
      title: item.title || "",
      message: item.message || "",
      type: item.type || "General",
      priority: item.priority || "Medium",
      date: item.date || "",

      department: item.department || "Computer Engineering",
      semester: item.semester || "Semester 4",
      division: item.division || "A",
      target: item.target || "Students",

      createdAt: item.createdAt || "",
      createdBy: item.createdBy || "",
    });
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-3xl font-bold">
            Manage Notifications
          </h1>

          <p className="text-gray-500">
            Create and manage student notifications
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
          Add Notification
        </button>

      </div>

      {showForm && (

        <div className="bg-white rounded-2xl shadow-md p-6">

          <div className="flex justify-between mb-6">

            <h2 className="text-2xl font-bold">
              {editing ? "Edit Notification" : "Add Notification"}
            </h2>

            <button onClick={resetForm}>
              <X />
            </button>

          </div>

          <div className="grid md:grid-cols-2 gap-4">

            <input
              placeholder="Notification ID"
              disabled={editing}
              value={form.id}
              onChange={(e) =>
                setForm({ ...form, id: e.target.value })
              }
              className="border rounded-xl p-3"
            />

            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              className="border rounded-xl p-3"
            />

            <textarea
              placeholder="Message"
              value={form.message}
              onChange={(e) =>
                setForm({ ...form, message: e.target.value })
              }
              className="border rounded-xl p-3 md:col-span-2"
              rows={4}
            />
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value })
              }
              className="border rounded-xl p-3"
            >
              <option>General</option>
              <option>Exam</option>
              <option>Fees</option>
              <option>Holiday</option>
              <option>Event</option>
            </select>

            <select
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value })
              }
              className="border rounded-xl p-3"
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>

            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
              className="border rounded-xl p-3 md:col-span-2"
            />
            <select
              value={form.department}
              onChange={(e) =>
                setForm({
                  ...form,
                  department: e.target.value,
                })
              }
              className="border rounded-xl p-3"
            >
              <option>Computer Engineering</option>
              <option>IT</option>
              <option>EXTC</option>
              <option>Mechanical</option>
              <option>Civil</option>
            </select>
            <select
              value={form.semester}
              onChange={(e) =>
                setForm({
                  ...form,
                  semester: e.target.value,
                })
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
              value={form.division}
              onChange={(e) =>
                setForm({
                  ...form,
                  division: e.target.value,
                })
              }
              className="border rounded-xl p-3"
            >
              <option>A</option>
              <option>B</option>
              <option>C</option>
            </select>
            <select
              value={form.target}
              onChange={(e) =>
                setForm({
                  ...form,
                  target: e.target.value,
                })
              }
              className="border rounded-xl p-3"
            >
              <option>Students</option>
              <option>Faculty</option>
              <option>Everyone</option>
            </select>

          </div>

          <div className="mt-6 flex gap-3">

            <button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
            >
              {editing ? "Update Notification" : "Save Notification"}
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
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

        {loading ? (
          <p className="text-center py-10">
            Loading notifications...
          </p>
        ) : filtered.length === 0 ? (

          <div className="text-center py-10">

            <Bell
              size={48}
              className="mx-auto text-gray-400 mb-4"
            />

            <p>No notifications found.</p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-100">

                <tr>
                  <th className="text-left p-4">Title</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Priority</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-center p-4">Actions</th>
                </tr>

              </thead>

              <tbody>

                {filtered.map((item) => (

                  <tr
                    key={item.id}
                    className="border-b hover:bg-gray-50"
                  >

                    <td className="p-4">
                      <div>
                        <p className="font-semibold">
                          {item.title}
                        </p>

                        <p className="text-sm text-gray-500">
                          {item.message}
                        </p>
                      </div>
                    </td>

                    <td className="p-4">
                      {item.type}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${item.priority === "High"
                          ? "bg-red-100 text-red-700"
                          : item.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                          }`}
                      >
                        {item.priority}
                      </span>
                    </td>

                    <td className="p-4">
                      {item.date}
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